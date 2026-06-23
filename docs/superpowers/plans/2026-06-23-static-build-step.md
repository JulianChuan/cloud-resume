# Static Build Step (Header/Footer Dedup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deduplicate the copy-pasted header/footer across the site's pages by assembling each page from shared partials with a tiny dependency-free Node build step at deploy time.

**Architecture:** Source pages move to `code/frontend/pages/` and replace their header/footer blocks with `<!-- include: header -->` / `<!-- include: footer -->` markers. A `build.js` script (Node built-ins only) stamps the shared `_partials/header.html` and `_partials/footer.html` into each page, injects the per-page active-nav highlight at build time, and writes a complete site into `dist/`. The deploy workflow runs the build and uploads `dist/`.

**Tech Stack:** Plain HTML/CSS/JS, Node 20 (built-in `fs`, `path`, `node:test`, `node:assert`), GitHub Actions, AWS S3 + CloudFront.

## Global Constraints

- **No dependencies.** No npm packages, no `node_modules`, no framework. Node built-in modules only.
- **Node version:** the workflow already provides Node 20; rely only on APIs available there (`fs.cpSync`, `fs.rmSync`, `node:test`).
- **URLs must not change.** Built pages keep their existing paths: pages at `/code/frontend/<page>.html`, site root `/` serves `index.html`, `error.html` is the 404. Static assets stay at `/assets/...`, `/code/frontend/style.css`, `/code/frontend/theme-switch.js`.
- **No visible output change.** The only intended differences vs. the current pages are header normalizations (see below). No page *content* changes.
- **Preserve the hardened workflow:** keep the SHA-pinned actions and the CloudFront invalidation step from the prior PR.

### Per-page active-nav mapping (verbatim — drives the header marker)

| active value | pages |
|---|---|
| `about` | `about.html` |
| `portfolio` | `portfolio.html`, `cloud-resume.html`, `socket-demo.html`, `linea-guide.html` |
| *(none)* | `index.html`, `activedraft.html`, `appsketiers.html`, `immutable.html`, `zenledger.html` |
| *(no markers — passes through)* | `error.html` (standalone page, has no header/footer) |

### Expected (intended) diffs the unified header introduces — anything else is a regression

- Removal of the stray `<!-- Adjust href as needed -->` comment (was present only in `index.html`, `about.html`, `portfolio.html`, `cloud-resume.html`, `socket-demo.html`).
- `cloud-resume.html`, `socket-demo.html`, `activedraft.html`, `appsketiers.html`: home link `href="index.html"` → `href="/"`.
- `appsketiers.html`: About link `href="about.html"` → `href="/code/frontend/about.html"`.
- `linea-guide.html`: Portfolio link `href="portfolio.html"` → `href="/code/frontend/portfolio.html"`.

All of the above resolve to the same destinations today; they are consistency fixes, not behavior changes.

---

## File Structure

- Create: `code/frontend/build.js` — the assembler (pure functions + `build()`).
- Create: `code/frontend/build.test.js` — unit tests for the pure functions.
- Create: `code/frontend/_partials/header.html` — single source of truth for the nav header (with active-nav tokens).
- Create: `code/frontend/_partials/footer.html` — single source of truth for the footer.
- Create: `code/frontend/pages/*.html` — the 11 pages moved here, slimmed to unique content + markers.
- Delete: `code/frontend/*.html` (the 11 originals, after moving).
- Modify: `.github/workflows/deploy-to-s3.yml` — add build step, upload `dist/`.
- Modify/Create: `.gitignore` — ignore `dist/`.
- Unchanged: `code/frontend/style.css`, `code/frontend/theme-switch.js`, `assets/`.

---

## Task 1: Build engine — pure functions with unit tests

**Files:**
- Create: `code/frontend/build.js`
- Test: `code/frontend/build.test.js`

**Interfaces:**
- Produces:
  - `renderHeader(headerTpl: string, active?: string) -> string` — replaces `{{ACTIVE_ABOUT}}` / `{{ACTIVE_PORTFOLIO}}` tokens in the header template with `" active"` for the matching nav item, `""` otherwise.
  - `assemble(html: string, headerTpl: string, footerTpl: string) -> string` — replaces the first `<!-- include: header [active=x] -->` marker with the rendered header and the first `<!-- include: footer -->` marker with the footer. Returns input unchanged if no markers present.

- [ ] **Step 1: Write the failing tests**

Create `code/frontend/build.test.js`:

```js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assemble, renderHeader } = require('./build.js');

const HEADER = 'H[{{ACTIVE_ABOUT}}][{{ACTIVE_PORTFOLIO}}]';
const FOOTER = 'F';

test('renderHeader with no active leaves both tokens empty', () => {
  assert.equal(renderHeader(HEADER, undefined), 'H[][]');
});

test('renderHeader active=about marks only About', () => {
  assert.equal(renderHeader(HEADER, 'about'), 'H[ active][]');
});

test('renderHeader active=portfolio marks only Portfolio', () => {
  assert.equal(renderHeader(HEADER, 'portfolio'), 'H[][ active]');
});

test('assemble replaces a plain header marker', () => {
  assert.equal(assemble('a\n<!-- include: header -->\nb', HEADER, FOOTER), 'a\nH[][]\nb');
});

test('assemble replaces header marker carrying an active value', () => {
  assert.equal(assemble('<!-- include: header active=portfolio -->', HEADER, FOOTER), 'H[][ active]');
});

test('assemble replaces the footer marker', () => {
  assert.equal(assemble('x\n<!-- include: footer -->\ny', HEADER, FOOTER), 'x\nF\ny');
});

test('assemble leaves a page with no markers untouched (error.html case)', () => {
  const page = '<!DOCTYPE html><html>no markers</html>';
  assert.equal(assemble(page, HEADER, FOOTER), page);
});

test('assemble preserves $ sequences in partials (function replacer, no regex footgun)', () => {
  assert.equal(assemble('<!-- include: footer -->', HEADER, 'a$&b$1c'), 'a$&b$1c');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test code/frontend/build.test.js`
Expected: FAIL — cannot find module `./build.js` (it doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `code/frontend/build.js` (pure functions + module export only; file I/O comes in Task 2):

```js
'use strict';

// Replace the active-nav tokens in the header template. `active` is "about",
// "portfolio", or undefined (no highlight, e.g. the home page).
function renderHeader(headerTpl, active) {
  return headerTpl
    .replace('{{ACTIVE_ABOUT}}', active === 'about' ? ' active' : '')
    .replace('{{ACTIVE_PORTFOLIO}}', active === 'portfolio' ? ' active' : '');
}

// Stamp the shared partials into one page. Function replacers are used so that
// any `$`-sequences inside the partials are inserted literally (a string
// replacement would treat `$&`, `$1`, etc. as special). Pages with no markers
// (e.g. error.html) pass straight through.
function assemble(html, headerTpl, footerTpl) {
  html = html.replace(
    /<!--\s*include:\s*header(?:\s+active=([a-z]+))?\s*-->/,
    (_match, active) => renderHeader(headerTpl, active)
  );
  html = html.replace(
    /<!--\s*include:\s*footer\s*-->/,
    () => footerTpl
  );
  return html;
}

module.exports = { assemble, renderHeader };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test code/frontend/build.test.js`
Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add code/frontend/build.js code/frontend/build.test.js
git commit -m "Add build.js assembler core with unit tests"
```

---

## Task 2: Partials, slimmed pages, and the full build

**Files:**
- Create: `code/frontend/_partials/header.html`, `code/frontend/_partials/footer.html`
- Create: `code/frontend/pages/<page>.html` (move all 11)
- Modify: `code/frontend/build.js` (add `build()` + `require.main` guard)
- Modify/Create: `.gitignore`
- Delete: `code/frontend/*.html` (the originals, after the move)

**Interfaces:**
- Consumes: `assemble`, `renderHeader` from Task 1.
- Produces: a `dist/` tree — `dist/index.html`, `dist/error.html`, `dist/assets/**`, `dist/code/frontend/<page>.html`, `dist/code/frontend/style.css`, `dist/code/frontend/theme-switch.js`.

- [ ] **Step 1: Snapshot the current pages as a golden reference (before any change)**

This is the verification baseline for Task 3 — capture it before moving anything.

```bash
rm -rf /tmp/cr-golden && mkdir -p /tmp/cr-golden
cp code/frontend/*.html /tmp/cr-golden/
ls /tmp/cr-golden/   # expect 11 .html files
```

- [ ] **Step 2: Create the header partial**

Create `code/frontend/_partials/header.html` (the `index.html` header, minus the stray comment, with active-nav tokens). Note the leading indentation is intentional — the marker is placed at column 0 in pages, and the partial supplies the indentation:

```html
      <header>
        <div class="header-content">
          <a href="/code/frontend/about.html" class="header-link{{ACTIVE_ABOUT}}">About</a>
          <div class="center-content">
            <a href="/">
              <img
                src="/assets/headshot.jpeg"
                alt="Profile Picture"
                class="header-icon"
              />
            </a>
          </div>
          <a href="/code/frontend/portfolio.html" class="header-link{{ACTIVE_PORTFOLIO}}">Portfolio</a>
        </div>
      </header>
```

The file must have **no trailing newline** (so the assembled output keeps the original line breaks). Verify: `tail -c1 code/frontend/_partials/header.html | xxd` should show the last byte is `>` (0x3e), not `0a`.

- [ ] **Step 3: Create the footer partial**

Create `code/frontend/_partials/footer.html` (identical to the footer in every current page):

```html
      <footer>
        <div class="footer-links">
          <a href="mailto:julianchuan@proton.me" target="_blank">Email</a>
          |
          <a href="https://github.com/JulianChuan" target="_blank">GitHub</a>
          |
          <a href="https://twitter.com/buy_eth" target="_blank">Twitter</a>
          |
          <a href="https://linkedin.com/in/julian-chuan" target="_blank">LinkedIn</a>
          |
          <a href="/assets/julian-resume.pdf" target="_blank">Resume</a>
        </div>
        <p class="footer-text">
          Designed &amp; Deployed with ❤️ by Julian Chuan. &copy; 2024
        </p>
      </footer>
```

No trailing newline (same check as Step 2). **Note:** the source pages currently contain a literal `&` in "Designed & Deployed"; copy whatever the current pages have verbatim so the diff in Task 3 stays clean — if the originals use a bare `&`, use a bare `&` here instead of `&amp;`.

- [ ] **Step 4: Move pages into `pages/` and insert markers**

```bash
mkdir -p code/frontend/pages
git mv code/frontend/*.html code/frontend/pages/
```

Then, in each file under `code/frontend/pages/`, make these edits (using the Edit tool, not by hand):

For every page **except `error.html`**:
1. Replace the entire `<header>…</header>` block (the 6-space-indented block) with a single line at **column 0**:
   - `index.html`, `activedraft.html`, `appsketiers.html`, `immutable.html`, `zenledger.html`: `<!-- include: header -->`
   - `about.html`: `<!-- include: header active=about -->`
   - `portfolio.html`, `cloud-resume.html`, `socket-demo.html`, `linea-guide.html`: `<!-- include: header active=portfolio -->`
2. Replace the entire `<footer>…</footer>` block with a single line at column 0: `<!-- include: footer -->`

`error.html`: leave it exactly as-is (it has no header/footer; `assemble` passes it through).

- [ ] **Step 5: Add the `build()` function to `build.js`**

Append to `code/frontend/build.js`, immediately **before** the `module.exports` line:

```js
const fs = require('fs');
const path = require('path');

const FRONTEND = __dirname;
const SRC = path.join(FRONTEND, 'pages');
const PARTIALS = path.join(FRONTEND, '_partials');
const REPO = path.join(FRONTEND, '..', '..');
const DIST = path.join(REPO, 'dist');
const DIST_FRONTEND = path.join(DIST, 'code', 'frontend');

function build() {
  const headerTpl = fs.readFileSync(path.join(PARTIALS, 'header.html'), 'utf8');
  const footerTpl = fs.readFileSync(path.join(PARTIALS, 'footer.html'), 'utf8');

  // Start from a clean output tree so deletes in source propagate.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST_FRONTEND, { recursive: true });

  // Assemble each source page into dist/code/frontend/<page>.html.
  for (const file of fs.readdirSync(SRC)) {
    if (!file.endsWith('.html')) continue;
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    fs.writeFileSync(path.join(DIST_FRONTEND, file), assemble(src, headerTpl, footerTpl));
  }

  // Static siblings the pages load from /code/frontend/.
  for (const asset of ['style.css', 'theme-switch.js']) {
    fs.copyFileSync(path.join(FRONTEND, asset), path.join(DIST_FRONTEND, asset));
  }

  // Site assets served from /assets/.
  fs.cpSync(path.join(REPO, 'assets'), path.join(DIST, 'assets'), { recursive: true });

  // Root entrypoints: "/" serves index.html; error.html is the custom 404.
  fs.copyFileSync(path.join(DIST_FRONTEND, 'index.html'), path.join(DIST, 'index.html'));
  fs.copyFileSync(path.join(DIST_FRONTEND, 'error.html'), path.join(DIST, 'error.html'));

  console.log('Built site to dist/');
}

if (require.main === module) build();
```

(The `module.exports = { assemble, renderHeader };` line stays at the very end.)

- [ ] **Step 6: Re-run the unit tests (guard against breaking Task 1)**

Run: `node --test code/frontend/build.test.js`
Expected: PASS — still 8 tests passing (adding `build()` must not change the pure functions).

- [ ] **Step 7: Run the build**

Run: `node code/frontend/build.js`
Expected: prints `Built site to dist/`.

Then sanity-check the output exists:

```bash
ls dist dist/code/frontend dist/assets
```
Expected: `dist/index.html`, `dist/error.html`, all 11 pages under `dist/code/frontend/`, `style.css`, `theme-switch.js`, and the `assets/` files.

- [ ] **Step 8: Ignore the build output**

```bash
touch .gitignore
printf 'dist/\n' >> .gitignore
```
(If `.gitignore` already lists `dist/`, skip the append.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Extract header/footer partials; assemble pages via build.js"
```

---

## Task 3: Prove visual parity against the golden snapshot

**Files:** none modified unless reconciliation is needed (then `_partials/*.html`).

**Interfaces:**
- Consumes: the `dist/` tree from Task 2 and `/tmp/cr-golden/` from Task 2 Step 1.

- [ ] **Step 1: Diff every assembled page against the original**

```bash
for f in /tmp/cr-golden/*.html; do
  name=$(basename "$f")
  echo "=== $name ==="
  diff "$f" "dist/code/frontend/$name" || true
done
```

- [ ] **Step 2: Confirm only the intended diffs appear**

Expected output, page by page — **no other lines may appear**:
- `index.html`: removal of the `<!-- Adjust href as needed -->` comment line.
- `about.html`, `portfolio.html`: removal of the comment line (about/portfolio active classes are preserved by the markers, so they do **not** appear as diffs).
- `cloud-resume.html`, `socket-demo.html`: comment removed **and** home link `index.html` → `/`.
- `activedraft.html`: home link `index.html` → `/` (this page had no comment).
- `appsketiers.html`: home link `index.html` → `/` **and** About link `about.html` → `/code/frontend/about.html`.
- `immutable.html`, `zenledger.html`: **no diff** (their headers already matched the partial; comment was already absent).
- `linea-guide.html`: comment removed **and** Portfolio link `portfolio.html` → `/code/frontend/portfolio.html`.
- `error.html`: **no diff** (passed through untouched).

If any diff touches page *content* (anything inside `<main>`, the `<head>`, scripts, or the footer), STOP — the partial or a marker placement is wrong. Fix the partial/marker and re-run Task 2 Step 7 + this diff. Do not proceed until only the intended diffs remain.

- [ ] **Step 3: Commit any reconciliation (only if Step 2 required partial fixes)**

```bash
git add code/frontend/_partials
git commit -m "Reconcile partials to match original page output"
```
(If no reconciliation was needed, skip this step.)

---

## Task 4: Wire the build into the deploy workflow

**Files:**
- Modify: `.github/workflows/deploy-to-s3.yml`

**Interfaces:**
- Consumes: `build.js` producing `dist/`.

- [ ] **Step 1: Replace the "Stage root entrypoints" step with a build step**

In `.github/workflows/deploy-to-s3.yml`, delete the entire `Stage root entrypoints for deployment` step (the `cp code/frontend/index.html .` / `error.html .` block) and put this in its place:

```yaml
    - name: Build site
      run: node code/frontend/build.js
```

- [ ] **Step 2: Point the S3 sync at `dist/`**

Change the `Deploy to S3` step's `with`/`env` so it uploads the assembled `dist/` tree (the include/exclude filters are no longer needed — `dist/` contains exactly what should ship):

```yaml
    - name: Deploy to S3
      uses: jakejarvis/s3-sync-action@be0c4ab89158cac4278689ebedd8407dd5f35a83 # v0.5.1
      with:
        args: --follow-symlinks --delete
      env:
        AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        SOURCE_DIR: dist
```

Leave the `Set up Node.js`, `Configure AWS credentials`, and `Invalidate CloudFront cache` steps unchanged.

- [ ] **Step 3: Validate the workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-to-s3.yml')); print('valid YAML')"`
Expected: `valid YAML`

- [ ] **Step 4: Dry-run the full build once more (what CI will do)**

Run: `rm -rf dist && node code/frontend/build.js && ls dist`
Expected: `Built site to dist/` and the populated `dist/` listing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-to-s3.yml
git commit -m "Build site and deploy dist/ in CI"
```

---

## Self-Review

**Spec coverage:**
- Build step, no deps → Tasks 1–2 (Node built-ins, `node:test`). ✔
- File layout (`_partials/`, `pages/`, `build.js`) → Task 2. ✔
- Marker-based includes + build-time active-nav (Option A) → Tasks 1–2, header tokens + mapping table. ✔
- Preserve URLs / dist mirrors current S3 layout → Task 2 Step 5. ✔
- Deploy workflow change → Task 4. ✔
- Local preview (`node code/frontend/build.js`) → Task 2 Step 7. ✔
- Byte-parity verification → Task 3. ✔
- Out of scope (`<head>` dedup, redesign, dev server) → not included. ✔

**Placeholder scan:** No TBD/TODO; every code and command step shows full content. ✔

**Type consistency:** `renderHeader(headerTpl, active)` and `assemble(html, headerTpl, footerTpl)` are used with identical signatures in `build.test.js` (Task 1), `build()` (Task 2), and the exports. Tokens `{{ACTIVE_ABOUT}}` / `{{ACTIVE_PORTFOLIO}}` match between the header partial (Task 2 Step 2) and `renderHeader` (Task 1 Step 3). ✔
