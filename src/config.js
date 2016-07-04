import findup from 'findup-sync';
import path from 'path';
import { arrayify, requireFn } from './utils';
import * as c from './const';
import os from 'os';
import { debuglog } from './logs';

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
debuglog(`CONFIG: parentDir = ${parentDir}`);
const packageFile = findup('package.json', { cwd: parentDir });
debuglog(`CONFIG: packageFile = ${packageFile}`);
const configFile = findup('.cmdclirc.json', { cwd: parentDir });
debuglog(`CONFIG: configFile = ${configFile}`);

export const configObject = {
  ...requireFn(packageFile, packageFile),
  ...requireFn(configFile, packageFile),
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
