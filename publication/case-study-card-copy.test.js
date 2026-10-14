// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';
import { compactCardCaption, reviewedCardCaptions } from './case-study-card-copy.js';

const publication = compileCaseStudyPublication();

describe('reviewed compact card captions', () => {
  it('projects each reviewed note without changing article content, and detects stale bindings', () => {
    for (const [id, reviewed] of Object.entries(reviewedCardCaptions)) {
      const story = publication.find((item) => item.id === id);
      expect(story, id).toBeDefined();
      expect(compactCardCaption(story), id).toBe(reviewed.caption);
      const approved = caseStudyPublicationManifest.records.find((record) => record.id === story.id).content;
      expect(story.cardCaption, story.slug).toMatch(/illustration/i);
      expect(story.cardCaption.length, story.slug).toBeLessThan(story.image.caption.length);
      expect(story.summary).toBe(approved.summary);
      expect(story.image).toEqual(approved.image);
      expect(story.gallery).toEqual(approved.gallery);
      expect(story.sections).toEqual(approved.sections);
    }
  });

  it.each([
    ['invoice-ocr-extraction', /known layout.*fixed crop/i],
    ['yolo-computer-vision-optimization', /form scoring remains separate/i],
    ['browser-search-to-spreadsheet', /fictional search data/i],
    ['depth-based-distance-estimation', /stored reference scale.*assumed camera geometry.*setup-specific validation/i],
    ['healthcare-document-intelligence', /native PDF.*fictional entries.*0 Off, 1 Available, 2 Request to Work/i],
    ['n8n-python-ai-agents', /SELECT checks.*default LIMIT 100.*do not guarantee read-only.*maximum result size/i],
    ['python-ci-workflow-automation', /supports an existing code-quality workflow.*not an executed CI run/i],
    ['resumable-listing-data-extraction', /saved JSON Lines listing IDs.*settings.*code/i],
  ])('retains the material cover limitation on %s cards', (id, limitation) => {
    const reviewed = reviewedCardCaptions[id];
    if (reviewed) expect(reviewed.caption).toMatch(limitation);
  });

  it('does not reuse a compact note for an unknown story, replaced cover or revised caption', () => {
    const story = publication.find((item) => item.cardCaption);
    expect(compactCardCaption({ ...story, id: 'new-story' })).toBeUndefined();
    expect(compactCardCaption({ ...story, image: { ...story.image, src: '/assets/case-studies/new-cover.png' } })).toBeUndefined();
    expect(compactCardCaption({ ...story, image: { ...story.image, caption: 'New material limit requiring review.' } })).toBeUndefined();
    expect(compactCardCaption({ ...story, image: undefined })).toBeUndefined();
  });

  it('exposes only the public compact copy in the browser projection', () => {
    const module = renderPublicCaseStudyModule(publication);
    for (const story of publication.filter((item) => item.cardCaption)) {
      expect(module).toContain(story.cardCaption);
    }
    expect(module).not.toMatch(/coverDigest|approvedCover|compactCardCaption/);
  });
});
