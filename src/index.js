import 'babel-polyfill';
import inquirer from 'inquirer';
const ArgumentParser = require('argparse').ArgumentParser;
import { getConfig, arrayify, isPositional, isRequired } from './utils';
import micromatch from 'micromatch';
import findup from 'findup-sync';
import path from 'path';
import resolve from 'resolve';
import os from 'os';
import winston from 'winston';

const parentDir = path.dirname(module.parent.filename);
winston.debug(`CONFIG: parentDir = ${parentDir}`);
const packageFile = findup('package.json', { cwd: parentDir });
winston.debug(`CONFIG: packageFile = ${packageFile}`);
const configFile = findup('.cmdclirc.json', { cwd: parentDir });
winston.debug(`CONFIG: configFile = ${configFile}`);
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
const EMPTY_PASSWORD = '__EMPTY__';

let commandsClasses;
LOCAL_FOLDERS.forEach((name) => {
  commandsClasses = {
    ...commandsClasses,
    ...requireFn(name),
  };
});

micromatch(names, pattern).forEach((name) => {
  try {
    winston.debug(`Load command class: ${name}`);
    commandsClasses[name.split('-').pop()] = requireFn(name);
  } catch (e) {
    winston.error(`Error while loading command class: ${name}`);
  }
});

function mapInquirer(id, cfg, config) {
  let ret = {
    name: id[0],
    message: cfg.message || `Select ${cfg.help}`,
    ...(cfg.typeFunction && { filter: cfg.typeFunction }),
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
  } else if (cfg.isPassword) {
    ret = {
      ...ret,
      type: 'password',
      message: cfg.message || `Provide ${cfg.help || cfg.dest}`,
    };
  } else if (cfg.action === 'storeTrue') {
    ret = {
      ...ret,
      type: 'confirm',
      message: cfg.message || `Confirm ${cfg.help || cfg.dest}`,
    };
  } else {
    ret = {
      ...ret,
      type: 'input',
      message: cfg.message || `Provide ${cfg.help || cfg.dest}`,
    };
  }
  return ret;
}

function mapArgparse(id, cfg) {
  const isArgRequired = isRequired(id, cfg);
  return {
    ...(isArgRequired || cfg.action === 'store' && { help: '(default: %(defaultValue)s)' }),
    ...(isArgRequired && { nargs: '?', action: 'store' }),
    ...(!isArgRequired && { action: 'storeTrue' }),
    ...(cfg.isPassword && { action: 'store', const: EMPTY_PASSWORD, nargs: '?' }),
    ...cfg,
  };
}

function argsSelector(cfg) {
  return new Promise((resolveSelector) => {
    inquirer.prompt(cfg).then((answers) => {
      resolveSelector(answers);
    });
  });
}

function checkArgs(cmd, args, config) {
  const cfg = [];
  for (const param of getCommandArgs(cmd)) {
    if (isRequired(param.id, param.cfg) || param.cfg.isPassword) {
      const revealedParam = isPositional(param.id) ?
        parser._getPositional(param.id, param.cfg) :
        parser._getOptional(param.id, param.cfg);

      param.cfg.typeFunction = parser._registryGet('type', param.cfg.type, param.cfg.type);

      const val = args[revealedParam.dest];
      if (val === null || (param.cfg.isPassword && val === EMPTY_PASSWORD)) {
        const promptConfig = mapInquirer(param.id, revealedParam, config);
        winston.debug(`map inquirer: ${param.id} -> `, promptConfig);
        cfg.push(promptConfig);
      }
    }
  }

  return argsSelector(cfg)
    .then(answers => ({
      ...args,
      ...answers,
    }));
}

function defineTopCommand(name, classes, parentParser) {
  const subparsers = parentParser.addSubparsers({
    title: '',
    dest: name,
  });

  return Object.keys(classes).reduce(
    (mem, cmdName) => {
      const cmd = defineCommand(subparsers, cmdName, classes[cmdName]);
      arrayify([cmdName, ...(cmd.aliases || [])]).forEach(alias => (mem[alias] = cmd));

      return mem;
    },
    {}
  );
}

function *getCommandArgs(command) {
  let params;
  if (typeof command.getArgs === 'function') {
    params = command.getArgs();
  } else if (Array.isArray(command.args)) {
    params = command.args;
  }

  if (params) {
    for (const param of params) {
      const p = arrayify(param);
      const cfg = (typeof p[p.length - 1] === 'object') ?
        p.pop() : {};
      const id = (Array.isArray(p[0])) ?
        p[0] : p;

      yield {
        id,
        cfg: mapArgparse(id, cfg),
      };
    }
  }
}

function defineCommand(parentParser, cmdName, CmdCls) {
  let command;
  const cmdParserCfg = { help: true };

  if (typeof CmdCls === 'function') {
    command = new CmdCls();
    command.isCommand = true;

    if (typeof command.aliases !== 'undefined') {
      cmdParserCfg.aliases = arrayify(command.aliases);
    }

    const cmdParser = parentParser.addParser(cmdName, cmdParserCfg);

    for (const param of getCommandArgs(command)) {
      cmdParser.addArgument(param.id, param.cfg);
    }
  } else {
    const cmdParser = parentParser.addParser(cmdName, cmdParserCfg);
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
  defaultValue: false,
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

if (typeof command.getArgs === 'function' || Array.isArray(command.args)) {
  resolvedArgs = config.then((cfg) => checkArgs(command, args, cfg));
}

Promise.all([
  Promise.resolve(resolvedArgs),
  config,
]).then((result) => {
  args = result[0];
  const cfg = result[1];
  Promise.resolve(command.exec(args, cfg))
    .then(results => {
      if (typeof command.print === 'function') {
        command.print(results, args, cfg);
      }
    })
    .catch(err => {
      if (typeof command.catch === 'function') {
        command.catch(err, args, cfg);
      } else {
        process.stderr.write(`Error while executing command: ${err}\n`);
      }
    });
});
