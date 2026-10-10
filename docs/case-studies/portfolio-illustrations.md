# Portfolio illustration assignments

On 10 October 2026, Viv requested inspecting the top-level PNG files in `/Users/viv/Freelance/portfolio/*.png` and saving them to their matching case studies. All five images were viewed before assignment. Viv then approved displaying the OCR and invoice illustrations with captions explaining their illustrative scope, and requested keeping lead qualification unassigned.

The three assigned illustrations appear in the existing galleries. Current project screenshots remain the article and collection covers. The original files are unchanged.

| Supplied filename | Case study | Disposition | Supplied SHA-256 |
| --- | --- | --- | --- |
| ChatGPT Image Aug 8, 2026, 03_57_14 PM (1).png | invoice-ocr-extraction | Added to its gallery | fd037492a41495f036b6d5ef3aa3c45d48664b272ba92ee3ba8be1754e1bfe04 |
| ChatGPT Image Aug 8, 2026, 03_57_14 PM (2).png | ai-invoice-processing-automation | Added to its gallery | b62fc9703a746c28bc6eb4e0e2ea998069b81190d3aa8d0380553c5f44018768 |
| ChatGPT Image Aug 8, 2026, 03_57_15 PM (4).png | ai-project-planning-assistant | Added to its gallery | d06f0fc78c42733d590f74f499f91b51c124d40532abbe1b7552ed57bc7ee590 |
| ChatGPT Image Aug 8, 2026, 03_57_15 PM (3).png | Unassigned | Saved at `docs/case-studies/unassigned/n8n-lead-qualification.png`; excluded from production | 8d87723835fba138f2e047f1e3d5a4eb701cf4e2d21650749588625ca876cf67 |
| ChatGPT Image Aug 8, 2026, 03_57_15 PM (5).png | sports-video-analytics-yolo | Same pixels as the football illustration already delivered in [PR #350](https://github.com/vivekpatel99/my-portfolio-webisite/pull/350); no duplicate asset | fa3e0352229ccf27bfc674ed45ef2d3f99abd896dd196f888f8ea1bb60a999b6 |

## Illustration scope

The OCR image includes a 94% faster processing claim and JSON/database output. Its caption states that those are not verified for the local invoice-photo-to-Excel project.

The invoice illustration includes PO/database matching, Azure OpenAI and audit-ready wording. Its caption identifies those as conceptual details, while the case study describes the verified extraction, deterministic checks, review states and spreadsheet output.

The planning image illustrates the LangGraph assistant and its progression toward a reviewable plan. It supplements the existing architecture diagram.

Lead qualification shows webhook intake, enrichment, AI scoring and ClickUp routing. It has no confirmed matching case study and remains unassigned as requested.

## Asset preparation

Assigned PNG copies retain source pixels and dimensions while removing metadata. Full-resolution images remain available for enlargement. WebP display images and JPEG thumbnails use the existing hash-bound derivative registry. The unassigned PNG is an exact source-file copy outside the public output.

Publication approvals record the direct request and caption decision. Existing summaries, outcome claims, cover images and unrelated case studies are unchanged. This PR requires its own review and merge; production release remains separate.

## Verification

- All 90 targeted publication, gallery, article, thumbnail, derivative and route-integrity tests passed.
- Display-derivative integrity checks and the production build passed, including all 21 case-study routes and 36 internal links.
- Twelve browser checks passed across Chromium and WebKit, desktop and mobile, and all three assigned galleries. Checks covered image loading, captions, enlargement, zoom, keyboard dismissal, restored focus and overflow.
- A fresh independent review found no actionable issues. Pixel comparisons confirmed that the assigned copies preserve the supplied artwork; the unassigned copy preserves the exact source bytes.
- Existing covers and factual claims were compared against `develop`. The unassigned lead illustration is absent from production output.

T3 preview automation reported no available host and instructed against retrying. The rendered checks used the installed Playwright browsers against the production preview instead.
