import tabtab from 'tabtab';
import { getCommandArgs, isPositional, loadConfig } from './utils';
import { BASE_CONFIG, GLOBAL_CONFIG_FILE, CONFIG_FILE } from './config';

export default function complete(binEntryPoint, commands, parser) {
  const tab = tabtab({
    name: binEntryPoint,
    cache: false,
  });

  function handleCompletion(data, done) {
    const items = data.line.trim().split(' ');
    let cmdPos = items[0].length + 1;
    items.splice(0, 1);
    let i = 0;

    let cmd = commands.root;
    while (i < items.length && !cmd.isCommand) {
      const cmdName = items[i++];
      cmdPos += cmdName.length + 1;
      if (cmd.hasOwnProperty(cmdName)) {
        cmd = cmd[cmdName];
      } else {
        // probably param ...
        break;
      }
    }
    if (cmd.isCommand) {
      let params = [];
      const args = parser.parseKnownArgs(items);
      const config = loadConfig(args.global, BASE_CONFIG, GLOBAL_CONFIG_FILE, CONFIG_FILE);

      for (const param of getCommandArgs(cmd)) {
        const isPosition = isPositional(param.id);
        const revealedParam = isPosition ?
          parser._getPositional(param.id, param.cfg) :
          parser._getOptional(param.id, param.cfg);

        const val = args[0][revealedParam.dest];
        if (!isPosition) {
          params = [...params, ...revealedParam.optionStrings];
        }

        // positional + value null + promptChoices
        // TODO handle only current positional
        if (isPosition &&
            (typeof val === 'undefined' || val === null) &&
            revealedParam.promptChoices) {
          params = [...params, ...revealedParam.promptChoices.call(null, config)];
        }

        // optional + action: store + before current position
      }

      done(null, params);
    } else {
      done(null, Object.keys(cmd));
    }
  }

  tab.on(binEntryPoint, handleCompletion);
  tab.start();

  return tab.env.complete;
}
