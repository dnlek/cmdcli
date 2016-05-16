import findParentDir from 'find-parent-dir';
import fs from 'fs';

export function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

export function getConfig(file, startDir) {
  return new Promise((resolve) => {
    findParentDir(startDir, file, (err, dir) => {
      if (!err && dir) {
        fs.readFile(`${dir}/${file}`, 'utf8', (rerr, data) =>
          resolve({ data: JSON.parse(data), dir }));
      } else {
        resolve({ data: {}, dir: null });
      }
    });
  });
}
