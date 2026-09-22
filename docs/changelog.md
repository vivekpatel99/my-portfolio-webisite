# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- The n8n case study at `/project/n8n-python-ai-agents/` now includes representative n8n workflow screenshots from other portfolio work as temporary stand-ins until Andrew engagement screenshots are available.
- The schedule-PDF case study at `/project/healthcare-document-intelligence/` now states it is not clinical EHR or medical records.
- Homepage, meta, and JSON-LD now show Starting at €45/hour.
- The sports case study at `/project/sports-video-analytics-yolo/` now states it is a batch review pipeline, not live scoring.
- The depth case study at `/project/depth-based-distance-estimation/` now states it is a lab demo, not a benchmark, and not for proposals.
- Homepage proof chips, About, and SEO no longer claim unsourced 94% savings or 21+ projects.
- Move the planning-assistant and Python CI case studies into an Other work section on the collection page. Keep their project URLs.
- Homepage, meta, and JSON-LD now say based in Linz, Austria.

### Removed
- 300+ Hours chip from the homepage proof strip.

### Fixed
- Size case-study galleries to wide workflow screenshots so n8n canvases no longer sit in a tall empty 4:3 box

## [0.13.0] - 2025-01-18

### Added
- Centralized links configuration (`src/config/links.js`) for all external URLs
- Canonical URL management in App.jsx for better SEO
- Claude Code configuration (`.claude/` directory) for AI-assisted development
- Production test plan documentation

### Changed
- Updated package name from `web-app` to `vivekapatel-portfolio`
- Improved About section with updated profile images
- Enhanced Hero section layout and animations
- Improved technology display handling
- Reorganized documentation into `docs/` directory

### Removed
- Unused `HeroImage.jsx` component (dead code cleanup)
- Moved root-level documentation files to `docs/` directory

### Fixed
- Mobile overflow issues
- Accessibility improvements (ARIA labels, keyboard navigation)
- SEO meta tags optimization
- Performance optimizations

## [0.12.0] - Previous Release

### Added
- Initial portfolio website with React 18 + Vite
- Section-based single-page architecture
- Framer Motion animations
- Radix UI accessible components
- Tailwind CSS styling with dark mode
- Sentry error tracking integration
- Google Analytics with cookie consent
