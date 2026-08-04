const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{app,components}/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const needsOptimized = content.includes('getOptimizedImageUrl(') && !content.includes('import {') && !content.includes('getOptimizedImageUrl') || (content.includes('getOptimizedImageUrl') && !content.match(/import.*getOptimizedImageUrl/));
  const needsRaw = content.includes('getRawMediaUrl(') && !content.includes('import {') && !content.includes('getRawMediaUrl') || (content.includes('getRawMediaUrl') && !content.match(/import.*getRawMediaUrl/));

  let importsToAdd = [];
  if (needsOptimized) importsToAdd.push('getOptimizedImageUrl');
  if (needsRaw) importsToAdd.push('getRawMediaUrl');

  if (importsToAdd.length > 0) {
    // Check if there is an existing import from "@/utils/image"
    if (content.includes('from "@/utils/image"')) {
       // Too complex to parse, just add a new import line
       const lastImportIndex = content.lastIndexOf('import ');
       if (lastImportIndex !== -1) {
         const nextLine = content.indexOf('\n', lastImportIndex);
         content = content.slice(0, nextLine + 1) + `import { ${importsToAdd.join(', ')} } from "@/utils/image";\n` + content.slice(nextLine + 1);
       } else {
         content = `import { ${importsToAdd.join(', ')} } from "@/utils/image";\n` + content;
       }
    } else {
       const lastImportIndex = content.lastIndexOf('import ');
       if (lastImportIndex !== -1) {
         const nextLine = content.indexOf('\n', lastImportIndex);
         content = content.slice(0, nextLine + 1) + `import { ${importsToAdd.join(', ')} } from "@/utils/image";\n` + content.slice(nextLine + 1);
       } else {
         content = `import { ${importsToAdd.join(', ')} } from "@/utils/image";\n` + content;
       }
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added imports to ${file}`);
  }
});
