/**
 * Theme Generator
 *
 * Converts theme colors from hex to HSL and injects CSS variables
 * into the web application's stylesheet
 */

const fs = require('fs');
const path = require('path');

class ThemeGenerator {
  constructor(industryConfig) {
    this.config = industryConfig;
  }

  /**
   * Convert hex color to HSL
   * @param {string} hex - Hex color code (e.g., "#FF5733")
   * @returns {Object} HSL values {h, s, l}
   */
  hexToHSL(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Generate CSS custom properties from theme config
   * @returns {string} CSS custom properties
   */
  generateCSSVariables() {
    const colors = this.config.theme.colors;
    const primary = this.hexToHSL(colors.primary);
    const secondary = this.hexToHSL(colors.secondary);
    const accent = this.hexToHSL(colors.accent);

    return `  /* Theme Colors - Generated for ${this.config.company.name} */
  --primary: ${primary.h} ${primary.s}% ${primary.l}%;
  --primary-foreground: 0 0% 98%;
  --secondary: ${secondary.h} ${secondary.s}% ${secondary.l}%;
  --secondary-foreground: 0 0% 98%;
  --accent: ${accent.h} ${accent.s}% ${accent.l}%;
  --accent-foreground: 0 0% 98%;`;
  }

  /**
   * Inject theme CSS variables into the web app's index.css
   * @param {string} rootDir - Root directory of the project
   */
  injectThemeCSS(rootDir) {
    const cssPath = path.join(rootDir, 'web', 'src', 'index.css');

    if (!fs.existsSync(cssPath)) {
      console.warn(`Warning: index.css not found at ${cssPath}`);
      return;
    }

    let cssContent = fs.readFileSync(cssPath, 'utf8');

    // Generate CSS variables
    const themeVariables = this.generateCSSVariables();

    // Find the :root selector and replace theme colors
    const rootRegex = /(:root\s*\{[^}]*)(\/\*\s*Theme Colors[^*]*\*\/[^}]*)(--primary:[^;]+;[^}]*--primary-foreground:[^;]+;[^}]*--secondary:[^;]+;[^}]*--secondary-foreground:[^;]+;[^}]*--accent:[^;]+;[^}]*--accent-foreground:[^;]+;)?/s;

    if (rootRegex.test(cssContent)) {
      // Replace existing theme colors
      cssContent = cssContent.replace(rootRegex, `$1${themeVariables}\n`);
    } else {
      // Add theme colors to :root if not present
      cssContent = cssContent.replace(
        /(:root\s*\{)/,
        `$1\n${themeVariables}\n`
      );
    }

    fs.writeFileSync(cssPath, cssContent, 'utf8');
    console.log(`  ✓ Injected theme CSS: ${cssPath}`);
  }

  /**
   * Copy logo and assets to web public directory
   * @param {string} rootDir - Root directory of the project
   */
  copyAssets(rootDir) {
    const themePath = path.join(rootDir, 'config', 'industries', this.config.industry.id, 'theme');
    const publicPath = path.join(rootDir, 'web', 'public', 'industry-assets');

    // Create public assets directory if it doesn't exist
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    // Copy logo if it exists
    const logoPath = path.join(themePath, this.config.theme.logo.replace('assets/', ''));
    if (fs.existsSync(logoPath)) {
      const logoDestPath = path.join(publicPath, path.basename(logoPath));
      fs.copyFileSync(logoPath, logoDestPath);
      console.log(`  ✓ Copied logo: ${logoDestPath}`);
    } else {
      console.warn(`  ⚠ Logo not found: ${logoPath}`);
    }

    // Copy any other assets in the theme directory
    if (fs.existsSync(themePath)) {
      const themeFiles = fs.readdirSync(themePath);
      themeFiles.forEach(file => {
        const filePath = path.join(themePath, file);
        const destPath = path.join(publicPath, file);

        if (fs.statSync(filePath).isFile() && file !== path.basename(logoPath)) {
          fs.copyFileSync(filePath, destPath);
          console.log(`  ✓ Copied asset: ${destPath}`);
        }
      });
    }
  }

  /**
   * Generate all theme-related files
   * @param {string} rootDir - Root directory of the project
   */
  generate(rootDir) {
    console.log(`Generating theme for ${this.config.company.name}...`);

    this.injectThemeCSS(rootDir);
    this.copyAssets(rootDir);

    console.log(`✓ Theme generation complete`);
  }
}

module.exports = ThemeGenerator;
