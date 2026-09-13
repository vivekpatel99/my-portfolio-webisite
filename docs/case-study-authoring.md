# Case-study authoring and local preview

Author a story in the hub's `website-case-studies/` library, then pass each selected
file explicitly to the preparation command. Preparation writes only the ignored
`.case-study-preview/candidate.json` candidate; it does not approve or publish
anything.

The editable inputs are the selected Markdown story and its grouped source
assets outside this repository. The website repository owns the reviewed
staged store under `publication/` and the approved public assets under
`public/assets/case-studies/`. Candidate snapshots and local preview output
are derived, ignored inputs; `dist/` is generated deployment output and is
never an authoring location.

```sh
npm run case-study:prepare -- \
  --source /path/to/case-study.md \
  --assets-root /path/to/assets/story-id \
  --out .case-study-preview

npm run case-study:preview -- \
  --candidate .case-study-preview/candidate.json \
  --port 4173

# After reviewing the exact candidate bytes, stage them mechanically.
shasum -a 256 .case-study-preview/candidate.json
npm run case-study:stage -- \
  --candidate .case-study-preview/candidate.json \
  --sha256 <candidate-sha256> \
  --approved-by Viv \
  --approved-at 2026-09-09T00:00:00Z \
  --evidence https://example.invalid/review
```

To revise a staged story, edit its Markdown and rerun `case-study:prepare` with
that source explicitly selected. Review the resulting candidate, compute its
new digest, and run `case-study:stage` again. A fresh digest and approval are
required for every title, summary, public-section, public category/caption,
or media byte change; a stale digest is rejected and leaves the last staged
snapshot unchanged. Private notes and ignored frontmatter are excluded by
design, so changing them leaves the candidate bytes unchanged. The stage
command reports the selected identities it changed.

Preparation errors identify the source file and field. For a missing or
duplicate public H2, repair the Markdown headings and rerun preparation with
the affected explicit sources. For an invalid source path or asset, keep the
asset beneath the selected real assets root, use a supported image with bytes
matching its suffix, and reprepare. For a stale candidate SHA-256, discard the
stale approval, review the newly prepared bytes, compute a new digest, and
stage only that reviewed digest. Do not edit `candidate.json` or generated
publication files by hand.

To withdraw one staged story, name its stable ID explicitly:

```sh
npm run case-study:withdraw -- \
  --id story-id
```

Withdrawal writes a metadata-only draft tombstone for that ID, so a baseline
record cannot reappear when a candidate omits it. Omission from a candidate
never deletes a story, and an unknown ID is rejected without changing the
staged store. The command removes the story from the next generated cards,
article HTML, sitemap, route allowlist, and unreferenced staged asset entries;
it does not delete source assets automatically.

For a one-step local preview, use `case-study:preview` with one or more explicit
`--source` arguments. The server binds only to `127.0.0.1`, adds `noindex`, and
is refused when `CI` is set or `NODE_ENV=production`.

Each source needs YAML frontmatter with `id`, `title`, and `summary`; add an
explicit `project_status` of `completed` or `ongoing` when the project status is
known. A completed story also requires `completed_at` in `YYYY-MM` form. Use the
known completion month when supported by evidence; when the exact month is
unavailable, obtain Viv's best month/year estimate and record the source or
estimate evidence in private authoring notes. Do not substitute the publication
date or invent a date. The public format is the same for known and estimated
months, with no approximation marker. `slug` and `category` are optional. IDs and slugs use lowercase
hyphenated words. The body
must contain exactly one level-two heading for each of `The problem`, `What I
built`, and `The outcome`. Only those sections are projected. Source H1 text,
introductory blockquotes, private notes, and all other sections stay out of the
candidate.

The parser accepts paragraphs, lists, emphasis, inline code, ordinary internal
paths or HTTPS links, subordinate headings, blockquotes, fenced code blocks, and
PNG, JPEG, or WebP images. A cover uses `image.src`, `image.alt`, and optional
`image.caption` frontmatter; inline images use ordinary Markdown such as
`![Workflow screenshot](wide.png)`. Every image needs non-empty alt text. Image
sources are resolved beneath one real assets root, rejecting traversal,
symlink escapes, missing files, external URLs, SVG, and malformed or mismatched
image bytes. Public image paths must end in `.png`, `.jpg`, `.jpeg`, or `.webp`
and their suffix must match the detected bytes. A staging or build error such
as `image path extension does not match its actual png format` means the
reviewed candidate metadata or filename must be repaired and reviewed again;
do not rename an approved file in place. If `--assets-root` is omitted,
preparation uses the sibling
`assets/<story-id>` directory next to the source file. Pass an explicit root when
the hub stores assets elsewhere. Only referenced bytes are frozen into the
ignored candidate directory and copied to the content-addressed public asset
namespace during staging.

Use permitted actual project screenshots only after removing client or other
identifying details, removing embedded metadata, and optimizing the final
bytes. Prepare, review, and stage those final bytes. Any later pixel or
metadata change needs a new preparation and review; do not auto-edit or reuse
an unrelated image. A text-only story is a valid fallback.

Copy [the case-study template](templates/case-study.md) before writing a new
story. Do not place source files, private notes, draft media, or candidate output
in the website's tracked public inputs. Staging is the reviewed website input; it
does not deploy or submit anything. Re-run preparation and preview for a
revision, then stage the new candidate with its new digest. Withdrawal is a
separate explicit operation and is not implied by omitting a story from a
candidate.

The historical review and planning documents record earlier decisions and
evidence. They are not alternate authoring instructions; this guide and the
current publication compiler define the active prepare, preview, stage, revise,
and withdraw flow.

The checked-in `publication/case-study-manifest.js` is the build-only authority.
`publication/staged-case-study-publication.js` is generated by the stage command
and merged into that manifest. Vite exposes only its validated public projection;
private source files, candidate JSON, approval metadata, and unreferenced assets
are outside production inputs. The production build generates cards, SEO,
sitemap, Apache project allowlisting, and static project HTML from that one
projection.

Only records with publication status `published` enter the validated public
projection used by article routes. The shared `eligibleCaseStudies` export
contains only records whose public `projectStatus` is explicitly `completed`; `ongoing` and status-unknown records remain available for article and withdrawal controls but are
excluded from collection cards and homepage counts. The retained legacy records
may be owner-confirmed completed without a month. New Markdown articles still
require a valid `completed_at` month with completed status.

Homepage cards use the build-only `publication/case-study-featured.js` slug
configuration. The selector keeps configured order, ignores unavailable or
ineligible slugs, removes duplicates, and caps the result at three stories.
Configuration chooses existing eligible public records; it does not publish a
story or add metadata. The `/case-studies/` link uses the full eligible count.

The small legacy adapter in `publication/compile-case-studies.js` remains
because `n8n-openai-data-extraction`, `invoice-ocr-extraction`, and
`yolo-computer-vision-optimization` are retained records whose exact identity,
claims, or source mapping is still unresolved. It keeps their existing
validated content and provenance checks while projecting them through the same
article renderer. Remove this adapter only after explicit identity and content
migration has replaced every retained record and its consumers.

Use [the finite release checklist](case-study-release-checklist.md) to assemble
the exact candidate digest, asset digests, content approvals, CI/build evidence,
and host verification required for an authorized release. A draft disposition
does not satisfy those approvals.

Staged removal is a local release input. A verified live removal is a separate
deployment result: the authorized hosting step must delete obsolete files, and
release verification must check the withdrawn URL, its assets, sitemap, and
route status. Do not treat a successful preparation or build as proof that a
live URL changed. If deployment outcome is uncertain, inspect the actual
hosting state before retrying.


## Library shortcuts and current preparation batch

Use `npm run case-study:library -- list --directory /path/to/website-case-studies`
to discover editable stories. `new` creates an ID-named Markdown template and
its assets directory without overwriting existing stories. `prepare --id ID`
selects one story, repeated IDs select a batch, and `prepare --all` validates
the whole directory. Sources must be outside the website repository; preparation
still uses the existing compiler and ignored candidate directory.

The 2026-09-13 library contains twelve reviewed-source drafts: three replacement
stories preserving current website IDs and nine additional stories. Ten have
historical completion months; invoice-core and healthcare identity/date mapping
need confirmation. Four stories have source-project media; eight have clearly labelled workflow
illustrations using synthetic data. These illustrations are not delivery evidence. The hub library's `docs/INVENTORY.md` and `catalog.json`
record coverage and open questions. No batch publication is implied.

A multi-story local preview presents a review index at `/`, with each story at
`/project/<slug>/`. The review index is noindex and is not the public collection.
Client-attractiveness ranking will be decided in a separate session; the current
public ordering is unchanged by preparing this library.
