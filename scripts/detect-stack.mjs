#!/usr/bin/env node
// Detect the target project's stack by scanning marker files.
// Usage: node scripts/detect-stack.mjs <target-project-dir>
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.argv[2] || '.';
const SUPPORTED = ['kmp', 'native-ios', 'native-android', 'web'];

function walk(dir, depth, hits, max = 4) {
  if (depth > max) return;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'build' || e.name === '.gradle' || e.name === 'DerivedData') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.endsWith('.xcodeproj') || e.name.endsWith('.xcworkspace')) hits.xcode.push(p);
      walk(p, depth + 1, hits, max);
    } else {
      if (e.name === 'AndroidManifest.xml') hits.androidManifest.push(p);
      if (e.name === 'Package.swift') hits.packageSwift.push(p);
      if (e.name === 'pubspec.yaml') hits.pubspec.push(p);
      if (e.name === 'build.gradle.kts' || e.name === 'build.gradle') hits.gradle.push(p);
      if (e.name === 'libs.versions.toml') hits.toml.push(p);
      if (e.name === 'manifest.webmanifest' || e.name === 'site.webmanifest') hits.webManifest.push(p);
      if (e.name === 'index.html') hits.indexHtml.push(p);
    }
  }
}

const hits = { xcode: [], androidManifest: [], packageSwift: [], pubspec: [], gradle: [], toml: [], webManifest: [], indexHtml: [] };
walk(root, 0, hits);

// Read Gradle scripts AND the version catalog — modern KMP applies the plugin via an alias
// (alias(libs.plugins.kotlinMultiplatform)), so the plugin id lives in libs.versions.toml.
const buildText = [...hits.gradle, ...hits.toml]
  .map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
const isMultiplatform =
  /kotlin\(["']multiplatform["']\)|org\.jetbrains\.kotlin\.multiplatform|libs\.plugins\.kotlinMultiplatform|kotlinMultiplatform\b|kotlin-multiplatform/.test(buildText);

let stack = 'unknown';
const evidence = [];
if (isMultiplatform) {
  stack = 'kmp';
  evidence.push('Kotlin multiplatform plugin found in a Gradle script');
  if (hits.androidManifest.length) evidence.push(`AndroidManifest.xml (${hits.androidManifest.length})`);
  if (hits.xcode.length || hits.packageSwift.length) evidence.push('iOS project present');
} else if (hits.pubspec.length) {
  stack = 'flutter';
  evidence.push('pubspec.yaml found');
} else if (hits.xcode.length || hits.packageSwift.length) {
  stack = 'native-ios';
  evidence.push(hits.xcode[0] ? `Xcode project: ${hits.xcode[0]}` : 'Package.swift found');
} else if (hits.androidManifest.length) {
  stack = 'native-android';
  evidence.push(`AndroidManifest.xml: ${hits.androidManifest[0]}`);
}

// A web target can coexist with KMP/native projects. Record the path regardless of the
// primary stack; only promote stack to 'web' when nothing else matched.
const webTarget = hits.webManifest[0] || hits.indexHtml[0] || null;
if (webTarget) {
  if (stack === 'unknown') {
    stack = 'web';
    evidence.push(`Web target: ${webTarget}`);
  } else {
    evidence.push(`Web target also present: ${webTarget}`);
  }
}

const result = {
  stack,
  supported: SUPPORTED.includes(stack),
  evidence,
  targets: {
    ios: stack === 'kmp' || stack === 'native-ios' ? (hits.xcode[0] || hits.packageSwift[0] || null) : null,
    android: stack === 'kmp' || stack === 'native-android' ? (hits.androidManifest[0] || null) : null,
    web: webTarget,
  },
  supportedStacks: SUPPORTED,
};

console.log(JSON.stringify(result, null, 2));
if (!result.supported) process.exitCode = 2;
