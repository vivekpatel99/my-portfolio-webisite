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
    "/assets/case-studies/n8n-data-extraction.png": {"file":"public/assets/case-studies/n8n-data-extraction.png","approval":{"kind":"explicit","sha256":"e6fbcc7caa954b217adfa063990d460059e44d08808ad85c9e8988418920104c","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.613Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/n8n-data-processor.png": {"file":"public/assets/case-studies/n8n-data-processor.png","approval":{"kind":"explicit","sha256":"72c334f819d00fb872bea5cdb429e07a540b18794a627f758d0c8e092cb84636","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.614Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/n8n-excel-to-json.png": {"file":"public/assets/case-studies/n8n-excel-to-json.png","approval":{"kind":"explicit","sha256":"ab7acc351c8af2d032a4d05ae75422e15cf54d079409eed67150dc28dd352178","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.615Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/n8n-table-to-json.png": {"file":"public/assets/case-studies/n8n-table-to-json.png","approval":{"kind":"explicit","sha256":"bfb52b84274b63e55d99682c1ecaebcee0a1498b63dc6b9590c295b2b57f040c","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.615Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/n8n-error-handler.png": {"file":"public/assets/case-studies/n8n-error-handler.png","approval":{"kind":"explicit","sha256":"753a3e00357784381e121fd6593d4a054f0f6380cfb172eccd4702665ad9856e","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.615Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/n8n-error-notifier.png": {"file":"public/assets/case-studies/n8n-error-notifier.png","approval":{"kind":"explicit","sha256":"7ceb0c200e091088b91c199e7f4eb910deb8e83ce796644c3efce238ebca5b80","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.616Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/invoice-ocr-excel-results.png": {"file":"public/assets/case-studies/invoice-ocr-excel-results.png","approval":{"kind":"explicit","sha256":"30d08f427ad9dd6098464b4c1d28d180232ec3531b3e016853a3c605083fa9ad","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.616Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/yoga-pose-output-1.jpg": {"file":"public/assets/case-studies/yoga-pose-output-1.jpg","approval":{"kind":"explicit","sha256":"5d40e830aa8d828e7fe3c360c8e867ad6ece4f2fdca5e4efc917744df42d4661","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.616Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/yoga-pose-output-2.jpg": {"file":"public/assets/case-studies/yoga-pose-output-2.jpg","approval":{"kind":"explicit","sha256":"eeeef2e888f1d90f3f74cc2dedce3217b69875c67001b95e138dbda8dfa92249","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.616Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/yoga-pose-output-3.jpg": {"file":"public/assets/case-studies/yoga-pose-output-3.jpg","approval":{"kind":"explicit","sha256":"ceb105f111468c414425a9b66c60f83d1c05152495eeae4b79d9770637fba7e6","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.617Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/yoga-pose-output-4.jpg": {"file":"public/assets/case-studies/yoga-pose-output-4.jpg","approval":{"kind":"explicit","sha256":"e0fda8e3265b2103cda475ec21735f245b48aeee64505137ffb1d446ce8fb869","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.617Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
    "/assets/case-studies/yoga-pose-output-5.jpg": {"file":"public/assets/case-studies/yoga-pose-output-5.jpg","approval":{"kind":"explicit","sha256":"b3a9d87cd8189721b815648379e5c41748bd8db215f20b201fe3e56024e2eb80","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.618Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"}},
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
      approval: {"kind":"explicit","sha256":"31c9bee4f617dd0fa1956029ac0d0fde004880feb7be44f31f014a8026b98978","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.618Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"},
      claimRefs: { summary: 'n8n-openai-data-extraction.summary', outcome: 'n8n-openai-data-extraction.outcome', stats: ['n8n-openai-data-extraction.stats.0', 'n8n-openai-data-extraction.stats.1'] },
      content: {
        projectStatus: 'completed',
        title: 'n8n + OpenAI Data Extraction', cardTitle: 'Automated Data Extraction - n8n + OpenAI', category: 'AI Workflow Automation',
        summary: 'A production-ready workflow that extracts structured data from German websites, validates it, and prepares it for downstream operations.',
        challenge: 'The client needed to turn inconsistent web pages into reliable business records without spending hours manually copying, cleaning, and checking every field.',
        solution: 'I designed an n8n workflow that combines scraping, prompt-assisted extraction, validation, and handoff logic. The system keeps the workflow inspectable for the client while using OpenAI only where language understanding adds value.',
        outcome: 'The workflow reduced manual research effort, improved consistency across extracted records, and gave the client a reusable automation base for future data sources.',
        stats: [{ value: 40, suffix: '+', label: 'Hours Saved', description: 'Weekly manual research and formatting work targeted for automation.' }, { value: 1, suffix: '', label: 'Reusable Workflow', description: 'A maintainable n8n system the client can inspect and extend.' }],
        image: {"src":"/assets/case-studies/n8n-data-extraction.png","alt":"Main n8n workflow for discovering and extracting website datasets"},
        gallery: [{"src":"/assets/case-studies/n8n-data-extraction.png","alt":"Main n8n workflow for discovering and extracting website datasets","caption":"Main n8n workflow for discovering and extracting website datasets."},{"src":"/assets/case-studies/n8n-data-processor.png","alt":"Data processor routing Excel, CSV and HTML tables","caption":"Data processor routing Excel, CSV and HTML tables."},{"src":"/assets/case-studies/n8n-excel-to-json.png","alt":"Excel workbook extraction and conversion to JSON","caption":"Excel workbook extraction and conversion to JSON."},{"src":"/assets/case-studies/n8n-table-to-json.png","alt":"Table normalization, schema generation and tagging workflow","caption":"Table normalization, schema generation and tagging workflow."},{"src":"/assets/case-studies/n8n-error-handler.png","alt":"Error classification and structured logging workflow","caption":"Error classification and structured logging workflow."},{"src":"/assets/case-studies/n8n-error-notifier.png","alt":"Fatal workflow error notification setup","caption":"Fatal workflow error notification setup."}],
        stack: ['n8n', 'OpenAI', 'Web Scraping', 'Data Validation'],
        externalLinks: [{ label: 'Upwork project', claimRef: 'n8n-openai-data-extraction.upwork-project' }],
      },
    },
    {
      id: 'invoice-ocr-extraction', slug: 'invoice-ocr-extraction', status: 'published',
      approval: {"kind":"explicit","sha256":"2933abb7f0af2bab0247f10c7438af3eebf873ba1c5b31e45e76a3d215ebafc8","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.618Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"},
      claimRefs: { summary: 'invoice-ocr-extraction.summary', outcome: 'invoice-ocr-extraction.outcome', stats: ['invoice-ocr-extraction.stats.0', 'invoice-ocr-extraction.stats.1'] },
      content: {
        projectStatus: 'completed',
        title: 'Invoice OCR Extraction', cardTitle: 'Invoice OCR Data Extraction', category: 'Document AI',
        summary: 'An OCR extraction workflow for pulling seller and client information from invoice photos and returning structured fields for review.',
        challenge: 'Invoice photos vary in lighting, layout, rotation, and field naming. The client needed a dependable way to extract key parties and reduce manual review time.',
        solution: 'I combined OCR, image preprocessing, bounding-box review, and field-level normalization so extracted data could be checked quickly and reused by downstream systems.',
        outcome: 'The project turned messy invoice images into structured, reviewable data and created a practical foundation for higher-volume document automation.',
        stats: [{ value: 100, suffix: '%', label: 'Reviewable Output', description: 'Extraction results tied back to visual evidence for faster checks.' }, { value: 2, suffix: '', label: 'Party Types', description: 'Seller and client details extracted from invoice images.' }],
        image: {"src":"/assets/case-studies/invoice-ocr.webp","alt":"Invoice image with bounding boxes showing extracted client information via OCR."},
        gallery: [{"src":"/assets/case-studies/invoice-ocr.webp","alt":"Invoice image with bounding boxes showing extracted client information via OCR.","caption":"Invoice OCR demonstration with detected client fields highlighted."},{"src":"/assets/case-studies/invoice-ocr-excel-results.png","alt":"Spreadsheet output with source filenames and extracted client fields","caption":"Excel output from the invoice-photo OCR project."}],
        stack: ['OCR', 'Python', 'Image Processing', 'Structured Extraction'],
        externalLinks: [{ label: 'Upwork project', claimRef: 'invoice-ocr-extraction.upwork-project' }],
      },
    },
    {
      id: 'yolo-computer-vision-optimization', slug: 'yolo-computer-vision-optimization', status: 'published',
      approval: {"kind":"explicit","sha256":"bf70ee8464728b8378334c1cf426973c8864059b3310a879b513ed0b478d52cc","approvedBy":"Viv","approvedAt":"2026-09-13T07:51:40.618Z","evidence":"https://github.com/vivekpatel99/my-portfolio-webisite/blob/fix/restore-completed-case-study-cards/docs/decisions/project-gallery-sources.md"},
      claimRefs: { summary: 'yolo-computer-vision-optimization.summary', outcome: 'yolo-computer-vision-optimization.outcome', stats: ['yolo-computer-vision-optimization.stats.0', 'yolo-computer-vision-optimization.stats.1', 'yolo-computer-vision-optimization.stats.2'] },
      content: {
        projectStatus: 'completed',
        title: 'YOLO Computer Vision Optimization', cardTitle: 'Real-Time Pose Detection - YOLO', category: 'Computer Vision',
        summary: 'A YOLO-based computer-vision project focused on reliable pose detection and the production concerns around fast, usable inference.',
        challenge: 'The client needed computer-vision results that were usable in an application context, where slow inference and unstable predictions can break the user experience.',
        solution: 'I implemented a YOLO-based pose-estimation pipeline, tuned the processing flow, and framed the work around deployment constraints rather than offline demo accuracy alone.',
        outcome: 'The result was a practical vision pipeline for real-time pose detection, backed by production optimization experience from CUDA, ONNX, and edge deployment work.',
        stats: [{ value: 94, suffix: '%', label: 'Inference Improvement', description: 'Production optimization benchmark from real-time vision engineering work.' }, { value: 2.5, suffix: 's', label: 'Optimized Runtime', description: 'Image-stitching runtime achieved after CUDA/OpenCV optimization.' }, { value: 37, suffix: 's', label: 'Original Runtime', description: 'Baseline runtime before production optimization.' }],
        image: {"src":"/assets/case-studies/yoga-pose.webp","alt":"YOLO model detecting and estimating a yoga pose in an image."},
        gallery: [{"src":"/assets/case-studies/yoga-pose.webp","alt":"YOLO model detecting and estimating a yoga pose in an image.","caption":"Yoga pose output with detected body keypoints."},{"src":"/assets/case-studies/yoga-pose-output-1.jpg","alt":"YOLO body keypoints: Standing wide stance with arms extended","caption":"Standing wide stance with arms extended."},{"src":"/assets/case-studies/yoga-pose-output-2.jpg","alt":"YOLO body keypoints: Standing lunge with arms raised","caption":"Standing lunge with arms raised."},{"src":"/assets/case-studies/yoga-pose-output-3.jpg","alt":"YOLO body keypoints: Kneeling pose with back arched","caption":"Kneeling pose with back arched."},{"src":"/assets/case-studies/yoga-pose-output-4.jpg","alt":"YOLO body keypoints: Wide stance with bent knee and arms extended","caption":"Wide stance with bent knee and arms extended."},{"src":"/assets/case-studies/yoga-pose-output-5.jpg","alt":"YOLO body keypoints: Prone backbend with arms supporting the torso","caption":"Prone backbend with arms supporting the torso."}],
        stack: ['YOLO', 'Python', 'Computer Vision', 'Real-time Inference'],
        externalLinks: [{ label: 'Upwork project', claimRef: 'yolo-computer-vision-optimization.upwork-project' }, { label: 'Related GitHub', claimRef: 'yolo-computer-vision-optimization.related-github' }],
      },
    },
  ],
};

// Staged records are generated mechanically from a reviewed candidate. Merge
// them into this manifest so the compiler remains the one source of truth.
export const caseStudyPublicationManifest = mergeCaseStudyManifest(caseStudyPublicationBaseline, stagedCaseStudyPublication);
