import { arrayify, isPositional, isRequired } from './utils';
import * as c from './const';
import * as prompt from './prompt';
import { debuglog } from './logs';

const BASE_PARSER_CFG = { addHelp: true };

function mapArgparse(id, cfg) {
  const isArgRequired = isRequired(id, cfg);
  return {
    ...(isArgRequired || cfg.action === 'store' && { help: '(default: %(defaultValue)s)' }),
    ...(isArgRequired && { nargs: '?', action: 'store' }),
    ...(!isArgRequired && { action: 'storeTrue' }),
    ...(cfg.isPassword && { action: 'store', nargs: '?', constant: c.EMPTY_PASSWORD }),
    ...cfg,
  };
}

export function *getCommandArgs(command) {
  let params;
  if (typeof command.getArgs === 'function') {
    params = command.getArgs();
  } else if (Array.isArray(command.args)) {
    params = command.args;
  }

  if (params) {
    for (const param of params) {
      const p = arrayify(param);
      const cfg = (p.length > 1 &&
        typeof p[p.length - 1] === 'object' &&
        !Array.isArray(p[p.length - 1])) ?
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
  debuglog(`DEFINE COMMAND =  ${cmdName}`);
  const cmdParserCfg = { ...BASE_PARSER_CFG };
  const command = new CmdCls();
  command.isCommand = true;

  if (typeof command.aliases !== 'undefined') {
    cmdParserCfg.aliases = arrayify(command.aliases).map((alias) => (
      (Array.isArray(alias)) ? alias[0] : alias
    ));
  }

  const cmdParser = parentParser.addParser(cmdName, cmdParserCfg);

  for (const param of getCommandArgs(command)) {
    cmdParser.addArgument(param.id, param.cfg);
  }

  return command;
}

function mapAliases(cmd) {
  return (mem, a) => {
    const alias = arrayify(a);
    return {
      ...mem,
      [alias[0]]: {
        cmd,
        args: alias[1],
      },
    };
  };
}

export function defineNamespace(name, classes, parentParser) {
  debuglog(`DEFINE NAMESPACE =  ${name}`);
  const subparsers = parentParser.addSubparsers({
    title: '',
    dest: name,
  });

  return Object.keys(classes).reduce(
    (mem, cmdName) => {
      const CmdCls = classes[cmdName];
      let cmd;
      if (typeof CmdCls === 'function') {
        cmd = defineCommand(subparsers, cmdName, CmdCls);
      } else {
        const cmdParserCfg = { ...BASE_PARSER_CFG };
        const cmdParser = subparsers.addParser(cmdName, cmdParserCfg);
        cmd = defineNamespace(cmdName, CmdCls, cmdParser);
      }

      return arrayify([cmdName, ...(cmd.aliases || [])]).reduce(mapAliases(cmd), mem);
    },
    {}
  );
}

function checkArgs(parser, cmd, args, config) {
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

export function getCurrentCommand(commands, args) {
  let i = 'root';
  let command = commands[i];
  const path = [i];
  while (command && (!command.cmd || !command.cmd.isCommand)) {
    i = args[i];
    command = command[i] || command.cmd[i];
    path.push(i);
  }
  debuglog(`CALL PATH: ${path.join(', ')}`);
  return command;
}

export function resolve(cmd, config, cmdArgs, parser) {
  let args;
  const command = cmd.cmd;

  if (typeof command.getArgs === 'function' || Array.isArray(command.args)) {
    args = Promise.resolve(config).then((cfg) => checkArgs(parser, command, cmdArgs, cfg));
  }

  return Promise.all([
    Promise.resolve(args),
    Promise.resolve(config),
  ]).then((result) => ({
    command,
    args: { ...result[0], ...cmd.args },
    cfg: result[1],
  }));
}

export function execute(item) {
  // Execute exec function
  Promise.resolve(item.command.exec(item.args, item.cfg))
    .then(results => {
      // Execute print function if available
      if (typeof item.command.print === 'function') {
        item.command.print(results, item.args, item.cfg);
      }
    })
    .catch(err => {
      // Execute local catch function if available
      // Internal command errors handler
      if (typeof item.command.catch === 'function') {
        item.command.catch(err, item.args, item.cfg);
      } else {
        // global commands errors handler
        process.stderr.write(`Error while executing command: ${err}\n`);
      }
    });
}
