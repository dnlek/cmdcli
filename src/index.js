import 'babel-polyfill';
const ArgumentParser = require('argparse').ArgumentParser;
import { isPositional, isRequired, loadConfig, requireFn } from './utils';
import micromatch from 'micromatch';
import * as c from './const';
import { names, pattern, LOCAL_FOLDERS, configObject, binEntryPoint,
        BASE_CONFIG, GLOBAL_CONFIG_FILE, CONFIG_FILE, packageFile } from './config';
import { logger, debuglog } from './logs';
import complete from './complete';
import * as prompt from './prompt';
import { defineNamespace, getCommandArgs } from './command';

let commandsClasses;
LOCAL_FOLDERS.forEach((name) => {
  commandsClasses = {
    ...commandsClasses,
    ...requireFn(name, packageFile),
  };
});

micromatch(names, pattern).forEach((name) => {
  try {
    debuglog(`Load command class: ${name}`);
    commandsClasses[name.split('-').pop()] = requireFn(name, packageFile);
  } catch (e) {
    process.stderr.write(`Error while loading command class: ${name}\n`);
    process.exit(2);
  }
});

function checkArgs(cmd, args, config) {
  const cfg = [];
  for (const param of getCommandArgs(cmd)) {
    if (isRequired(param.id, param.cfg) || param.cfg.isPassword) {
      const revealedParam = isPositional(param.id) ?
        parser._getPositional(param.id, param.cfg) :
        parser._getOptional(param.id, param.cfg);

      param.cfg.typeFunction = parser._registryGet('type', param.cfg.type, param.cfg.type);
      const val = args[revealedParam.dest];

      if ((val === null && !param.cfg.isPassword) ||
          (param.cfg.isPassword && val === c.EMPTY_PASSWORD)) {
        const promptConfig = prompt.mapArgs(param.id, revealedParam, config);
        cfg.push(promptConfig);
      }
    }
  }

  return prompt.argsSelector(cfg)
    .then(answers => ({
      ...args,
      ...answers,
    }));
}

const parser = new ArgumentParser({
  addHelp: true,
  description: `${configObject.name} // ${configObject.description}`,
});

parser.addArgument(['-g', '--global'], {
  action: 'storeTrue',
  help: 'Use globals only, ignore project configs',
  defaultValue: false,
});

parser.addArgument(['--version'], {
  action: 'version',
  version: `%(prog)s ${configObject.version}`,
});

parser.addArgument(['--verbose', '-v'], {
  action: 'count',
});

parser.addArgument(['--silent'], {
  action: 'storeTrue',
});

const commands = { root: defineNamespace('root', commandsClasses, parser) };

if (!complete(binEntryPoint, commands, parser)) {
  let args = parser.parseArgs();

  if (args.verbose > 0) {
    logger.level = c.LOG_LEVELS[
      Math.min(c.LOG_LEVELS.length - 1,
      c.DEFAULT_LOG_LEVEL + args.verbose)];
  } else {
    logger.level = c.LOG_LEVELS[c.DEFAULT_LOG_LEVEL];
  }

  if (args.silent) {
    logger.level = -1;
  }

  const cmdPath = ['root'];
  let i = 'root';
  let command = commands[i];
  while (!command.isCommand) {
    i = args[i];
    cmdPath.push(i);
    command = command[i];
  }

  const config = loadConfig(args.global, BASE_CONFIG, GLOBAL_CONFIG_FILE, CONFIG_FILE);

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
        // Execute print function if available
        if (typeof command.print === 'function') {
          command.print(results, args, cfg);
        }
      })
      .catch(err => {
        // Execute local catch function if available
        // Internal command errors handler
        if (typeof command.catch === 'function') {
          command.catch(err, args, cfg);
        } else {
          // global commands errors handler
          process.stderr.write(`Error while executing command: ${err}\n`);
        }
      });
  });
}

export {
  logger,
};
