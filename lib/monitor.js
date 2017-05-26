/**
 * Created by im on 4/24/17.
 */
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var minute = 6e4;

var Monitor = function Monitor() {

    this.instances = [];

    this.aliases = [];

    this.monitorConfig = {
        defaultInterval: minute * 30,
        alertedInterval: minute / 2,
        timeFormat: "DD_MM HH:mm"
    };

    this.config = function (data) {
        if (!data) {
            return this.monitorConfig;
        }

        if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object") {
            throw Error("Unknown config type");
        }
        for (var prop in data) {
            if (prop in this.monitorConfig) {
                this.monitorConfig[prop] = data[prop];
            } else {
                logger.error("Trying to set unknown property -", prop);
            }
        }
    };

    this.register = function (url, onUp, onDown) {
        if (!this._isUrl(url)) {
            throw Error("Invalid url - " + url);
        }

        if (this._isFree(url)) {
            var Instance = require('./Instance');
            var instance = new Instance(url, onUp, onDown, this._getAlias(url));

            this.instances.push(instance);
            logger.log("Added new instance", url);

            instance.runDefaultJob();
            return instance;
        }
    };

    this.remove = function (name) {
        for (var i = 0; i < this.instances.length; i++) {
            var instance = this.instances[i];
            if (instance.alias === name || instance.host === name) {
                instance.stopJob();
                this._removeAlias(instance.alias);
                this.instances.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    this.toInstance = function (name, callback) {
        if (!name) {
            throw Error("name of instance should be specified!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback should be specified!");
        }

        var instance = this.getInstanceByName(name);

        if (!instance) {
            return false;
        }

        callback(instance);
        return true;
    };

    this.getInstanceByName = function (name) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.instances[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var instance = _step.value;

                if (instance.alias === name || instance.url === name) {
                    return instance;
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
    };

    this.getItems = function () {
        return this.instances;
    };

    this.hasItems = function () {
        return this.instances.length > 0;
    };

    this._getAlias = function (input) {
        input = input.replace(/(^\w+:|^)\/\//, '').replace(".", "");

        var pointer = 3,
            name = void 0;

        do {
            name = input.substr(0, pointer++);
        } while (~this.aliases.indexOf(name));

        this.aliases.push(name);

        return name;
    };

    this._removeAlias = function (name) {
        for (var i = 0; i < this.aliases.length; i++) {
            if (this.aliases[i] === name) {
                this.aliases.splice(i, 1);
            }
        }
    };

    this._isFree = function (host) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = this.instances[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var inst = _step2.value;

                if (inst.host === host) {
                    return false;
                }
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

        return true;
    };

    this._isUrl = function (host) {
        return (/^([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(host)
        );
    };
};

var logger = function () {
    var manager = require('simple-log-manager');

    if (process.env.LOG && Boolean(process.env.LOG) === false) {
        return manager.createDummyLogger("monitor");
    }

    if (Boolean(process.env.DEBUG)) {
        return manager.createConsoleLogger("monitor");
    }

    return manager.createFileLogger("monitor", {
        fileNamePattern: "monitor-<DATE>.log",
        dir: process.env.LOG_DIR || require('path').join(__dirname, "..", "logs")
    });
}();

var monitor = new Monitor();

module.exports = {
    config: monitor.config.bind(monitor),
    register: monitor.register.bind(monitor),
    remove: monitor.remove.bind(monitor),
    get: monitor.getInstanceByName.bind(monitor),
    hasItems: monitor.hasItems.bind(monitor),
    getItems: monitor.getItems.bind(monitor),
    getAndCall: monitor.toInstance.bind(monitor)
};
//# sourceMappingURL=monitor.js.map