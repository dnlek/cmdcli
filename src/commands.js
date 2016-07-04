import { arrayify, getCommandArgs } from './utils';

const BASE_PARSER_CFG = { addHelp: true };

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

      return arrayify([cmdName, ...(cmd.aliases || [])])
        .reduce((aliasMem, alias) => ({ ...aliasMem, [alias]: cmd }), mem);
    },
    {}
  );
}
