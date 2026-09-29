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
  const cssGradientColors = (value) => {
    if (!/gradient\(/i.test(value)) return [];
    const stops = cssColors(value);
    return stops.slice(0, -1).flatMap((color, index) => {
      const next = stops[index + 1];
      return Array.from({ length: 21 }, (_, sample) => {
        const progress = sample / 20;
        return {
          rgb: color.rgb.map((channel, channelIndex) => channel
            + (next.rgb[channelIndex] - channel) * progress),
          alpha: color.alpha + (next.alpha - color.alpha) * progress,
        };
      });
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
    const leftStop = stops[Math.max(0, right - 1)] ?? stops.at(-1);
    const rightStop = stops[Math.max(0, right)] ?? stops.at(-1);
    const span = rightStop.position - leftStop.position;
    const ratio = span <= 0 ? 1 : (progress - leftStop.position) / span;
    return {
      rgb: leftStop.color.rgb.map((channel, channelIndex) => channel
        + (rightStop.color.rgb[channelIndex] - channel) * ratio),
      alpha: leftStop.color.alpha + (rightStop.color.alpha - leftStop.color.alpha) * ratio,
    };
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
  const sampleImage = (image, point, rect, fit = 'fill', position = '50% 50%', repeat = 'no-repeat', size = 'auto') => {
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
      const sampleWidth = Math.min(image.naturalWidth, image.naturalWidth / width);
      const sampleHeight = Math.min(image.naturalHeight, image.naturalHeight / height);
      const sourceX = Math.min(image.naturalWidth - sampleWidth, Math.max(0,
        x / width * image.naturalWidth - sampleWidth / 2));
      const sourceY = Math.min(image.naturalHeight - sampleHeight, Math.max(0,
        y / height * image.naturalHeight - sampleHeight / 2));
      pixelContext.clearRect(0, 0, 1, 1);
      pixelContext.drawImage(image, sourceX, sourceY, sampleWidth, sampleHeight, 0, 0, 1, 1);
      const [red, green, blue, alpha] = pixelContext.getImageData(0, 0, 1, 1).data;
      return { rgb: [red, green, blue], alpha: alpha / 255 };
    } catch {
      return null;
    }
  };

  const measure = async (element) => {
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
    const rect = element.getBoundingClientRect();
    const samplePoint = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const imagesAtPoint = [...document.images].filter((image) => {
      const imageRect = image.getBoundingClientRect();
      return samplePoint.x >= imageRect.left && samplePoint.x <= imageRect.right
        && samplePoint.y >= imageRect.top && samplePoint.y <= imageRect.bottom;
    });
    let backgrounds = [[0, 0, 0]];
    let imageSamplingFailed = false;
    const applyNodeBackground = async (node, currentBackgrounds) => {
      const style = getComputedStyle(node);
      const color = parseColor(style.backgroundColor);
      if (color && color.alpha > 0) currentBackgrounds = currentBackgrounds.map((background) => composite(color, background));
      const imageLayers = splitLayers(style.backgroundImage);
      for (let index = imageLayers.length - 1; index >= 0; index -= 1) {
        const layer = imageLayers[index];
        if (!layerCoversPoint(node, samplePoint, style, index)) continue;
        if (layer.includes('url(')) {
          const image = await loadCssImage(layer);
          const sample = sampleImage(image, samplePoint, node.getBoundingClientRect(), 'none',
            layerValue(style, 'backgroundPosition', index, '0% 0%'),
            layerValue(style, 'backgroundRepeat', index, 'repeat'),
            layerValue(style, 'backgroundSize', index, 'auto'));
          if (!sample) imageSamplingFailed = true;
          else currentBackgrounds = currentBackgrounds.map((background) => composite(sample, background));
          continue;
        }
        const sampledGradient = cssGradientColorAtPoint(layer, node, style, index, samplePoint);
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
    const imagePlacements = imagesAtPoint.map((image) => {
      const imageAncestors = new Set();
      for (let node = image.parentElement; node; node = node.parentElement) imageAncestors.add(node);
      const commonAncestor = [...ancestors].reverse().find((node) => imageAncestors.has(node));
      const imagePath = [];
      for (let node = image.parentElement; node && node !== commonAncestor; node = node.parentElement) imagePath.unshift(node);
      return { image, commonAncestor, imagePath };
    });
    for (const node of ancestors) {
      backgrounds = await applyNodeBackground(node, backgrounds);
      for (const placement of imagePlacements.filter(({ commonAncestor }) => commonAncestor === node)) {
        let imageBackgrounds = backgrounds;
        for (const imageNode of placement.imagePath) imageBackgrounds = await applyNodeBackground(imageNode, imageBackgrounds);
        imageBackgrounds = await applyNodeBackground(placement.image, imageBackgrounds);
        if (!placement.image.complete) placement.image.loading = 'eager';
        try {
          await placement.image.decode();
        } catch {
          imageSamplingFailed = true;
        }
        const imageStyle = getComputedStyle(placement.image);
        const sample = sampleImage(placement.image, samplePoint, placement.image.getBoundingClientRect(), imageStyle.objectFit, imageStyle.objectPosition);
        if (!sample) imageSamplingFailed = true;
        else imageBackgrounds = imageBackgrounds.map((background) => composite(sample, background));

        const targetChild = ancestors[ancestors.indexOf(node) + 1];
        const imageChild = placement.imagePath[0] ?? placement.image;
        const siblings = [...node.children];
        const imageChildIndex = siblings.indexOf(imageChild);
        const targetChildIndex = siblings.indexOf(targetChild);
        if (imageChildIndex >= 0 && targetChildIndex > imageChildIndex) {
          for (const overlay of siblings.slice(imageChildIndex + 1, targetChildIndex)) {
            const overlayRect = overlay.getBoundingClientRect();
            if (samplePoint.x >= overlayRect.left && samplePoint.x <= overlayRect.right
              && samplePoint.y >= overlayRect.top && samplePoint.y <= overlayRect.bottom) {
              imageBackgrounds = await applyNodeBackground(overlay, imageBackgrounds);
            }
          }
        }
        backgrounds = imageBackgrounds;
      }
    }
    const style = getComputedStyle(element);
    const parsedForeground = parseColor(style.color);
    if (!parsedForeground) throw new Error('Could not parse rendered foreground color');
    const foregrounds = backgrounds.map((background) => composite(parsedForeground, background));
    const contrasts = imageSamplingFailed ? [1] : backgrounds.map((background, index) => {
      const foregroundLuminance = luminance(foregrounds[index]);
      const backgroundLuminance = luminance(background);
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    });
    const worstBackgroundIndex = imageSamplingFailed ? 0 : contrasts.indexOf(Math.min(...contrasts));
    const ownText = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    return {
      ratio: contrasts[worstBackgroundIndex],
      foreground: foregrounds[worstBackgroundIndex],
      background: imageSamplingFailed ? [0, 0, 0] : backgrounds[worstBackgroundIndex],
      tag: element.tagName,
      className: element.className,
      fontSize: parseFloat(style.fontSize),
      text: ownText.slice(0, 60),
      transparentText: parsedForeground.alpha === 0,
      visible: rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden'
        && style.display !== 'none',
    };
  };
  return Array.isArray(target) ? Promise.all(target.map(measure)) : measure(target);
};

const renderedContrast = async (locator) => locator.evaluate(measureRenderedContrast);

const expectRenderedContrast = async (locator, label, minimum = 4.5) => {
  const result = await renderedContrast(locator);
  expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(minimum);
  return result;
};

const expectRenderedForeground = async (locator, label, expected) => {
  await expect.poll(
    async () => (await renderedContrast(locator)).foreground.join(','),
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
    page.locator('#main-content').getByRole('link', { name: 'View All Services' }),
    'Unknown service fallback link',
  );
});

test('visible text under 14px meets 4.5:1 on its rendered background', async ({ page }) => {
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
