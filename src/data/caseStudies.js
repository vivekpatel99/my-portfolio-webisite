import { portfolioImages, socialLinks } from '@/config/links';

export const caseStudies = [
  {
    id: 'n8n-openai-data-extraction',
    slug: 'n8n-openai-data-extraction',
    title: 'n8n + OpenAI Data Extraction',
    cardTitle: 'Automated Data Extraction - n8n + OpenAI',
    category: 'AI Workflow Automation',
    summary:
      'A production-ready workflow that extracts structured data from German websites, validates it, and prepares it for downstream operations.',
    challenge:
      'The client needed to turn inconsistent web pages into reliable business records without spending hours manually copying, cleaning, and checking every field.',
    solution:
      'I designed an n8n workflow that combines scraping, prompt-assisted extraction, validation, and handoff logic. The system keeps the workflow inspectable for the client while using OpenAI only where language understanding adds value.',
    outcome:
      'The workflow reduced manual research effort, improved consistency across extracted records, and gave the client a reusable automation base for future data sources.',
    stats: [
      {
        value: 40,
        suffix: '+',
        label: 'Hours Saved',
        description: 'Weekly manual research and formatting work targeted for automation.',
      },
      {
        value: 11,
        suffix: '+',
        label: 'Projects Delivered',
        description: 'Built from patterns proven across AI automation client work.',
      },
      {
        value: 100,
        suffix: '%',
        label: 'Job Success',
        description: 'Delivered with the reliability expected from Upwork client work.',
      },
      {
        value: 1,
        suffix: '',
        label: 'Reusable Workflow',
        description: 'A maintainable n8n system the client can inspect and extend.',
      },
    ],
    image: {
      src: portfolioImages.n8nWorkflow,
      alt: 'An n8n workflow for automated data extraction from German websites.',
    },
    gallery: [
      {
        src: portfolioImages.n8nWorkflow,
        alt: 'n8n workflow canvas showing connected automation steps.',
      },
      {
        src: portfolioImages.aiPlanningAgent,
        alt: 'AI workflow graph representing structured automation planning.',
      },
    ],
    stack: ['n8n', 'OpenAI', 'Web Scraping', 'Data Validation'],
    externalLinks: [
      {
        label: 'Upwork project',
        href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760',
      },
    ],
  },
  {
    id: 'invoice-ocr-extraction',
    slug: 'invoice-ocr-extraction',
    title: 'Invoice OCR Extraction',
    cardTitle: 'Invoice OCR Data Extraction',
    category: 'Document AI',
    summary:
      'An OCR extraction workflow for pulling seller and client information from invoice photos and returning structured fields for review.',
    challenge:
      'Invoice photos vary in lighting, layout, rotation, and field naming. The client needed a dependable way to extract key parties and reduce manual review time.',
    solution:
      'I combined OCR, image preprocessing, bounding-box review, and field-level normalization so extracted data could be checked quickly and reused by downstream systems.',
    outcome:
      'The project turned messy invoice images into structured, reviewable data and created a practical foundation for higher-volume document automation.',
    stats: [
      {
        value: 100,
        suffix: '%',
        label: 'Reviewable Output',
        description: 'Extraction results tied back to visual evidence for faster checks.',
      },
      {
        value: 2,
        suffix: '',
        label: 'Party Types',
        description: 'Seller and client details extracted from invoice images.',
      },
      {
        value: 300,
        suffix: '+',
        label: 'Client Hours',
        description: 'Experience base across delivered AI and automation work.',
      },
      {
        value: 5,
        suffix: '★',
        label: 'Client Standard',
        description: 'Built for the quality bar reflected in Upwork feedback.',
      },
    ],
    image: {
      src: portfolioImages.invoiceOcr,
      alt: 'Invoice image with bounding boxes showing extracted client information via OCR.',
    },
    gallery: [
      {
        src: portfolioImages.invoiceOcr,
        alt: 'Invoice OCR output with detected information highlighted.',
      },
      {
        src: portfolioImages.n8nWorkflow,
        alt: 'Automation workflow used to coordinate extraction and validation.',
      },
    ],
    stack: ['OCR', 'Python', 'Image Processing', 'Structured Extraction'],
    externalLinks: [
      {
        label: 'Upwork project',
        href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256',
      },
    ],
  },
  {
    id: 'yolo-computer-vision-optimization',
    slug: 'yolo-computer-vision-optimization',
    title: 'YOLO Computer Vision Optimization',
    cardTitle: 'Real-Time Pose Detection - YOLO',
    category: 'Computer Vision',
    summary:
      'A YOLO-based computer-vision project focused on reliable pose detection and the production concerns around fast, usable inference.',
    challenge:
      'The client needed computer-vision results that were usable in an application context, where slow inference and unstable predictions can break the user experience.',
    solution:
      'I implemented a YOLO-based pose-estimation pipeline, tuned the processing flow, and framed the work around deployment constraints rather than offline demo accuracy alone.',
    outcome:
      'The result was a practical vision pipeline for real-time pose detection, backed by production optimization experience from CUDA, ONNX, and edge deployment work.',
    stats: [
      {
        value: 94,
        suffix: '%',
        label: 'Inference Improvement',
        description: 'Production optimization benchmark from real-time vision engineering work.',
      },
      {
        value: 2.5,
        suffix: 's',
        label: 'Optimized Runtime',
        description: 'Image-stitching runtime achieved after CUDA/OpenCV optimization.',
      },
      {
        value: 37,
        suffix: 's',
        label: 'Original Runtime',
        description: 'Baseline runtime before production optimization.',
      },
      {
        value: 9,
        suffix: '+',
        label: 'Years Experience',
        description: 'Engineering background across automation, testing, and computer vision.',
      },
    ],
    image: {
      src: portfolioImages.yogaPose,
      alt: 'YOLO model detecting and estimating a yoga pose in an image.',
    },
    gallery: [
      {
        src: portfolioImages.yogaPose,
        alt: 'Pose-estimation demo using a YOLO model.',
      },
      {
        src: portfolioImages.footballTracking,
        alt: 'YOLO tracking multiple football players in video.',
      },
    ],
    stack: ['YOLO', 'Python', 'Computer Vision', 'Real-time Inference'],
    externalLinks: [
      {
        label: 'Upwork project',
        href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136',
      },
      {
        label: 'Related GitHub',
        href: 'https://github.com/vivekpatel99/football-players-tracking-yolo',
      },
    ],
  },
];

export const featuredCaseStudies = caseStudies;

export const getCaseStudyBySlug = (slug) =>
  caseStudies.find((caseStudy) => caseStudy.slug === slug);

export const caseStudySlugs = caseStudies.map((caseStudy) => caseStudy.slug);

export const primaryContactHref = '/contact';
export const directEmailHref = socialLinks.emailHref;
