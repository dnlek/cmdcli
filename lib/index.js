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

var _marked = [getCommandArgs].map(regeneratorRuntime.mark);

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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
      message: cfg.message || 'Confirm ' + (cfg.help || cfg.dest)
    });
  } else if (cfg.isPassword) {
    ret = _extends({}, ret, {
      type: 'password',
      message: cfg.message || 'Provide ' + (cfg.help || cfg.dest)
    });
  } else {
    ret = _extends({}, ret, {
      type: 'input',
      message: cfg.message || 'Provide ' + (cfg.help || cfg.dest)
    });
  }
  return ret;
}

function mapArgparse(id, cfg) {
  var isArgRequired = (0, _utils.isRequired)(id, cfg);
  return _extends({}, isArgRequired && { nargs: '?' }, isArgRequired && { action: 'store' }, !isArgRequired && { action: 'storeTrue' }, cfg);
}

function argsSelector(cfg) {
  return new Promise(function (resolveSelector) {
    _inquirer2.default.prompt(cfg).then(function (answers) {
      resolveSelector(answers);
    });
  });
}

function checkArgs(cmd, args, config) {
  var cfg = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = getCommandArgs(cmd)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var param = _step.value;

      if ((0, _utils.isRequired)(param.id, param.cfg)) {
        var revealedParam = (0, _utils.isPositional)(param.id) ? parser._getPositional(param.id, param.cfg) : parser._getOptional(param.id, param.cfg);

        if (args[revealedParam.dest] === null) {
          cfg.push(mapInquirer(param.id, revealedParam, config));
        }
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

function getCommandArgs(command) {
  var params, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, param, p, cfg, id;

  return regeneratorRuntime.wrap(function getCommandArgs$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          params = undefined;

          if (typeof command.getArgs === 'function') {
            params = command.getArgs();
          } else if (Array.isArray(command.args)) {
            params = command.args;
          }

          if (!params) {
            _context.next = 32;
            break;
          }

          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 6;
          _iterator2 = params[Symbol.iterator]();

        case 8:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 18;
            break;
          }

          param = _step2.value;
          p = (0, _utils.arrayify)(param);
          cfg = _typeof(p[p.length - 1]) === 'object' ? p.pop() : {};
          id = Array.isArray(p[0]) ? p[0] : p;
          _context.next = 15;
          return {
            id: id,
            cfg: mapArgparse(id, cfg)
          };

        case 15:
          _iteratorNormalCompletion2 = true;
          _context.next = 8;
          break;

        case 18:
          _context.next = 24;
          break;

        case 20:
          _context.prev = 20;
          _context.t0 = _context['catch'](6);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 24:
          _context.prev = 24;
          _context.prev = 25;

          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }

        case 27:
          _context.prev = 27;

          if (!_didIteratorError2) {
            _context.next = 30;
            break;
          }

          throw _iteratorError2;

        case 30:
          return _context.finish(27);

        case 31:
          return _context.finish(24);

        case 32:
        case 'end':
          return _context.stop();
      }
    }
  }, _marked[0], this, [[6, 20, 24, 32], [25,, 27, 31]]);
}

function defineCommand(parentParser, cmdName, CmdCls) {
  var cmdParser = parentParser.addParser(cmdName, { addHelp: true });
  var command = undefined;
  if (typeof CmdCls === 'function') {
    command = new CmdCls();
    command.isCommand = true;

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = getCommandArgs(command)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var param = _step3.value;

        cmdParser.addArgument(param.id, param.cfg);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
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

if (typeof command.getArgs === 'function' || Array.isArray(command.args)) {
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
  }).catch(function (err) {
    return process.stderr.write('Error while executing command: ' + err);
  });
});