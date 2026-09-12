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
      return;
    }
    images.push({ src: image.src, alt: image.alt, width: image.width, height: image.height, ...(image.caption ? { caption: image.caption } : {}) });
  };
  const visit = (nodes = []) => nodes.forEach((node) => {
    if (node.type === 'image') add(node);
    if (node.children) visit(node.children);
    if (node.items) visit(node.items);
  });
  add(story.image);
  story.gallery?.forEach((media) => add(media.poster ? { ...media, src: media.poster } : media));
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
      opener.current?.focus();
    };
  }, [expanded]);
  if (!selected) return null;
  const cover = (image, loading = 'eager') => h('figure', { className: 'case-study-cover', key: image.src },
    h('a', { href: image.src }, h('img', { src: image.src, alt: image.alt, width: image.width, height: image.height, loading })),
    image.caption ? h('figcaption', null, image.caption) : null);
  if (images.length === 1) return cover(selected);
  if (!interactive) return h(React.Fragment, null, images.map((image, i) => cover(image, i ? 'lazy' : 'eager')));
  const button = (label, action, content, props = {}) => h('button', { type: 'button', 'aria-label': label, onClick: action, ...props }, content);
  const keyboard = (event) => {
    const inspectingZoom = zoom > 1 && event.target.classList.contains('case-gallery-viewport');
    if (!inspectingZoom && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
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
      large ? h('div', { className: 'case-gallery-viewport', tabIndex: 0, 'aria-label': 'Enlarged image; scroll to inspect when zoomed' },
        h('img', { src: selected.src, alt: selected.alt, style: { width: `${zoom * 100}%`, maxWidth: 'none', height: `${zoom * 100}%` } }))
        : button(`Enlarge image: ${selected.alt}`, () => setExpanded(true), h('img', { src: selected.src, alt: selected.alt, width: selected.width, height: selected.height }), { className: 'case-gallery-open', ref: opener }),
      button('Previous image', () => select(index - 1), '‹', { className: 'case-gallery-arrow case-gallery-prev' }),
      button('Next image', () => select(index + 1), '›', { className: 'case-gallery-arrow case-gallery-next' })),
    h('p', { className: 'case-gallery-count', 'aria-live': 'polite', 'aria-atomic': true }, `${index + 1} of ${images.length}`),
    large ? h('div', { className: 'case-gallery-zoom' },
      button('Zoom out', () => setZoom(Math.max(1, zoom - 0.5)), '−', { disabled: zoom === 1 }),
      h('span', null, `${zoom * 100}%`),
      button('Zoom in', () => setZoom(Math.min(3, zoom + 0.5)), '+', { disabled: zoom === 3 })) : null,
    h('div', { className: 'case-gallery-thumbnails', ref: large ? expandedStrip : inlineStrip, 'aria-label': 'Choose an image' }, images.map((image, i) => button(`Show image ${i + 1}: ${image.alt}`, () => select(i), h('img', { src: image.src, alt: '', loading: 'lazy' }), { key: image.src, 'aria-pressed': i === index }))),
    selected.caption ? h('p', { className: 'case-gallery-caption' }, selected.caption) : null);
  return h(React.Fragment, null,
    h('section', { className: 'case-gallery', 'aria-label': 'Case study images', onKeyDown: keyboard, inert: expanded ? '' : undefined }, gallery(false)),
    expanded ? createPortal(h('div', { className: 'case-gallery-overlay', onClick: (event) => { if (event.target === event.currentTarget) close(); } },
      h('div', { role: 'dialog', 'aria-modal': true, 'aria-label': 'Enlarged case study images', className: 'case-gallery-dialog', ref: dialog, onKeyDown: keyboard },
        button('Close enlarged image', close, '×', { className: 'case-gallery-close' }), gallery(true))), document.body) : null);
}
