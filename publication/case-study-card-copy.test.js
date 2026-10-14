// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';
import { compactCardCaption } from './case-study-card-copy.js';

const publication = compileCaseStudyPublication();

describe('reviewed compact card captions', () => {
  it('projects a shorter illustration note for all twelve current stories without changing article content', () => {
    expect(publication).toHaveLength(12);
    for (const story of publication) {
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
    ['python-ci-workflow-automation', /not an executed CI run/i],
    ['resumable-listing-data-extraction', /saved JSON Lines listing IDs.*settings.*code/i],
  ])('retains the material cover limitation on %s cards', (id, limitation) => {
    expect(publication.find((story) => story.id === id).cardCaption).toMatch(limitation);
  });

  it('does not reuse a compact note for an unknown story, replaced cover or revised caption', () => {
    const story = publication[0];
    expect(compactCardCaption({ ...story, id: 'new-story' })).toBeUndefined();
    expect(compactCardCaption({ ...story, image: { ...story.image, src: '/assets/case-studies/new-cover.png' } })).toBeUndefined();
    expect(compactCardCaption({ ...story, image: { ...story.image, caption: 'New material limit requiring review.' } })).toBeUndefined();
    expect(compactCardCaption({ ...story, image: undefined })).toBeUndefined();
  });

  it('exposes only the public compact copy in the browser projection', () => {
    const module = renderPublicCaseStudyModule(publication);
    expect(module).toContain(publication[0].cardCaption);
    expect(module).not.toMatch(/coverDigest|approvedCover|compactCardCaption/);
  });
});
