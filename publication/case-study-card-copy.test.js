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
      if (!story) {
        expect(caseStudyPublicationManifest.records.find((record) => record.id === id)?.status, id).toBe('draft');
        continue;
      }
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

  it.each(['summary', 'sections', 'gallery'])('falls back when the reviewed %s changes without a new cover', (field) => {
    const story = structuredClone(publication.find((item) => item.cardCaption));
    if (field === 'summary') story.summary += ' New material scope limitation.';
    if (field === 'sections') story.sections[0].heading += ' New material scope limitation.';
    if (field === 'gallery') story.gallery[0].caption = 'New evidence limitation.';
    expect(compactCardCaption(story)).toBeUndefined();
  });

  it.each(Object.keys(reviewedCardCaptions))('does not project the retained note for withdrawn %s', (id) => {
    const manifest = structuredClone(caseStudyPublicationManifest);
    const index = manifest.records.findIndex((record) => record.id === id);
    if (manifest.records[index]?.status === 'published') {
      const { slug } = manifest.records[index];
      manifest.records[index] = { id, slug, status: 'draft' };
    }
    const withdrawn = compileCaseStudyPublication({ manifest });
    expect(reviewedCardCaptions[id]).toBeDefined();
    expect(withdrawn.find((story) => story.id === id)).toBeUndefined();
    expect(renderPublicCaseStudyModule(withdrawn, [], [])).not.toContain(`"id":"${id}"`);
  });

  it('exposes only the public compact copy in the browser projection', () => {
    const module = renderPublicCaseStudyModule(publication);
    for (const story of publication.filter((item) => item.cardCaption)) {
      expect(module).toContain(story.cardCaption);
    }
    expect(module).not.toMatch(/scopeDigest|coverDigest|approvedCover|compactCardCaption/);
  });
});
