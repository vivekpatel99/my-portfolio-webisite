import { digest } from './case-study-evidence.js';

// Authored, public-only card copy approved under issue #369. The staged story
// remains the authority for the full cover caption and all article/media data.
// Bind each shortening to the reviewed summary, sections and media: replacement media
// or revised scope must fall back to its full caption until reviewed again.
export const reviewedCardCaptions = {
  'n8n-openai-data-extraction': {
    scopeDigest: '2f418cff304f0e4c76c9596e6ac86ccf49569d1f8ac04f8b093674196cf71aa6',
    caption: 'Workflow illustration.',
  },
  'invoice-ocr-extraction': {
    scopeDigest: '027b354f818ece1d42adc914ac8ec5a323fc539353a02fc2190923cf6581e581',
    caption: 'Workflow illustration. Known layout and fixed crop.',
  },
  'yolo-computer-vision-optimization': {
    scopeDigest: '2d05e8c4feb2d136638dab344867e0af28e6e60299e71c970645fdf335115224',
    caption: 'Still-image illustration. Form scoring remains separate.',
  },
  'ai-invoice-processing-automation': {
    scopeDigest: 'a076d823d7d5db424f365339616ebf4fe05ac2f168166c8c214583642fa291fa',
    caption: 'Workflow illustration.',
  },
  'ai-project-planning-assistant': {
    scopeDigest: '2fadfb60076655cdac326edff2a0044b2ed44bd5a9d523a5a337332699939cbd',
    caption: 'Conceptual workflow illustration.',
  },
  'browser-search-to-spreadsheet': {
    scopeDigest: 'e426094a317f06b82ee20a50e9ccbaacf67384d3b46a65841d3fa10f0594cc3f',
    caption: 'Workflow illustration with fictional search data.',
  },
  'depth-based-distance-estimation': {
    scopeDigest: '1cf8f92f915886163311cddf1f6f7ea1371989cc8a68dfa0d101b1e5da67cf9e',
    caption: 'Webcam illustration. Stored reference scale and assumed camera geometry require setup-specific validation.',
  },
  'healthcare-document-intelligence': {
    scopeDigest: '5558d90c7a698f90a21e44a50bc027ff110cf88ad80cb2c5c34749cbb9f85684',
    caption: 'Native PDF illustration with fictional entries. Request legend: 0 Off, 1 Available, 2 Request to Work.',
  },
  'n8n-python-ai-agents': {
    scopeDigest: 'ddf2dde973cf75214effbdfa7e0211f27ac6da790b3ebee74b66e83e0943699f',
    caption: 'Workflow illustration. SELECT checks and default LIMIT 100 do not guarantee read-only database access or a maximum result size.',
  },
  'python-ci-workflow-automation': {
    scopeDigest: '0a1b37889d26f67ae36a08f6579616db1f1d076ff87e295244142cbf664417b8',
    caption: 'Workflow illustration. Supports an existing code-quality workflow; not an executed CI run.',
  },
  'resumable-listing-data-extraction': {
    scopeDigest: 'f416a32503cb4e179b89eeac9c75db242d56560db4fde93f857af58b7b50ccdc',
    caption: 'Workflow illustration. Resume uses saved JSON Lines listing IDs; processing settings are defined in code.',
  },
  'sports-video-analytics-yolo': {
    scopeDigest: '20499ef68079f5376a666416a8cba6becb6cee182000dd747a5a0a47795913d5',
    caption: 'Workflow illustration.',
  },
};

export function compactCardCaption(story) {
  const reviewed = reviewedCardCaptions[story.id];
  if (!reviewed || !story.image?.caption) return undefined;
  const scopeDigest = digest({ summary: story.summary, sections: story.sections, image: story.image, gallery: story.gallery });
  return scopeDigest === reviewed.scopeDigest ? reviewed.caption : undefined;
}
