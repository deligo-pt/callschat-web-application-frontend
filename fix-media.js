const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix <video src={variable}
  content = content.replace(/<video[^>]+src=\{([^}]+)\}/g, (match, srcValue) => {
    if (srcValue.includes('getRawMediaUrl') || srcValue.startsWith('`') || srcValue.startsWith('"') || srcValue.startsWith("'")) {
      return match;
    }
    changed = true;
    return match.replace(srcValue, `getRawMediaUrl(${srcValue})`);
  });

  // Fix <a href={m.mediaUrl}
  content = content.replace(/href=\{([m|c]\.mediaUrl)\}/g, (match, srcValue) => {
    changed = true;
    return `href={getRawMediaUrl(${srcValue})}`;
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

fixFile('app/(dashboard)/chats/page.tsx');
fixFile('app/(dashboard)/groups/[groupId]/page.tsx');
