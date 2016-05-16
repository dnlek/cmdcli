import 'babel-polyfill';
import inquirer from 'inquirer';
const ArgumentParser = require('argparse').ArgumentParser;
import { getConfig, arrayify } from './utils';
import micromatch from 'micromatch';
import findup from 'findup-sync';
import path from 'path';
import resolve from 'resolve';
import os from 'os';

const parentDir = path.dirname(module.parent.filename);
const packageFile = findup('package.json', { cwd: parentDir });
const configFile = findup('.cmdclirc.json', { cwd: parentDir });
const requireFn = (name) => {
  // This searches up from the specified package.json file, making sure
  // the config option behaves as expected. See issue #56.
  const src = resolve.sync(name, { basedir: path.dirname(packageFile) });
  return require(src);
};

const configObject = {
  ...requireFn(packageFile),
  ...requireFn(configFile),
};

const pattern = arrayify(configObject.commandsPattern || ['cmdcli-*', 'cmd-cli-*']);
const scope = arrayify(configObject.commandsScope ||
  ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']);
const LOCAL_FOLDERS = arrayify(configObject.localCommands || []);
const CONFIG_FILE = configObject.configFile || '.clirc';
const GLOBAL_CONFIG_FILE = `${os.homedir()}/${CONFIG_FILE}`;
const BASE_CONFIG = configObject.baseConfig || {};
const names = scope.reduce((result, prop) => (
  result.concat(Object.keys(configObject[prop] || {}))
), []);

let commandsClasses;
LOCAL_FOLDERS.forEach((name) => {
  commandsClasses = {
    ...commandsClasses,
    ...requireFn(name),
  };
});

micromatch(names, pattern).forEach((name) => {
  try {
    commandsClasses[name.split('-').pop()] = requireFn(name);
  } catch (e) {
    console.log('error', e);
  }
});

function mapInquirer(id, cfg, config) {
  let ret = {
    name: id[0],
    message: cfg.message || `Select ${cfg.help}`,
  };

  if ((cfg.nargs === '*' || cfg.nargs === '+') && cfg.promptChoices) {
    ret = {
      ...ret,
      type: 'checkbox',
      choices: Array.isArray(cfg.promptChoices) ?
        cfg.promptChoices : cfg.promptChoices.bind(null, config),
    };
  } if (cfg.promptRaw && cfg.promptChoices) {
    ret = {
      ...ret,
      type: 'rawList',
      choices: Array.isArray(cfg.promptChoices) ?
        cfg.promptChoices : cfg.promptChoices.bind(null, config),
    };
  } else if (cfg.promptChoices) {
    ret = {
      ...ret,
      type: 'list',
      choices: Array.isArray(cfg.promptChoices) ?
        cfg.promptChoices : cfg.promptChoices.bind(null, config),
    };
  } else if (cfg.action === 'storeTrue') {
    ret = {
      ...ret,
      type: 'confirm',
      message: cfg.message || `Confirm ${cfg.help}`,
    };
  } else if (cfg.isPassword) {
    ret = {
      ...ret,
      type: 'password',
      message: cfg.message || `Provide ${cfg.help}`,
    };
  } else {
    ret = {
      ...ret,
      type: 'input',
      message: cfg.message || `Provide ${cfg.help}`,
    };
  }
  return ret;
}

function isRequired(arg) {
  return (arg[1].required || !arg[0].some((item) => item.indexOf('-') === 0));
}

function mapArgparse(id, cfg) {
  return (isRequired([id, cfg]) && typeof cfg.nargs === 'undefined') ?
    { ...cfg, nargs: '?' } : cfg;
}

function argsSelector(cfg) {
  return new Promise((resolve) => {
    inquirer.prompt(cfg).then((answers) => {
      resolve(answers);
    });
  });
}


function checkArgs(cmd, args, config) {
  const argsIt = cmd.getArgs();
  const cfg = [];
  for (const arg of argsIt) {
    if (isRequired(arg) && !args[arg[0]]) {
      cfg.push(mapInquirer(arg[0], arg[1], config));
    }
  }

  return argsSelector(cfg).then((answers) => ({
    ...args,
    ...answers,
  }));
}

function defineTopCommand(name, classes, parentParser) {
  const subparsers = parentParser.addSubparsers({
    title: '',
    dest: name,
  });

  return Object.keys(classes).reduce((mem, cmdName) => (
    { ...mem, [cmdName]: defineCommand(subparsers, cmdName, classes[cmdName]) }), {});
}

function defineCommand(parentParser, cmdName, CmdCls) {
  const cmdParser = parentParser.addParser(cmdName, { addHelp: true });
  let command;
  if (typeof CmdCls === 'function') {
    command = new CmdCls();
    command.isCommand = true;

    if (typeof command.getArgs === 'function') {
      const paramsIt = command.getArgs();
      for (const param of paramsIt) {
        cmdParser.addArgument(param[0], mapArgparse(param[0], param[1]));
      }
    }
  } else {
    command = defineTopCommand(cmdName, CmdCls, cmdParser);
  }

  return command;
}

const parser = new ArgumentParser({
  version: configObject.version,
  addHelp: true,
  description: `${configObject.name} // ${configObject.description}`,
});

parser.addArgument(['-g', '--global'], {
  action: 'storeTrue',
  help: 'Use globals only, ignore project configs',
  default: false,
});

const commands = { root: defineTopCommand('root', commandsClasses, parser) };

let args = parser.parseArgs();
const cmdPath = ['root'];
let i = 'root';
let command = commands[i];
while (!command.isCommand) {
  i = args[i];
  cmdPath.push(i);
  command = command[i];
}

const config = Promise.all([
  getConfig(GLOBAL_CONFIG_FILE, path.resolve(process.cwd(), '..')),
  getConfig(CONFIG_FILE, process.cwd()),
]).then((result) => (args.global ?
    { ...BASE_CONFIG, ...result[0].data } :
    { ...BASE_CONFIG, ...result[0].data, ...result[1].data })
);

let resolvedArgs = args;

if (typeof command.getArgs === 'function') {
  resolvedArgs = config.then((cfg) => checkArgs(command, args, cfg));
}

Promise.all([
  Promise.resolve(resolvedArgs),
  config,
]).then((result) => {
  args = result[0];
  const cfg = result[1];
  Promise.resolve(command.exec(args, cfg)).then((results) => {
    if (typeof command.print === 'function') {
      command.print(results, args, cfg);
    }
  });
});
