#!/usr/bin/env tsx
/**
 * lint-i18n.ts - i18n Lint Script for Tibyan
 * 
 * Validates:
 * 1. All locale JSON files have identical key sets
 * 2. No hardcoded UI strings in TSX components
 * 3. No ternary locale patterns (isRTL ? '...' : '...')
 * 
 * Usage: npm run lint:i18n
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// TYPES
// ============================================================================

interface Issue {
  file: string;
  line: number;
  column: number;
  type: "hardcoded" | "ternary" | "prop";
  snippet: string;
  suggestion: string;
}

interface LocaleData {
  locale: string;
  keys: Set<string>;
  data: Record<string, unknown>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MESSAGES_DIR = "./messages";
const SRC_DIR = "./src";
const MAX_ISSUES = 200;

// Props that should use translations
const I18N_PROPS = [
  "aria-label",
  "ariaLabel",
  "placeholder",
  "title",
  "helperText",
  "label",
  "alt",
  "description",
];

// Patterns to detect ternary locale switching
const TERNARY_PATTERNS = [
  /isRTL\s*\?\s*["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g,
  /isRtl\s*\?\s*["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g,
  /locale\s*===?\s*["'`]ar["'`]\s*\?\s*["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g,
  /language\s*===?\s*["'`]ar["'`]\s*\?\s*["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g,
];

// Skip these file patterns
const SKIP_FILES = [
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /node_modules/,
  /\.d\.ts$/,
  /lint-i18n\.ts$/,
];

// Skip these text patterns (not real UI text)
const SKIP_TEXT_PATTERNS = [
  /^[\s\d.,;:!?@#$%^&*()_+=\[\]{}|\\/<>~`'"•→←↑↓✓✗★☆●○■□▲△▼▽-]*$/, // Only punctuation/numbers/symbols
  /^[A-Z_][A-Z0-9_]*$/, // CONSTANT_CASE
  /^[a-z]+[A-Z]/, // camelCase (likely variable)
  /^https?:\/\//, // URLs
  /^mailto:/, // Email links
  /^#[0-9a-fA-F]{3,8}$/, // Hex colors
  /^rgba?\(/, // RGB colors
  /^\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms)?$/, // CSS values
  /^[A-Z]{2,3}$/, // Short codes like "US", "EN"
  /^[\u{1F300}-\u{1F9FF}]+$/u, // Emoji only
  /^(true|false|null|undefined)$/i, // Boolean/null literals
  /^(div|span|button|input|form|img|svg|path|a|p|h[1-6])$/i, // HTML tags
  /^(GET|POST|PUT|PATCH|DELETE|OPTIONS)$/i, // HTTP methods
  /^application\/json$/, // MIME types
  /^\s*$/, // Whitespace only
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Flatten nested object keys with dot notation
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Check if text looks like translatable content
 */
function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();
  
  // Too short
  if (trimmed.length < 2) return false;
  
  // Skip patterns
  for (const pattern of SKIP_TEXT_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  
  // Contains Arabic characters - definitely translatable
  if (/[\u0600-\u06FF]/.test(trimmed)) return true;
  
  // Contains multiple English words - likely translatable
  if (/[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(trimmed)) return true;
  
  // Single English word with 4+ letters - might be translatable
  if (/^[a-zA-Z]{4,}$/.test(trimmed)) return true;
  
  // Capitalized word (likely UI label)
  if (/^[A-Z][a-z]+/.test(trimmed)) return true;
  
  return false;
}

/**
 * Get all files recursively
 */
function getFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath: string): boolean {
  return SKIP_FILES.some(pattern => pattern.test(filePath));
}

// ============================================================================
// LOCALE VALIDATION
// ============================================================================

function loadLocales(): LocaleData[] {
  const locales: LocaleData[] = [];
  
  if (!fs.existsSync(MESSAGES_DIR)) {
    console.error(`❌ Messages directory not found: ${MESSAGES_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith(".json"));
  
  for (const file of files) {
    const locale = path.basename(file, ".json");
    const filePath = path.join(MESSAGES_DIR, file);
    
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content) as Record<string, unknown>;
      const keys = new Set(flattenKeys(data));
      
      locales.push({ locale, keys, data });
    } catch (error) {
      console.error(`❌ Failed to parse ${file}: ${error}`);
    }
  }
  
  return locales;
}

function validateLocaleKeys(locales: LocaleData[]): { valid: boolean; missingByLocale: Map<string, string[]> } {
  if (locales.length === 0) {
    return { valid: false, missingByLocale: new Map() };
  }
  
  // Collect all keys from all locales
  const allKeys = new Set<string>();
  for (const locale of locales) {
    for (const key of locale.keys) {
      allKeys.add(key);
    }
  }
  
  // Find missing keys per locale
  const missingByLocale = new Map<string, string[]>();
  
  for (const locale of locales) {
    const missing: string[] = [];
    for (const key of allKeys) {
      if (!locale.keys.has(key)) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      missingByLocale.set(locale.locale, missing);
    }
  }
  
  return {
    valid: missingByLocale.size === 0,
    missingByLocale,
  };
}

// ============================================================================
// SOURCE CODE SCANNING
// ============================================================================

function scanFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNum = lineIndex + 1;
    
    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
    
    // 1. Check for ternary locale patterns
    for (const pattern of TERNARY_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(line)) !== null) {
        issues.push({
          file: filePath,
          line: lineNum,
          column: match.index,
          type: "ternary",
          snippet: match[0].substring(0, 60) + (match[0].length > 60 ? "..." : ""),
          suggestion: "Use useTranslations() hook instead of ternary",
        });
      }
    }
    
    // 2. Check i18n props with hardcoded strings
    for (const prop of I18N_PROPS) {
      // Match prop="string" or prop={'string'} or prop={"string"}
      const propPatterns = [
        new RegExp(`${prop}=["']([^"']{2,})["']`, "g"),
        new RegExp(`${prop}=\\{["'\`]([^"'\`]{2,})["'\`]\\}`, "g"),
      ];
      
      for (const propPattern of propPatterns) {
        propPattern.lastIndex = 0;
        let match;
        while ((match = propPattern.exec(line)) !== null) {
          const text = match[1];
          if (isTranslatableText(text)) {
            issues.push({
              file: filePath,
              line: lineNum,
              column: match.index,
              type: "prop",
              snippet: `${prop}="${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
              suggestion: `Use ${prop}={t("key")} with translation`,
            });
          }
        }
      }
    }
    
    // 3. Check for hardcoded JSX text (between > and <)
    // Look for >text< patterns (JSX children)
    const jsxTextPattern = />([^<>{}\n]+)</g;
    jsxTextPattern.lastIndex = 0;
    let match;
    while ((match = jsxTextPattern.exec(line)) !== null) {
      const text = match[1].trim();
      if (text && isTranslatableText(text)) {
        // Skip if it's a template literal or variable reference
        if (text.includes("{") || text.includes("}")) continue;
        if (text.startsWith("$")) continue;
        
        issues.push({
          file: filePath,
          line: lineNum,
          column: match.index,
          type: "hardcoded",
          snippet: `>${text.substring(0, 40)}${text.length > 40 ? "..." : ""}<`,
          suggestion: "Replace with {t(\"key\")}",
        });
      }
    }
    
    // 4. Check for alert() calls with hardcoded strings
    const alertPattern = /alert\(["'`]([^"'`]+)["'`]\)/g;
    alertPattern.lastIndex = 0;
    while ((match = alertPattern.exec(line)) !== null) {
      const text = match[1];
      if (isTranslatableText(text)) {
        issues.push({
          file: filePath,
          line: lineNum,
          column: match.index,
          type: "hardcoded",
          snippet: `alert("${text.substring(0, 30)}${text.length > 30 ? "..." : ""}")`,
          suggestion: "Replace alert() with toaster + t()",
        });
      }
    }
  }
  
  return issues;
}

function scanSourceFiles(): Issue[] {
  const issues: Issue[] = [];
  const files = getFiles(SRC_DIR, [".ts", ".tsx"]);
  
  for (const file of files) {
    if (shouldSkipFile(file)) continue;
    
    try {
      const fileIssues = scanFile(file);
      issues.push(...fileIssues);
    } catch (error) {
      console.error(`⚠️  Error scanning ${file}: ${error}`);
    }
  }
  
  return issues;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log("\n🌐 Tibyan i18n Lint\n");
  console.log("=".repeat(60) + "\n");
  
  let hasErrors = false;
  
  // 1. Validate locale files
  console.log("📁 Checking locale files...\n");
  const locales = loadLocales();
  console.log(`   Found ${locales.length} locale(s): ${locales.map(l => l.locale).join(", ")}`);
  
  const { valid, missingByLocale } = validateLocaleKeys(locales);
  
  if (!valid) {
    hasErrors = true;
    console.log("\n❌ Missing translation keys:\n");
    for (const [locale, missing] of missingByLocale) {
      console.log(`   ${locale.toUpperCase()} is missing ${missing.length} key(s):`);
      for (const key of missing.slice(0, 10)) {
        console.log(`      - ${key}`);
      }
      if (missing.length > 10) {
        console.log(`      ... and ${missing.length - 10} more`);
      }
      console.log();
    }
  } else {
    console.log("   ✅ All locales have identical key sets\n");
  }
  
  // 2. Scan source files
  console.log("🔍 Scanning source files for hardcoded strings...\n");
  const issues = scanSourceFiles();
  
  if (issues.length > 0) {
    hasErrors = true;
    
    // Group by type
    const byType = {
      hardcoded: issues.filter(i => i.type === "hardcoded"),
      ternary: issues.filter(i => i.type === "ternary"),
      prop: issues.filter(i => i.type === "prop"),
    };
    
    console.log("❌ Found issues:\n");
    console.log(`   Hardcoded strings: ${byType.hardcoded.length}`);
    console.log(`   Ternary patterns:  ${byType.ternary.length}`);
    console.log(`   Untranslated props: ${byType.prop.length}`);
    console.log(`   Total: ${issues.length}\n`);
    
    // Print top issues
    const topIssues = issues.slice(0, MAX_ISSUES);
    console.log("-".repeat(60));
    console.log(`\nTop ${topIssues.length} issues:\n`);
    
    for (const issue of topIssues) {
      const relPath = path.relative(process.cwd(), issue.file);
      console.log(`  ${relPath}:${issue.line}`);
      console.log(`    Type: ${issue.type}`);
      console.log(`    Found: ${issue.snippet}`);
      console.log(`    Fix: ${issue.suggestion}`);
      console.log();
    }
    
    if (issues.length > MAX_ISSUES) {
      console.log(`... and ${issues.length - MAX_ISSUES} more issues\n`);
    }
    
    // Suggestions
    console.log("-".repeat(60));
    console.log("\n💡 Suggestions:\n");
    console.log("   1. Add missing keys to messages/{locale}.json files");
    console.log("   2. Replace hardcoded text with t(\"namespace.key\")");
    console.log("   3. Replace isRTL ternaries with useTranslations() hook");
    console.log("   4. Use aria-label={t(\"key\")} for accessibility props");
    console.log("   5. Replace alert() with toaster.create({ title: t(\"key\") })");
    console.log();
  } else {
    console.log("   ✅ No hardcoded strings detected\n");
  }
  
  // Summary
  console.log("=".repeat(60));
  if (hasErrors) {
    console.log("\n❌ i18n lint failed. Fix issues above.\n");
    process.exit(1);
  } else {
    console.log("\n✅ i18n lint passed!\n");
    process.exit(0);
  }
}

main();
