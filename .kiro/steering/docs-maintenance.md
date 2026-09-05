---
description: Reminds Kiro of docs structure and update conventions when editing documentation
fileMatch: "docs/**/*.md"
---

# Documentation Maintenance

## Structure

```
docs/
├── research/INDEX.md          — Master research index (keep updated)
├── research/*.md              — Research findings, reports, benchmarks
├── setup/                     — Environment setup guides (01-07)
├── DEPLOYMENT_ARCHITECTURE.md — Docker/deployment topology
├── production-architecture.md — Production system design
├── how-production-pipeline-works.md — Pipeline flow explanation
└── *.md                       — Other architecture/feature docs
```

## Rules When Editing Docs

1. **Update INDEX.md** if adding/removing research docs
2. **Keep docs factual** — document what IS, not what might be
3. **Date your findings** — include date in meeting notes and reports
4. **Reference, don't duplicate** — link to other docs instead of copying content
5. **Archive stale docs** — move to `docs/archive/` if no longer current
