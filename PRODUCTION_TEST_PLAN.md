# Production Test Plan - vivekapatel.com

**Last Updated:** 2025-11-27
**Website:** https://vivekapatel.com
**Status:** Ready for testing

---

## Quick Start

Run all tests in parallel using 7 sub-agents:
```
Test all categories simultaneously for fastest results
```

---

## Test Category 1: Page Load & Routing

### Routes (HTTP 200 Expected)

| ID | URL | Check |
|----|-----|-------|
| R-001 | https://vivekapatel.com/ | [ ] 200, contains "Vivek Patel" |
| R-002 | https://vivekapatel.com/contact | [ ] 200, contact form visible |
| R-003 | https://vivekapatel.com/legal | [ ] 200, "Privacy Policy" |
| R-004 | https://vivekapatel.com/data-policy | [ ] 200, "Cookie Policy" |
| R-005 | https://vivekapatel.com/project/social-media-app | [ ] 200, project details |
| R-006 | https://vivekapatel.com/nonexistent | [ ] Redirects to home |
| R-007 | https://vivekapatel.com/project/invalid | [ ] Redirects to home |

### Hash Routes (Scroll Anchors)

| ID | URL | Check |
|----|-----|-------|
| R-008 | https://vivekapatel.com/#services | [ ] Scrolls to services |
| R-009 | https://vivekapatel.com/#about | [ ] Scrolls to about |
| R-010 | https://vivekapatel.com/#portfolio | [ ] Scrolls to portfolio |
| R-011 | https://vivekapatel.com/#testimonials | [ ] Scrolls to testimonials |

---

## Test Category 2: SEO & Meta Tags

### Basic Meta Tags

| ID | Element | Expected | Check |
|----|---------|----------|-------|
| SEO-001 | `<title>` | "Vivek Patel - Computer Vision & AI Engineer" | [ ] |
| SEO-002 | `meta[description]` | Contains "Freelance AI" | [ ] |
| SEO-003 | `meta[robots]` | "index, follow" | [ ] |

### Open Graph

| ID | Tag | Expected | Check |
|----|-----|----------|-------|
| SEO-004 | `og:title` | "Vivek Patel - Computer Vision & AI Engineer" | [ ] |
| SEO-005 | `og:description` | Portfolio description | [ ] |
| SEO-006 | `og:type` | "website" | [ ] |
| SEO-007 | `og:url` | "https://www.vivekapatel.com/" | [ ] |
| SEO-008 | `og:image` | Valid URL, returns 200 | [ ] |

### Twitter Cards

| ID | Tag | Expected | Check |
|----|-----|----------|-------|
| SEO-009 | `twitter:card` | "summary_large_image" | [ ] |
| SEO-010 | `twitter:title` | Contains "Vivek Patel" | [ ] |
| SEO-011 | `twitter:image` | Valid URL, returns 200 | [ ] |

### Structured Data

| ID | Schema | Check |
|----|--------|-------|
| SEO-012 | JSON-LD Person | [ ] Valid, correct data |
| SEO-013 | JSON-LD ProfessionalService | [ ] Valid, services listed |

### Sitemap & Robots

| ID | URL | Check |
|----|-----|-------|
| SEO-014 | https://vivekapatel.com/sitemap.xml | [ ] 200, valid XML |
| SEO-015 | https://vivekapatel.com/robots.txt | [ ] 200, allows crawling |

---

## Test Category 3: External Links

### Social/Professional Links

| ID | Platform | URL | Check |
|----|----------|-----|-------|
| EXT-001 | GitHub | https://github.com/vivekpatel99 | [ ] |
| EXT-002 | LinkedIn | https://www.linkedin.com/in/vivek-patel99/ | [ ] |
| EXT-003 | Upwork | https://www.upwork.com/freelancers/vivekpatel99 | [ ] |
| EXT-004 | Freelancer | https://www.freelancer.com/u/vivekpatel999 | [ ] |
| EXT-005 | FreelancerMap | https://www.freelancermap.de/profil/ai-engineer-specializing-in-computer-vision-with-expertise-in-cuda-and-onnx-optimization | [ ] |

### Portfolio Project Links

| ID | Project | URL | Check |
|----|---------|-----|-------|
| EXT-006 | n8n Workflow | https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760 | [ ] |
| EXT-007 | Invoice OCR | https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256 | [ ] |
| EXT-008 | Yoga Pose | https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136 | [ ] |
| EXT-009 | Football Tracking | https://github.com/vivekpatel99/football-players-tracking-yolo | [ ] |
| EXT-010 | Medical Segmentation | https://github.com/vivekpatel99/breast-cancer-segmentation-vgg-fcn-pytorch | [ ] |
| EXT-011 | AI Planning Agent | https://github.com/vivekpatel99/project-planning-genie | [ ] |

---

## Test Category 4: Asset Loading

### Logos & Favicon

| ID | Asset | URL | Check |
|----|-------|-----|-------|
| AST-001 | Favicon | https://raw.githubusercontent.com/vivekpatel99/my-portfolio-webisite/main/public/assets/logos/mylogo.png | [ ] |
| AST-002 | Logo | https://raw.githubusercontent.com/vivekpatel99/my-portfolio-webisite/main/public/assets/logos/white_background.png | [ ] |

### Background Images

| ID | Asset | URL | Check |
|----|-------|-----|-------|
| AST-003 | Hero BG | https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/71f6723b117af5fb7e36d829dfcd6b7f.jpg | [ ] |
| AST-004 | Black BG | https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/3d284e50ce513c15332533e5e6e3bae1.png | [ ] |

### Profile Images

| ID | Asset | URL | Check |
|----|-------|-----|-------|
| AST-005 | About Photo | https://raw.githubusercontent.com/vivekpatel99/my-portfolio-webisite/main/public/assets/images/vivek-black-and-white.png | [ ] |
| AST-006 | Profile Photo | https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/9b45fe76e7e373b4cb617a63c8494322.png | [ ] |
| AST-007 | Hero Image | https://imagedelivery.net/LqiWLm-3MGbYHtFuUbcBtA/119580eb-abd9-4191-b93a-f01938786700/public | [ ] |

### Portfolio Project Images

| ID | Project | URL | Check |
|----|---------|-----|-------|
| AST-008 | n8n | https://www.upwork.com/att/download/portfolio/persons/uid/1883842334427528625/profile/projects/files/afa0fdb2-5e26-45a5-b7c2-11b3f2e7555e | [ ] |
| AST-009 | Invoice OCR | https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main/output/original_with_bboxes_demo.jpg | [ ] |
| AST-010 | Yoga Pose | https://www.upwork.com/att/download/portfolio/persons/uid/1883842334427528625/profile/projects/files/2f4283c5-deca-4a2a-b17d-07033247de19 | [ ] |
| AST-011 | Football GIF | https://raw.githubusercontent.com/vivekpatel99/football-players-tracking-yolo/main/readme-assets/yolov12l_processed_121364_0.gif | [ ] |
| AST-012 | Medical GIF | https://raw.githubusercontent.com/vivekpatel99/breast-cancer-segmentation-vgg-fcn-pytorch/main/results/predictions_animation.gif | [ ] |
| AST-013 | AI Agent | https://raw.githubusercontent.com/vivekpatel99/project-planning-genie/main/assets/final_graph.png | [ ] |

### Tech Stack Icons (Sample)

| ID | Icon | URL | Check |
|----|------|-----|-------|
| AST-014 | Python | https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg | [ ] |
| AST-015 | PyTorch | https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg | [ ] |
| AST-016 | TensorFlow | https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg | [ ] |
| AST-017 | YOLO | https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg | [ ] |
| AST-018 | OpenAI | https://cdn.worldvectorlogo.com/logos/openai-2.svg | [ ] |
| AST-019 | HuggingFace | https://huggingface.co/front/assets/huggingface_logo.svg | [ ] |

---

## Test Category 5: Interactive Components (Playwright)

### Navigation

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-001 | Header nav | Click each nav link | Smooth scroll | [ ] |
| INT-002 | Mobile menu open | Click hamburger | Menu slides in | [ ] |
| INT-003 | Mobile menu close | Click link | Menu closes | [ ] |
| INT-004 | Logo click | Click logo | Navigate home | [ ] |
| INT-005 | Hire Me button | Click header CTA | Navigate /contact | [ ] |

### Hero Section

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-006 | Hero "Hire Me" | Click button | Navigate /contact | [ ] |
| INT-007 | "View My Work" | Click button | Scroll #portfolio | [ ] |
| INT-008 | Upwork badge | Click badge | Opens Upwork new tab | [ ] |

### Services Section

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-009 | Expand service 1 | Click card | Expands, icon rotates | [ ] |
| INT-010 | Expand service 2 | Click card | Expands | [ ] |
| INT-011 | Collapse service | Click again | Collapses | [ ] |
| INT-012 | Keyboard | Enter on focused | Expands | [ ] |

### Portfolio Section

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-013 | Card hover | Hover project | Zoom, overlay | [ ] |
| INT-014 | External project | Click n8n | Opens Upwork new tab | [ ] |
| INT-015 | GitHub project | Click Football | Opens GitHub new tab | [ ] |

### Experience Section

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-016 | Expand | Click item | Description expands | [ ] |
| INT-017 | Collapse | Click again | Collapses | [ ] |

### Connect & CTA

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-018 | Upwork card | Click card | Opens Upwork | [ ] |
| INT-019 | Direct Message | Click card | Navigate /contact | [ ] |
| INT-020 | Get Free Quote | Click CTA | Navigate /contact | [ ] |

### Footer

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| INT-021 | Quick Links | Click links | Navigate/scroll | [ ] |
| INT-022 | Privacy Policy | Click | Navigate /legal | [ ] |
| INT-023 | Cookie Policy | Click | Navigate /data-policy | [ ] |
| INT-024 | Manage Cookies | Click | Toast appears | [ ] |
| INT-025 | Social links | Click | Opens new tab | [ ] |

---

## Test Category 6: Contact Form (Validation Only)

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| FRM-001 | Empty submit | Submit empty | Toast "Missing fields" | [ ] |
| FRM-002 | Missing name | Fill email+desc | Toast error | [ ] |
| FRM-003 | Missing email | Fill name+desc | Toast error | [ ] |
| FRM-004 | Missing description | Fill name+email | Toast error | [ ] |
| FRM-005 | Invalid email | Bad email format | HTML5 validation | [ ] |
| FRM-006 | Budget dropdown | Click dropdown | Options appear | [ ] |
| FRM-007 | Select budget | Select option | Value selected | [ ] |

### Contact Page Links

| ID | Test | Expected | Check |
|----|------|----------|-------|
| FRM-008 | Upwork link | Opens profile | [ ] |
| FRM-009 | Freelancer link | Opens profile | [ ] |
| FRM-010 | Email link | Opens mailto | [ ] |
| FRM-011 | GitHub link | Opens profile | [ ] |
| FRM-012 | LinkedIn link | Opens profile | [ ] |

---

## Test Category 7: Cookie Consent (GDPR)

| ID | Test | Steps | Expected | Check |
|----|------|-------|----------|-------|
| COK-001 | Banner appears | Clear localStorage, visit | Banner after 1.5s | [ ] |
| COK-002 | Accept All | Click button | Banner closes, saved | [ ] |
| COK-003 | Reject All | Click button | Banner closes, analytics=false | [ ] |
| COK-004 | Customize | Click button | Panel expands | [ ] |
| COK-005 | Necessary checkbox | View | Disabled, checked | [ ] |
| COK-006 | Analytics toggle | Toggle | State changes | [ ] |
| COK-007 | Save preferences | Save | Banner closes | [ ] |
| COK-008 | Close X | Click X | Banner closes | [ ] |
| COK-009 | Persist | Reload | No banner | [ ] |
| COK-010 | localStorage | After consent | Key exists | [ ] |

---

## Test Category 8: Performance (Lighthouse)

### Core Web Vitals

| ID | Metric | Target | Page | Check |
|----|--------|--------|------|-------|
| PRF-001 | Performance | >= 80 | Homepage | [ ] |
| PRF-002 | LCP | < 2.5s | Homepage | [ ] |
| PRF-003 | FID/INP | < 100ms | Homepage | [ ] |
| PRF-004 | CLS | < 0.1 | Homepage | [ ] |
| PRF-005 | TTI | < 3.8s | Homepage | [ ] |
| PRF-006 | Performance | >= 80 | Contact | [ ] |
| PRF-007 | Performance | >= 80 | Project | [ ] |

### Additional

| ID | Check | Target | Check |
|----|-------|--------|-------|
| PRF-008 | Images optimized | Properly sized | [ ] |
| PRF-009 | JS bundle | < 500KB gzip | [ ] |
| PRF-010 | CSS bundle | < 100KB gzip | [ ] |
| PRF-011 | Fonts | No FOIT/FOUT | [ ] |

---

## Test Category 9: Accessibility (WCAG 2.1 AA)

| ID | Check | Target | Check |
|----|-------|--------|-------|
| A11Y-001 | Score | >= 90 | [ ] |
| A11Y-002 | Color contrast | 4.5:1 ratio | [ ] |
| A11Y-003 | Alt text | All images | [ ] |
| A11Y-004 | Heading hierarchy | Proper h1-h6 | [ ] |
| A11Y-005 | Focus indicators | Visible | [ ] |
| A11Y-006 | Keyboard nav | All focusable | [ ] |
| A11Y-007 | ARIA labels | All interactive | [ ] |
| A11Y-008 | Skip link | Works | [ ] |
| A11Y-009 | Form labels | All inputs | [ ] |
| A11Y-010 | Touch targets | >= 44x44px | [ ] |

---

## Test Category 10: Responsive Design

### Viewports to Test
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1440x900
- Large: 1920x1080

| ID | Test | Viewport | Expected | Check |
|----|------|----------|----------|-------|
| RES-001 | Mobile menu | 375px | Hamburger visible | [ ] |
| RES-002 | Desktop nav | 1440px | Nav visible | [ ] |
| RES-003 | Hero | All | No overflow | [ ] |
| RES-004 | Portfolio grid | 375px | 1 column | [ ] |
| RES-005 | Portfolio grid | 768px | 2 columns | [ ] |
| RES-006 | Portfolio grid | 1440px | 3 columns | [ ] |
| RES-007 | Timeline | 375px | Left side | [ ] |
| RES-008 | Timeline | 1440px | Centered | [ ] |
| RES-009 | Footer | 375px | Stacked | [ ] |
| RES-010 | Footer | 1440px | Horizontal | [ ] |
| RES-011 | Contact form | All | Usable | [ ] |
| RES-012 | Images | All | No overflow | [ ] |

---

## Test Category 11: Animations

| ID | Animation | Expected | Check |
|----|-----------|----------|-------|
| ANI-001 | Hero entrance | Fade in stagger | [ ] |
| ANI-002 | Section scroll | Animate on view | [ ] |
| ANI-003 | Tech marquee | Infinite scroll | [ ] |
| ANI-004 | Stats counter | Count up on view | [ ] |
| ANI-005 | Portfolio hover | Scale, overlay | [ ] |
| ANI-006 | Service expand | Animate open/close | [ ] |
| ANI-007 | Mobile menu | Slide from top | [ ] |
| ANI-008 | Cookie banner | Slide from bottom | [ ] |
| ANI-009 | Button hover | Arrow slides | [ ] |
| ANI-010 | Testimonials | Marquee runs | [ ] |

---

## Test Category 12: Error Handling

| ID | Test | Expected | Check |
|----|------|----------|-------|
| ERR-001 | Sentry loaded | Script present | [ ] |
| ERR-002 | Console errors | None on load | [ ] |
| ERR-003 | Network errors | None (except expected) | [ ] |
| ERR-004 | 404 handling | Graceful redirect | [ ] |

---

## Test Results Summary

| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| 1. Page Load & Routing | 11 | | | |
| 2. SEO & Meta Tags | 15 | | | |
| 3. External Links | 11 | | | |
| 4. Asset Loading | 19 | | | |
| 5. Interactive Components | 25 | | | |
| 6. Contact Form | 12 | | | |
| 7. Cookie Consent | 10 | | | |
| 8. Performance | 11 | | | |
| 9. Accessibility | 10 | | | |
| 10. Responsive Design | 12 | | | |
| 11. Animations | 10 | | | |
| 12. Error Handling | 4 | | | |
| **TOTAL** | **150** | | | |

---

## Failed Tests Log

| Test ID | Category | Issue | Severity | Notes |
|---------|----------|-------|----------|-------|
| | | | | |

---

## Configuration

- **Contact Form:** Skip actual submission (validation only)
- **Rate-Limited Sites:** Test all, accept failures from LinkedIn/Upwork
- **Execution:** All 7 agents in parallel

---

## Agent Distribution

| Agent | Categories | Method | Est. Time |
|-------|------------|--------|-----------|
| 1 | Page Load, SEO | WebFetch + HTML parse | ~5 min |
| 2 | External Links | WebFetch HEAD requests | ~3 min |
| 3 | Asset Loading | WebFetch HEAD requests | ~5 min |
| 4 | Interactive, Form, Cookie | Playwright | ~10 min |
| 5 | Performance, Accessibility | Lighthouse CLI | ~5 min |
| 6 | Responsive, Animations | Playwright viewports | ~8 min |
| 7 | Error Handling | Mixed | ~3 min |

---

## How to Run

```bash
# Ask Claude Code to run production tests
"Run the production test plan against vivekapatel.com using parallel agents"

# Or run specific categories
"Run only SEO and Performance tests on production"
```

---

## Changelog

| Date | Changes |
|------|---------|
| 2025-11-27 | Initial test plan created |
