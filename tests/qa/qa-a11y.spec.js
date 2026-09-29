import { expect, test } from './qa-test.js';
import { caseStudies } from '../../src/data/caseStudies.js';
import { serviceOffers } from '../../src/data/serviceOffers.js';

const measureRenderedContrast = (target) => {
  const parseColor = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const channels = match[1].replaceAll('/', ' ').trim().split(/[ ,]+/).filter(Boolean);
      const rgb = channels.slice(0, 3).map(Number);
      const alpha = channels[3] === undefined ? 1 : Number(channels[3]);
      return rgb.every(Number.isFinite) && Number.isFinite(alpha) ? { rgb, alpha } : null;
    }
    if (value.trim().toLowerCase() === 'transparent') return { rgb: [0, 0, 0], alpha: 0 };
    const hex = value.match(/^#([\da-f]{3,8})$/i)?.[1];
    if (!hex) return null;
    const expanded = hex.length <= 4 ? [...hex].map((channel) => channel + channel).join('') : hex;
    const rgb = [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16));
    const alpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    return rgb.every(Number.isFinite) && Number.isFinite(alpha) ? { rgb, alpha } : null;
  };
  const composite = (foreground, background) => {
    const alpha = foreground.alpha;
    return foreground.rgb.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
  };
  const luminance = (rgb) => rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const splitLayers = (value) => {
    const layers = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === '(') depth += 1;
      if (value[index] === ')') depth -= 1;
      if (value[index] === ',' && depth === 0) {
        layers.push(value.slice(start, index));
        start = index + 1;
      }
    }
    layers.push(value.slice(start));
    return layers;
  };
  const cssColors = (value) => (value.match(/rgba?\([^)]*\)|#[\da-f]{3,8}\b|\btransparent\b/gi) ?? [])
    .map(parseColor)
    .filter(Boolean);
  // CSS gradients interpolate in premultiplied-alpha space, so a transparent stop
  // fades coverage without darkening the opaque stop's color.
  const interpolateColor = (from, to, progress) => {
    const alpha = from.alpha + (to.alpha - from.alpha) * progress;
    if (alpha === 0) return { rgb: [0, 0, 0], alpha: 0 };
    return {
      rgb: from.rgb.map((channel, channelIndex) => (channel * from.alpha
        + (to.rgb[channelIndex] * to.alpha - channel * from.alpha) * progress) / alpha),
      alpha,
    };
  };
  const cssGradientColors = (value) => {
    if (!/gradient\(/i.test(value)) return [];
    const stops = cssColors(value);
    return stops.slice(0, -1).flatMap((color, index) => {
      const next = stops[index + 1];
      return Array.from({ length: 21 }, (_, sample) => interpolateColor(color, next, sample / 20));
    }).concat(stops.slice(-1));
  };
  const layerValue = (style, property, index, fallback) => {
    const layers = splitLayers(style[property]);
    return layers[index % layers.length]?.trim() ?? fallback;
  };
  const cssGradientColorAtPoint = (value, node, style, index, point) => {
    if (!/^linear-gradient\(/i.test(value)) return null;
    const inner = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'));
    const parts = splitLayers(inner);
    const firstColorIndex = parts.findIndex((part) => cssColors(part).length > 0);
    if (firstColorIndex < 0) return null;
    const direction = parts.slice(0, firstColorIndex).join(' ').trim();
    let angle = Math.PI;
    const degrees = direction.match(/^(-?\d+(?:\.\d+)?)deg$/i);
    if (degrees) angle = Number(degrees[1]) * Math.PI / 180;
    else if (direction.startsWith('to ')) {
      const sides = direction.slice(3).split(/\s+/);
      const x = sides.includes('right') ? 1 : sides.includes('left') ? -1 : 0;
      const y = sides.includes('bottom') ? 1 : sides.includes('top') ? -1 : 0;
      angle = Math.atan2(x, -y);
      if (angle < 0) angle += Math.PI * 2;
    } else if (direction) return null;

    const rect = node.getBoundingClientRect();
    const size = layerValue(style, 'backgroundSize', index, 'auto').split(/\s+/);
    const dimension = (value, containerSize) => value?.endsWith('%')
      ? containerSize * Number.parseFloat(value) / 100
      : value?.endsWith('px') ? Number.parseFloat(value) : containerSize;
    const width = dimension(size[0], rect.width);
    const height = dimension(size[1], rect.height);
    const position = layerValue(style, 'backgroundPosition', index, '0% 0%').split(/\s+/);
    const offset = (value, available) => {
      if (value === 'right' || value === 'bottom') return available;
      if (value === 'center') return available / 2;
      if (value === 'left' || value === 'top') return 0;
      if (value.endsWith('%')) return available * Number.parseFloat(value) / 100;
      if (value.endsWith('px')) return Number.parseFloat(value);
      return 0;
    };
    const left = rect.left + offset(position[0], rect.width - width);
    const top = rect.top + offset(position[1] ?? '50%', rect.height - height);
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const length = Math.abs(dx) * width + Math.abs(dy) * height;
    const startX = left + width / 2 - dx * length / 2;
    const startY = top + height / 2 - dy * length / 2;
    const progress = Math.max(0, Math.min(1,
      ((point.x - startX) * dx + (point.y - startY) * dy) / length));
    const stops = parts.slice(firstColorIndex).map((part) => {
      const match = part.match(/rgba?\([^)]*\)|#[\da-f]{3,8}\b|\btransparent\b/i);
      if (!match) return null;
      const color = parseColor(match[0]);
      const position = part.slice(match.index + match[0].length).trim().match(/^(-?\d*\.?\d+)(%|px)/);
      return { color, position: position ? Number(position[1]) / (position[2] === '%' ? 100 : length) : null };
    }).filter((stop) => stop?.color);
    if (stops.length === 0) return null;
    if (stops[0].position === null) stops[0].position = 0;
    if (stops.at(-1).position === null) stops.at(-1).position = 1;
    for (let stopIndex = 0; stopIndex < stops.length;) {
      if (stops[stopIndex].position !== null) {
        stopIndex += 1;
        continue;
      }
      const start = stopIndex - 1;
      let end = stopIndex;
      while (end < stops.length && stops[end].position === null) end += 1;
      const range = end - start;
      for (let fill = stopIndex; fill < end; fill += 1) {
        stops[fill].position = stops[start].position
          + (stops[end].position - stops[start].position) * (fill - start) / range;
      }
      stopIndex = end + 1;
    }
    const right = stops.findIndex((stop) => stop.position >= progress);
    if (right === -1) return stops.at(-1).color;
    const leftStop = stops[Math.max(0, right - 1)] ?? stops.at(-1);
    const rightStop = stops[Math.max(0, right)] ?? stops.at(-1);
    const span = rightStop.position - leftStop.position;
    const ratio = span <= 0 ? 1 : (progress - leftStop.position) / span;
    return interpolateColor(leftStop.color, rightStop.color, ratio);
  };
  const layerCoversPoint = (node, point, style, index) => {
    const repeat = layerValue(style, 'backgroundRepeat', index, 'repeat');
    if (repeat.split(/\s+/).some((axis) => axis !== 'no-repeat')) return true;

    const rect = node.getBoundingClientRect();
    const size = layerValue(style, 'backgroundSize', index, 'auto').split(/\s+/);
    const dimension = (value, containerSize) => {
      if (!value || value === 'auto') return containerSize;
      if (value.endsWith('%')) return containerSize * Number.parseFloat(value) / 100;
      if (value.endsWith('px')) return Number.parseFloat(value);
      return containerSize;
    };
    const width = dimension(size[0], rect.width);
    const height = dimension(size[1] ?? size[0], rect.height);
    const position = layerValue(style, 'backgroundPosition', index, '0% 0%').split(/\s+/);
    const offset = (value, available) => {
      if (value === 'right' || value === 'bottom') return available;
      if (value === 'center') return available / 2;
      if (value === 'left' || value === 'top') return 0;
      if (value.endsWith('%')) return available * Number.parseFloat(value) / 100;
      if (value.endsWith('px')) return Number.parseFloat(value);
      return 0;
    };
    const left = rect.left + offset(position[0], rect.width - width);
    const top = rect.top + offset(position[1] ?? '50%', rect.height - height);
    return point.x >= left && point.x <= left + width && point.y >= top && point.y <= top + height;
  };
  // Pseudo-elements have no DOM node, so each rendered absolute/fixed ::before or
  // ::after becomes a stable paint layer with its computed style and resolved box.
  // In-flow pseudo boxes have no resolvable geometry and are not modelled.
  const pseudoLayerCache = new WeakMap();
  const pseudoRect = (element, pseudoStyle) => {
    const px = (value) => Number.parseFloat(value) || 0;
    let originLeft = 0;
    let originTop = 0;
    if (pseudoStyle.position === 'absolute') {
      let block = element;
      while (block !== document.documentElement && getComputedStyle(block).position === 'static'
        && getComputedStyle(block).transform === 'none') block = block.parentElement;
      const blockRect = block.getBoundingClientRect();
      const blockStyle = getComputedStyle(block);
      originLeft = blockRect.left + px(blockStyle.borderLeftWidth);
      originTop = blockRect.top + px(blockStyle.borderTopWidth);
    }
    const contentBox = pseudoStyle.boxSizing !== 'border-box';
    const width = px(pseudoStyle.width) + (contentBox ? px(pseudoStyle.paddingLeft) + px(pseudoStyle.paddingRight)
      + px(pseudoStyle.borderLeftWidth) + px(pseudoStyle.borderRightWidth) : 0);
    const height = px(pseudoStyle.height) + (contentBox ? px(pseudoStyle.paddingTop) + px(pseudoStyle.paddingBottom)
      + px(pseudoStyle.borderTopWidth) + px(pseudoStyle.borderBottomWidth) : 0);
    const left = originLeft + px(pseudoStyle.left) + px(pseudoStyle.marginLeft);
    const top = originTop + px(pseudoStyle.top) + px(pseudoStyle.marginTop);
    return { left, top, width, height, right: left + width, bottom: top + height };
  };
  const pseudoLayer = (element, pseudo) => {
    const pseudoStyle = getComputedStyle(element, pseudo);
    if (['none', 'normal'].includes(pseudoStyle.content) || pseudoStyle.display === 'none'
      || !['absolute', 'fixed'].includes(pseudoStyle.position)) return null;
    if (!pseudoLayerCache.has(element)) pseudoLayerCache.set(element, {});
    const layers = pseudoLayerCache.get(element);
    layers[pseudo] ??= {
      pseudoOf: element,
      pseudo,
      parentElement: element,
      getBoundingClientRect: () => pseudoRect(element, getComputedStyle(element, pseudo)),
    };
    return layers[pseudo];
  };
  const styleOf = (node) => (node.pseudoOf ? getComputedStyle(node.pseudoOf, node.pseudo) : getComputedStyle(node));
  const zIndexOf = (node) => Number.parseInt(styleOf(node).zIndex, 10) || 0;
  // Child paint layers in DOM paint order: ::before, element children, ::after.
  const paintLayers = (node) => (node.pseudoOf ? [] : [
    pseudoLayer(node, '::before'), ...node.children, pseudoLayer(node, '::after'),
  ].filter(Boolean));
  const paintsOwnBackground = (nodeStyle) => nodeStyle.visibility !== 'hidden'
    && (nodeStyle.backgroundImage !== 'none' || (parseColor(nodeStyle.backgroundColor)?.alpha ?? 0) > 0);
  // Root (and body, when the root has none) backgrounds propagate to the whole canvas.
  const paintsCanvas = (node) => node === document.documentElement
    || (node === document.body && !paintsOwnBackground(getComputedStyle(document.documentElement)));
  // `visibility` inherits, so an image's computed value reflects hidden ancestors
  // (and a descendant re-declaring `visible`, which CSS honours).
  const isPaintedImage = (node) => node.tagName === 'IMG' && getComputedStyle(node).visibility === 'visible';
  // Includes descendants, their pseudo layers, and DOM images: a transparent box can
  // still carry painted (and overflowing) children.
  const subtreePaintNodes = (root) => (root.pseudoOf ? [root] : [root, ...root.querySelectorAll('*')])
    .flatMap((node) => (node.pseudoOf ? [node] : [node, ...paintLayers(node).filter((layer) => layer.pseudoOf)]))
    .filter((paintNode) => paintsOwnBackground(styleOf(paintNode)) || isPaintedImage(paintNode));
  const createsStackingContext = (node) => {
    if (node === document.documentElement) return true;
    const nodeStyle = styleOf(node);
    const parentDisplay = node.parentElement ? getComputedStyle(node.parentElement).display : '';
    return (nodeStyle.zIndex !== 'auto' && (nodeStyle.position !== 'static' || /flex|grid/.test(parentDisplay)))
      || ['fixed', 'sticky'].includes(nodeStyle.position)
      || Number(nodeStyle.opacity) < 1
      || nodeStyle.isolation === 'isolate'
      || nodeStyle.mixBlendMode !== 'normal'
      || ['transform', 'filter', 'perspective', 'clipPath', 'backdropFilter']
        .some((property) => nodeStyle[property] && nodeStyle[property] !== 'none')
      || /\b(?:paint|layout|strict|content)\b/.test(nodeStyle.contain);
  };
  // Negative-z children of a non-stacking ancestor paint in the enclosing stacking
  // context, beneath every opaque ancestor background (color, gradient, or image)
  // up to that context.
  const opaqueAncestorPaintCovers = async (parent, point) => {
    for (let node = parent; node && !createsStackingContext(node); node = node.parentElement) {
      const nodeStyle = getComputedStyle(node);
      if (parseColor(nodeStyle.backgroundColor)?.alpha === 1) return true;
      const imageLayers = splitLayers(nodeStyle.backgroundImage);
      for (let index = 0; index < imageLayers.length; index += 1) {
        const layer = imageLayers[index];
        if (!layerCoversPoint(node, point, nodeStyle, index)) continue;
        const isImage = layer.includes('url(');
        const sampledGradient = isImage ? null : cssGradientColorAtPoint(layer, node, nodeStyle, index, point);
        const paints = isImage
          ? [sampleImage(await loadCssImage(layer), point, node.getBoundingClientRect(), 'none',
            layerValue(nodeStyle, 'backgroundPosition', index, '0% 0%'),
            layerValue(nodeStyle, 'backgroundRepeat', index, 'repeat'),
            layerValue(nodeStyle, 'backgroundSize', index, 'auto'))]
          : sampledGradient ? [sampledGradient] : cssGradientColors(layer);
        if (paints.length > 0 && paints.every((paint) => paint?.alpha === 1)) return true;
      }
    }
    return false;
  };
  const pixelContext = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const cssImageCache = new Map();
  const loadCssImage = (layer) => {
    const url = layer.match(/url\((?:"([^"]+)"|'([^']+)'|([^'\")]+))\)/i);
    const source = url?.[1] ?? url?.[2] ?? url?.[3]?.trim();
    if (!source) return Promise.resolve(null);
    if (!cssImageCache.has(source)) {
      cssImageCache.set(source, new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = source;
      }));
    }
    return cssImageCache.get(source);
  };
  // `blur` is a backdrop-filter Gaussian sigma in CSS px, approximated by a box
  // average with the same variance (width sigma * sqrt(12)).
  const sampleImage = (image, point, rect, fit = 'fill', position = '50% 50%', repeat = 'no-repeat', size = 'auto', blur = 0) => {
    if (!image?.complete || !image.naturalWidth || !image.naturalHeight
      || point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) return null;
    const [positionX = '50%', positionY = '50%'] = position.trim().split(/\s+/);
    const resolvePosition = (value, available) => {
      if (value.endsWith('%')) return available * Number.parseFloat(value) / 100;
      if (value.endsWith('px')) return Number.parseFloat(value);
      if (value === 'left' || value === 'top') return 0;
      if (value === 'right' || value === 'bottom') return available;
      return available / 2;
    };
    const sizeParts = size.trim().split(/\s+/);
    let width = image.naturalWidth;
    let height = image.naturalHeight;
    if (size === 'cover' || size === 'contain' || fit === 'cover' || fit === 'contain') {
      const strategy = size === 'cover' || size === 'contain' ? size : fit;
      const scale = (strategy === 'cover' ? Math.max : Math.min)(rect.width / width, rect.height / height);
      width *= scale;
      height *= scale;
    } else if (sizeParts[0] !== 'auto') {
      width = sizeParts[0].endsWith('%') ? rect.width * Number.parseFloat(sizeParts[0]) / 100 : Number.parseFloat(sizeParts[0]);
      height = sizeParts[1] && sizeParts[1] !== 'auto'
        ? sizeParts[1].endsWith('%') ? rect.height * Number.parseFloat(sizeParts[1]) / 100 : Number.parseFloat(sizeParts[1])
        : width * image.naturalHeight / image.naturalWidth;
    } else if (sizeParts[1] && sizeParts[1] !== 'auto') {
      height = sizeParts[1].endsWith('%') ? rect.height * Number.parseFloat(sizeParts[1]) / 100 : Number.parseFloat(sizeParts[1]);
      width = height * image.naturalWidth / image.naturalHeight;
    } else if (fit === 'fill') {
      width = rect.width;
      height = rect.height;
    }
    if (!width || !height) return null;
    const availableX = rect.width - width;
    const availableY = rect.height - height;
    const left = rect.left + resolvePosition(positionX, availableX);
    const top = rect.top + resolvePosition(positionY, availableY);
    const localX = point.x - left;
    const localY = point.y - top;
    const repeatsX = repeat === 'repeat' || repeat === 'repeat-x';
    const repeatsY = repeat === 'repeat' || repeat === 'repeat-y';
    const x = repeatsX ? ((localX % width) + width) % width : localX;
    const y = repeatsY ? ((localY % height) + height) % height : localY;
    if (x < 0 || y < 0 || x > width || y > height) return null;
    try {
      const extent = Math.max(1, blur * Math.sqrt(12));
      const sampleWidth = Math.min(image.naturalWidth, image.naturalWidth * extent / width);
      const sampleHeight = Math.min(image.naturalHeight, image.naturalHeight * extent / height);
      const sourceX = Math.min(image.naturalWidth - sampleWidth, Math.max(0,
        x / width * image.naturalWidth - sampleWidth / 2));
      const sourceY = Math.min(image.naturalHeight - sampleHeight, Math.max(0,
        y / height * image.naturalHeight - sampleHeight / 2));
      const grid = blur > 0 ? 8 : 1;
      pixelContext.clearRect(0, 0, grid, grid);
      pixelContext.drawImage(image, sourceX, sourceY, sampleWidth, sampleHeight, 0, 0, grid, grid);
      const { data } = pixelContext.getImageData(0, 0, grid, grid);
      // Average in premultiplied space so transparent pixels add coverage, not black.
      const sum = [0, 0, 0, 0];
      for (let index = 0; index < data.length; index += 4) {
        const pixelAlpha = data[index + 3] / 255;
        for (let channel = 0; channel < 3; channel += 1) sum[channel] += data[index + channel] * pixelAlpha;
        sum[3] += pixelAlpha;
      }
      const alpha = sum[3] / (grid * grid);
      return { rgb: sum[3] > 0 ? sum.slice(0, 3).map((channel) => channel / sum[3]) : [0, 0, 0], alpha };
    } catch {
      return null;
    }
  };

  const measure = async (element) => {
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const parsedForeground = parseColor(style.color);
    if (!parsedForeground) throw new Error('Could not parse rendered foreground color');
    const foregroundOpacity = ancestors.reduce((opacity, node) => opacity * Number(getComputedStyle(node).opacity), 1);
    const renderedForeground = { ...parsedForeground, alpha: parsedForeground.alpha * foregroundOpacity };
    // Paint-order key of a layer path below an ancestor: z-index comes from the first
    // stacking-context node (non-stacking wrappers let descendant z-indexes compete),
    // and positioned layers paint after in-flow ones at the same z-index.
    const stackingKey = (path) => {
      const stackingNode = path.find(createsStackingContext);
      const positionedNode = stackingNode ?? path.find((pathNode) => styleOf(pathNode).position !== 'static');
      return { zIndex: stackingNode ? zIndexOf(stackingNode) : 0, positioned: Boolean(positionedNode) };
    };
    // The target's own text paints above its z >= 0 layers, so for the target
    // itself only negative-z layers sit behind the text.
    const targetLayerOf = (ancestor, ancestorIndex) => {
      const targetChild = ancestors[ancestorIndex + 1];
      return targetChild
        ? { index: paintLayers(ancestor).indexOf(targetChild), ...stackingKey(ancestors.slice(ancestorIndex + 1)) }
        : { index: -1, zIndex: 0, positioned: false };
    };
    const paintsBehindTarget = (key, index, target) => key.zIndex < target.zIndex
      || (key.zIndex === target.zIndex && (Number(key.positioned) < Number(target.positioned)
        || (key.positioned === target.positioned && index < target.index)));
    const siblingPaintsBehind = (ancestor, ancestorIndex, sibling, siblingIndex) => paintsBehindTarget(
      stackingKey([sibling]), siblingIndex, targetLayerOf(ancestor, ancestorIndex));
    const textNodes = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE
      && node.textContent.trim());
    const ownText = textNodes.map((node) => node.textContent).join('').replace(/\s+/g, ' ').trim();
    const textRects = textNodes.flatMap((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].filter((textRect) => textRect.width > 1 && textRect.height > 1);
    });
    const paintedImages = [...document.images].filter(isPaintedImage);
    const samplePoints = textRects.flatMap((textRect) => {
      const overlapsImage = paintedImages.some((image) => {
        const imageRect = image.getBoundingClientRect();
        return textRect.left < imageRect.right && textRect.right > imageRect.left
          && textRect.top < imageRect.bottom && textRect.bottom > imageRect.top;
      });
      const hasSpatialBackground = ancestors.some((node, index) => {
        if (/gradient\(|url\(/.test(getComputedStyle(node).backgroundImage)) return true;
        // Text overflowing a painted ancestor box sits partly on the backdrop outside it.
        if (!paintsCanvas(node) && paintsOwnBackground(getComputedStyle(node))) {
          const nodeRect = node.getBoundingClientRect();
          if (textRect.left < nodeRect.left || textRect.right > nodeRect.right
            || textRect.top < nodeRect.top || textRect.bottom > nodeRect.bottom) return true;
        }
        return paintLayers(node).some((sibling, siblingIndex) => {
          if (!siblingPaintsBehind(node, index, sibling, siblingIndex)) return false;
          return subtreePaintNodes(sibling).some((paintNode) => {
            const paintRect = paintNode.getBoundingClientRect();
            return textRect.left < paintRect.right && textRect.right > paintRect.left
              && textRect.top < paintRect.bottom && textRect.bottom > paintRect.top;
          });
        });
      });
      if (!overlapsImage && !hasSpatialBackground) {
        return [{ x: textRect.left + textRect.width / 2, y: textRect.top + textRect.height / 2 }];
      }
      const columns = Math.max(3, Math.min(12, Math.ceil(textRect.width / 12)));
      return [0.2, 0.5, 0.8].flatMap((vertical) => Array.from({ length: columns }, (_, column) => ({
        x: textRect.left + textRect.width * (column + 0.5) / columns,
        y: textRect.top + textRect.height * vertical,
      })));
    });
    if (samplePoints.length === 0) samplePoints.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

    const sampleAtPoint = async (samplePoint) => {
      let backgrounds = [[0, 0, 0]];
      let imageSamplingFailed = false;
      const applyNodeBackground = async (node, currentBackgrounds) => {
        const nodeStyle = styleOf(node);
        const color = parseColor(nodeStyle.backgroundColor);
        if (color && color.alpha > 0) currentBackgrounds = currentBackgrounds.map((background) => composite(color, background));
        const imageLayers = splitLayers(nodeStyle.backgroundImage);
        for (let index = imageLayers.length - 1; index >= 0; index -= 1) {
          const layer = imageLayers[index];
          if (!layerCoversPoint(node, samplePoint, nodeStyle, index)) continue;
          if (layer.includes('url(')) {
            const image = await loadCssImage(layer);
            const sample = sampleImage(image, samplePoint, node.getBoundingClientRect(), 'none',
              layerValue(nodeStyle, 'backgroundPosition', index, '0% 0%'),
              layerValue(nodeStyle, 'backgroundRepeat', index, 'repeat'),
              layerValue(nodeStyle, 'backgroundSize', index, 'auto'));
            if (!sample) imageSamplingFailed = true;
            else currentBackgrounds = currentBackgrounds.map((background) => composite(sample, background));
            continue;
          }
          const sampledGradient = cssGradientColorAtPoint(layer, node, nodeStyle, index, samplePoint);
          const colors = sampledGradient ? [sampledGradient] : cssGradientColors(layer);
          if (colors.length === 0) continue;
          if (sampledGradient) {
            currentBackgrounds = currentBackgrounds.map((background) => composite(sampledGradient, background));
            continue;
          }
          const gradientBackgrounds = colors.flatMap((gradientColor) => currentBackgrounds
            .map((background) => composite(gradientColor, background)));
          currentBackgrounds = colors.every((gradientColor) => gradientColor.alpha === 1)
            ? gradientBackgrounds
            : [...currentBackgrounds, ...gradientBackgrounds];
        }
        return currentBackgrounds;
      };
      // An opacity < 1 node is its own group: paint it over each backdrop, then
      // mix that result back into the same backdrop by the group opacity.
      const applyOpacityGroup = async (node, currentBackgrounds, paint) => {
        const groupOpacity = Number(styleOf(node).opacity);
        if (groupOpacity >= 1) return paint(currentBackgrounds);
        const grouped = await Promise.all(currentBackgrounds.map(async (backdrop) => (await paint([backdrop]))
          .map((painted) => composite({ rgb: painted, alpha: groupOpacity }, backdrop))));
        return grouped.flat();
      };
      const coversSamplePoint = (node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0
          && samplePoint.x >= rect.left && samplePoint.x <= rect.right
          && samplePoint.y >= rect.top && samplePoint.y <= rect.bottom;
      };
      // True when a non-visible-overflow box between paintNode and root hides the
      // sample point. Absolute boxes escape clips below their containing block.
      const isClippedWithin = (paintNode, root) => {
        const position = styleOf(paintNode).position;
        if (paintNode === root || position === 'fixed') return false;
        let escaping = position === 'absolute';
        for (let node = paintNode.parentElement; node; node = node.parentElement) {
          const nodeStyle = getComputedStyle(node);
          if (escaping && nodeStyle.position !== 'static') escaping = false;
          if (!escaping && (nodeStyle.overflowX !== 'visible' || nodeStyle.overflowY !== 'visible')
            && !coversSamplePoint(node)) return true;
          if (nodeStyle.position === 'absolute') escaping = true;
          if (node === root) return false;
        }
        return false;
      };
      // Paints one DOM image's pixel at the sample point; `blur` is the backdrop-filter
      // sigma of layers above it.
      const applyImagePixel = async (image, currentBackgrounds, blur) => {
        if (!image.complete) image.loading = 'eager';
        try {
          await image.decode();
        } catch {
          imageSamplingFailed = true;
        }
        const imageStyle = getComputedStyle(image);
        const sample = sampleImage(image, samplePoint, image.getBoundingClientRect(),
          imageStyle.objectFit, imageStyle.objectPosition, undefined, undefined, blur);
        if (!sample) {
          imageSamplingFailed = true;
          return currentBackgrounds;
        }
        return currentBackgrounds.map((background) => composite(sample, background));
      };
      // Collects the layers painted in root's stacking context, in tree order,
      // restricted to `relevant` (nodes on a path to a painter at the sample point).
      // Non-stacking wrappers flatten into it, so their z-indexed descendants escape
      // wrapper order; stacking-context layers stay atomic with their descendants.
      const collectPaintItems = (root, relevant, path = [], items = []) => {
        for (const layer of paintLayers(root)) {
          if (!relevant.has(layer)) continue;
          const layerPath = [...path, layer];
          const atomic = createsStackingContext(layer);
          items.push({ node: layer, path: layerPath, atomic });
          if (!atomic) collectPaintItems(layer, relevant, layerPath, items);
        }
        return items;
      };
      // CSS paint order within one stacking context: z-index, then in-flow before
      // positioned at the same z-index, then tree order.
      const inPaintOrder = (items) => items.map((item, order) => ({ item, order, key: stackingKey(item.path) }))
        .sort((left, right) => left.key.zIndex - right.key.zIndex
          || Number(left.key.positioned) - Number(right.key.positioned) || left.order - right.order)
        .map(({ item }) => item);
      // A layer's own background and image pixel, when they cover the sample point
      // and no overflow box below `clipRoot` hides them.
      const paintOwnLayer = async (node, currentBackgrounds, clipRoot, blur) => {
        if (!coversSamplePoint(node) || isClippedWithin(node, clipRoot)) return currentBackgrounds;
        let painted = currentBackgrounds;
        if (paintsOwnBackground(styleOf(node))) painted = await applyNodeBackground(node, painted);
        if (isPaintedImage(node)) painted = await applyImagePixel(node, painted, blur);
        return painted;
      };
      // Stacking contexts paint atomically as opacity groups: own layer, then their
      // flattened descendants in paint order. Flattened items have opacity 1, since
      // opacity < 1 always creates a stacking context.
      const paintItem = (item, currentBackgrounds, relevant, clipRoot, blur) => (!item.atomic
        ? paintOwnLayer(item.node, currentBackgrounds, clipRoot, blur)
        : applyOpacityGroup(item.node, currentBackgrounds, async (groupBackgrounds) => {
          let painted = await paintOwnLayer(item.node, groupBackgrounds, clipRoot, blur);
          for (const child of inPaintOrder(collectPaintItems(item.node, relevant))) {
            painted = await paintItem(child, painted, relevant, clipRoot, blur);
          }
          return painted;
        }));
      const opacityScopes = [];
      for (const [level, node] of ancestors.entries()) {
        const nodeStyle = getComputedStyle(node);
        const nodeOpacity = Number(nodeStyle.opacity);
        if (nodeOpacity < 1) {
          opacityScopes.push({ node, opacity: nodeOpacity, backdrop: backgrounds.map((background) => [...background]) });
        }
        if (paintsCanvas(node) || coversSamplePoint(node)) backgrounds = await applyNodeBackground(node, backgrounds);
        // Backdrop blurs on deeper ancestors (including the text element) filter the
        // image pixels painted at this level; stacked Gaussian blurs add in variance.
        const blur = Math.sqrt(ancestors.slice(level + 1)
          .flatMap((blurNode) => [...(getComputedStyle(blurNode).backdropFilter ?? '')
            .matchAll(/blur\((\d*\.?\d+)px\)/g)].map((match) => Number(match[1]) ** 2))
          .reduce((sum, variance) => sum + variance, 0));
        const targetChild = ancestors[level + 1];
        const layers = paintLayers(node);
        const target = targetLayerOf(node, level);
        const negativeLayersHidden = layers.some((layer) => zIndexOf(layer) < 0)
          && await opaqueAncestorPaintCovers(node, samplePoint);
        // Only layers on a path to a visible, unclipped painter at the point matter.
        const relevant = new Set();
        for (const sibling of layers) {
          if (sibling === targetChild) continue;
          for (const paintNode of subtreePaintNodes(sibling)) {
            if (!coversSamplePoint(paintNode) || isClippedWithin(paintNode, sibling)) continue;
            for (let pathNode = paintNode; pathNode && !relevant.has(pathNode);
              pathNode = pathNode === sibling ? null : pathNode.parentElement) relevant.add(pathNode);
          }
        }
        for (const item of inPaintOrder(collectPaintItems(node, relevant))) {
          const key = stackingKey(item.path);
          if (key.zIndex < 0 && negativeLayersHidden) continue;
          if (!paintsBehindTarget(key, layers.indexOf(item.path[0]), target)) continue;
          backgrounds = await paintItem(item, backgrounds, relevant, item.path[0], blur);
        }
      }
      const opacityScopeNodes = new Set(opacityScopes.map(({ node }) => node));
      const ungroupedOpacity = ancestors.reduce((opacity, node) => opacity
        * (opacityScopeNodes.has(node) ? 1 : Number(getComputedStyle(node).opacity)), 1);
      let candidates = backgrounds.map((background) => ({
        background,
        foreground: composite({ ...parsedForeground, alpha: parsedForeground.alpha * ungroupedOpacity }, background),
      }));
      for (const scope of opacityScopes.reverse()) {
        candidates = candidates.flatMap((candidate) => scope.backdrop.map((backdrop) => ({
          background: composite({ rgb: candidate.background, alpha: scope.opacity }, backdrop),
          foreground: composite({ rgb: candidate.foreground, alpha: scope.opacity }, backdrop),
        })));
      }
      const measured = candidates.map(({ background, foreground }) => {
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        return {
          ratio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
            / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
          foreground,
          background,
        };
      });
      const worst = measured.reduce((result, candidate) => candidate.ratio < result.ratio ? candidate : result);
      return {
        ...worst,
        ratio: imageSamplingFailed ? 1 : worst.ratio,
        background: imageSamplingFailed ? [0, 0, 0] : worst.background,
      };
    };
    const samples = await Promise.all(samplePoints.map(sampleAtPoint));
    const worstSample = samples.reduce((worst, sample) => sample.ratio < worst.ratio ? sample : worst);
    return {
      ...worstSample,
      tag: element.tagName,
      className: element.className,
      fontSize: parseFloat(style.fontSize),
      text: ownText.slice(0, 60),
      transparentText: renderedForeground.alpha === 0,
      visible: rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden'
        && style.display !== 'none',
    };
  };
  if (!Array.isArray(target)) return measure(target);
  const candidates = target.filter((element) => {
    const style = getComputedStyle(element);
    if (Number.parseFloat(style.fontSize) >= 14 || style.display === 'none' || style.visibility === 'hidden') return false;
    if (![...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return false;
    for (let node = element; node; node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) === 0) return false;
    }
    return true;
  });
  return Promise.all(candidates.map(measure));
};

const renderedContrast = async (locator, { waitForOpacity = true } = {}) => {
  if (waitForOpacity) {
    const readOpacity = (element) => {
      let opacity = 1;
      for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
      return opacity;
    };
    if (await locator.evaluate(readOpacity) < 0.99) {
      await locator.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect.poll(() => locator.evaluate(readOpacity), {
        message: 'target text and its ancestors should finish opacity transitions',
        timeout: 3000,
      }).toBeGreaterThanOrEqual(0.99);
    }
  }
  return locator.evaluate(measureRenderedContrast);
};

const expectRenderedContrast = async (locator, label, minimum = 4.5) => {
  const result = await renderedContrast(locator);
  expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(minimum);
  return result;
};

const expectRenderedForeground = async (locator, label, expected) => {
  await expect.poll(
    async () => (await renderedContrast(locator)).foreground.map(Math.round).join(','),
    { message: label },
  ).toBe(expected);
};

test('contrast measurement includes gradient background stops', async ({ page }) => {
  await page.setContent('<div style="background: linear-gradient(165deg, #141318 0%, #0e0e10 100%); padding: 16px"><span id="gradient-label" style="color: #747b87; font-size: 12px">Gradient label</span></div>');
  const result = await renderedContrast(page.locator('#gradient-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement includes interpolated gradient colors', async ({ page }) => {
  await page.setContent('<div style="background: linear-gradient(#000 0%, #fff 100%); padding: 16px"><span id="gradient-label" style="color: #767676; font-size: 12px">Gradient label</span></div>');
  const result = await renderedContrast(page.locator('#gradient-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement keeps the final gradient color after its stop', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:100px;height:40px;background:linear-gradient(to right,#fff 0%,#000 50%)"><span id="gradient-label" style="position:absolute;left:70px;top:10px;color:#000;font-size:12px">End label</span></div>');
  const result = await renderedContrast(page.locator('#gradient-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement samples across the rendered text bounds', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:320px;height:40px;background:linear-gradient(to right,#fff 0%,#fff 70%,#000 70%,#000 100%)"><span id="gradient-label" style="position:absolute;left:0;top:8px;color:#000;font-size:16px;white-space:nowrap">This whole text label reaches the dark side</span></div>');
  const result = await renderedContrast(page.locator('#gradient-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement includes positioned gradient siblings behind text', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:240px;height:40px;background:#fff"><div style="position:absolute;inset:0;z-index:0;background:linear-gradient(#000,#000)"></div><span id="sibling-label" style="position:relative;z-index:1;color:#000;font-size:12px">Sibling background label</span></div>');
  const result = await renderedContrast(page.locator('#sibling-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement includes later lower-stack gradient siblings', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:240px;height:40px;background:#fff"><span id="sibling-label" style="position:relative;z-index:1;color:#000;font-size:12px">Sibling background label</span><div style="position:absolute;inset:0;z-index:0;background:linear-gradient(#000,#000)"></div></div>');
  const result = await renderedContrast(page.locator('#sibling-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement samples solid sibling backgrounds across text bounds', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:320px;height:40px;background:#fff"><span id="sibling-label" style="position:relative;z-index:1;color:#000;font-size:16px;white-space:nowrap">This label reaches the dark sibling on its right</span><div style="position:absolute;left:70%;top:0;width:30%;height:100%;z-index:0;background:#000"></div></div>');
  const result = await renderedContrast(page.locator('#sibling-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement composites positioned sibling opacity groups', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:240px;height:40px;background:#fff"><div style="position:absolute;inset:0;z-index:0;background:#000;opacity:0.1"></div><span id="sibling-label" style="position:relative;z-index:1;color:#fff;font-size:12px">Faded sibling background label</span></div>');
  const result = await renderedContrast(page.locator('#sibling-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('contrast measurement paints descendants of transparent positioned siblings', async ({ page }) => {
  const cases = [
    { label: 'inset descendant', sibling: 'inset:0', child: 'inset:0', expectFailure: true },
    { label: 'overflowing descendant', sibling: 'left:0;top:0;width:0;height:0', child: 'left:0;top:0;width:240px;height:40px', expectFailure: true },
    { label: 'faded sibling group', sibling: 'inset:0;opacity:0.1', child: 'inset:0', expectFailure: false },
  ];
  for (const { label, sibling, child, expectFailure } of cases) {
    await page.setContent(`<div style="position:relative;width:240px;height:40px;background:#fff"><div style="position:absolute;${sibling};z-index:0"><div style="position:absolute;${child};background:#000"></div></div><span id="sibling-label" style="position:relative;z-index:1;color:#000;font-size:12px">Descendant background label</span></div>`);
    const result = await renderedContrast(page.locator('#sibling-label'));
    if (expectFailure) expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeLessThan(4.5);
    else expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('contrast measurement paints ::before and ::after backgrounds', async ({ page }) => {
  const layer = 'content:"";position:absolute;background:#000';
  const cases = [
    { label: 'parent ::before', css: `#host::before{${layer};inset:0;z-index:0}`, expectFailure: true },
    { label: 'parent ::after', css: `#host::after{${layer};inset:0;z-index:0}`, expectFailure: true },
    { label: 'label ::before below its text', css: `#pseudo-label::before{${layer};inset:0;z-index:-1}`, expectFailure: true },
    { label: 'uncovered ::before', css: `#host::before{${layer};left:160px;top:0;width:80px;height:40px;z-index:0}`, expectFailure: false },
    { label: 'faded ::before', css: `#host::before{${layer};inset:0;z-index:0;opacity:0.1}`, expectFailure: false },
  ];
  for (const { label, css, expectFailure } of cases) {
    await page.setContent(`<style>#host{position:relative;width:240px;height:40px;background:#fff}${css}</style><div id="host"><span id="pseudo-label" style="position:relative;z-index:1;color:#000;font-size:12px;white-space:nowrap">Pseudo label</span></div>`);
    const result = await renderedContrast(page.locator('#pseudo-label'));
    if (expectFailure) expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeLessThan(4.5);
    else expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('contrast measurement limits ancestor fills to their painted box', async ({ page }) => {
  await page.setContent('<div style="background:#000"><div style="width:40px;height:20px;background:#fff"><span id="overflow-label" style="color:#000;font-size:12px;white-space:nowrap">Overflowing black label outside the white box</span></div></div>');
  const result = await renderedContrast(page.locator('#overflow-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('contrast measurement clips sibling descendants to overflow ancestors', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:240px;height:40px;background:#000"><div style="position:absolute;left:0;top:0;width:0;height:0;overflow:hidden"><div style="position:absolute;left:0;top:0;width:240px;height:40px;background:#fff"></div></div><span id="clipped-label" style="position:relative;z-index:1;color:#000;font-size:12px">Black label over a clipped white layer</span></div>');
  const result = await renderedContrast(page.locator('#clipped-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('contrast measurement composites text and ancestor CSS opacity', async ({ page }) => {
  for (const ancestorOpacity of [false, true]) {
    await page.setContent(`<div style="background:#fff;${ancestorOpacity ? 'opacity:0.1' : ''}"><span id="opacity-label" style="color:#000;font-size:12px;${ancestorOpacity ? '' : 'opacity:0.1'}">Faded label</span></div>`);
    const result = await renderedContrast(page.locator('#opacity-label'), { waitForOpacity: false });
    expect(result.ratio, `ancestor opacity: ${ancestorOpacity}`).toBeLessThan(4.5);
  }
});

test('contrast measurement composites opacity groups against their outer backdrop', async ({ page }) => {
  const cases = [
    { open: '<div style="background:#000;opacity:0.5;padding:8px">', close: '</div>' },
    { open: '<div style="background:linear-gradient(#000,#000);opacity:0.5;padding:8px">', close: '</div>' },
    { open: '<div style="opacity:0.5;padding:8px"><div style="background:#000;padding:8px">', close: '</div></div>' },
  ];
  for (const group of cases) {
    await page.setContent(`<div style="background:#fff;padding:8px">${group.open}<span id="opacity-label" style="color:#fff;font-size:12px">White text in a half-opacity group</span>${group.close}</div>`);
    const result = await renderedContrast(page.locator('#opacity-label'), { waitForOpacity: false });
    expect(result.ratio, group).toBeLessThan(4.5);
  }
});

test('contrast measurement composites sibling backgrounds in stacking order', async ({ page }) => {
  await page.setContent('<div style="position:relative;width:240px;height:40px;background:#fff"><div style="position:absolute;inset:0;z-index:1;background:#000"></div><div style="position:absolute;inset:0;z-index:0;background:#fff"></div><span id="sibling-label" style="position:relative;z-index:2;color:#000;font-size:12px">Stacked sibling background label</span></div>');
  const result = await renderedContrast(page.locator('#sibling-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement places negative-z siblings by parent stacking context', async ({ page }) => {
  const cases = [
    { parent: 'position:relative', stackingContext: false },
    { parent: 'position:relative;z-index:0', stackingContext: true },
  ];
  for (const { parent, stackingContext } of cases) {
    await page.setContent(`<div style="${parent};width:240px;height:40px;background:#fff"><div style="position:absolute;inset:0;z-index:-1;background:#000"></div><span id="sibling-label" style="color:#000;font-size:12px">Negative z sibling label</span></div>`);
    const result = await renderedContrast(page.locator('#sibling-label'));
    if (stackingContext) expect(result.ratio, parent).toBeLessThan(4.5);
    else expect(result.ratio, parent).toBeGreaterThanOrEqual(4.5);
  }
});

test('contrast measurement interpolates translucent gradients with premultiplied alpha', async ({ page }) => {
  await page.setContent('<div style="background:#000"><div style="position:relative;width:240px;height:40px;background:linear-gradient(#fff,transparent)"><span id="gradient-label" style="position:absolute;left:0;top:14px;color:#fff;font-size:12px;line-height:12px">Fading gradient label</span></div></div>');
  const result = await renderedContrast(page.locator('#gradient-label'));
  expect(result.ratio).toBeLessThan(4.5);
});

test('contrast measurement hides negative-z siblings under opaque ancestor background images', async ({ page }) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#fff"/></svg>';
  const backgrounds = ['linear-gradient(#fff,#fff)', `url('data:image/svg+xml,${encodeURIComponent(svg)}')`];
  for (const background of backgrounds) {
    await page.setContent(`<div style="position:relative;width:240px;height:40px;background-image:${background}"><div style="position:absolute;inset:0;z-index:-1;background:#000"></div><span id="sibling-label" style="color:#fff;font-size:12px">Negative z sibling label</span></div>`);
    const result = await renderedContrast(page.locator('#sibling-label'));
    expect(result.ratio, background).toBeLessThan(4.5);
  }
});

test('contrast measurement samples DOM and CSS background image pixels', async ({ page }) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#141414"/></svg>';
  const source = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  for (const cssBackground of [false, true]) {
    const image = cssBackground ? '' : `<img src="${source}" alt="" style="width:100%;height:100%">`;
    const background = cssBackground ? `background-image:url("${source}");background-size:100% 100%;background-repeat:no-repeat;` : '';
    await page.setContent(`<div style="position:relative;width:100px;height:100px;${background}">${image}<span id="image-label" style="position:absolute;inset:40px;color:#444;font-size:12px">Image label</span></div>`);
    await page.evaluate(async (src) => {
      const loaded = new Image();
      loaded.src = src;
      await loaded.decode();
    }, source);
    const result = await renderedContrast(page.locator('#image-label'));
    expect(result.ratio, `CSS background: ${cssBackground}`).toBeLessThan(4.5);
  }
});

test('contrast measurement composites DOM image opacity groups', async ({ page }) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#000"/></svg>';
  const source = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  const image = (style) => `<img src="${source}" alt="" style="width:100%;height:100%;display:block;${style}">`;
  const cases = [
    { label: 'image opacity', paint: `<div style="position:absolute;inset:0">${image('opacity:0.1')}</div>` },
    { label: 'image ancestor opacity', paint: `<div style="position:absolute;inset:0;opacity:0.1">${image('')}</div>` },
  ];
  for (const { label, paint } of cases) {
    await page.setContent(`<div style="position:relative;width:240px;height:40px;background:#fff">${paint}<span id="image-label" style="position:relative;color:#fff;font-size:12px">Faded image background label</span></div>`);
    await page.evaluate(async (src) => {
      const loaded = new Image();
      loaded.src = src;
      await loaded.decode();
    }, source);
    const result = await renderedContrast(page.locator('#image-label'));
    expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeLessThan(4.5);
  }
});

test('contrast measurement applies image overlays once', async ({ page }) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#fff"/></svg>';
  const source = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  // White image -> 50% black scrim -> white text renders ~3.9:1; double-counting the scrim reports ~8:1.
  await page.setContent(`<div style="position:relative;width:240px;height:40px"><img src="${source}" alt="" style="position:absolute;inset:0;width:100%;height:100%"><div style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div><span id="image-label" style="position:relative;color:#fff;font-size:12px">Scrimmed image label</span></div>`);
  await page.evaluate(async (src) => {
    const loaded = new Image();
    loaded.src = src;
    await loaded.decode();
  }, source);
  const result = await renderedContrast(page.locator('#image-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('contrast measurement blurs image pixels behind backdrop-filter labels', async ({ page }) => {
  // White image with a 16px black stripe under the label; the 16px backdrop blur
  // pulls in the surrounding white, so the real backdrop is light gray, not black.
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="240" height="80" fill="#fff"/><rect y="32" width="240" height="16" fill="#000"/></svg>';
  const source = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  await page.setContent(`<div style="position:relative;width:240px;height:80px"><div style="position:absolute;inset:0"><img src="${source}" alt="" style="display:block;width:240px;height:80px"></div><span id="blur-label" style="position:absolute;left:20px;top:32px;z-index:1;height:16px;line-height:16px;background:rgba(0,0,0,0.1);backdrop-filter:blur(16px);color:#fff;font-size:12px;white-space:nowrap">Blurred portrait label</span></div>`);
  await page.evaluate(async (src) => {
    const loaded = new Image();
    loaded.src = src;
    await loaded.decode();
  }, source);
  const result = await renderedContrast(page.locator('#blur-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('contrast measurement stacks overlapping DOM images in paint order', async ({ page }) => {
  const svg = (fill) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${fill}"/></svg>`)}`;
  const [black, white] = [svg('#000'), svg('#fff')];
  const image = (src, zIndex) => `<img src="${src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;z-index:${zIndex}">`;
  const cases = [
    { label: 'direct siblings', wrap: (top, bottom) => `${top}${bottom}` },
    { label: 'shared wrapper', wrap: (top, bottom) => `<div>${top}${bottom}</div>` },
    { label: 'separate wrappers', wrap: (top, bottom) => `<div>${top}</div><div>${bottom}</div>` },
  ];
  for (const { label, wrap } of cases) {
    await page.setContent(`<div style="position:relative;width:240px;height:40px">${wrap(image(black, 1), image(white, 0))}<span id="image-label" style="position:relative;z-index:2;color:#000;font-size:12px">Black label over the top black image</span></div>`);
    await page.evaluate((sources) => Promise.all(sources.map((src) => {
      const loaded = new Image();
      loaded.src = src;
      return loaded.decode();
    })), [black, white]);
    const result = await renderedContrast(page.locator('#image-label'));
    expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeLessThan(4.5);
  }
});

test('contrast measurement ignores visibility-hidden DOM images', async ({ page }) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#000"/></svg>';
  const source = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  const image = (style) => `<img src="${source}" alt="" style="position:absolute;inset:0;width:100%;height:100%;${style}">`;
  const cases = [
    { label: 'hidden image', paint: image('visibility:hidden') },
    { label: 'hidden image ancestor', paint: `<div style="visibility:hidden">${image('')}</div>` },
  ];
  for (const { label, paint } of cases) {
    await page.setContent(`<div style="position:relative;width:240px;height:40px;background:#fff">${paint}<span id="image-label" style="position:relative;color:#fff;font-size:12px">White label over a hidden image</span></div>`);
    await page.evaluate(async (src) => {
      const loaded = new Image();
      loaded.src = src;
      await loaded.decode();
    }, source);
    const result = await renderedContrast(page.locator('#image-label'));
    expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeLessThan(4.5);
  }
});

test('contrast measurement ignores DOM images above the text', async ({ page }) => {
  const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#000"/></svg>')}`;
  await page.setContent(`<div style="position:relative;width:240px;height:40px;background:#fff"><img src="${source}" alt="" style="position:absolute;inset:0;width:100%;height:100%;z-index:2"><span id="image-label" style="position:relative;z-index:1;color:#fff;font-size:12px">White label under a black image</span></div>`);
  await page.evaluate(async (src) => {
    const loaded = new Image();
    loaded.src = src;
    await loaded.decode();
  }, source);
  const result = await renderedContrast(page.locator('#image-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('contrast measurement keeps painted descendants beside images', async ({ page }) => {
  const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')}`;
  await page.setContent(`<div style="position:relative;width:240px;height:40px;background:#fff"><div style="position:absolute;inset:0"><div style="position:absolute;inset:0;background:#000"></div><img src="${source}" alt="" style="position:absolute;inset:0;width:100%;height:100%"></div><span id="image-label" style="position:relative;z-index:1;color:#000;font-size:12px">Black label over a black layer</span></div>`);
  await page.evaluate(async (src) => {
    const loaded = new Image();
    loaded.src = src;
    await loaded.decode();
  }, source);
  const result = await renderedContrast(page.locator('#image-label'));
  expect(result.ratio, JSON.stringify(result)).toBeLessThan(4.5);
});

test('home has exactly one main landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
});

test('project page uses a single main landmark', async ({ page }) => {
  await page.goto('/project/n8n-openai-data-extraction');
  await expect(page.locator('main')).toHaveCount(1);
});

test('contact social icon links have accessible names', async ({ page }) => {
  await page.goto('/contact');
  const links = page.locator('a[href*="linkedin"], a[href*="github"]').filter({
    has: page.locator('svg'),
  });
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const ariaLabel = await link.getAttribute('aria-label');
    const text = await link.textContent();
    if (!text?.trim()) {
      expect(ariaLabel, `Icon link ${i} should have aria-label`).toBeTruthy();
    }
  }
});

test('mobile menu closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile menu isolates background content while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    document.querySelector('[aria-label="Toggle navigation menu"]').click();
  });
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await expect(page.locator('#main-content')).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
});

test('mobile menu isolates the identified site footer without mutating the testimonial footer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const siteFooter = page.locator('#site-footer');
  const testimonialFooter = page.locator('#testimonials footer');
  await expect(siteFooter).toHaveCount(1);
  await expect(testimonialFooter).toHaveCount(1);

  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await expect(siteFooter).toHaveAttribute('inert', '');
  await expect(siteFooter).toHaveAttribute('aria-hidden', 'true');
  await expect(testimonialFooter).not.toHaveAttribute('inert', '');
  await expect(testimonialFooter).not.toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('Escape');
  await expect(siteFooter).not.toHaveAttribute('inert', '');
  await expect(siteFooter).not.toHaveAttribute('aria-hidden', 'true');
});

test('testimonial Field Quote structure without soft asserts', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.locator('#testimonials')).toBeAttached();
  
  // New craft Field Quote structure
  await expect(page.locator('#testimonials .field')).toHaveCount(1);
  await expect(page.locator('#testimonials .rail')).toHaveCount(1);
  await expect(page.locator('#testimonials .quote-area')).toHaveCount(1);
  
  // Diamond-shaped navigation dots (buttons, not tabs)
  const dots = page.locator('#testimonials .dots button');
  const dotCount = await dots.count();
  
  expect(dotCount).toBeGreaterThan(0);
  
  // Verify structural elements
  await expect(page.locator('#testimonials blockquote')).toHaveCount(1);
  await expect(page.locator('#testimonials .count')).toHaveCount(1);
});

test('reduced motion disables custom cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
});

test('form inputs have associated labels', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact');
    for (const id of ['name', 'email', 'budget', 'description']) {
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
      await expectRenderedContrast(label, `${id} label at ${width}px`);
      expect(await label.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(12);
    }
    await expect(page.locator('.field-meta')).toHaveCount(0);
  }
});

test('normal-size purple text and links meet contrast in rendered states', async ({ page }) => {
  // Consent geometry is tested separately; its delayed appearance must not move
  // the pointer off the link whose hover colour this test measures.
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  await page.goto('/');
  await expect(page.getByText('Starting at €45/hour', { exact: true })).toHaveCount(0);
  const locationChip = page.getByText('Based in Linz, Austria', { exact: true });
  const chipBackground = await locationChip.evaluate((element) => {
    const badge = element.parentElement;
    const style = badge ? getComputedStyle(badge) : null;
    return style ? {
      backgroundColor: style.backgroundColor,
      alpha: style.backgroundColor.startsWith('rgba(')
        ? Number(style.backgroundColor.split(',')[3].replace(')', '').trim())
        : 1,
    } : null;
  });
  expect(chipBackground?.backgroundColor, 'Hero location badge should have a stable dark background').toBe('rgb(12, 13, 13)');
  expect(chipBackground?.alpha, 'Hero location badge should be opaque over the image').toBe(1);
  await expectRenderedContrast(locationChip, 'Hero location');

  const cardLabel = page.locator('#portfolio article').first().locator('.cat, a .text-\\[\\#a78bfa\\]').first();
  await expectRenderedContrast(cardLabel, 'Case study card craft label');
  // Check if it's a link for hover state testing
  const isLink = await cardLabel.evaluate((element) => {
    const link = element.closest('a');
    return link && link.getAttribute('href')?.startsWith('http');
  });
  if (isLink) {
    const linkElement = await cardLabel.evaluateHandle((element) => element.closest('a'));
    await linkElement.asElement().hover();
    await expectRenderedForeground(linkElement.asElement(), 'Case study card external link should finish its hover transition', '255,255,255');
    await expectRenderedContrast(linkElement.asElement(), 'Case study card external link on hover');
  }

  const portfolioLink = page.getByRole('link', { name: /View all case studies/ });
  await expectRenderedContrast(portfolioLink, 'Portfolio collection link');
  await expect.poll(async () => {
    // Reacquire the actual link after scrolling/layout settles on the CI browser.
    await portfolioLink.hover();
    return {
      hovered: await portfolioLink.evaluate((element) => element.matches(':hover')),
      foreground: (await renderedContrast(portfolioLink)).foreground.join(','),
    };
  }, { message: 'Portfolio collection link must be hovered and finish its colour transition' })
    .toEqual({ hovered: true, foreground: '255,255,255' });
  await expectRenderedContrast(portfolioLink, 'Portfolio collection link on hover');
  await page.mouse.move(0, 0);
  await portfolioLink.focus();
  await expect(portfolioLink).toBeFocused();
  await expectRenderedForeground(portfolioLink, 'Portfolio collection link focus state', '167,139,250');
  await expectRenderedContrast(portfolioLink, 'Portfolio collection link on focus');
});

test('policy, contact, footer, and not-found accent states meet contrast', async ({ page }) => {
  await page.goto('/legal/');
  for (const name of ['Cookie Policy', 'Resend', 'Convex', 'Sentry']) {
    await expectRenderedContrast(page.locator('main').getByRole('link', { name, exact: true }), `Legal ${name}`);
  }

  await page.goto('/data-policy/');
  await expectRenderedContrast(page.locator('main').getByRole('link', { name: 'Privacy Policy', exact: true }), 'Data policy link');

  await page.goto('/contact/');
  const email = page.getByRole('link', { name: /@/ }).first();
  await email.hover();
  await expectRenderedForeground(email, 'Contact email should finish its hover transition', '167,139,250');
  await expectRenderedContrast(email, 'Contact email on hover');

  await page.goto('/');
  const footerLink = page.locator('footer').getByRole('link', { name: 'Home', exact: true });
  await footerLink.hover();
  await expectRenderedForeground(footerLink, 'Footer navigation link should finish its hover transition', '167,139,250');
  await expectRenderedContrast(footerLink, 'Footer navigation link on hover');

  await page.goto('/missing-page/');
  await expectRenderedContrast(page.getByText('404', { exact: true }), 'Not-found status');
});

const PRIMARY_FILL = '124,58,237';
const PRIMARY_HOVER_FILL = '109,40,217';

const ownBackground = (locator) => locator.evaluate((element) => {
  const match = getComputedStyle(element).backgroundColor.match(/rgba?\(([^)]+)\)/);
  return match ? match[1].split(/[ ,/]+/).filter(Boolean).slice(0, 3).join(',') : '';
});

const paintedDominantColor = async (page, locator) => {
  await page.mouse.move(0, 0);
  const png = await locator.screenshot({ animations: 'disabled' });
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const counts = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1])[0][0];
  }, png.toString('base64'));
};

const expectFilledPrimaryStates = async (page, button, label) => {
  await expect(button).toBeVisible();
  await expect.poll(() => ownBackground(button), { message: `${label} rest fill` }).toBe(PRIMARY_FILL);
  await expectRenderedForeground(button, `${label} rest text`, '255,255,255');
  await expectRenderedContrast(button, `${label} at rest`);
  expect(await paintedDominantColor(page, button), `${label} painted fill`).toBe(PRIMARY_FILL);

  await button.hover();
  await expect.poll(() => ownBackground(button), { message: `${label} hover fill` }).toBe(PRIMARY_HOVER_FILL);
  await expectRenderedForeground(button, `${label} hover text`, '255,255,255');
  await expectRenderedContrast(button, `${label} on hover`);

  await page.mouse.move(0, 0);
  await button.focus();
  await expect(button).toBeFocused();
  await expect.poll(() => ownBackground(button), { message: `${label} focus fill` }).toBe(PRIMARY_FILL);
  await expectRenderedContrast(button, `${label} on focus`);
};

test('filled primary CTAs keep white text readable at rest, hover, and focus', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  await page.goto('/');
  await expectFilledPrimaryStates(
    page,
    page.locator('#main-content').getByRole('button', { name: 'Request a Project Estimate' }).first(),
    'Hero primary CTA',
  );

  await page.goto(`/services/${serviceOffers[0].id}/`);
  await expectFilledPrimaryStates(
    page,
    page.locator('#main-content').getByRole('link', { name: 'Request a Project Estimate' }),
    'Service detail CTA',
  );

  await page.goto('/services/not-a-service/');
  await expectRenderedContrast(
    page.locator('#main-content').getByRole('link', { name: 'Back to Home' }),
    'Unknown service 404 link',
  );
});

test('visible text under 14px meets 4.5:1 on its rendered background', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  const routes = ['/', '/contact/', '/case-studies/', `/services/${serviceOffers[0].id}/`, '/legal/', '/data-policy/'];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('#main-content h1').first()).toBeVisible();
    const results = await page.locator('body *:not(script):not(style):not(:disabled)')
      .evaluateAll(measureRenderedContrast);
    const small = results.filter((result) => result.visible && result.text
      && !result.transparentText && result.fontSize < 14);
    expect(small.length, `${route} should render small labels to check`).toBeGreaterThan(0);
    const failures = small.filter((result) => result.ratio < 4.5)
      .map(({ tag, className, text, fontSize, ratio, foreground, background }) => ({
        tag, className, text, fontSize, ratio: Number(ratio.toFixed(2)), foreground, background,
      }));
    expect(failures, `${route} small text below 4.5:1`).toEqual([]);
  }

  await page.goto('/');
  const footerPolicy = page.locator('#site-footer').getByRole('link', { name: 'Privacy Policy', exact: true });
  await expectRenderedContrast(footerPolicy, 'Footer policy link at rest');
  await footerPolicy.hover();
  await expectRenderedForeground(footerPolicy, 'Footer policy link should finish its hover transition', '209,213,219');
  await expectRenderedContrast(footerPolicy, 'Footer policy link on hover');
});

test('service card and detail scope lists meet normal-text contrast', async ({ page }) => {
  await page.goto('/#services');
  const card = page.locator('#services article').first();
  await expect(card).toBeVisible();
  await expectRenderedContrast(card.getByRole('heading', { level: 3 }), 'Service offer title');
  await expectRenderedContrast(card.locator('p'), 'Service offer summary');
  const details = card.getByRole('link', { name: /Scope details/i });
  await expectRenderedContrast(details, 'Service scope link');
  await details.click();
  await expect(page).toHaveURL(/\/services\/data-extraction-automation-sprint\/?$/);
  await expect(page.getByRole('heading', { name: 'In scope' })).toBeVisible();
  const items = page.locator('main li');
  await expect(items).not.toHaveCount(0);
  await expect(items.first()).toHaveCSS('color', /^rgb\(/);
  const count = await items.count();
  for (let i = 0; i < count; i += 1) {
    await expectRenderedContrast(items.nth(i), `Service offer scope item ${i}`);
  }
});

test('services section exists for anchor target', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#services')).toBeAttached();
  await expect(page.locator('#about')).toBeAttached();
  await expect(page.locator('#portfolio')).toBeAttached();
  await expect(page.locator('#testimonials')).toBeAttached();
});

test('section anchor lands below the sticky header without a large gap', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if ((await page.viewportSize()).width < 768) {
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await page.getByRole('dialog', { name: 'Navigation menu' })
      .getByRole('link', { name: 'Services' }).click();
  } else {
    await page.getByRole('navigation').first()
      .getByRole('link', { name: 'Services' }).click();
  }
  const section = page.locator('#services');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  const sectionTop = await section.evaluate((element) => element.getBoundingClientRect().top);
  const headerHeight = await page.locator('header').first()
    .evaluate((element) => element.getBoundingClientRect().height);
  const scrollPadding = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
  expect(sectionTop).toBeGreaterThanOrEqual(headerHeight);
  expect(sectionTop).toBeLessThanOrEqual(scrollPadding + 16);
});

test('header stays visible and content fits across route types', async ({ page }) => {
  const routes = [
    '/',
    '/case-studies/',
    '/contact/',
    `/project/${caseStudies[0].slug}/`,
    `/services/${serviceOffers[0].id}/`,
    '/legal/',
    '/data-policy/',
    '/missing-page/',
  ];
  const viewportWidth = (await page.viewportSize()).width;

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('#main-content h1').first()).toBeVisible();
    await page.locator('#main-content').evaluate((element) => {
      element.style.minHeight = '2400px';
    });
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: route })
      .toBeGreaterThan(1000);
    await expect.poll(() => page.locator('header').first()
      .evaluate((element) => element.getBoundingClientRect().top), { message: route }).toBe(0);
    if (viewportWidth === 390) {
      expect(await page.evaluate(() => document.querySelector('#root').scrollWidth), route)
        .toBeLessThanOrEqual(viewportWidth);
    }
  }
});

test('estimate action stays reachable after deep scrolling', async ({ page }) => {
  await page.goto('/case-studies/');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

  if ((await page.viewportSize()).width < 768) {
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await page.getByRole('dialog', { name: 'Navigation menu' })
      .getByRole('button', { name: 'Request a Project Estimate' }).click();
  } else {
    await page.locator('header').getByRole('button', { name: 'Request Estimate' }).click();
  }
  await expect(page).toHaveURL(/\/contact\/?$/);
});

test('document scroll padding clears the sticky header for anchor navigation', async ({ page }) => {
  await page.goto('/');
  const padding = await page.locator('html').evaluate((element) =>
    parseFloat(getComputedStyle(element).scrollPaddingTop)
  );
  const header = await page.getByRole('banner').boundingBox();
  expect(padding).toBeGreaterThanOrEqual(header.height);
});

test('hero invoice proof fold structure per #176', async ({ page }) => {
  await page.goto('/');
  
  const hero = page.locator('section').first();
  await expect(hero).toBeVisible();
  
  const h1 = page.getByRole('heading', { level: 1, name: /Computer Vision & AI Engineer/i });
  await expect(h1).toBeVisible();
  
  const proofsGroup = page.locator('[role="group"][aria-label="Detected credentials"]');
  await expect(proofsGroup).toBeVisible();
  
  await expect(page.getByText('Top Rated Plus', { exact: true })).toBeVisible();
  await expect(page.getByText('100% Job Success', { exact: true })).toBeVisible();
  await expect(page.getByText('Upwork freelancer')).toBeVisible();
  await expect(page.getByText('Client delivery record')).toBeVisible();
  
  await expect(page.getByText('Detected total', { exact: true })).toHaveCount(0);
  await expect(page.getByText('PROOF ·', { exact: true })).toHaveCount(0);
  await expect(page.getByText('fields · 2', { exact: true })).toHaveCount(0);
  await expect(page.getByText('PROOF · DETECTED', { exact: true })).toHaveCount(0);
  
  const invoice = page.locator('article[aria-label="Profile invoice field parse"]');
  const rateField = invoice.locator('div', { has: page.getByText('Rate') }).filter({ hasText: '€45/hour' });
  await expect(rateField.getByText('€45/hour', { exact: true })).toBeVisible();
  
  const locationField = invoice.locator('div', { has: page.getByText('Location') }).filter({ hasText: 'Linz, Austria' });
  await expect(locationField.getByText('Linz, Austria', { exact: true })).toBeVisible();
  
  await expect(page.getByText('doc · extract · 0.97')).toBeVisible();
  await expect(page.getByText('INV-VP-0045')).toBeVisible();
});
