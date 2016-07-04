const ArgumentParser = require('argparse').ArgumentParser;
import { configObject } from './config';

export function getParser() {
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

  return parser;
}
