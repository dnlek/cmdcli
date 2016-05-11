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
