# Central Markdown authoring with an explicit publish step

## Status

Accepted by Viv on 2026-09-09. Simple article UI subsequently approved and implementation plan written; implementation pending.

## Context

Viv already maintains Markdown case studies in the central proposal hub and wants
to reuse them for the portfolio and proposals with minimal maintenance. The website
currently maintains separate JavaScript story records.

## Decision

Author stories with assistant help in the existing central Markdown hub. Prepare
a website preview, then require an explicit publish instruction before the
automated release flow. Keep the existing website stack and use a shared template
to present exported public content. This replaces the previously documented
assumption that each project's repository holds its case-study source file.

## Consequences

The story has one editable source and requires no browser editor or new CMS.
An export step must transfer selected text and media into the deployment source;
changing a local Markdown file alone does not update the hosted website. Export
validation, release integration, and removal behavior still need a concrete plan.
Private evidence and internal indexes remain outside the publication payload.
