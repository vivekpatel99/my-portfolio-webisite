// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { compileCaseStudyPublication } from '../../publication/compile-case-studies.js';
import Gallery, { collectGalleryImages } from './CaseStudyGallery.js';
afterEach(cleanup);
const images = ['Input', 'Output', 'Workflow'].map((alt, i) => ({ src: `/image-${i}.png`, alt, width: 800, height: 600 }));
describe('case study gallery', () => {
  it('collects approved legacy gallery images from the public record', () => {
    const story = compileCaseStudyPublication().find(({ slug }) => slug === 'invoice-ocr-extraction');
    expect(story.gallery).toHaveLength(2);
    expect(collectGalleryImages(story).map(({ src }) => src)).toEqual([
      '/assets/case-studies/invoice-ocr.webp',
      '/assets/case-studies/planning-graph.webp',
    ]);
  });
  it('collects only story images in order and deduplicates by source', () => {
    expect(collectGalleryImages({ image: images[0], sections: [{ nodes: [{ children: [{ type: 'image', ...images[0] }, { type: 'image', ...images[1] }] }] }] })).toEqual(images.slice(0, 2));
  });
  it('merges missing metadata from a later duplicate source', () => {
    const first = { ...images[0], alt: undefined };
    const duplicate = { type: 'image', ...images[0], alt: 'Later alt', caption: 'Later caption' };
    expect(collectGalleryImages({ image: first, sections: [{ nodes: [duplicate] }] })[0]).toMatchObject({
      src: images[0].src, alt: 'Later alt', caption: 'Later caption',
    });
  });
  it('keeps the first caption when duplicate sources both have captions', () => {
    const first = { ...images[0], caption: 'First caption' };
    const duplicate = { type: 'image', ...images[0], caption: 'Later caption' };
    expect(collectGalleryImages({ image: first, sections: [{ nodes: [duplicate] }] })[0].caption).toBe('First caption');
  });
  it('uses stage geometry and exposes every image URL in static markup', () => {
    const staticImages = images.map((image, i) => ({ ...image, caption: `Caption ${i + 1}` }));
    const html = renderToStaticMarkup(<Gallery images={staticImages} interactive={false} />);
    expect(html).toContain('case-gallery-stage');
    expect(html).not.toContain('case-study-cover');
    expect(html).not.toContain('aria-label="Previous image"');
    expect(html).not.toContain('aria-label="Next image"');
    staticImages.forEach((image) => expect(html).toContain(`href="${image.src}"`));
    staticImages.forEach((image) => expect(html).toContain(image.caption));
    expect(html.match(/class="case-gallery-thumbnail"/g)).toHaveLength(staticImages.length);
    expect(readFileSync('src/components/CaseStudyArticle.css', 'utf8'))
      .toMatch(/\.case-gallery-thumbnails (?:button, \.case-gallery-thumbnails )?a/);
  });
  it('uses gallery stage geometry on the first client render', () => {
    const html = renderToStaticMarkup(<Gallery images={images} />);
    expect(html).toContain('case-gallery-stage');
    expect(html).not.toContain('case-study-cover');
  });
  it('preserves a single cover without gallery controls', () => {
    render(<Gallery images={[images[0]]} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link').getAttribute('href')).toBe(images[0].src);
  });
  it('preserves and renders video sources while using the poster as a preview', () => {
    const video = {
      src: '/football-tracking.mp4',
      poster: '/football-tracking.webp',
      alt: 'Tracked football players',
    };
    expect(collectGalleryImages({ gallery: [video], sections: [] })[0]).toEqual(video);
    const { container } = render(<Gallery images={[video]} />);
    const renderedVideo = container.querySelector('video');
    expect(renderedVideo?.getAttribute('src')).toBe(video.src);
    expect(renderedVideo?.getAttribute('poster')).toBe(video.poster);
  });
  it('leaves arrow keys to focused video controls', () => {
    const video = { src: '/football-tracking.mp4', poster: '/football-tracking.webp', alt: 'Tracked football players' };
    render(<Gallery images={[images[0], video]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show image 2: Tracked football players' }));
    fireEvent.keyDown(screen.getByLabelText(video.alt), { key: 'ArrowRight' });
    expect(screen.getByText('2 of 2')).toBeTruthy();
  });
  it('still closes the dialog with Escape while native video controls hold focus', () => {
    const video = { src: '/football-tracking.mp4', poster: '/football-tracking.webp', alt: 'Tracked football players' };
    render(<Gallery images={[images[0], video]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.querySelector('[aria-label="Show image 2: Tracked football players"]'));
    fireEvent.keyDown(dialog.querySelector('video'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('restores focus to a remaining control when the opener is replaced by a video', () => {
    const video = { src: '/football-tracking.mp4', poster: '/football-tracking.webp', alt: 'Tracked football players' };
    render(<Gallery images={[images[0], video]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.querySelector('[aria-label="Show image 2: Tracked football players"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Close enlarged image' }));
    const gallery = screen.getByRole('region', { name: 'Case study images' });
    expect(screen.queryByRole('button', { name: 'Enlarge image: Tracked football players' })).toBeNull();
    expect(gallery.contains(document.activeElement)).toBe(true);
    expect(document.activeElement.getAttribute('aria-label')).toBe('Show image 2: Tracked football players');
  });
  it('shows only the selected caption in the interactive gallery', () => {
    const captioned = images.slice(0, 2).map((image, i) => ({ ...image, caption: `Caption ${i + 1}` }));
    render(<Gallery images={captioned} />);
    expect(screen.getByText('Caption 1')).toBeTruthy();
    expect(screen.queryByText('Caption 2')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show image 2: Output' }));
    expect(screen.queryByText('Caption 1')).toBeNull();
    expect(screen.getByText('Caption 2')).toBeTruthy();
  });
  it('hides image zoom controls when a video is selected in the dialog', () => {
    const video = { src: '/football-tracking.mp4', poster: '/football-tracking.webp', alt: 'Tracked football players' };
    render(<Gallery images={[images[0], video]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.querySelector('[aria-label="Show image 2: Tracked football players"]'));
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull();
  });
  it('loops and selects thumbnails using accessible controls', () => {
    render(<Gallery images={images} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByText('3 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('1 of 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show image 2: Output' }));
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });
  it('supports keyboard navigation, enlargement, zoom and Escape focus restoration', () => {
    render(<Gallery images={images} />);
    const opener = screen.getByRole('button', { name: 'Enlarge image: Input' });
    opener.focus();
    fireEvent.keyDown(opener, { key: 'ArrowRight' });
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Output' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('150%')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe('');
  });
  it('scales zoom from the fitted image size, not the viewport width alone', () => {
    render(<Gallery images={images} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    const enlarged = screen.getByLabelText('Enlarged image; scroll to inspect when zoomed').querySelector('img');
    expect(enlarged.style.width).toBe('150%');
    expect(enlarged.style.height).toBe('150%');
  });
  it('swipes horizontally without treating vertical scrolling as navigation', () => {
    const { container } = render(<Gallery images={images} />);
    const stage = container.querySelector('.case-gallery-stage');
    fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 100, clientY: 110 }] });
    expect(screen.getByText('2 of 3')).toBeTruthy();
    fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 190, clientY: 250 }] });
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });
  it('allows touch and keyboard panning when enlarged and zoomed', () => {
    render(<Gallery images={images} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    const viewport = screen.getByLabelText('Enlarged image; scroll to inspect when zoomed');
    expect(viewport.parentElement.style.touchAction).toBe('auto');
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    expect(screen.getByText('150%')).toBeTruthy();
    expect(screen.getByRole('dialog').textContent).toContain('1 of 3');
    fireEvent.keyDown(viewport, { key: 'Escape' });
    const stage = screen.getByRole('region', { name: 'Case study images' }).querySelector('.case-gallery-stage');
    fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 100, clientY: 110 }] });
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });
  it('traps modal focus and restores the background when closed', () => {
    render(<Gallery images={images} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    const close = screen.getByRole('button', { name: 'Close enlarged image' });
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement.getAttribute('aria-label')).toBe('Show image 3: Workflow');
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.click(close);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: 'Case study images' }).hasAttribute('inert')).toBe(false);
  });
  it('keeps the portal dialog inside the overlay by sizing it with the border box', () => {
    // The portal renders outside `.case-study-article`, so it cannot inherit that subtree's border-box rule.
    const style = document.createElement('style');
    style.textContent = readFileSync('src/components/CaseStudyArticle.css', 'utf8');
    document.head.append(style);
    render(<Gallery images={images} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Input' }));
    const dialog = screen.getByRole('dialog');
    expect(getComputedStyle(dialog.parentElement).boxSizing).toBe('border-box');
    expect(getComputedStyle(dialog).boxSizing).toBe('border-box');
    expect(getComputedStyle(dialog.querySelector('.case-gallery-thumbnail')).boxSizing).toBe('border-box');
    style.remove();
  });
});
