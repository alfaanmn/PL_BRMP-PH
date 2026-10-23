import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      results.push({ fullPath, relPath: path.relative('jurnall', fullPath), file, size: stat.size });
    }
  });
  return results;
}

const files = getFiles('jurnall');
console.log(JSON.stringify(files, null, 2));
