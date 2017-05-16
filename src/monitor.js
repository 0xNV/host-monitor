/**
 * Created by im on 4/24/17.
 */
'use strict';
const minute = 6e4;

const Monitor = function () {

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

        if (typeof data !== "object") {
            throw Error ("Unknown config type")
        }
        for (const prop in data) {
            if (prop in this.monitorConfig) {
                this.monitorConfig[prop] = data[prop];
            } else {
                logger.error("Trying to set unknown property -", prop);
            }
        }
    };

    this.register = function (name, onUp, onDown) {
        const host = this._clearUrl(name);

        if (!this._isHost(host)) {
            throw Error ("Invalid url - "+host);
        }

        if (this._isFree(host)) {
            const Instance = require('./Instance');
            const instance = new Instance(host, onUp, onDown, this._getAlias(name));

            this.instances.push(instance);
            logger.log("Added new instance", host);

            instance.runDefaultJob();
            return instance;
        }
    };

    this.remove = function (name) {
        for (let i = 0; i < this.instances.length; i++) {
            const instance = this.instances[i];
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
                throw Error ("name of instance should be specified!");
            }

            if (typeof callback !== 'function') {
                throw Error ("callback should be specified!");
            }

            name = this._clearUrl(name);

            const instance = this.getInstanceByName(name);

            if (!instance) {
                return false;
            }

            callback(instance);
            return true;
    };

    this.getInstanceByName = function (name) {
        for (const instance of this.instances) {
            if (instance.alias === name || instance.host === name) {
                return instance;
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

        let pointer = 3,
            name;

        do {
            name = input.substr(0, pointer++);
        } while (~this.aliases.indexOf(name));

        this.aliases.push(name);

        return name;
    };

    this._removeAlias = function (name) {
        for (let i=0; i < this.aliases.length; i++) {
            if (this.aliases[i] === name) {
                this.aliases.splice(i, 1);
            }
        }
    };

    this._isFree = function (host) {
        for (const inst of this.instances) {
            if (inst.host === host) {
                return false;
            }
        }
        return true;
    };

    this._clearUrl = function (url) {
        if (url && url.match(/http/)) {
            if (url.match(/^<http/)) {
                if (url.match(/^<http(.*)\|.*>/)) {
                    url = url.split(/<|\||>/)[2];
                } else {
                    url = url.replace(/<|>/g, '');
                }
            }
        }
        return url.replace(/(^\w+:|^)\/\//g, '')
    };

    this._isHost = function (host) {
        return /^([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(host);
    }
};

const logger = (() => {
    const manager = require('simple-log-manager');

    if (process.env.LOG && Boolean(process.env.LOG) === false) {
        return manager.createDummyLogger("monitor");
    }

    if (Boolean(process.env.DEBUG)) {
        return manager.createConsoleLogger("monitor");
    }

    return manager.createFileLogger("monitor", {
        fileNamePattern: "monitor-<DATE>.log",
        dir: require('path').join(__dirname, "..", "logs")
    })
})();

const monitor = new Monitor();

module.exports = {
    config: monitor.config.bind(monitor),
    register: monitor.register.bind(monitor),
    remove: monitor.remove.bind(monitor),
    get: monitor.getInstanceByName.bind(monitor),
    hasItems: monitor.hasItems.bind(monitor),
    getItems: monitor.getItems.bind(monitor),
    getAndCall: monitor.toInstance.bind(monitor)
};