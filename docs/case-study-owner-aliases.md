# Case Study Owner Aliases

This document maps public case study marketing titles to internal project names for owner reference.

## Purpose

Owner aliases help cross-check marketing titles against real project names without putting private names in public HTML. They are visible only when owner mode is activated.

## Activation

- Turn on: Visit any page with `?me=1` in the URL
- Turn off: Visit any page with `?me=0` in the URL
- Preference persists in `localStorage` across sessions

## Alias Mapping

| Slug | Internal/Owner Name |
|------|---------------------|
| sports-video-analytics-yolo | Football / match tracking (batch review) |
| yolo-computer-vision-optimization | Yoga pose / fitness keypoints |
| n8n-openai-data-extraction | Pia/Stephan German website datasets |
| invoice-ocr-extraction | Invoice OCR → spreadsheet |
| ai-invoice-processing-automation | Invoice workflow with review controls |
| n8n-python-ai-agents | Andrew engagement — n8n + read-only SQL agent |
| healthcare-document-intelligence | Color-coded schedule PDFs → Excel (not EHR) |
| browser-search-to-spreadsheet | Browser search → spreadsheet handoff |
| resumable-listing-data-extraction | Resumable listing scrape → CSV/JSONL |
| python-ci-workflow-automation | Python CI / code-quality toolkit |
| ai-project-planning-assistant | LangGraph brief → implementation plan |
| depth-based-distance-estimation | Lab depth demo (not for proposals) |

## Implementation

- **Data source**: `src/data/caseStudyOwnerAliases.js`
- **State management**: `src/lib/ownerMode.js` + `src/hooks/useOwnerMode.js`
- **Display component**: `src/components/OwnerAlias.jsx`
- **Used in**: CaseStudyCard (portfolio gallery) and CaseStudyArticle (detail page)

## Notes

- Aliases are client-side only and not included in SSR/static HTML
- No SEO or public visibility impact
- Mac hub copy at `case_study_to_proposal_hub` is maintained separately by Portfolio Chief
