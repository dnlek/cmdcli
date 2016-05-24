'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPositional = isPositional;
exports.isRequired = isRequired;
exports.arrayify = arrayify;
exports.getConfig = getConfig;

var _findParentDir = require('find-parent-dir');

var _findParentDir2 = _interopRequireDefault(_findParentDir);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isPositional(id) {
  return !id.some(function (item) {
    return item.indexOf('-') === 0;
  });
}

function isRequired(id, cfg) {
  return cfg.required || isPositional(id);
}

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

function getConfig(file, startDir) {
  return new Promise(function (resolve) {
    (0, _findParentDir2.default)(startDir, file, function (err, dir) {
      if (!err && dir) {
        _fs2.default.readFile(dir + '/' + file, 'utf8', function (rerr, data) {
          return resolve({ data: JSON.parse(data), dir: dir });
        });
      } else {
        resolve({ data: {}, dir: null });
      }
    });
  });
}