import findParentDir from 'find-parent-dir';
import fs from 'fs';

export function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

export function getConfig(file) {
  return new Promise((resolve) => {
    findParentDir(process.cwd(), file, (err, dir) => {
      if (!err && dir) {
        fs.readFile(`${dir}/${file}`, 'utf8', (rerr, data) =>
          resolve({ data: JSON.parse(data), dir }));
      } else {
        resolve({ data: {}, dir: null });
      }
    });
  });
}
