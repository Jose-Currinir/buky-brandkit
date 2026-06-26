// Dependency-free tests for scripts/detect-stack.mjs.
// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const detect = resolve(here, '..', 'scripts', 'detect-stack.mjs');

function run(dir) {
  // detect-stack.mjs exits with code 2 when unsupported; execFileSync throws on nonzero,
  // so capture stdout from the error too.
  let out;
  try {
    out = execFileSync(process.execPath, [detect, dir], { encoding: 'utf8' });
  } catch (e) {
    out = e.stdout || '';
  }
  return JSON.parse(out);
}

function tmpFixture() {
  const d = mkdtempSync(join(tmpdir(), 'detectfix-'));
  return d;
}

test('detects KMP via libs.versions.toml alias', () => {
  const d = tmpFixture();
  try {
    writeFileSync(join(d, 'build.gradle.kts'), 'plugins {\n  alias(libs.plugins.kotlinMultiplatform)\n}\n');
    mkdirSync(join(d, 'gradle'), { recursive: true });
    writeFileSync(
      join(d, 'gradle', 'libs.versions.toml'),
      '[plugins]\nkotlinMultiplatform = { id = "org.jetbrains.kotlin.multiplatform" }\n'
    );
    const res = run(d);
    assert.equal(res.stack, 'kmp');
    assert.equal(res.supported, true);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('detects web via manifest + index.html', () => {
  const d = tmpFixture();
  try {
    writeFileSync(join(d, 'index.html'), '<!doctype html><title>x</title>');
    writeFileSync(join(d, 'manifest.webmanifest'), '{"name":"x"}');
    const res = run(d);
    assert.equal(res.stack, 'web');
    assert.equal(res.supported, true);
    assert.ok(res.targets.web, 'targets.web should be set');
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});
