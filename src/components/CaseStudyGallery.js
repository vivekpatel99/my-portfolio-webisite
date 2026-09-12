import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
const h = React.createElement;

export function collectGalleryImages(story) {
  const images = [];
  const add = (image) => {
    if (!image) return;
    const existing = images.find((entry) => entry.src === image.src);
    if (existing) {
      if (!existing.alt && image.alt) existing.alt = image.alt;
      if (!existing.caption && image.caption) existing.caption = image.caption;
      if (!existing.poster && image.poster) existing.poster = image.poster;
      return;
    }
    images.push({
      src: image.src,
      alt: image.alt,
      ...(image.width === undefined ? {} : { width: image.width }),
      ...(image.height === undefined ? {} : { height: image.height }),
      ...(image.poster ? { poster: image.poster } : {}),
      ...(image.caption ? { caption: image.caption } : {}),
    });
  };
  const visit = (nodes = []) => nodes.forEach((node) => {
    if (node.type === 'image') add(node);
    if (node.children) visit(node.children);
    if (node.items) visit(node.items);
  });
  add(story.image);
  story.gallery?.forEach(add);
  story.sections.forEach((section) => visit(section.nodes));
  return images;
}

export default function CaseStudyGallery({ images, interactive = typeof window !== 'undefined' }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const opener = useRef(null);
  const dialog = useRef(null);
  const touch = useRef(null);
  const inlineStrip = useRef(null);
  const expandedStrip = useRef(null);
  const selected = images[index] || images[0];
  const select = (next) => { setIndex((next + images.length) % images.length); setZoom(1); };
  const close = () => { setExpanded(false); setZoom(1); };
  useEffect(() => {
    const strip = expanded ? expandedStrip.current : inlineStrip.current;
    const thumbnail = strip?.querySelector('[aria-pressed="true"]');
    if (thumbnail) strip.scrollLeft = Math.max(0, thumbnail.offsetLeft - strip.clientWidth / 2 + thumbnail.clientWidth / 2);
  }, [index, expanded]);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const overlay = dialog.current?.parentElement;
    const background = [...document.body.children].filter((element) => element !== overlay);
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    dialog.current?.querySelector('button')?.focus();
    return () => {
      background.forEach((element, i) => { element.inert = previousInert[i]; });
      document.body.style.overflow = previousOverflow;
      // The opener button is replaced by a <video> when the dialog switches to a video, so fall back to the inline strip.
      const restore = opener.current?.isConnected ? opener.current
        : inlineStrip.current?.querySelector('[aria-pressed="true"]') || inlineStrip.current?.querySelector('button');
      restore?.focus();
    };
  }, [expanded]);
  if (!selected) return null;
  const isVideo = (media) => /\.(?:mp4|webm|ogv)$/i.test(media.src);
  const media = (item, fitted = true) => isVideo(item)
    ? h('video', {
      src: item.src,
      poster: item.poster,
      controls: true,
      preload: 'metadata',
      'aria-label': item.alt,
      style: fitted ? { display: 'block', width: '100%', height: '100%', objectFit: 'contain' } : { display: 'block', width: '100%' },
    })
    : h('img', { src: item.src, alt: item.alt, width: item.width, height: item.height });
  const preview = (item, loading = 'lazy') => h('img', {
    src: item.poster || item.src,
    alt: item.poster ? item.alt : '',
    width: item.width,
    height: item.height,
    loading,
  });
  const cover = (image, loading = 'eager') => h('figure', { className: 'case-study-cover', key: image.src },
    isVideo(image) ? media(image, false) : h('a', { href: image.src }, h('img', { src: image.src, alt: image.alt, width: image.width, height: image.height, loading })),
    image.caption ? h('figcaption', null, image.caption) : null);
  if (images.length === 1) return cover(selected);
  const button = (label, action, content, props = {}) => h('button', { type: 'button', 'aria-label': label, onClick: action, ...props }, content);
  const keyboard = (event) => {
    const seekingMedia = Boolean(event.target.closest?.('video, audio'));
    const inspectingZoom = zoom > 1 && event.target.classList.contains('case-gallery-viewport');
    if (!seekingMedia && !inspectingZoom && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault(); select(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Escape') close();
    if (expanded && event.key === 'Tab') {
      const buttons = [...dialog.current.querySelectorAll('*')].filter((element) =>
        (element.tagName === 'BUTTON' && !element.disabled) || element.getAttribute('tabindex') === '0');
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  const gallery = (large) => h(React.Fragment, null,
    h('div', { className: 'case-gallery-stage', style: large && zoom > 1 ? { touchAction: 'auto' } : undefined, onTouchStart: (event) => { touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }, onTouchEnd: (event) => {
      if (!touch.current || zoom > 1) return;
      const dx = event.changedTouches[0].clientX - touch.current.x;
      const dy = event.changedTouches[0].clientY - touch.current.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) select(index + (dx < 0 ? 1 : -1));
      touch.current = null;
    }, onTouchCancel: () => { touch.current = null; } },
      isVideo(selected) ? media(selected)
        : large ? h('div', { className: 'case-gallery-viewport', tabIndex: 0, 'aria-label': 'Enlarged image; scroll to inspect when zoomed' },
        h('img', { src: selected.src, alt: selected.alt, style: { width: `${zoom * 100}%`, maxWidth: 'none', height: `${zoom * 100}%` } }))
        : interactive
          ? button(`Enlarge image: ${selected.alt}`, (event) => { opener.current = event.currentTarget; setExpanded(true); }, h('img', { src: selected.src, alt: selected.alt, width: selected.width, height: selected.height }), { className: 'case-gallery-open' })
          : h('a', { href: selected.src, className: 'case-gallery-open', style: { display: 'block', width: '100%', height: '100%', padding: '12px' } }, h('img', { src: selected.src, alt: selected.alt, width: selected.width, height: selected.height })),
      interactive ? button('Previous image', () => select(index - 1), '‹', { className: 'case-gallery-arrow case-gallery-prev' }) : null,
      interactive ? button('Next image', () => select(index + 1), '›', { className: 'case-gallery-arrow case-gallery-next' }) : null),
    h('p', { className: 'case-gallery-count', 'aria-live': 'polite', 'aria-atomic': true }, `${index + 1} of ${images.length}`),
    large && !isVideo(selected) ? h('div', { className: 'case-gallery-zoom' },
      button('Zoom out', () => setZoom(Math.max(1, zoom - 0.5)), '−', { disabled: zoom === 1 }),
      h('span', null, `${zoom * 100}%`),
      button('Zoom in', () => setZoom(Math.min(3, zoom + 0.5)), '+', { disabled: zoom === 3 })) : null,
    h('div', { className: 'case-gallery-thumbnails', ref: large ? expandedStrip : inlineStrip, 'aria-label': 'Choose an image' }, images.map((image, i) => interactive
      ? button(`Show image ${i + 1}: ${image.alt}`, () => select(i), preview(image), { key: image.src, className: 'case-gallery-thumbnail', 'aria-pressed': i === index })
      : h('a', { href: image.src, key: image.src, className: 'case-gallery-thumbnail', 'aria-label': `Open media ${i + 1}: ${image.alt}` }, preview(image)))),
    interactive
      ? selected.caption ? h('p', { className: 'case-gallery-caption' }, selected.caption) : null
      : images.map((image) => image.caption ? h('p', { className: 'case-gallery-caption', key: `${image.src}-caption` }, image.caption) : null));
  return h(React.Fragment, null,
    h('section', { className: 'case-gallery', 'aria-label': 'Case study images', onKeyDown: keyboard, inert: expanded ? '' : undefined }, gallery(false)),
    expanded ? createPortal(h('div', { className: 'case-gallery-overlay', onClick: (event) => { if (event.target === event.currentTarget) close(); } },
      h('div', { role: 'dialog', 'aria-modal': true, 'aria-label': 'Enlarged case study images', className: 'case-gallery-dialog', ref: dialog, onKeyDown: keyboard },
        button('Close enlarged image', close, '×', { className: 'case-gallery-close' }), gallery(true))), document.body) : null);
}
