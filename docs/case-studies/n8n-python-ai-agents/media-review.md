# n8n media review

Issue #121 replaces the database-input cover and representative screenshots with a project overview and two real n8n editor captures.

The overview is the cover, collection thumbnail, and first gallery image. The second image shows the comparison workflow and its create, update, and delete routes. The third shows the SQL agent, schema loading, conversation memory, and separate execution path. The editable diagram is `workflow-overview.excalidraw` in this directory.

The screenshots were captured in Dell n8n 2.42.6 from inactive, sanitized imports of the original project exports. Executable node names, types, positions, connections, and operation labels remain. Credentials, pinned client data, sticky notes, and sensitive parameters were omitted before capture. The node configuration warnings reflect that sanitization. These images show archived workflow structure, not successful executions or database-level isolation.

The comparison export SHA-256 is `40ed133675fef8f4cb6261ce05346164c88fd001387673a828a57727ad35636d`. The SQL-agent export SHA-256 is `b563d8b83fc087697b4bb1a80360f9be2060bf59aceac4ae60aa24f93a09eb90`.

Codex reviewed the final media and exact candidate under Viv's explicit implementation instruction. This is an agent review, not a claim that Viv inspected the final bytes. Candidate SHA-256 is `118a1f7a812d043eda19e533d43fad1e6430e818b0911da444ef4f10d8c4cf8a`. Existing non-media article copy is preserved.

Validation on 10 October 2026 passed the production build and 72 tests covering publication, images, staging, gallery behavior, and display derivatives. T3 browser checks on the production preview confirmed all three gallery images, the overview first on initial load, and no horizontal overflow at a 390px viewport. No merge or deployment was performed.

Editable Markdown, original final PNG assets, and vector source are retained outside the website repository at `/Users/viv/Freelance/case_study_to_proposal_hub/reports/issue121-media-2026-10-10/source/`. The website repository contains only the staged projection, public assets, editable diagram, and this review.

The two inactive Dell capture drafts remain available for reproducing the capture. The user's signed-in n8n tab is preserved.
