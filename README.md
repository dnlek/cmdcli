# cmdcli

[![NPM version](https://img.shields.io/npm/v/cmdcli.svg)](https://www.npmjs.org/package/cmdcli)

Module which simplifies building of command line programs with multiple subcommands.
Subcommands can be either stored in local module or referenced as external modules

## How to use

* Create new npm module and add cmdcli as dependency.
```bash
  npm i -S cmdcli
```
* Create `bin/<app_name>` file with the following contents:
```bash
  #!/usr/bin/env node
  process.title = '<APP_NAME>';
  require('../node_modules/cmdcli/lib/index');
```
* Create `.cmdclirc.json` config file
* Add bin entry in package.json

or clone [cmdcli-example project](https://github.com/dnlek/cmdcli-example).

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
  get args() {
    return [
      ['param', {
        help: 'Sample param',
      }],
    ];
  }

  get aliases() {
    return ['co'];
  }

  /**
   * synchronous or asynchronous command execution function
   * args - Arguments parsed from command line - based on getArgs
   * cfg - Application configuration read from config files
   */
  exec(args, cfg) {

    return new Promise((resolve) => {
      resolve();
    })
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
   * Optional errors handling function
   * err - Error message
   * args - Arguments parsed from command line - based on getArgs
   * cfg - Application configuration read from config files
   */
  catch(err, args, cfg) {
    process.stdout.write("Handle execution errors");
  }


}
```

## Params

Each command can have it's own set of positional and optional parameters.
Here is how to define sample list of params:

```javascript
export default class Command {
  get args() {
    return [
      ['one'], // simple positional argument. By default action will be 'store'
      ['-a', '--alpha'], // simple optional argument. By default optional arguments have action 'storeTrue'
      ['-b'],
      [['-c', '--longer']],
      ['param', {
        action: 'store', // set action for param see: https://github.com/nodeca/argparse#action-some-details
        help: 'Sample param', // help will show up in usage and help outputs
        message: 'Please provide param', // message will show up when falling back to inquirer (more to come)
        required: true, // (default: false) Mark optional param as required. Applies only to optional params.
        nargs: '*', // how many times argument can be used.
        isPassword: true, // whether given param is a password. Passwords are hidden with *** when given via prompt
        ...
      }], // we can also apply configuration to each argument
    ];
  }
}
```

## Completions

Completions are handled automatically in bash/zsh and fish environments using [node-tabtab](https://github.com/mklabs/node-tabtab) project.
To activate completion for your program you need to install tabtab script first.
The easiest way to do this is to add following install script to your program:
```json
{
  "scripts": {
    "install": "tabtab install"
  }
}
```
For more info take a look at [tabtab module documentation](https://github.com/mklabs/node-tabtab).

By default completion will be handled for subcommands, optional arguments names and positional arguments with promptChoices parameter defined.
