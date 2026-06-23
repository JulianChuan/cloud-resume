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

  // The standalone Socket demo app is hosted at /code/socket-demo/ and linked
  // from socket-demo.html; ship it verbatim (it has no header/footer to assemble).
  fs.cpSync(path.join(REPO, 'code', 'socket-demo'), path.join(DIST, 'code', 'socket-demo'), { recursive: true });

  // Root entrypoints: "/" serves index.html; error.html is the custom 404.
  fs.copyFileSync(path.join(DIST_FRONTEND, 'index.html'), path.join(DIST, 'index.html'));
  fs.copyFileSync(path.join(DIST_FRONTEND, 'error.html'), path.join(DIST, 'error.html'));

  console.log('Built site to dist/');
}

if (require.main === module) build();

module.exports = { assemble, renderHeader };
