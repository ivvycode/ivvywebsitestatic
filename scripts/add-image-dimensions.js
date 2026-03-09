#!/usr/bin/env node
/**
 * Build script: Add explicit width/height to all <img> tags in static-site HTML.
 * 
 * Infers dimensions from:
 *   1. Parent element CSS class context (e.g. .cs-hero__image img)
 *   2. Image's own CSS class (e.g. .content-section__image)
 *   3. Known filename patterns (e.g. cta-pattern.png)
 *   4. Common inline style hints (e.g. height: 40px)
 * 
 * Usage:  node static-site/scripts/add-image-dimensions.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const STATIC_DIR = path.resolve(__dirname, "..");

// ── Dimension rules ──────────────────────────────────────────────────
// Ordered by specificity: first match wins.
// Each rule has a `test` function receiving { imgTag, parentContext, filePath }
// and returns { width, height } or null.

const rules = [
  // Skip images that already have both width and height
  {
    name: "already-has-dimensions",
    test: ({ imgTag }) =>
      /\bwidth\s*=/.test(imgTag) && /\bheight\s*=/.test(imgTag) ? "skip" : null,
  },

  // ── Parent-context rules ──────────────────────────────────────────

  // Case study hero images (full-width banner)
  {
    name: "cs-hero__image",
    test: ({ parentContext }) =>
      parentContext.includes("cs-hero__image") ? { width: 1200, height: 520 } : null,
  },

  // Case study logo card
  {
    name: "cs-logo-card__logo-wrap",
    test: ({ parentContext }) =>
      parentContext.includes("cs-logo-card__logo-wrap") ? { width: 160, height: 64 } : null,
  },

  // Case study feature icons
  {
    name: "cs-feature",
    test: ({ parentContext }) =>
      parentContext.includes("cs-feature") ? { width: 32, height: 32 } : null,
  },

  // Integration hero logo boxes
  {
    name: "integ-hero__logo-box",
    test: ({ parentContext }) =>
      parentContext.includes("integ-hero__logo-box") ? { width: 120, height: 56 } : null,
  },

  // Integration flow card logos
  {
    name: "integ-flow-card__logo-wrap",
    test: ({ parentContext }) =>
      parentContext.includes("integ-flow-card__logo-wrap") ? { width: 80, height: 32 } : null,
  },

  // Integration grid card logos
  {
    name: "integ-card",
    test: ({ parentContext }) =>
      parentContext.includes("integ-card") ? { width: 80, height: 40 } : null,
  },

  // Case study card images (in customers.html grid)
  {
    name: "case-study-card__image",
    test: ({ parentContext }) =>
      parentContext.includes("case-study-card__image") ? { width: 400, height: 300 } : null,
  },

  // Case study card logos
  {
    name: "case-study-card__logo",
    test: ({ parentContext }) =>
      parentContext.includes("case-study-card__logo") ? { width: 120, height: 32 } : null,
  },

  // Testimonial logos
  {
    name: "testimonial__logo",
    test: ({ imgTag }) =>
      /class="[^"]*testimonial__logo/.test(imgTag) ? { width: 120, height: 40 } : null,
  },

  // ── Class-based rules ─────────────────────────────────────────────

  // Content section images
  {
    name: "content-section__image",
    test: ({ imgTag }) =>
      /class="[^"]*content-section__image/.test(imgTag) ? { width: 600, height: 400 } : null,
  },

  // CTA pattern (decorative, absolutely positioned)
  {
    name: "cta__pattern",
    test: ({ imgTag }) =>
      /class="[^"]*cta__pattern/.test(imgTag) ? { width: 1200, height: 400 } : null,
  },

  // Page hero images
  {
    name: "page-hero__image",
    test: ({ imgTag }) =>
      /class="[^"]*page-hero__image/.test(imgTag) ? { width: 960, height: 520 } : null,
  },

  // Lite YouTube thumbnails
  {
    name: "lite-youtube__thumb",
    test: ({ imgTag }) =>
      /class="[^"]*lite-youtube__thumb/.test(imgTag) ? { width: 480, height: 360 } : null,
  },

  // Trust logo images
  {
    name: "trust-logos",
    test: ({ parentContext }) =>
      parentContext.includes("trust-logos") ? { width: 120, height: 40 } : null,
  },

  // Header/footer logos
  {
    name: "header/footer-logo",
    test: ({ parentContext }) =>
      parentContext.includes("header__logo") || parentContext.includes("footer__logo")
        ? { width: 100, height: 32 }
        : null,
  },

  // Feature grid icons
  {
    name: "features-grid icon",
    test: ({ parentContext }) =>
      parentContext.includes("feature-card__icon") || parentContext.includes("features-grid")
        ? { width: 40, height: 40 }
        : null,
  },

  // ── Inline style hints ────────────────────────────────────────────

  // style="height: XXpx"
  {
    name: "inline-height",
    test: ({ imgTag }) => {
      const m = imgTag.match(/style="[^"]*height:\s*(\d+)px/);
      if (m) {
        const h = parseInt(m[1], 10);
        // Estimate width from common aspect ratios
        return { width: Math.round(h * 3), height: h };
      }
      return null;
    },
  },

  // ── Filename-based fallbacks ──────────────────────────────────────

  // Icons (small)
  {
    name: "icon-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/icons\//.test(imgTag) ? { width: 32, height: 32 } : null,
  },

  // Logos
  {
    name: "logo-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/logos\//.test(imgTag) ? { width: 120, height: 40 } : null,
  },

  // Badges
  {
    name: "badge-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/badges\//.test(imgTag) ? { width: 600, height: 500 } : null,
  },

  // Hero images
  {
    name: "hero-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/heroes\//.test(imgTag) ? { width: 960, height: 520 } : null,
  },

  // Venue images
  {
    name: "venue-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/venues\//.test(imgTag) ? { width: 600, height: 400 } : null,
  },

  // Case study images
  {
    name: "case-study-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/case-studies\//.test(imgTag) ? { width: 400, height: 300 } : null,
  },

  // Pattern images (decorative)
  {
    name: "pattern-filename",
    test: ({ imgTag }) =>
      /src="[^"]*\/patterns\//.test(imgTag) ? { width: 1200, height: 400 } : null,
  },

  // G2 badges
  {
    name: "g2-badge",
    test: ({ imgTag }) =>
      /src="[^"]*g2[^"]*badge/i.test(imgTag) || /src="[^"]*winter/i.test(imgTag)
        ? { width: 80, height: 112 }
        : null,
  },

  // Payment logos
  {
    name: "payment-logo",
    test: ({ imgTag }) =>
      /src="[^"]*\/(visa|mastercard|amex|worldpay|stripe|paypal)/i.test(imgTag)
        ? { width: 80, height: 40 }
        : null,
  },
];

// ── HTML Processing ──────────────────────────────────────────────────

/**
 * Extract ~200 chars of context before an img tag to identify parent classes.
 */
function getParentContext(html, imgIndex) {
  const start = Math.max(0, imgIndex - 300);
  return html.substring(start, imgIndex);
}

/**
 * Process a single HTML file: find all <img> tags, apply rules, add dimensions.
 */
function processFile(filePath) {
  let html = fs.readFileSync(filePath, "utf-8");
  let modified = false;
  let count = 0;

  // Match all <img ...> tags
  const imgRegex = /<img\b[^>]*>/gi;
  const replacements = [];

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];
    const imgIndex = match.index;
    const parentContext = getParentContext(html, imgIndex);

    let result = null;
    let ruleName = "";

    for (const rule of rules) {
      result = rule.test({ imgTag, parentContext, filePath });
      if (result === "skip") {
        result = null;
        break;
      }
      if (result) {
        ruleName = rule.name;
        break;
      }
    }

    if (result) {
      // Build new img tag with width/height inserted before the closing >
      let newTag = imgTag;

      // Remove any existing partial width/height
      newTag = newTag.replace(/\s+width\s*=\s*"[^"]*"/gi, "");
      newTag = newTag.replace(/\s+height\s*=\s*"[^"]*"/gi, "");

      // Insert width and height before closing >
      newTag = newTag.replace(
        /\s*\/?>$/,
        ` width="${result.width}" height="${result.height}">`
      );

      if (newTag !== imgTag) {
        replacements.push({ original: imgTag, replacement: newTag, rule: ruleName });
        count++;
      }
    }
  }

  // Apply replacements in reverse order to preserve indices
  for (const { original, replacement } of replacements) {
    html = html.replace(original, replacement);
    modified = true;
  }

  return { html, modified, count };
}

/**
 * Recursively find all .html files in a directory.
 */
function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !["scripts", "node_modules", ".git"].includes(entry.name)) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  const htmlFiles = findHtmlFiles(STATIC_DIR);
  let totalFixed = 0;
  let filesModified = 0;

  console.log(`\n📐 Image Dimension Script`);
  console.log(`   Scanning ${htmlFiles.length} HTML files in ${STATIC_DIR}`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n`);

  for (const filePath of htmlFiles) {
    const { html, modified, count } = processFile(filePath);
    if (modified) {
      const rel = path.relative(STATIC_DIR, filePath);
      console.log(`  ✅ ${rel} — ${count} image(s) fixed`);
      totalFixed += count;
      filesModified++;

      if (!DRY_RUN) {
        fs.writeFileSync(filePath, html, "utf-8");
      }
    }
  }

  console.log(`\n   Done! ${totalFixed} images updated across ${filesModified} files.\n`);
}

main();
