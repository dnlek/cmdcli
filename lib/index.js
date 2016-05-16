'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

require('babel-polyfill');

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _utils = require('./utils');

var _micromatch = require('micromatch');

var _micromatch2 = _interopRequireDefault(_micromatch);

var _findupSync = require('findup-sync');

var _findupSync2 = _interopRequireDefault(_findupSync);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ArgumentParser = require('argparse').ArgumentParser;

var parentDir = _path2.default.dirname(module.parent.filename);
var packageFile = (0, _findupSync2.default)('package.json', { cwd: parentDir });
var configFile = (0, _findupSync2.default)('.cmdclirc.json', { cwd: parentDir });
var requireFn = function requireFn(name) {
  // This searches up from the specified package.json file, making sure
  // the config option behaves as expected. See issue #56.
  var src = _resolve2.default.sync(name, { basedir: _path2.default.dirname(packageFile) });
  return require(src);
};

var configObject = _extends({}, requireFn(packageFile), requireFn(configFile));

var pattern = (0, _utils.arrayify)(configObject.commandsPattern || ['cmdcli-*', 'cmd-cli-*']);
var scope = (0, _utils.arrayify)(configObject.commandsScope || ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']);
var LOCAL_FOLDERS = (0, _utils.arrayify)(configObject.localCommands || []);
var CONFIG_FILE = configObject.configFile || '.clirc';
var GLOBAL_CONFIG_FILE = _os2.default.homedir() + '/' + CONFIG_FILE;
var BASE_CONFIG = configObject.baseConfig || {};
var names = scope.reduce(function (result, prop) {
  return result.concat(Object.keys(configObject[prop] || {}));
}, []);

var commandsClasses = undefined;
LOCAL_FOLDERS.forEach(function (name) {
  commandsClasses = _extends({}, commandsClasses, requireFn(name));
});

(0, _micromatch2.default)(names, pattern).forEach(function (name) {
  try {
    commandsClasses[name.split('-').pop()] = requireFn(name);
  } catch (e) {
    console.log('error', e);
  }
});

function mapInquirer(id, cfg, config) {
  var ret = {
    name: id[0],
    message: cfg.message || 'Select ' + cfg.help
  };

  if ((cfg.nargs === '*' || cfg.nargs === '+') && cfg.promptChoices) {
    ret = _extends({}, ret, {
      type: 'checkbox',
      choices: Array.isArray(cfg.promptChoices) ? cfg.promptChoices : cfg.promptChoices.bind(null, config)
    });
  }if (cfg.promptRaw && cfg.promptChoices) {
    ret = _extends({}, ret, {
      type: 'rawList',
      choices: Array.isArray(cfg.promptChoices) ? cfg.promptChoices : cfg.promptChoices.bind(null, config)
    });
  } else if (cfg.promptChoices) {
    ret = _extends({}, ret, {
      type: 'list',
      choices: Array.isArray(cfg.promptChoices) ? cfg.promptChoices : cfg.promptChoices.bind(null, config)
    });
  } else if (cfg.action === 'storeTrue') {
    ret = _extends({}, ret, {
      type: 'confirm',
      message: cfg.message || 'Confirm ' + cfg.help
    });
  } else if (cfg.isPassword) {
    ret = _extends({}, ret, {
      type: 'password',
      message: cfg.message || 'Provide ' + cfg.help
    });
  } else {
    ret = _extends({}, ret, {
      type: 'input',
      message: cfg.message || 'Provide ' + cfg.help
    });
  }
  return ret;
}

function isRequired(arg) {
  return arg[1].required || !arg[0].some(function (item) {
    return item.indexOf('-') === 0;
  });
}

function mapArgparse(id, cfg) {
  return isRequired([id, cfg]) && typeof cfg.nargs === 'undefined' ? _extends({}, cfg, { nargs: '?' }) : cfg;
}

function argsSelector(cfg) {
  return new Promise(function (resolve) {
    _inquirer2.default.prompt(cfg).then(function (answers) {
      resolve(answers);
    });
  });
}

function checkArgs(cmd, args, config) {
  var argsIt = cmd.getArgs();
  var cfg = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = argsIt[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var arg = _step.value;

      if (isRequired(arg) && !args[arg[0]]) {
        cfg.push(mapInquirer(arg[0], arg[1], config));
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return argsSelector(cfg).then(function (answers) {
    return _extends({}, args, answers);
  });
}

function defineTopCommand(name, classes, parentParser) {
  var subparsers = parentParser.addSubparsers({
    title: '',
    dest: name
  });

  return Object.keys(classes).reduce(function (mem, cmdName) {
    return _extends({}, mem, _defineProperty({}, cmdName, defineCommand(subparsers, cmdName, classes[cmdName])));
  }, {});
}

function defineCommand(parentParser, cmdName, CmdCls) {
  var cmdParser = parentParser.addParser(cmdName, { addHelp: true });
  var command = undefined;
  if (typeof CmdCls === 'function') {
    command = new CmdCls();
    command.isCommand = true;

    if (typeof command.getArgs === 'function') {
      var paramsIt = command.getArgs();
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = paramsIt[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var param = _step2.value;

          cmdParser.addArgument(param[0], mapArgparse(param[0], param[1]));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  } else {
    command = defineTopCommand(cmdName, CmdCls, cmdParser);
  }

  return command;
}

var parser = new ArgumentParser({
  version: configObject.version,
  addHelp: true,
  description: configObject.name + ' // ' + configObject.description
});

parser.addArgument(['-g', '--global'], {
  action: 'storeTrue',
  help: 'Use globals only, ignore project configs',
  default: false
});

var commands = { root: defineTopCommand('root', commandsClasses, parser) };

var args = parser.parseArgs();
var cmdPath = ['root'];
var i = 'root';
var command = commands[i];
while (!command.isCommand) {
  i = args[i];
  cmdPath.push(i);
  command = command[i];
}

var config = Promise.all([(0, _utils.getConfig)(GLOBAL_CONFIG_FILE, _path2.default.resolve(process.cwd(), '..')), (0, _utils.getConfig)(CONFIG_FILE, process.cwd())]).then(function (result) {
  return args.global ? _extends({}, BASE_CONFIG, result[0].data) : _extends({}, BASE_CONFIG, result[0].data, result[1].data);
});

var resolvedArgs = args;

if (typeof command.getArgs === 'function') {
  resolvedArgs = config.then(function (cfg) {
    return checkArgs(command, args, cfg);
  });
}

Promise.all([Promise.resolve(resolvedArgs), config]).then(function (result) {
  args = result[0];
  var cfg = result[1];
  Promise.resolve(command.exec(args, cfg)).then(function (results) {
    if (typeof command.print === 'function') {
      command.print(results, args, cfg);
    }
  });
});