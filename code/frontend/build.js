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
