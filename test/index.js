'use strict';

var path = require('path');
var glob = require('glob');
var Mocha = require('mocha');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespace(path);
var glob__namespace = /*#__PURE__*/_interopNamespace(glob);
var Mocha__default = /*#__PURE__*/_interopDefaultLegacy(Mocha);

const mocha = new Mocha__default['default']({
    ui: 'tdd',
    color: true,
});
const files = glob__namespace.sync('**/*.test.js', {
    cwd: __dirname,
});
files.forEach((file) => mocha.addFile(path__namespace.resolve(__dirname, file)));
mocha.run(() => {
});
