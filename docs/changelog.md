# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Updated TechStack component with better error handling
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
