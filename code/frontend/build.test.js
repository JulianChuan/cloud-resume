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
