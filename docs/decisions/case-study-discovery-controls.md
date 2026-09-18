# Case-study discovery controls

## Decision

The initial case-study collection ships without category filters or search.
This records the approved deferral in issue #87 (CB-09); it is not a release
blocker for the initial collection browsing work.

## Reason for deferral

These controls should be introduced when they solve a demonstrated discovery
problem in the real published collection:

- Revisit category filters when several real published categories contain
  enough stories for filtering to be useful.
- Revisit search when published titles or categories become difficult to scan.

No automatic numeric threshold was approved. The decision should be based on
the usefulness of the controls in the actual published content.

## Future-scope gate

Filters or search require a separate scope decision before implementation.
That decision must derive categories from actual published content and define
clear empty and reset states. If approved, the controls must remain compatible
with the collection's counts, loading behavior, and browsing-position
restoration.

## Scope boundary

This record covers collection browsing controls only. Article galleries remain
separate. The deferral does not authorize implementation work in the initial
collection release.
