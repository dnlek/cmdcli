# cmdcli

Module which simplifies building of command line programs with multiple subcommands.
Subcommands can be wither stored in local module or referenced as external modules

## How to use

* Create new npm module and add cmdcli as dependency.
```bash
  npm i -S git+https://git@github.com:dnlek/cmdcli.git
```
* Create `bin/<app_name>` file with the following contents:
```bash
  #!/usr/bin/env node
  process.title = '<APP_NAME>';
  require('../node_modules/cmdcli/lib/index');
```
* Create `.cmdclirc` config file
* Add bin entry in package.json

## Configuration:

commandsPattern (default: `['cmdcli-*', 'cmd-cli-*']`)  
Pattern used to find subcommands in project dependencies. All packages which will match the pattern will be included as subcommands.

commandsScope (default: `['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']`)  
Where to look for subcommands modules

localCommands (default: `[]`)  
Where to look for local submodules with subcommands. Local subcommands will be included without top level command.

configFile (default: `.clirc`)  
What is the name of application config file. By default library will locate this file in home folder and first one found while traversing up folders structure.

baseConfig (default: `{}`)  
Base config object which will be overwritten by config files.

## Commands:

Sample command could look like this:
```javascript
export default class Command {
  /**
   * Pass all arguments to cmdcli
   */
  getArgs() {
    return [
      [['param'], {
        action: 'store',
        help: 'Sample param',
      }],
    ];
  }

  /**
   * Optional print results function
   * results - results passed from exec function
   * args - Arguments parsed from command line - based on getArgs
   * cfg - Application configuration read from config files
   */
  print(results, args, cfg) {
    process.stdout.write("Print output from the exec command");
  }

  /**
   * syncronous or asynchronous command execution function
   * args - Arguments parsed from command line - based on getArgs
   * cfg - Application configuration read from config files
   */
  exec(args, cfg) {

    return new Promise((resolve) => {
      resolve();
    })
  }
}
```
