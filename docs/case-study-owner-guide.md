# Add or edit your case studies

Editable stories live in `/Users/viv/Freelance/case_study_to_proposal_hub/website-case-studies/`.
Open an existing `.md` file in your text editor to change its copy. Keep its ID and slug unchanged.
Run the commands below from `/Users/viv/Freelance/my-website/horizons-website`.

## Create a story

```sh
npm run case-study:library -- new \
  --directory /Users/viv/Freelance/case_study_to_proposal_hub/website-case-studies \
  --id my-new-project --title 'My new project'
```

Open the created `my-new-project.md`. Fill in its summary and the three sections: `## The problem`, `## What I built`, and `## The outcome`. Add `project_status: completed` and `completed_at: 2026-09` in the frontmatter, using the actual completion month or your recorded best estimate. Completed stories appear in the collection; stories without completed status do not.

## Add photos or screenshots

Put PNG, JPG, or WebP files in `website-case-studies/assets/my-new-project/`. Use your project images with client details removed. To choose a cover, add this inside the opening YAML frontmatter, before its closing `---`:

```yaml
image:
  src: overview.png
  alt: Overview of the invoice-processing workflow
  caption: Invoice intake and review workflow
```

To add another screenshot, insert this under `## What I built` or another public section:

```markdown
![Review screen showing extracted invoice fields](review-screen.png)
```

Use filenames relative to the story's asset folder. Referenced images feed the article gallery automatically. Files merely copied into the folder do not appear. Do not edit generated assets under `public/` or `dist/`.

## Preview your edits

```sh
npm run case-study:library -- prepare \
  --directory /Users/viv/Freelance/case_study_to_proposal_hub/website-case-studies \
  --id my-new-project
npm run case-study:preview -- \
  --candidate .case-study-preview/library/candidate.json --port 4173
```

Open <http://127.0.0.1:4173/>. After editing, stop the preview with Ctrl+C, prepare again, and restart it. Repeat `--id` to select several stories, or use `--all` to preview the full library.

## Include the reviewed version in the website

Preparation alone does not update the website. Once you approve the preview, stage the exact candidate using the command in [the authoring guide](case-study-authoring.md). It needs the candidate SHA-256, your name, the current UTC timestamp, and an actual HTTPS review record such as the related GitHub issue. Then run tests and build and open a feature-branch PR into `develop`.

You can also ask: “Stage the updated `my-new-project` case study and screenshots for develop.” The homepage stays at three handpicked stories; `/case-studies/` shows the full completed collection, six cards at a time through **Load more**. A production release uses a separately approved PR from `develop` to `main`.

The 2026-09-15 batch contains twelve staged articles. All twelve have completion dates. Invoice processing and healthcare document intelligence use September 2026 estimates authorized by the owner; the private library records the basis. Authorization and the initial candidate digest are recorded in [issue #112](https://github.com/vivekpatel99/my-portfolio-webisite/issues/112).
