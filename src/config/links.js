// ============================================
// BASE URLs - Update these when repo structure changes
// ============================================
export const BASE_URLS = {
  // GitHub repositories
  myPortfolioWebsite: 'https://raw.githubusercontent.com/vivekpatel99/my-portfolio-webisite/main/public',
  portfolioAssets: 'https://raw.githubusercontent.com/vivekpatel99/portfolio-webisite-assets/main',

  // CDNs
  hostingerCdn: 'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e',
  jsdelivrDevicons: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons',

  // External project repos (for portfolio images)
  invoiceOcrRepo: 'https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main',
  footballTrackingRepo: 'https://raw.githubusercontent.com/vivekpatel99/football-players-tracking-yolo/main',
  medicalSegmentationRepo: 'https://raw.githubusercontent.com/vivekpatel99/breast-cancer-segmentation-vgg-fcn-pytorch/main',
  planningGenieRepo: 'https://raw.githubusercontent.com/vivekpatel99/project-planning-genie/main',
};

// ============================================
// SOCIAL LINKS
// ============================================
export const socialLinks = {
  github: 'https://github.com/vivekpatel99',
  linkedin: 'https://www.linkedin.com/in/vivek-patel99/',
  upwork: 'https://www.upwork.com/freelancers/vivekpatel99?mp_source=share',
  freelancer: 'https://www.freelancer.com/u/vivekpatel999',
  freelancerMap: 'https://www.freelancermap.de/profil/ai-engineer-specializing-in-computer-vision-with-expertise-in-cuda-and-onnx-optimization',
  emailHref: 'mailto:vivekp.freelance@pm.me',
  contactEmail: 'vivekp.freelance@pm.me',
};

// ============================================
// LOGOS
// ============================================
export const logos = {
  favicon: `${BASE_URLS.myPortfolioWebsite}/assets/logos/mylogo.png`,
  logo: `${BASE_URLS.myPortfolioWebsite}/assets/logos/mylogo.png`,
  logoDarkBg: `${BASE_URLS.myPortfolioWebsite}/assets/logos/white_background.png`,
};

// ============================================
// BACKGROUNDS
// ============================================
export const backgrounds = {
  hero: `${BASE_URLS.hostingerCdn}/71f6723b117af5fb7e36d829dfcd6b7f.jpg`,
  cta: `${BASE_URLS.hostingerCdn}/71f6723b117af5fb7e36d829dfcd6b7f.jpg`, // Same as hero
  black: `${BASE_URLS.hostingerCdn}/3d284e50ce513c15332533e5e6e3bae1.png`,
};

// ============================================
// PROFILE IMAGES
// ============================================
export const profileImages = {
  aboutPhoto: `${BASE_URLS.myPortfolioWebsite}/assets/images/vivek-black-and-white.png`,
  profilePhoto: `${BASE_URLS.hostingerCdn}/9b45fe76e7e373b4cb617a63c8494322.png`,
  heroImage: 'https://imagedelivery.net/LqiWLm-3MGbYHtFuUbcBtA/119580eb-abd9-4191-b93a-f01938786700/public',
  teamCollaboration: `${BASE_URLS.hostingerCdn}/michael-t-rxri-ho62y4-unsplash-2-tvxRc.jpg`,
};

// ============================================
// TECH STACK ICONS
// ============================================
export const techIcons = {
  // DevIcons (jsDelivr CDN)
  git: `${BASE_URLS.jsdelivrDevicons}/git/git-original.svg`,
  opencv: `${BASE_URLS.jsdelivrDevicons}/opencv/opencv-original.svg`,
  tensorflow: `${BASE_URLS.jsdelivrDevicons}/tensorflow/tensorflow-original.svg`,
  pytorch: `${BASE_URLS.jsdelivrDevicons}/pytorch/pytorch-original.svg`,
  python: `${BASE_URLS.jsdelivrDevicons}/python/python-original.svg`,
  fastapi: `${BASE_URLS.jsdelivrDevicons}/fastapi/fastapi-original.svg`,
  aws: `${BASE_URLS.jsdelivrDevicons}/amazonwebservices/amazonwebservices-plain-wordmark.svg`,
  selenium: `${BASE_URLS.jsdelivrDevicons}/selenium/selenium-original.svg`,
  docker: `${BASE_URLS.jsdelivrDevicons}/docker/docker-original.svg`,
  postgresql: `${BASE_URLS.jsdelivrDevicons}/postgresql/postgresql-original.svg`,
  kubernetes: `${BASE_URLS.jsdelivrDevicons}/kubernetes/kubernetes-plain.svg`,

  // Other sources
  yolo: 'https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg',
  n8n: 'https://avatars.githubusercontent.com/u/45487711?s=200&v=4',
  langchain: 'https://avatars.githubusercontent.com/u/126733545?s=200&v=4',
  streamlit: 'https://streamlit.io/images/brand/streamlit-mark-color.png',
  claude: `${BASE_URLS.myPortfolioWebsite}/assets/logos/claude-color.svg`,
  openai: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg',
  mlflow: 'https://www.mlflow.org/img/mlflow-black.svg',
  huggingface: 'https://huggingface.co/front/assets/huggingface_logo.svg',
  onnx: 'https://www.vectorlogo.zone/logos/onnxai/onnxai-icon.svg',
};

// ============================================
// PORTFOLIO PROJECT IMAGES
// ============================================
export const portfolioImages = {
  n8nWorkflow: 'https://www.upwork.com/att/download/portfolio/persons/uid/1883842334427528625/profile/projects/files/afa0fdb2-5e26-45a5-b7c2-11b3f2e7555e',
  invoiceOcr: `${BASE_URLS.invoiceOcrRepo}/output/original_with_bboxes_demo.jpg`,
  yogaPose: 'https://www.upwork.com/att/download/portfolio/persons/uid/1883842334427528625/profile/projects/files/2f4283c5-deca-4a2a-b17d-07033247de19',
  footballTracking: `${BASE_URLS.footballTrackingRepo}/readme-assets/yolov12l_processed_121364_0.gif`,
  medicalSegmentation: `${BASE_URLS.medicalSegmentationRepo}/results/predictions_animation.gif`,
  aiPlanningAgent: `${BASE_URLS.planningGenieRepo}/assets/final_graph.png`,
};

// ============================================
// PROJECT CASE STUDY GALLERY (Project.jsx)
// ============================================
export const projectGallery = {
  hero: `${BASE_URLS.hostingerCdn}/gemini_generated_image_n6u5epn6u5epn6u5-5ABrF.png`,
  gallery1: `${BASE_URLS.hostingerCdn}/gemini_generated_image_mxgp1bmxgp1bmxgp-IDwMQ.png`,
  gallery2: `${BASE_URLS.hostingerCdn}/gemini_generated_image_mxgp1bmxgp1bmxgp-1-RqwfI.png`,
  gallery3: `${BASE_URLS.hostingerCdn}/professional-exchange-BmQpX.png`,
};

// ============================================
// META/SEO IMAGES (for index.html reference)
// ============================================
export const metaImages = {
  ogImage: `${BASE_URLS.myPortfolioWebsite}/assets/logos/white_background.png`,
  twitterImage: `${BASE_URLS.myPortfolioWebsite}/assets/logos/white_background.png`,
  jsonLdImage: `${BASE_URLS.myPortfolioWebsite}/assets/images/vivek-black-and-white.png`,
};

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
export const assetsLinks = {
  logo: logos.logo,
  logoDarkBg: logos.logoDarkBg,
  blackBackground: backgrounds.black,
  profilePhoto: profileImages.profilePhoto,
};
