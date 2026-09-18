# Portfolio Case-Study Publishing

This context defines the language for turning approved project evidence into public portfolio case studies. It separates private client work from the limited material that may appear on vivekapatel.com.

## Language

**Source Project**:
A client project whose implementation and supporting evidence inform a case study. Its repository may remain private; the story is authored in the central case-study library.
_Avoid_: Case Study, portfolio page

**Case Study**:
An approved public account of a Source Project that explains the problem, approach, and evidenced outcome without exposing confidential implementation details.
_Avoid_: README, project, feature

**Publishing Status**:
The explicit state in a Case Study that controls its visibility on the public website. Only approved `published` Case Studies enter production outputs; draft previews stay local.
_Avoid_: done, ready

**Project Status**:
The explicit state describing whether the underlying project is `completed` or
`ongoing`. A published Case Study enters the completed collection only when its
Project Status is `completed`; missing status is excluded from that collection.
_Avoid_: published, ready

**Portfolio-safe Content**:
The text, images, links, and claims explicitly selected for public publication. It excludes source code, credentials, client data, and unapproved implementation details.
_Avoid_: repository contents, project files

## Current planning goals (2026-09-09)

Viv wants to author case studies with assistant help after completing client work,
then update the website automatically with minimal ongoing effort. The same
stories should support Google discovery and relevant Upwork proposals. Visual
design should be reviewable before feature implementation.

Viv accepted central Markdown authoring with assistant help, preview followed by
an explicit publish step, and refinement of the current dark/purple visual style.
See `docs/adr/0001-central-case-study-authoring.md` and
`docs/planning/case-study-publishing.md`. Feature implementation and publication
have not started.

The approved UI is one simple article template: title, summary, optional screenshot,
The problem, What I built, The outcome, and a contact link. There are no
project-specific layouts. The implementation plan is
`docs/planning/simple-case-study-implementation-plan.md`.
