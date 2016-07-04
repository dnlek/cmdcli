import findParentDir from 'find-parent-dir';
import fs from 'fs';
import path from 'path';

export function isPositional(id) {
  return (!id.some((item) => item.indexOf('-') === 0));
}

export function isRequired(id, cfg) {
  return (cfg.required || isPositional(id));
}

export function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

export function getConfig(file, startDir) {
  return new Promise((resolve) => {
    findParentDir(startDir, file, (err, dir) => {
      if (!err && dir) {
        fs.readFile(`${dir}/${file}`, 'utf8', (rerr, data) =>
          resolve({ data: JSON.parse(data), dir, file: `${dir}/${file}` }));
      } else {
        resolve({ data: {}, dir: null, file: null });
      }
    });
  });
}

function updateConfig(file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${file}`, JSON.stringify(data), 'utf8', err => (err ? reject(err) : resolve()));
  });
}

class Config {
  constructor(config) {
    Object.assign(this, config);
  }

  save() {
    updateConfig(this.configFile, this);
  }
}

export function extendConfig(config, file) {
  const cfg = new Config(config);
  Object.defineProperty(cfg, 'configFile', {
    value: file,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  return cfg;
}

export function loadConfig(global, baseConfig, globalConfigFile, configFile) {
  return Promise.all([
    getConfig(globalConfigFile, path.resolve(process.cwd(), '..')),
    getConfig(configFile, process.cwd()),
  ])
    .then((result) => (global ?
      extendConfig({ ...baseConfig, ...result[0].data }, result[0].file) :
      extendConfig({ ...baseConfig, ...result[0].data, ...result[1].data }, result[1].file))
    );
}
