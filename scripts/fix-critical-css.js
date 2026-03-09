#!/usr/bin/env node
/**
 * Fix critical CSS and HTML in all static site HTML files:
 * 1. Remove text-transform:uppercase and letter-spacing from .btn in critical CSS
 * 2. Change .btn--primary color from #fff to #103620 in critical CSS
 * 3. Fix .page-hero__subtitle font-size from 16px to 18px and color opacity
 * 4. Change CTA section buttons from btn--primary to btn--secondary (dark bg sections need white buttons)
 */

const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.resolve(__dirname, '..');

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', 'scripts', 'partials'].includes(entry.name)) {
      results.push(...findHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

let totalFixed = 0;
const files = findHtmlFiles(STATIC_DIR);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Remove text-transform:uppercase;letter-spacing from .btn in critical CSS
  if (content.includes('text-transform:uppercase;letter-spacing:.5px')) {
    content = content.replace(/text-transform:uppercase;letter-spacing:\.5px;?/g, '');
    changed = true;
  }
  if (content.includes("text-transform:uppercase;letter-spacing:0.5px")) {
    content = content.replace(/text-transform:uppercase;letter-spacing:0\.5px;?/g, '');
    changed = true;
  }

  // 2. Fix .btn--primary color from #fff to #103620 in critical CSS
  if (/\.btn--primary\{background:#99CC52;color:#fff\}/.test(content)) {
    content = content.replace(/\.btn--primary\{background:#99CC52;color:#fff\}/g, '.btn--primary{background:#99CC52;color:#103620}');
    changed = true;
  }

  // 3. Fix .page-hero__subtitle: font-size 16px→18px, color opacity 0.8→0.9
  if (/\.page-hero__subtitle\{font-size:16px;color:rgba\(255,255,255,0\.8\)/.test(content)) {
    content = content.replace(
      /\.page-hero__subtitle\{font-size:16px;color:rgba\(255,255,255,0\.8\);line-height:1\.6\}/g,
      '.page-hero__subtitle{font-size:18px;color:rgba(255,255,255,0.9);line-height:1.6}'
    );
    changed = true;
  }

  // 4. Fix CTA buttons in dark sections: btn--primary btn--lg → btn--secondary btn--lg
  const ctaSectionPattern = /<section\s+class="(?:cta|integ-cta)"[\s\S]*?<\/section>/g;
  const ctaSections = content.match(ctaSectionPattern);
  if (ctaSections) {
    for (const section of ctaSections) {
      if (section.includes('btn btn--primary btn--lg')) {
        const fixed = section.replace(/btn btn--primary btn--lg/g, 'btn btn--secondary btn--lg');
        content = content.replace(section, fixed);
        changed = true;
      }
    }
  }

  // 5. Fix trust logos: add grayscale class, remove inline opacity
  content = content.replace(
    /(<img\s+src="images\/logos\/[^"]+"\s+alt="[^"]*")\s+style="height:\s*\d+px;\s*opacity:\s*0\.6;?"(\s*>)/g,
    (match, before, after) => {
      if (!match.includes('trust-logos__logo')) {
        changed = true;
        return `${before} class="trust-logos__logo" style="height: 40px;"${after}`;
      }
      return match;
    }
  );

  // 6. Fix undefined --ivvy-green references to --ivvy-primary
  if (content.includes('var(--ivvy-green)')) {
    content = content.replace(/var\(--ivvy-green\)/g, 'var(--ivvy-primary)');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed: ${path.relative(STATIC_DIR, file)}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} of ${files.length} files.`);
