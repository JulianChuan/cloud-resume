# Static Build Step — Header/Footer Deduplication

**Date:** 2026-06-23
**Status:** Approved (design), pending implementation plan

## Problem

The site is 11 static HTML pages in `code/frontend/`. Each page carries a
character-for-character copy of the same header (nav) and footer. A single
shared change (e.g. a footer edit) currently requires editing all 11 files, and
copy-paste drift has already produced bugs — most recently a `julianchuan.coml`
typo that was broken in one page and correct in the others.

This does not scale: at 100 pages the duplication becomes unmanageable and a
source of silent inconsistency. We want each shared fact (header, footer) to
live in exactly one place — the DRY principle.

## Constraints

- The site is served as static files from S3/CloudFront. S3 returns files
  verbatim; it does no processing. Any assembly must therefore happen **before**
  files reach S3 (at build time) — not in S3, and (by choice) not in the browser.
- The live site's URLs must not change. Built pages must keep their existing
  paths (`/code/frontend/<page>.html`, `/`, etc.) so existing links and SEO hold.
- Visible output must be unchanged. The refactor is internal only.
- Stay dependency-free: no npm packages, no framework. Node is already available
  in the GitHub Actions workflow.

## Approach: a tiny in-repo build step (no dependencies)

A ~40-line Node script (`build.js`) assembles complete pages from slim source
pages + shared partials, writing finished HTML to a `dist/` directory that the
deploy workflow uploads. Chosen over Eleventy (heavier, more to learn/maintain
for 11 pages) and over client-side JS includes (causes a flash, hurts SEO, fails
without JS).

## File layout

```
code/frontend/
  _partials/
    header.html        # the single source of truth for the nav header
    footer.html        # the single source of truth for the footer
  pages/               # the 11 pages, slimmed: unique content + include markers
    index.html
    about.html
    portfolio.html
    activedraft.html
    appsketiers.html
    cloud-resume.html
    error.html
    immutable.html
    linea-guide.html
    socket-demo.html
    zenledger.html
  style.css            # unchanged
  theme-switch.js      # unchanged
  build.js             # the new assembler
```

`_partials/` (leading underscore) marks building blocks, not servable pages.

## How the build works

Each source page replaces its copied header/footer with markers:

```html
<!-- include: header active=portfolio -->
   ... the page's unique content ...
<!-- include: footer -->
```

`build.js` loops over every file in `pages/`:
1. Read the page.
2. Replace the `header` marker with `_partials/header.html`, and the `footer`
   marker with `_partials/footer.html`.
3. Handle the active-nav highlight (below).
4. Write the finished page into `dist/code/frontend/<page>.html`, preserving the
   existing URL structure. `index.html` and `error.html` are also staged at the
   `dist/` root (matching the current workflow's root-entrypoint behavior).

Static assets (`style.css`, `theme-switch.js`) and the repo's `assets/` are
copied/synced into `dist/` unchanged so the uploaded tree is self-contained.

### Active-nav highlight — build-time (Option A)

The header has one per-page difference: the current page's nav link gets
`class="header-link active"` (bold + underline). The source page declares which
tab is active via the marker (`active=portfolio`, `active=about`, or none).
`build.js` injects the `active` class into the matching link while stamping the
header. This keeps the header a single source of truth, produces complete HTML
with no flash, and works with JavaScript disabled.

## Deploy workflow change

Add one step before the S3 sync: `node build.js` (produces `dist/`). Point the
S3 upload at `dist/` instead of the raw repo files. This modifies the workflow
hardened in the previous PR; the SHA-pinned actions and CloudFront invalidation
are preserved.

## Local preview

`node build.js` produces `dist/`; open the files there to preview. This is the
one workflow change for the author: build before preview instead of opening the
raw file. A one-line command will be documented.

## Verification (the safety net)

The partials will be authored to reproduce the **current** header/footer exactly,
so the assembled `dist/` pages are byte-for-byte identical to today's pages
(modulo the intended de-duplication). Verification: build, then `diff` each
`dist/` page against the current committed page and confirm no visible
differences. This proves the refactor changed nothing the visitor sees.

## Out of scope

- Deduplicating the per-page `<head>` (title/description/og tags) — these
  genuinely differ per page; leave them in the source pages for now.
- Any visual redesign. This is a pure internal refactor.
- A local dev server / live reload (Eleventy territory) — not needed at this size.
