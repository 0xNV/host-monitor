/**
 * Created by im on 4/21/17.
 */
'use strict';

var moment = require("moment");

var config = require('./monitor').config();

var logger = function () {
    var manager = require('simple-log-manager');

    if (process.env.LOG && Boolean(process.env.LOG) === false) {
        return manager.createDummyLogger("instance");
    }

    if (Boolean(process.env.DEBUG)) {
        return manager.createConsoleLogger("instance");
    }
    return manager.createFileLogger("instance", {
        fileNamePattern: "instance-<DATE>.log",
        dir: require('path').join(__dirname, "..", "logs")
    });
}();

var checker = function checker() {
    var _this = this;

    require("is-reachable")(this.host).then(function (reachable) {
        logger.info(moment().format('DD/MMM_HH:mm') + ' | ' + (reachable ? " UP " : "DOWN") + ' | ' + _this.host + ' ');
        var firstCheck = _this.lastStatus === null;
        var wasUp = _this.lastStatus === true;

        if (reachable) {
            if (!wasUp && !firstCheck) {
                _this.lastStatus = true;
                _this.downFrom = null;
                _this.onUp.call(_this);
            }
        } else {
            if (wasUp) {
                _this.downFrom = moment();
            }
            if (firstCheck) {
                _this.onDown.call(_this);

                if (_this.lastStatus !== null) {
                    _this.runAlertedJob();
                }
            }
        }
        _this.lastStatus = reachable;
    });
};

var restartJob = function restartJob(jobFn, interval) {
    if (!jobFn || typeof jobFn !== 'function') {
        throw Error("Invalid job function");
    }

    if (!interval || typeof interval !== 'number') {
        throw Error("Invalid interval");
    }

    logger.log('Started job for ' + this.host + ' with interval ' + interval / 1000 + ' sec');
    this.job.restart(jobFn, interval);
};

function Instance(host, onUp, onDown, alias) {
    if (!host || typeof host !== 'string') {
        throw Error("Host is invalid or not specified");
    }
    if (!onUp || !onDown) {
        throw Error("onUp and onDown callbacks should be specified!");
    }
    var Job = require("./Job");

    this.onUp = onUp;
    this.onDown = onDown;

    this.host = host;
    this.url = host.match(/^http/) ? host : "http://" + host;
    this.alias = alias ? alias : null;

    this.lastStatus = null;
    this.downFrom = null;

    this.job = new Job();
}

Instance.prototype = {
    runDefaultJob: function runDefaultJob() {
        restartJob.apply(this, [checker.bind(this), config.defaultInterval]);
    },

    runAlertedJob: function runAlertedJob() {
        var _this2 = this;

        var counter = 0;

        restartJob.apply(this, [checker.bind(this), config.alertedInterval]);

        this.job.runUntil(function () {
            return counter++ > 120;
        }).onEnd(function () {
            _this2.runDefaultJob();
        });
    },

    isDown: function isDown() {
        return this.downFrom === null ? true : !!this.downFrom;
    },

    getDownDate: function getDownDate() {
        if (this.isDown()) {
            if (this.downFrom === null) {
                return "Never";
            }
            return this.downFrom.format(config.timeFormat);
        }
    },

    getLastCheckDate: function getLastCheckDate() {
        if (this.job.lastCheck) {
            return moment(this.job.lastCheck).format(config.timeFormat);
        }
    },

    getJobStatus: function getJobStatus(detailed) {
        var status = this.job ? this.job.status : null;

        if (typeof status === 'string') {
            return status;
        }

        if (status === null) {
            return "Not started";
        } else if (status === true) {
            var message = "Working";

            if (detailed && this.getLastCheckDate()) {
                message += ' | Last check on: ' + this.getLastCheckDate();
            }
            return message;
        }
    },

    getUpStatus: function getUpStatus(advanced) {
        if (this.lastStatus === null) {
            return "Checking";
        }
        if (!advanced) {
            return this.isDown() ? "DOWN" : "UP";
        }

        return this.isDown() ? 'DOWN | Was up - ' + this.getDownDate() : "UP";
    },

    resumeJob: function resumeJob() {
        this.job.resume();
    },

    stopJob: function stopJob() {
        this.job.stop();
    }
};

module.exports = Instance;
//# sourceMappingURL=Instance.js.map