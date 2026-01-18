# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Constraints

**DO NOT modify or break Horizons-related code.** This project is synced with Hostinger Horizons platform. The following must remain unchanged:
- `plugins/` directory (visual-editor, selection-mode, iframe-route-restoration)
- Error handlers in `vite.config.js` (horizons-vite-error, horizons-runtime-error, etc.)
- `window.parent.postMessage()` patterns for Horizons communication

## Git Workflow

**Branch Structure:**
- `main` = Production (strict protection, manual deploy to Hostinger)
- `dev` = Development/staging (PR required)
- `feature/*` = Feature branches (created from dev)

**NEVER commit directly to main or dev. Always use PRs.**

Workflow: `feature/* → PR → dev → PR → main → manual deploy`

```
feature/* ──PR──> dev ──PR──> main ──manual──> Hostinger (production)
                   │            │
                   │            └── CI: Build + Lint + Lighthouse
                   └── CI: Build + Lint
```

## Commands

```bash
# Development
bun run dev          # Start dev server on port 3000

# Production
bun run build        # Generate sitemap + build for production
bun run preview      # Preview production build on port 3000

# Code Quality
bun run lint         # Run ESLint
bun run lint:fix     # Run ESLint with auto-fix
bun run format       # Format code with Prettier
bun run format:check # Check formatting
```

## Architecture

This is a React portfolio website for Vivek Patel (vivekapatel.com), built with Vite and using a section-based single-page architecture.

### Tech Stack
- **React 18** with react-router-dom for routing
- **Vite** for build tooling with custom plugins in `plugins/`
- **Tailwind CSS** with CSS variables for theming (dark mode by default, bg: #0C0D0D)
- **Framer Motion** for animations
- **Radix UI** primitives for accessible UI components (in `src/components/ui/`)
- **Sentry** for error tracking

### Key Structure

- `src/pages/` - Route pages (Home, Contact, Project/:projectId, Legal, DataPolicy)
- `src/components/` - Home page sections (Hero, TechStack, Services, About, Experience, Portfolio, Testimonials, Stats, Connect, CTA) and shared components
- `src/components/ui/` - Radix-based UI primitives (button, input, toast, select, etc.)
- `src/lib/utils.js` - Contains `cn()` helper for Tailwind class merging
- `src/config/links.js` - External links configuration
- `tools/generate-sitemap.js` - Sitemap generator (runs automatically on build)

### Layout Pattern
`Layout.jsx` wraps all routes with Header, Footer, CustomCursor, GoogleAnalytics (consent-gated), and CookieConsentBanner. Uses `<Outlet />` for nested routes.

### Path Aliasing
`@/` maps to `src/` directory (configured in vite.config.js).

### Animations
`SectionAnimator` component wraps home page sections for scroll-triggered animations via Framer Motion.
