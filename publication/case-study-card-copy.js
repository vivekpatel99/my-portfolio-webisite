import { digest } from './case-study-evidence.js';

// Authored, public-only card copy approved under issue #369. The staged story
// remains the authority for the full cover caption and all article/media data.
// Bind each shortening to that exact cover path and caption: replacement media
// or revised scope must fall back to its full caption until reviewed again.
const reviewedCardCaptions = {
  'n8n-openai-data-extraction': {
    coverDigest: '76211a5f825314094611a8d6e18ecaed23436dc8b375ccfa866e17edaf8d2620',
    caption: 'Workflow illustration.',
  },
  'invoice-ocr-extraction': {
    coverDigest: '62e82d7ebb2b5ae13c1ec5fcf10a07881e2a5ee454c6fbd373b651cf6920ca1a',
    caption: 'Workflow illustration. Known layout and fixed crop.',
  },
  'yolo-computer-vision-optimization': {
    coverDigest: '4ab76851f5639c3d00a22c41577c52c4db8689886f62dfeb624363520a4fe0ed',
    caption: 'Still-image illustration. Form scoring remains separate.',
  },
  'ai-invoice-processing-automation': {
    coverDigest: '428eab3e2c00d8ec18fd1d862c88d9d82ec1a1b67e4fee86da16b8aaa0e77290',
    caption: 'Workflow illustration.',
  },
  'ai-project-planning-assistant': {
    coverDigest: '401166ad0b93a7c637d5c49b60d5d8bf7588f0eed5f055c448c67191b5a3a0da',
    caption: 'Conceptual workflow illustration.',
  },
  'browser-search-to-spreadsheet': {
    coverDigest: '95de7c355c95ae424ab28f45552378418044d36c13121bea6fb666be73b9cc52',
    caption: 'Workflow illustration with fictional search data.',
  },
  'depth-based-distance-estimation': {
    coverDigest: 'e080ca4a882d3d5312d0c3dd90d3f80c11b8dc3e5c7970dca56a015a70d650a4',
    caption: 'Webcam illustration. Stored reference scale and assumed camera geometry require setup-specific validation.',
  },
  'healthcare-document-intelligence': {
    coverDigest: '641066ef230bf6852c220309278c7eb39340f4eada37f59b762138c6dae2de9c',
    caption: 'Native PDF illustration with fictional entries. Request legend: 0 Off, 1 Available, 2 Request to Work.',
  },
  'n8n-python-ai-agents': {
    coverDigest: '206fa58b15856293e6ffd6dde81b3184b2696d8ee578a1f27ccba78f2a1c50d7',
    caption: 'Workflow illustration. SELECT checks and default LIMIT 100 do not guarantee read-only database access or a maximum result size.',
  },
  'python-ci-workflow-automation': {
    coverDigest: '998d00d436887b6a777b25b0e926e1073dbdc9e3a5da9ce4b77ef427c02e2801',
    caption: 'Workflow illustration, not an executed CI run.',
  },
  'resumable-listing-data-extraction': {
    coverDigest: 'f9ae1759e98e623fbd1abba7bd3047128c5145bbfc88baaadbf638d01e154b01',
    caption: 'Workflow illustration. Resume uses saved JSON Lines listing IDs; processing settings are defined in code.',
  },
  'sports-video-analytics-yolo': {
    coverDigest: '7eedc7d00fed618fcfbb2857e38ad415be7b801cc6a7b8742f652f0a9d66adf9',
    caption: 'Workflow illustration.',
  },
};

export function compactCardCaption(story) {
  const reviewed = reviewedCardCaptions[story.id];
  if (!reviewed || !story.image?.caption) return undefined;
  const coverDigest = digest({ src: story.image.src, caption: story.image.caption });
  return coverDigest === reviewed.coverDigest ? reviewed.caption : undefined;
}
