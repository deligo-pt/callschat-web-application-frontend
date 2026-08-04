const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('{app,components}/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to match <img src={variable} ... />
  // We want to avoid matching if it's already getOptimizedImageUrl or getRawMediaUrl
  // Also avoid string literals like <img src="/logo.png"
  
  content = content.replace(/<img[^>]+src=\{([^}]+)\}/g, (match, srcValue) => {
    // Skip if it's already wrapped
    if (srcValue.includes('getOptimizedImageUrl') || srcValue.includes('getRawMediaUrl') || srcValue.startsWith('`') || srcValue.startsWith('"') || srcValue.startsWith("'")) {
      return match;
    }
    
    // Skip if it's known safe blob or base64 (e.g. photoPreview, qrImage, avatarPreview)
    if (srcValue.includes('Preview') || srcValue.includes('qrImage') || srcValue.includes('mediaUrlInput') || srcValue.includes('photoPreview')) {
      return match;
    }

    // Now it's a raw variable like `m.mediaUrl` or `contact.avatarUrl`
    changed = true;
    return match.replace(srcValue, `getOptimizedImageUrl(${srcValue})`);
  });

  if (changed) {
    // Check if getOptimizedImageUrl is imported
    if (!content.includes('getOptimizedImageUrl')) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const nextLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLine + 1) + 'import { getOptimizedImageUrl } from "@/utils/image";\n' + content.slice(nextLine + 1);
      } else {
        content = 'import { getOptimizedImageUrl } from "@/utils/image";\n' + content;
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
