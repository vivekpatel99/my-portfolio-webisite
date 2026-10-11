// @vitest-environment node
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { digest } from './case-study-evidence.js';
import { parseMarkdownCaseStudy, prepareMarkdownCaseStudies, readPreparedCaseStudies } from './markdown-case-study.js';
import { stageReviewedCaseStudyCandidate } from './stage-case-study-publication.js';

const temporaryDirectories = [];
afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const source = (body = '') => `---
id: fixture-story
title: Fixture story
summary: A fixture summary.
category: Automation
private_note: DO_NOT_EXPORT
---

# Source heading that must not render

> Intro blockquote that must not render.

${body}

## Private notes
DO_NOT_EXPORT_PRIVATE

## The problem
The **problem** has \`inline code\`.

## What I built
- First step with [an internal link](/contact/).
- Second step with *emphasis*.

## The outcome
The outcome remains qualitative.
`;

describe('Markdown case-study preparation', () => {
  it('projects exactly the three public H2 sections and supported Markdown nodes', () => {
    const story = parseMarkdownCaseStudy({ source: source(), filePath: '/private/fixture.md' });
    expect(story).toEqual({
      id: 'fixture-story', slug: 'fixture-story', title: 'Fixture story', summary: 'A fixture summary.', category: 'Automation',
      sections: [
        { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'The ' }, { type: 'strong', children: [{ type: 'text', value: 'problem' }] }, { type: 'text', value: ' has ' }, { type: 'code', value: 'inline code' }, { type: 'text', value: '.' }] }] },
        { key: 'built', heading: 'What I built', nodes: [{ type: 'list', ordered: false, start: '', items: [
          { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'First step with ' }, { type: 'link', href: '/contact/', children: [{ type: 'text', value: 'an internal link' }] }, { type: 'text', value: '.' }] }] },
          { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Second step with ' }, { type: 'emphasis', children: [{ type: 'text', value: 'emphasis' }] }, { type: 'text', value: '.' }] }] },
        ] }] },
        { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'The outcome remains qualitative.' }] }] },
      ],
    });
    const serialized = JSON.stringify(story);
    expect(serialized).not.toContain('DO_NOT_EXPORT');
    expect(serialized).not.toContain('Source heading');
    expect(serialized).not.toContain('Intro blockquote');
  });

  it('decodes Markdown entities once before the renderer escapes text', () => {
    const story = parseMarkdownCaseStudy({ source: source().replace('The **problem** has `inline code`.', 'The &amp; &#65; problem.'), filePath: '/private/fixture.md' });
    expect(story.sections[0].nodes[0].children).toEqual([{ type: 'text', value: 'The & A problem.' }]);
  });

  it('rejects missing or duplicate public headings, unsafe links, raw HTML, and images', () => {
    const cases = [
      [source().replace('## The outcome', '## Other heading'), /fixture\.md: The outcome is required exactly once/],
      [source() + '\n## The outcome\nDuplicate', /fixture\.md: The outcome must appear exactly once/],
      [source().replace('/contact/', 'javascript:alert(1)'), /fixture\.md: What I built link must be an internal path or HTTPS URL/],
      [source().replace('/contact/', '/\\\\evil.test'), /fixture\.md: What I built link contains unsafe URL characters/],
      [source().replace('The **problem**', 'The <script>alert(1)<\/script>'), /fixture\.md: The problem contains raw HTML/],
    ];
    for (const [invalidSource, error] of cases) expect(() => parseMarkdownCaseStudy({ source: invalidSource, filePath: '/private/fixture.md' })).toThrow(error);
  });

  it('carries an explicit project status into the prepared story and rejects unknown values', () => {
    const completed = source().replace('category: Automation', 'category: Automation\nproject_status: completed\ncompleted_at: 2026-08');
    expect(parseMarkdownCaseStudy({ source: completed, filePath: '/private/fixture.md' })).toMatchObject({ projectStatus: 'completed', completedAt: '2026-08' });
    expect(parseMarkdownCaseStudy({ source: source(), filePath: '/private/fixture.md' })).not.toHaveProperty('completedAt');
    expect(() => parseMarkdownCaseStudy({ source: source().replace('category: Automation', 'category: Automation\ncompleted_at: 2026-08'), filePath: '/private/fixture.md' })).toThrow(/completed_at.*requires.*project_status.*completed/i);
    expect(() => parseMarkdownCaseStudy({ source: completed.replace('project_status: completed', 'project_status: ongoing'), filePath: '/private/fixture.md' })).toThrow(/completed_at.*requires.*project_status.*completed/i);
    const invalid = completed.replace('project_status: completed', 'project_status: paused');
    expect(() => parseMarkdownCaseStudy({ source: invalid, filePath: '/private/fixture.md' })).toThrow(/project_status.*completed.*ongoing/i);
    expect(() => parseMarkdownCaseStudy({ source: completed.replace('completed_at: 2026-08', 'completed_at: 2026-13'), filePath: '/private/fixture.md' })).toThrow(/completed_at.*valid YYYY-MM/i);
    expect(() => parseMarkdownCaseStudy({ source: completed.replace('\ncompleted_at: 2026-08', ''), filePath: '/private/fixture.md' })).toThrow(/completed_at.*required.*project_status.*completed/i);
  });

  it('rejects non-YAML frontmatter and duplicate YAML keys', () => {
    expect(() => parseMarkdownCaseStudy({ source: '---js\nmodule.exports = { id: "bad" }\n---\n', filePath: '/private/executable.md' })).toThrow(/executable\.md: frontmatter/);
    expect(() => parseMarkdownCaseStudy({ source: source().replace('id: fixture-story', 'id: fixture-story\nid: duplicate'), filePath: '/private/duplicate.md' })).toThrow(/duplicate\.md: frontmatter/);
  });

  it('handles a UTF-8 BOM without permitting an alternate frontmatter engine', () => {
    expect(parseMarkdownCaseStudy({ source: `\uFEFF${source()}`, filePath: '/private/bom.md' }).id).toBe('fixture-story');
    expect(() => parseMarkdownCaseStudy({ source: '\uFEFF---js\nmodule.exports = {}\n---\n', filePath: '/private/bom-executable.md' })).toThrow(/bom-executable\.md: frontmatter/);
    expect(() => parseMarkdownCaseStudy({ source: '\uFEFF\uFEFF---js\nmodule.exports = {}\n---\n', filePath: '/private/double-bom-executable.md' })).toThrow(/double-bom-executable\.md: frontmatter/);
  });

  it('validates a loaded candidate before preview can render unsafe or malformed nodes', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'markdown-case-study-candidate-'));
    temporaryDirectories.push(directory);
    const candidatePath = path.join(directory, 'candidate.json');
    const validStory = parseMarkdownCaseStudy({ source: source(), filePath: '/private/fixture.md' });
    const maliciousStory = structuredClone(validStory);
    maliciousStory.sections[0].nodes[0].children = [{ type: 'link', href: 'javascript:alert(1)', children: [{ type: 'text', value: 'bad' }] }];
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [maliciousStory] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/candidate\.json\.stories\[0\].*internal path or HTTPS URL/);
    maliciousStory.sections[0].nodes[0].children = [{ type: 'unknown' }];
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [maliciousStory] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/unsupported inline node type/);

    const completedWithoutDate = { ...validStory, projectStatus: 'completed' };
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [completedWithoutDate] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/completedAt.*required.*projectStatus.*completed/i);
    const dateWithoutCompleted = { ...validStory, completedAt: '2026-08' };
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [dateWithoutCompleted] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/completedAt.*requires.*projectStatus.*completed/i);
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [{ ...dateWithoutCompleted, projectStatus: 'ongoing' }] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/completedAt.*requires.*projectStatus.*completed/i);
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [{ ...dateWithoutCompleted, projectStatus: 'completed' }] }));
    expect(readPreparedCaseStudies(candidatePath)[0]).toMatchObject({ projectStatus: 'completed', completedAt: '2026-08' });
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [validStory] }));
    expect(readPreparedCaseStudies(candidatePath)[0]).not.toHaveProperty('completedAt');
  });

  it('validates every explicit file before replacing an existing candidate', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'markdown-case-study-test-'));
    temporaryDirectories.push(directory);
    const first = path.join(directory, 'first.md');
    const second = path.join(directory, 'second.md');
    writeFileSync(first, source());
    writeFileSync(second, source().replaceAll('fixture-story', 'second-story'));
    const outputDirectory = path.join(directory, 'preview');
    const firstResult = prepareMarkdownCaseStudies({ sourceFiles: [first], outputDirectory });
    const prior = readFileSync(firstResult.candidatePath, 'utf8');
    writeFileSync(second, source());
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [first, second], outputDirectory })).toThrow(/second\.md: id fixture-story is duplicated with first\.md/);
    expect(readFileSync(firstResult.candidatePath, 'utf8')).toBe(prior);
    writeFileSync(second, source().replaceAll('fixture-story', 'second-story'));
    writeFileSync(second, source().replaceAll('fixture-story', 'second-story').replace('## The outcome', '## Missing outcome'));
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [first, second], outputDirectory })).toThrow(/second\.md: The outcome/);
    expect(readFileSync(firstResult.candidatePath, 'utf8')).toBe(prior);
    const unchanged = prepareMarkdownCaseStudies({ sourceFiles: [first], outputDirectory });
    expect(readFileSync(unchanged.candidatePath, 'utf8')).toBe(prior);
  });

  it('freezes referenced screenshots with intrinsic dimensions and relative candidate paths', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'markdown-case-study-images-'));
    temporaryDirectories.push(directory);
    const assetsRoot = path.join(directory, 'assets', 'image-story');
    mkdirSync(assetsRoot, { recursive: true });
    copyFileSync(path.join(process.cwd(), 'public/assets/case-studies/planning-graph.webp'), path.join(assetsRoot, 'workflow.webp'));
    const sourcePath = path.join(directory, 'image-story.md');
    writeFileSync(sourcePath, `---\nid: image-story\ntitle: Image story\nsummary: Screenshot summary.\nimage:\n  src: workflow.webp\n  alt: Workflow screenshot\n  caption: Reviewed screenshot\n---\n## The problem\nA problem.\n## What I built\nInline:\n\n![Portrait alternative](workflow.webp)\n## The outcome\nAn outcome.\n`);
    const result = prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory: path.join(directory, 'preview'), assetsRoot });
    const candidate = JSON.parse(readFileSync(result.candidatePath, 'utf8'));
    const story = candidate.stories[0];
    expect(story.image.src).toMatch(/^\/assets\/case-studies\/image-story-[a-f0-9]{64}\.webp$/);
    expect(story.image.width).toBeGreaterThan(0);
    expect(story.sections[1].nodes[1].children[0].src).toBe(story.image.src);
    expect(Object.values(candidate.assets)[0].source).toMatch(/^assets\/[a-f0-9]{64}\.webp$/);
    expect(Object.values(candidate.assets)[0].source).not.toContain(directory);
    expect(story).not.toHaveProperty('gallery');
    const prior = readFileSync(result.candidatePath, 'utf8');
    const snapshotPath = path.join(path.dirname(result.candidatePath), Object.values(candidate.assets)[0].source);
    writeFileSync(snapshotPath, 'tampered snapshot');
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory: path.dirname(result.candidatePath), assetsRoot })).toThrow(/candidate snapshot .* has changed bytes/);
    expect(readFileSync(result.candidatePath, 'utf8')).toBe(prior);
  });

  it('keeps an authored image and MP4 gallery through prepare, reload, and stage', async () => {
    const directory = mkdtempSync(path.join(realpathSync(tmpdir()), 'markdown-case-study-gallery-'));
    temporaryDirectories.push(directory);
    const assetsRoot = path.join(directory, 'assets', 'gallery-story');
    mkdirSync(assetsRoot, { recursive: true });
    const shipped = path.join(process.cwd(), 'public/assets/case-studies');
    copyFileSync(path.join(shipped, 'sports-football-workflow.png'), path.join(assetsRoot, 'workflow.png'));
    copyFileSync(path.join(shipped, 'sports-football-tracking.mp4'), path.join(assetsRoot, 'tracking.mp4'));
    copyFileSync(path.join(shipped, 'sports-football-tracking-poster.png'), path.join(assetsRoot, 'tracking-poster.png'));
    copyFileSync(path.join(shipped, 'sports-football-confusion-matrix.png'), path.join(assetsRoot, 'matrix.png'));
    const sourcePath = path.join(directory, 'gallery-story.md');
    writeFileSync(sourcePath, `---
id: gallery-story
title: Gallery story
summary: Gallery summary.
private_note: DO_NOT_EXPORT
gallery:
  - src: workflow.png
    alt: Workflow Diagram
    caption: Workflow still
  - src: tracking.mp4
    alt: Football Tracking Clip
    poster: tracking-poster.png
    caption: Supplied tracking demonstration
  - src: matrix.png
    alt: Confusion Matrix
    caption: Confusion matrix
---
## The problem
A problem.
## What I built
Built.
## The outcome
An outcome.
`);
    const outputDirectory = path.join(directory, 'preview');
    const result = prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory, assetsRoot });
    const loaded = readPreparedCaseStudies(result.candidatePath);
    expect(loaded[0].gallery.map((item) => item.caption)).toEqual([
      'Workflow still',
      'Supplied tracking demonstration',
      'Confusion matrix',
    ]);
    expect(loaded[0].gallery.map((item) => item.alt)).toEqual([
      'Workflow Diagram',
      'Football Tracking Clip',
      'Confusion Matrix',
    ]);
    const [first, video, third] = loaded[0].gallery;
    expect(first.src).toMatch(/^\/assets\/case-studies\/gallery-story-[a-f0-9]{64}\.png$/);
    expect(third.src).toMatch(/^\/assets\/case-studies\/gallery-story-[a-f0-9]{64}\.png$/);
    expect(third.src).not.toBe(first.src);
    expect(first.width).toBeGreaterThan(0);
    expect(first.height).toBeGreaterThan(0);
    expect(video).toMatchObject({ width: 640, height: 360 });
    expect(video.src).toMatch(/^\/assets\/case-studies\/gallery-story-[a-f0-9]{64}\.mp4$/);
    expect(video.poster).toMatch(/^\/assets\/case-studies\/gallery-story-[a-f0-9]{64}\.png$/);
    expect(video.poster).not.toBe(first.src);
    expect(video).not.toHaveProperty('duration');
    expect(JSON.stringify(loaded)).not.toContain('DO_NOT_EXPORT');
    const candidate = JSON.parse(readFileSync(result.candidatePath, 'utf8'));
    expect(candidate.assets[video.src]).toMatchObject({ format: 'mp4', width: 640, height: 360 });
    expect(candidate.assets[video.src].source).toMatch(/^assets\/[a-f0-9]{64}\.mp4$/);
    expect(candidate.assets[video.poster].format).toBe('png');
    const stagedPath = path.join(directory, 'publication', 'staged-case-study-publication.js');
    mkdirSync(path.dirname(stagedPath), { recursive: true });
    mkdirSync(path.join(directory, 'public/assets/case-studies'), { recursive: true });
    writeFileSync(stagedPath, 'export const stagedCaseStudyPublication = {"records":[],"claims":{},"assets":{}};\n');
    writeFileSync(path.join(directory, 'publication/case-study-manifest.js'), 'export const caseStudyPublicationBaseline = {schemaVersion:1,records:[],claims:{},assets:{}};\n');
    await stageReviewedCaseStudyCandidate({
      candidatePath: result.candidatePath,
      stagedPath,
      metadata: {
        candidateSha256: digest(readFileSync(result.candidatePath)),
        approvedBy: 'Fixture',
        approvedAt: '2026-09-09T00:00:00Z',
        evidence: 'https://example.invalid/gallery',
      },
    });
    const store = JSON.parse(readFileSync(stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(store.records[0].content.gallery).toEqual(loaded[0].gallery);
    expect(store.assets[video.src].approval.sha256).toBe(candidate.assets[video.src].sha256);
    const stagedVideo = readFileSync(path.join(directory, `public${video.src}`));
    expect(stagedVideo.equals(readFileSync(path.join(shipped, 'sports-football-tracking.mp4')))).toBe(true);
  });

  it('rejects a null, empty, or unsupported gallery instead of dropping it', () => {
    const withGallery = (yaml) => source().replace('category: Automation', `category: Automation\n${yaml}`);
    const parse = (yaml) => parseMarkdownCaseStudy({ source: withGallery(yaml), filePath: '/private/fixture.md' });
    expect(() => parse('gallery:')).toThrow(/fixture\.md: gallery must be a non-empty array/);
    expect(() => parse('gallery: []')).toThrow(/fixture\.md: gallery must be a non-empty array/);
    expect(() => parse('gallery: clip.mp4')).toThrow(/fixture\.md: gallery must be a non-empty array/);
    expect(() => parse('gallery:\n  - src: shot.webp\n    alt: Shot\n    width: 640')).toThrow(/unsupported fields: width/);
    expect(() => parse('gallery:\n  - src: clip.mp4\n    alt: Clip\n    poster: poster.webp\n    duration: 4')).toThrow(/unsupported fields: duration/);
    expect(() => parse('gallery:\n  - src: clip.mp4\n    alt: Clip\n    poster: poster.webp\n    width: 640\n    height: 360')).toThrow(/unsupported fields: width, height/);
    expect(() => parse('gallery:\n  - src: Clip.MP4\n    alt: Clip')).toThrow(/gallery\[0\]\.poster must be a non-empty string/);
    expect(parseMarkdownCaseStudy({ source: source(), filePath: '/private/fixture.md' })).not.toHaveProperty('gallery');
  });

  it('rejects an unsafe gallery path without replacing the candidate', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'markdown-case-study-gallery-unsafe-'));
    temporaryDirectories.push(directory);
    const assetsRoot = path.join(directory, 'assets', 'gallery-story');
    mkdirSync(assetsRoot, { recursive: true });
    const shipped = path.join(process.cwd(), 'public/assets/case-studies/sports-football-workflow.png');
    copyFileSync(shipped, path.join(assetsRoot, 'workflow.png'));
    writeFileSync(path.join(directory, 'outside.png'), readFileSync(shipped));
    symlinkSync(path.join(directory, 'outside.png'), path.join(assetsRoot, 'linked.png'));
    const outputDirectory = path.join(directory, 'preview');
    mkdirSync(outputDirectory, { recursive: true });
    const prior = 'prior candidate\n';
    writeFileSync(path.join(outputDirectory, 'candidate.json'), prior);
    const writeStory = (galleryYaml) => {
      const sourcePath = path.join(directory, 'gallery-story.md');
      writeFileSync(sourcePath, `---
id: gallery-story
title: Gallery story
summary: Gallery summary.
gallery:
${galleryYaml}
---
## The problem
A problem.
## What I built
Built.
## The outcome
An outcome.
`);
      return sourcePath;
    };
    expect(() => prepareMarkdownCaseStudies({
      sourceFiles: [writeStory('  - src: ../outside.png\n    alt: Outside')],
      outputDirectory,
      assetsRoot,
    })).toThrow(/gallery source \.\.\/outside\.png must stay inside the story asset root/);
    expect(readFileSync(path.join(outputDirectory, 'candidate.json'), 'utf8')).toBe(prior);
    expect(() => prepareMarkdownCaseStudies({
      sourceFiles: [writeStory('  - src: linked.png\n    alt: Linked')],
      outputDirectory,
      assetsRoot,
    })).toThrow(/gallery source linked\.png escapes the story asset root/);
    expect(readFileSync(path.join(outputDirectory, 'candidate.json'), 'utf8')).toBe(prior);
  });
});
