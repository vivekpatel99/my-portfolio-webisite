import React from 'react';
import CaseStudyGallery, { collectGalleryImages } from './CaseStudyGallery.js';

// Images belong to the top gallery; prune their now-empty text containers.
const withoutImages = (nodes) => nodes.flatMap((node) => {
  if (node.type === 'image') return [];
  const copy = { ...node };
  if (node.children) {
    copy.children = withoutImages(node.children);
    if (!copy.children.length) return [];
  }
  if (node.items) {
    copy.items = withoutImages(node.items);
    if (!copy.items.length) return [];
  }
  return [copy];
});

const renderInline = (nodes, keyPrefix) => nodes.map((node, index) => {
  const key = `${keyPrefix}-inline-${index}`;
  switch (node.type) {
    case 'text': return node.value;
    case 'code': return React.createElement('code', { key }, node.value);
    case 'strong': return React.createElement('strong', { key }, renderInline(node.children, key));
    case 'emphasis': return React.createElement('em', { key }, renderInline(node.children, key));
    case 'delete': return React.createElement('del', { key }, renderInline(node.children, key));
    case 'break': return React.createElement('br', { key });
    case 'link': return React.createElement('a', { key, href: node.href }, renderInline(node.children, key));
    default: return null;
  }
});

const renderBlocks = (nodes, keyPrefix) => nodes.map((node, index) => {
  const key = `${keyPrefix}-block-${index}`;
  const children = node.children ? renderInline(node.children, key) : null;
  switch (node.type) {
    case 'paragraph': return React.createElement('p', { key }, children);
    case 'heading': return React.createElement(`h${Math.min(Math.max(node.level, 3), 6)}`, { key }, children);
    case 'codeBlock': return React.createElement('pre', { key }, React.createElement('code', { className: node.language ? `language-${node.language}` : undefined }, node.value));
    case 'blockquote': return React.createElement('blockquote', { key }, renderBlocks(node.children, key));
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul';
      const props = { key };
      if (node.ordered && node.start !== 1 && node.start !== '') props.start = node.start;
      return React.createElement(tag, props, node.items.map((item, itemIndex) => React.createElement('li', { key: `${key}-item-${itemIndex}` }, renderBlocks(item.children, `${key}-item-${itemIndex}`))));
    }
    default: return null;
  }
});

export const CaseStudyArticle = ({ story, backHref = '/#portfolio' }) => React.createElement(
  'article', { className: 'case-study-article' },
  React.createElement('a', { className: 'case-study-back', href: backHref }, '← View case studies'),
  story.category ? React.createElement('p', { className: 'case-study-category' }, story.category) : null,
  React.createElement('h1', null, story.title),
  React.createElement('p', { className: 'case-study-summary' }, story.summary),
  React.createElement(CaseStudyGallery, { key: story.slug || story.id, images: collectGalleryImages(story) }),
  React.createElement('div', { className: 'case-study-sections' }, story.sections.map((section) => ({ ...section, nodes: withoutImages(section.nodes) })).filter((section) => section.nodes.length).map((section) => React.createElement(
    'section', { key: section.key },
    React.createElement('h2', null, section.heading),
    renderBlocks(section.nodes, section.key),
  ))),
  React.createElement('div', { className: 'case-study-cta' },
    React.createElement('p', null, 'Working on something similar?'),
    React.createElement('a', { href: '/contact/' }, 'Discuss a similar project →'),
  ),
);

export default CaseStudyArticle;
