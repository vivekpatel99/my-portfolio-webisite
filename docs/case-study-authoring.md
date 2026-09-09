# Case-study authoring and local preview

Author a story in the hub's `case-studies/` directory, then pass each selected
file explicitly to the preparation command. Preparation writes only the ignored
`.case-study-preview/candidate.json` candidate; it does not approve or publish
anything.

```sh
npm run case-study:prepare -- \
  --source /path/to/case-study.md \
  --out .case-study-preview

npm run case-study:preview -- \
  --candidate .case-study-preview/candidate.json \
  --port 4173
```

For a one-step local preview, use `case-study:preview` with one or more explicit
`--source` arguments. The server binds only to `127.0.0.1`, adds `noindex`, and
is refused when `CI` is set or `NODE_ENV=production`.

Each source needs YAML frontmatter with `id`, `title`, and `summary`; `slug` and
`category` are optional. IDs and slugs use lowercase hyphenated words. The body
must contain exactly one level-two heading for each of `The problem`, `What I
built`, and `The outcome`. Only those sections are projected. Source H1 text,
introductory blockquotes, private notes, and all other sections stay out of the
candidate.

The parser accepts paragraphs, lists, emphasis, inline code, ordinary internal
paths or HTTPS links, subordinate headings, blockquotes, and fenced code blocks.
Raw HTML, executable or non-YAML frontmatter, unsafe links, and images fail with
a file and field error. Image input is intentionally reported as unsupported in
CS-02 and is scheduled for CS-04.

Copy [the case-study template](templates/case-study.md) before writing a new
story. Do not place source files, private notes, draft media, or candidate output
in the website's tracked public inputs. Publishing and deployment remain a
separate, explicit workflow after review.
