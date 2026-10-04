export const BASE_URLS = {
  hostingerCdn: 'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e',
};

export const socialLinks = {
  github: 'https://github.com/vivekpatel99',
  linkedin: 'https://www.linkedin.com/in/vivek-patel99/',
  upwork: 'https://www.upwork.com/freelancers/vivekpatel99?mp_source=share',
  freelancer: 'https://www.freelancer.com/u/vivekpatel999',
  freelancerMap: 'https://www.freelancermap.de/profil/ai-engineer-specializing-in-computer-vision-with-expertise-in-cuda-and-onnx-optimization',
  emailHref: 'mailto:contact@vivekapatel.com',
  contactEmail: 'contact@vivekapatel.com',
};

// /assets/* is served immutable for a year (public/.htaccess), so derivative
// filenames end in the first 12 hex chars of their own SHA-256. links.test.js
// rejects a derivative whose name or recorded source digest no longer matches.
// To regenerate one, rebuild it from the source, rename it with its new hash
// and update the source digest in links.test.js (#252).
export const logos = {
  favicon: '/assets/logos/mylogo.png',
  faviconLight: '/assets/logos/favicon-light-scheme.png',
  // The header mark renders at 30px; these are 60/90px derivatives of mylogo.png (#252).
  logo: '/assets/logos/mylogo-60-c6065baa4d50.webp',
  logoSrcSet: '/assets/logos/mylogo-60-c6065baa4d50.webp 2x, /assets/logos/mylogo-90-cbffb31a1bdc.webp 3x',
};

export const profileImages = {
  portrait: '/assets/images/vivek-black-and-white.webp',
  // Display-size derivatives of portrait (1008×1367), same crop (#252).
  portraitSrcSet: '/assets/images/vivek-black-and-white-480w-3a7a7a1ab19c.webp 480w, /assets/images/vivek-black-and-white-720w-aa13477551ed.webp 720w, /assets/images/vivek-black-and-white.webp 1008w',
  // About-only crop: (104, 118, 800, 664), hair starts at y=64. The 64px
  // excess over 4:3 lets bottom + 5px positioning retain fixed CSS headroom.
  aboutPortrait: '/assets/images/vivek-about-800w-77ce8032d2e7.webp',
  aboutPortraitSrcSet: '/assets/images/vivek-about-400w-e9c1fa10c8ee.webp 400w, /assets/images/vivek-about-800w-77ce8032d2e7.webp 800w, /assets/images/vivek-about-1200w-d5b1ad36e4d4.webp 1200w',
  teamCollaboration: `${BASE_URLS.hostingerCdn}/michael-t-rxri-ho62y4-unsplash-2-tvxRc.jpg`,
};

export const assetsLinks = {
  // Full-size mark for any future SEO/structured-data use, not the 30px header derivative.
  logo: logos.favicon,
};
