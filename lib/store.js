'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _findParentDir = require('find-parent-dir');

var _findParentDir2 = _interopRequireDefault(_findParentDir);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Store = (function () {
  function Store() {
    _classCallCheck(this, Store);
  }

  _createClass(Store, [{
    key: 'getConfig',
    value: function getConfig(file) {
      return new Promise(function (resolve) {
        (0, _findParentDir2.default)(process.cwd(), file, function (err, dir) {
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
  }]);

  return Store;
})();

exports.default = Store;