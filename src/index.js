import 'babel-polyfill';
import { getLocalCommands, getSubpackagesCommands, loadConfig } from './utils';
import { subpackages, pattern, LOCAL_FOLDERS,
        BASE_CONFIG, GLOBAL_CONFIG_FILE, CONFIG_FILE,
        binEntryPoint, packageDir } from './config';
import { logger } from './logs';
import * as c from './const';
import complete from './complete';
import { defineNamespace, execute, getCurrentCommand } from './command';
import { getParser } from './parser';

const commandsClasses = {
  ...getLocalCommands(LOCAL_FOLDERS, packageDir),
  ...getSubpackagesCommands(subpackages, pattern, packageDir),
};
const parser = getParser();
const commands = { root: defineNamespace('root', commandsClasses, parser) };

if (!complete(binEntryPoint, commands, parser)) {
  const args = parser.parseArgs();

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

  const command = getCurrentCommand(commands, args);
  const config = loadConfig(args.global, BASE_CONFIG, GLOBAL_CONFIG_FILE, CONFIG_FILE);

  execute(command, config, args, parser);
}

export {
  logger,
};
