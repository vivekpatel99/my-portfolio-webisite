import { stagedCaseStudyPublication } from './staged-case-study-publication.js';
import { mergeCaseStudyManifest } from './case-study-manifest-merge.js';

// This file is build-only. Do not import it from application code.
//
// `baseline-retention` is deliberately narrow: issue #43 authorizes retaining
// the exact content and assets from 08c2853 only. It does not assert that any
// claim, source, or license has been independently approved. New or changed
// material needs an explicit approval record before it can be projected.
export const BASELINE_COMMIT = '08c2853123c89b4061c72b9432588d619a1cc875';

const baselineRetention = (hash) => ({
  kind: 'baseline-retention',
  baselineCommit: BASELINE_COMMIT,
  sha256: hash,
  authorization: 'Issue #43 unchanged-content retention authorization',
});

export const caseStudyPublicationBaseline = {
  schemaVersion: 1,
  claims: {
    'n8n-openai-data-extraction.upwork-project': {
      type: 'external-link', recordId: 'n8n-openai-data-extraction', placement: 'externalLinks.0',
      value: 'https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760',
      approval: baselineRetention('2c48783d6880f16b9996886fa57c09378c312aef1a5fa7c5e0aa780b78beaa88'),
    },
    'invoice-ocr-extraction.upwork-project': {
      type: 'external-link', recordId: 'invoice-ocr-extraction', placement: 'externalLinks.0',
      value: 'https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256',
      approval: baselineRetention('317b237388ac3ec91abc0a50793d814e7e483991a6c7bbe84ce5f6bfb9d80eb5'),
    },
    'yolo-computer-vision-optimization.upwork-project': {
      type: 'external-link', recordId: 'yolo-computer-vision-optimization', placement: 'externalLinks.0',
      value: 'https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136',
      approval: baselineRetention('03a7bd17524fe1fa75ee3fa0248915a6352b44bdebee51c123f0999c1fffeb6c'),
    },
    'yolo-computer-vision-optimization.related-github': {
      type: 'external-link', recordId: 'yolo-computer-vision-optimization', placement: 'externalLinks.1',
      value: 'https://github.com/vivekpatel99/football-players-tracking-yolo',
      approval: baselineRetention('4639c6ca44ff998934b73b62d0b8194fc848f10897e475b793820679c6986a2f'),
    },
    'n8n-openai-data-extraction.summary': { type: 'content', recordId: 'n8n-openai-data-extraction', placement: 'summary', value: 'A production-ready workflow that extracts structured data from German websites, validates it, and prepares it for downstream operations.', approval: baselineRetention('03ba2e7f135b7c2be9c5a30f822d8fb7c84455b44db7a5b6da4be228777f4449') },
    'n8n-openai-data-extraction.outcome': { type: 'content', recordId: 'n8n-openai-data-extraction', placement: 'outcome', value: 'The workflow reduced manual research effort, improved consistency across extracted records, and gave the client a reusable automation base for future data sources.', approval: baselineRetention('64c5c5222ef5c3cfd1f99758f217cec299a0249443bcedc6a108b1a6ce1d036e') },
    'n8n-openai-data-extraction.stats.0': { type: 'content', recordId: 'n8n-openai-data-extraction', placement: 'stats.0', value: { value: 40, suffix: '+', label: 'Hours Saved', description: 'Weekly manual research and formatting work targeted for automation.' }, approval: baselineRetention('1515e6782a6271c0357ab99b4e16548e4f45b4e37075b13cd1f614c19ee53ca7') },
    'n8n-openai-data-extraction.stats.1': { type: 'content', recordId: 'n8n-openai-data-extraction', placement: 'stats.1', value: { value: 1, suffix: '', label: 'Reusable Workflow', description: 'A maintainable n8n system the client can inspect and extend.' }, approval: baselineRetention('e90f4957628948ab6dbb74eb50788063c68d1cc098f67784e3edcc275d0863d5') },
    'invoice-ocr-extraction.summary': { type: 'content', recordId: 'invoice-ocr-extraction', placement: 'summary', value: 'An OCR extraction workflow for pulling seller and client information from invoice photos and returning structured fields for review.', approval: baselineRetention('242d45f015c4e57a5e7f3f3d1611041bd794baa2518377ab51e40d9728e0c747') },
    'invoice-ocr-extraction.outcome': { type: 'content', recordId: 'invoice-ocr-extraction', placement: 'outcome', value: 'The project turned messy invoice images into structured, reviewable data and created a practical foundation for higher-volume document automation.', approval: baselineRetention('da94866144a1fc861c8c64bafd883ea9883e8b2f32d4adaf4dbb324b1e614cac') },
    'invoice-ocr-extraction.stats.0': { type: 'content', recordId: 'invoice-ocr-extraction', placement: 'stats.0', value: { value: 100, suffix: '%', label: 'Reviewable Output', description: 'Extraction results tied back to visual evidence for faster checks.' }, approval: baselineRetention('0d13ca2e51b12dca135ac50a133baebe559f7447fbac1ca329d9e16071dea09e') },
    'invoice-ocr-extraction.stats.1': { type: 'content', recordId: 'invoice-ocr-extraction', placement: 'stats.1', value: { value: 2, suffix: '', label: 'Party Types', description: 'Seller and client details extracted from invoice images.' }, approval: baselineRetention('c29c9e528070713f9ebbbac16bc8c64d564cd278a3255b7869e71ef2b1b7764f') },
    'yolo-computer-vision-optimization.summary': { type: 'content', recordId: 'yolo-computer-vision-optimization', placement: 'summary', value: 'A YOLO-based computer-vision project focused on reliable pose detection and the production concerns around fast, usable inference.', approval: baselineRetention('4ee358c5cac3bb31484f823becf0671caf0600cc4b070385c211e5efeb92fa39') },
    'yolo-computer-vision-optimization.outcome': { type: 'content', recordId: 'yolo-computer-vision-optimization', placement: 'outcome', value: 'The result was a practical vision pipeline for real-time pose detection, backed by production optimization experience from CUDA, ONNX, and edge deployment work.', approval: baselineRetention('6a304fc01766af730d5292b9b5ca47c87222b52bdab21ce7c9831b04b1656ef3') },
    'yolo-computer-vision-optimization.stats.0': { type: 'content', recordId: 'yolo-computer-vision-optimization', placement: 'stats.0', value: { value: 94, suffix: '%', label: 'Inference Improvement', description: 'Production optimization benchmark from real-time vision engineering work.' }, approval: baselineRetention('4a032c9e23c7745eba31375b5b3e22d5487cf7334b4dd5079b20f345f0de2c6e') },
    'yolo-computer-vision-optimization.stats.1': { type: 'content', recordId: 'yolo-computer-vision-optimization', placement: 'stats.1', value: { value: 2.5, suffix: 's', label: 'Optimized Runtime', description: 'Image-stitching runtime achieved after CUDA/OpenCV optimization.' }, approval: baselineRetention('b283ec7d4a63a389a3fb7f0d2a8635e260b50f217a0b805c51c640e4912d22eb') },
    'yolo-computer-vision-optimization.stats.2': { type: 'content', recordId: 'yolo-computer-vision-optimization', placement: 'stats.2', value: { value: 37, suffix: 's', label: 'Original Runtime', description: 'Baseline runtime before production optimization.' }, approval: baselineRetention('11a0f464d4e75828ec170395aa13afa53a6bd5e17d82d0b7fafaae44f3d673f1') },
  },
  assets: {
    '/assets/case-studies/planning-graph.webp': {
      file: 'public/assets/case-studies/planning-graph.webp',
      approval: baselineRetention('483e16b2c3afb3bf6273821ce09d831d07ae5a00ffce8c2b8e24b202062e41a8'),
    },
    '/assets/case-studies/invoice-ocr.webp': {
      file: 'public/assets/case-studies/invoice-ocr.webp',
      approval: baselineRetention('e6814512a97562f6ead7cd563262c97ffe80cd8ddd36408db2da67b50479b5b4'),
    },
    '/assets/case-studies/yoga-pose.webp': {
      file: 'public/assets/case-studies/yoga-pose.webp',
      approval: baselineRetention('a1c141cdaa34086f779a22bbc54861dd5a0b6bd6c956df38456a3313983c2c0c'),
    },
    '/assets/case-studies/football-tracking.mp4': {
      file: 'public/assets/case-studies/football-tracking.mp4',
      approval: baselineRetention('e8f90196e5e6edcef0ad11eefb8739f8c16b936217ea84109c33fe4ca7b12369'),
    },
    '/assets/case-studies/football-tracking.webp': {
      file: 'public/assets/case-studies/football-tracking.webp',
      approval: baselineRetention('8b16e0d29b7ec6b933a17605fc351e87b00f1e0841db5000d4b4366957530b53'),
    },
  },
  records: [
    {
      id: 'n8n-openai-data-extraction', slug: 'n8n-openai-data-extraction', status: 'published',
      approval: baselineRetention('1453b422960569b0f5cadbac841d1eb6f8ec9cdf0164312d4ac0786d579cf43c'),
      claimRefs: { summary: 'n8n-openai-data-extraction.summary', outcome: 'n8n-openai-data-extraction.outcome', stats: ['n8n-openai-data-extraction.stats.0', 'n8n-openai-data-extraction.stats.1'] },
      content: {
        title: 'n8n + OpenAI Data Extraction', cardTitle: 'Automated Data Extraction - n8n + OpenAI', category: 'AI Workflow Automation',
        summary: 'A production-ready workflow that extracts structured data from German websites, validates it, and prepares it for downstream operations.',
        challenge: 'The client needed to turn inconsistent web pages into reliable business records without spending hours manually copying, cleaning, and checking every field.',
        solution: 'I designed an n8n workflow that combines scraping, prompt-assisted extraction, validation, and handoff logic. The system keeps the workflow inspectable for the client while using OpenAI only where language understanding adds value.',
        outcome: 'The workflow reduced manual research effort, improved consistency across extracted records, and gave the client a reusable automation base for future data sources.',
        stats: [{ value: 40, suffix: '+', label: 'Hours Saved', description: 'Weekly manual research and formatting work targeted for automation.' }, { value: 1, suffix: '', label: 'Reusable Workflow', description: 'A maintainable n8n system the client can inspect and extend.' }],
        image: { src: '/assets/case-studies/planning-graph.webp', alt: 'First-party automation workflow graph from related planning work.' },
        gallery: [{ src: '/assets/case-studies/planning-graph.webp', alt: 'Automation workflow graph used to plan extraction and validation steps.' }],
        stack: ['n8n', 'OpenAI', 'Web Scraping', 'Data Validation'],
        externalLinks: [{ label: 'Upwork project', claimRef: 'n8n-openai-data-extraction.upwork-project' }],
      },
    },
    {
      id: 'invoice-ocr-extraction', slug: 'invoice-ocr-extraction', status: 'published',
      approval: baselineRetention('9a67de633d2827499987bff8593f87d3f875cb33580d43bebdf16aa11c758b2e'),
      claimRefs: { summary: 'invoice-ocr-extraction.summary', outcome: 'invoice-ocr-extraction.outcome', stats: ['invoice-ocr-extraction.stats.0', 'invoice-ocr-extraction.stats.1'] },
      content: {
        title: 'Invoice OCR Extraction', cardTitle: 'Invoice OCR Data Extraction', category: 'Document AI',
        summary: 'An OCR extraction workflow for pulling seller and client information from invoice photos and returning structured fields for review.',
        challenge: 'Invoice photos vary in lighting, layout, rotation, and field naming. The client needed a dependable way to extract key parties and reduce manual review time.',
        solution: 'I combined OCR, image preprocessing, bounding-box review, and field-level normalization so extracted data could be checked quickly and reused by downstream systems.',
        outcome: 'The project turned messy invoice images into structured, reviewable data and created a practical foundation for higher-volume document automation.',
        stats: [{ value: 100, suffix: '%', label: 'Reviewable Output', description: 'Extraction results tied back to visual evidence for faster checks.' }, { value: 2, suffix: '', label: 'Party Types', description: 'Seller and client details extracted from invoice images.' }],
        image: { src: '/assets/case-studies/invoice-ocr.webp', alt: 'Invoice image with bounding boxes showing extracted client information via OCR.' },
        gallery: [{ src: '/assets/case-studies/invoice-ocr.webp', alt: 'Invoice OCR output with detected information highlighted.' }, { src: '/assets/case-studies/planning-graph.webp', alt: 'Automation workflow used to coordinate extraction and validation.' }],
        stack: ['OCR', 'Python', 'Image Processing', 'Structured Extraction'],
        externalLinks: [{ label: 'Upwork project', claimRef: 'invoice-ocr-extraction.upwork-project' }],
      },
    },
    {
      id: 'yolo-computer-vision-optimization', slug: 'yolo-computer-vision-optimization', status: 'published',
      approval: baselineRetention('d7979798a13b84abf63d2eb47a109e183a475183fea4592ed32b81928ac98910'),
      claimRefs: { summary: 'yolo-computer-vision-optimization.summary', outcome: 'yolo-computer-vision-optimization.outcome', stats: ['yolo-computer-vision-optimization.stats.0', 'yolo-computer-vision-optimization.stats.1', 'yolo-computer-vision-optimization.stats.2'] },
      content: {
        title: 'YOLO Computer Vision Optimization', cardTitle: 'Real-Time Pose Detection - YOLO', category: 'Computer Vision',
        summary: 'A YOLO-based computer-vision project focused on reliable pose detection and the production concerns around fast, usable inference.',
        challenge: 'The client needed computer-vision results that were usable in an application context, where slow inference and unstable predictions can break the user experience.',
        solution: 'I implemented a YOLO-based pose-estimation pipeline, tuned the processing flow, and framed the work around deployment constraints rather than offline demo accuracy alone.',
        outcome: 'The result was a practical vision pipeline for real-time pose detection, backed by production optimization experience from CUDA, ONNX, and edge deployment work.',
        stats: [{ value: 94, suffix: '%', label: 'Inference Improvement', description: 'Production optimization benchmark from real-time vision engineering work.' }, { value: 2.5, suffix: 's', label: 'Optimized Runtime', description: 'Image-stitching runtime achieved after CUDA/OpenCV optimization.' }, { value: 37, suffix: 's', label: 'Original Runtime', description: 'Baseline runtime before production optimization.' }],
        image: { src: '/assets/case-studies/yoga-pose.webp', alt: 'YOLO model detecting and estimating a yoga pose in an image.' },
        gallery: [{ src: '/assets/case-studies/yoga-pose.webp', alt: 'Pose-estimation demo using a YOLO model.' }, { src: '/assets/case-studies/football-tracking.mp4', poster: '/assets/case-studies/football-tracking.webp', alt: 'YOLO tracking multiple football players in video.' }],
        stack: ['YOLO', 'Python', 'Computer Vision', 'Real-time Inference'],
        externalLinks: [{ label: 'Upwork project', claimRef: 'yolo-computer-vision-optimization.upwork-project' }, { label: 'Related GitHub', claimRef: 'yolo-computer-vision-optimization.related-github' }],
      },
    },
  ],
};

// Staged records are generated mechanically from a reviewed candidate. Merge
// them into this manifest so the compiler remains the one source of truth.
export const caseStudyPublicationManifest = mergeCaseStudyManifest(caseStudyPublicationBaseline, stagedCaseStudyPublication);
