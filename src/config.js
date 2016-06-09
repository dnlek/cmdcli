import findup from 'findup-sync';
import path from 'path';
import winston from 'winston';
import { arrayify } from './utils';
import * as c from './const';
import os from 'os';
import resolve from 'resolve';

// Iterate module parents to find parent npm package
let parentPackage = module.parent;
while (parentPackage != null && parentPackage.filename.indexOf('/cmdcli/lib/') !== -1) {
  parentPackage = parentPackage.parent;
}

// Handle local commands too
if (parentPackage === null) {
  parentPackage = module.parent;
}

const parentDir = path.dirname(parentPackage.filename);
winston.debug(`CONFIG: parentDir = ${parentDir}`);
const packageFile = findup('package.json', { cwd: parentDir });
winston.debug(`CONFIG: packageFile = ${packageFile}`);
const configFile = findup('.cmdclirc.json', { cwd: parentDir });
winston.debug(`CONFIG: configFile = ${configFile}`);

export const requireFn = (name) => {
  // This searches up from the specified package.json file, making sure
  // the config option behaves as expected. See issue #56.
  const src = resolve.sync(name, { basedir: path.dirname(packageFile) });
  return require(src);
};

export const configObject = {
  ...requireFn(packageFile),
  ...requireFn(configFile),
};

export const binEntryPoint = configObject.bin && Object.keys(configObject.bin).length ?
  Object.keys(configObject.bin)[0] :
  null;

export const pattern = arrayify(configObject.commandsPattern || c.DEFAULT_PACKAGE_PATTERN);
const scope = arrayify(configObject.commandsScope || c.DEFAULT_PACKAGE_SCOPE);
export const LOCAL_FOLDERS = arrayify(configObject.localCommands || []);
export const CONFIG_FILE = configObject.configFile || c.DEFAUL_CONFIG_FILE;
export const GLOBAL_CONFIG_FILE = `${os.homedir()}/${CONFIG_FILE}`;
export const BASE_CONFIG = configObject.baseConfig || {};
export const names = scope.reduce((result, prop) => (
  result.concat(Object.keys(configObject[prop] || {}))
), []);
