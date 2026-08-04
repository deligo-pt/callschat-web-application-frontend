const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  content = content.replace(/<video[^>]+src=\{([^}]+)\}/g, (match, srcValue) => {
    if (srcValue.includes('getRawMediaUrl') || srcValue.startsWith('`') || srcValue.startsWith('"') || srcValue.startsWith("'")) {
      return match;
    }
    if (srcValue.includes('Preview') || srcValue.includes('mediaUrlInput')) {
      return match;
    }
    changed = true;
    return match.replace(srcValue, `getRawMediaUrl(${srcValue})`);
  });

  if (changed) {
    if (!content.includes('getRawMediaUrl')) {
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const nextLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLine + 1) + 'import { getRawMediaUrl } from "@/utils/image";\n' + content.slice(nextLine + 1);
      } else {
        content = 'import { getRawMediaUrl } from "@/utils/image";\n' + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

fixFile('components/business/BusinessChannelsModal.tsx');
fixFile('components/chat/MediaGallery.tsx');
fixFile('app/(dashboard)/media/page.tsx');
