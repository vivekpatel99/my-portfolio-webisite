# Portfolio Website Improvements - Step by Step Guide

## Overview
This document contains all improvements for vivekapatel.com organized by file. Work through each file one at a time, copying the updated code to Horizons.

**Progress:** 13/14 tasks completed (tasks 10-14 skipped - icon deduplication deferred until off Horizons)

---

## ✅ COMPLETED

### 1. index.html (SEO - All Done)
- [x] Fix og:url typo (`vivkeapatel` → `vivekapatel`)
- [x] Add meta description with Europe-focused keywords
- [x] Add hreflang tags for European targeting
- [x] Add Twitter/X Card meta tags
- [x] Add JSON-LD structured data (Person + ProfessionalService schemas)

### 2. tools/generate-sitemap.js (Routes Fixed)
- [x] Change `/privacy-policy` → `/legal`
- [x] Change `/cookie-policy` → `/data-policy`

### 3. src/pages/Home.jsx (SEO Done)
- [x] Update meta description with Europe-focused keywords
- [x] Update meta keywords with European targeting

### 4. src/pages/Contact.jsx (SEO Done)
- [x] Update meta description with Europe-focused keywords
- [x] Update meta keywords with European targeting

---

### 5. src/index.css (Accessibility Done)
- [x] Fix cursor:none for touch devices using @media (pointer: fine)
- [x] Add prefers-reduced-motion support

---

### 6. src/components/Header.jsx (Accessibility Done)
- [x] Add aria-label, aria-expanded, aria-controls to mobile menu button
- [x] Add id, role="dialog", aria-modal, aria-label to mobile menu panel

---

### 7. src/components/Services.jsx (Accessibility Done)
- [x] Add keyboard navigation (Enter/Space to toggle)
- [x] Add role="button", tabIndex, aria-expanded, aria-controls
- [x] Add id to content panels

---

### 8. src/components/Portfolio.jsx (Accessibility Done)
- [x] Add keyboard navigation (Enter/Space to open project)
- [x] Add role="button", tabIndex, aria-label to cards
- [x] Add loading="lazy" to images

---

### 9. src/components/About.jsx (Performance Done)
- [x] Add loading="lazy" to Vivek photo
- [x] Add loading="lazy" to team collaboration photo

---

---

## ⏸️ DEFERRED (until off Horizons)

Tasks 10-14: Icon deduplication - requires creating new files which Horizons doesn't support.

---

## Testing Checklist

After each file update in Horizons, verify:

- [ ] Website loads without errors
- [ ] No console errors in browser dev tools
- [ ] Mobile menu works (Header.jsx)
- [ ] Service accordions work with keyboard (Services.jsx)
- [ ] Portfolio cards are keyboard accessible (Portfolio.jsx)
- [ ] Images load lazily (check Network tab)

### SEO Validation Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results) - Test JSON-LD
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) - Test Twitter cards
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) - Test Open Graph

---

## Target Keywords (for reference)

**Primary:**
- "freelance AI engineer Europe"
- "hire computer vision developer"
- "n8n automation developer Europe"
- "web scraping expert Europe"

**Secondary:**
- "Python AI freelancer"
- "YOLO object detection freelancer"
- "data extraction automation"
- "LangChain developer Europe"
- "real-time video analytics freelancer"
