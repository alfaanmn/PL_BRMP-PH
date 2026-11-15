const fs = require('fs');
const path = require('path');

function walk(dir) {
  let list = [];
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const p = path.join(dir, f);
      const s = fs.statSync(p);
      if (s.isDirectory()) {
        list.push({ type: 'dir', path: p });
        list = list.concat(walk(p));
      } else {
        list.push({ type: 'file', path: p });
      }
    }
  } catch(e) {}
  return list;
}

const items = walk('jurnall/02_BAB_II_TINJAUAN_PUSTAKA');
console.log(JSON.stringify(items, null, 2));

