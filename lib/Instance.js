/**
 * Created by im on 4/21/17.
 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var moment = require("moment");

var config = require('./monitor').config();

var Job = require("./Job");

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
        dir: process.env.LOG_DIR || require('path').join(__dirname, "..", "logs")
    });
}();

var checker = function checker() {
    var _this = this;

    require("is-reachable")(this.url).then(function (reachable) {
        logger.info(moment().format('DD/MMM_HH:mm') + ' | ' + (reachable ? " UP " : "DOWN") + ' | ' + _this.url + ' ');
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
            if (firstCheck || wasUp) {
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

var clearUrl = function clearUrl(url) {
    if (url.match(/^<http(.*)\|.*>/)) {
        return url.match(/[^\/>\|]+(?=>$)/i)[0];
    }

    return url.match(/(?:\:\/{2})?([^:\/]+(:\d+)?)(?=\/|$)/i)[1];
};

var Instance = function () {
    function Instance(url, onUp, onDown, alias) {
        _classCallCheck(this, Instance);

        if (!url || typeof url !== 'string') {
            throw Error("Host is invalid or not specified");
        }
        if (!onUp || !onDown) {
            throw Error("onUp and onDown callbacks should be specified!");
        }

        this.onUp = onUp;
        this.onDown = onDown;

        this.url = url;
        this.host = clearUrl(url);
        this.alias = alias ? alias : null;

        this.lastStatus = null;
        this.downFrom = null;

        this.job = new Job();
    }

    _createClass(Instance, [{
        key: 'runDefaultJob',
        value: function runDefaultJob() {
            restartJob.apply(this, [checker.bind(this), config.defaultInterval]);
        }
    }, {
        key: 'runAlertedJob',
        value: function runAlertedJob() {
            var _this2 = this;

            var counter = 0;

            restartJob.apply(this, [checker.bind(this), config.alertedInterval]);

            this.job.runUntil(function () {
                return counter++ > config.alertedCheckCount;
            }).onEnd(function () {
                _this2.runDefaultJob();
            });
        }
    }, {
        key: 'isDown',
        value: function isDown() {
            return this.lastStatus === false;
        }
    }, {
        key: 'getDownDate',
        value: function getDownDate() {
            if (this.isDown()) {
                if (this.downFrom === null) {
                    return "Never";
                }
                return this.downFrom.format(config.timeFormat);
            }
        }
    }, {
        key: 'getLastCheckDate',
        value: function getLastCheckDate() {
            if (this.job.lastCheck) {
                return moment(this.job.lastCheck).format(config.timeFormat);
            }
        }
    }, {
        key: 'getJobStatus',
        value: function getJobStatus(detailed) {
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
        }
    }, {
        key: 'getUpStatus',
        value: function getUpStatus(advanced) {
            if (this.lastStatus === null) {
                return "Checking";
            }
            if (!advanced) {
                return this.isDown() ? "DOWN" : "UP";
            }

            return this.isDown() ? 'DOWN | Was up - ' + this.getDownDate() : "UP";
        }
    }, {
        key: 'resumeJob',
        value: function resumeJob() {
            this.job.resume();
        }
    }, {
        key: 'stopJob',
        value: function stopJob() {
            this.job.stop();
        }
    }]);

    return Instance;
}();

module.exports = Instance;
//# sourceMappingURL=Instance.js.map