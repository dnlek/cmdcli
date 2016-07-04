import { arrayify, isRequired } from './utils';
import * as c from './const';

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
  const cmdParserCfg = { ...BASE_PARSER_CFG };
  const command = new CmdCls();
  command.isCommand = true;

  if (typeof command.aliases !== 'undefined') {
    cmdParserCfg.aliases = arrayify(command.aliases);
  }

  const cmdParser = parentParser.addParser(cmdName, cmdParserCfg);

  for (const param of getCommandArgs(command)) {
    cmdParser.addArgument(param.id, param.cfg);
  }

  return command;
}

export function defineNamespace(name, classes, parentParser) {
  console.log('defineNamespace', name, typeof parentParser);
  const subparsers = parentParser.addSubparsers({
    title: '',
    dest: name,
  });

  return Object.keys(classes).reduce(
    (mem, cmdName) => {
      console.log('def command', cmdName);
      const CmdCls = classes[cmdName];
      let cmd;
      if (typeof CmdCls === 'function') {
        cmd = defineCommand(subparsers, cmdName, CmdCls);
      } else {
        const cmdParserCfg = { ...BASE_PARSER_CFG };
        const cmdParser = subparsers.addParser(cmdName, cmdParserCfg);
        cmd = defineNamespace(cmdName, CmdCls, cmdParser);
      }

      return arrayify([cmdName, ...(cmd.aliases || [])])
        .reduce((aliasMem, alias) => ({ ...aliasMem, [alias]: cmd }), mem);
    },
    {}
  );
}
