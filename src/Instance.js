/**
 * Created by im on 4/21/17.
 */
'use strict';

const moment = require("moment");

const config = require('./monitor').config();

const logger = (() => {
    const manager = require('simple-log-manager');

    if (process.env.LOG && Boolean(process.env.LOG) === false) {
        return manager.createDummyLogger("instance");

    }

    if (Boolean(process.env.DEBUG)) {
        return manager.createConsoleLogger("instance");
    }
    return manager.createFileLogger("instance", {
        fileNamePattern: "instance-<DATE>.log",
        dir: require('path').join(__dirname, "..", "logs")
    })
})();

const checker = function () {
    require("is-reachable")(this.host).then(reachable => {
        logger.info(`${moment().format('DD/MMM_HH:mm')} | ${reachable ? " UP " : "DOWN"} | ${this.host} `);
        const firstCheck = this.lastStatus === null;
        const wasUp = this.lastStatus === true;

        if (reachable) {
            if (!wasUp && !firstCheck) {
                this.lastStatus = true;
                this.downFrom = null;
                this.onUp.call(this);
            }
        } else {
            if (wasUp) {
                this.downFrom = moment();
            }
            if (firstCheck || wasUp) {
                this.onDown.call(this);

                if (this.lastStatus !== null) {
                    this.runAlertedJob();
                }
            }
        }
        this.lastStatus = reachable;
    });
};

const restartJob = function (jobFn, interval) {
    if (!jobFn || typeof jobFn !== 'function') {
        throw Error("Invalid job function");
    }

    if (!interval || typeof interval !== 'number') {
        throw Error("Invalid interval");
    }

    logger.log(`Started job for ${this.host} with interval ${interval/1000} sec`);
    this.job.restart(jobFn, interval);
};

function Instance (host, onUp, onDown, alias) {
    if (!host || typeof host !== 'string') {
        throw Error ("Host is invalid or not specified");
    }
    if (!onUp || !onDown) {
        throw Error ("onUp and onDown callbacks should be specified!");
    }
    const Job = require("./Job");

    this.onUp = onUp;
    this.onDown = onDown;

    this.host = host;
    this.url = host.match(/^http/) ? host : "http://"+host;
    this.alias = alias ? alias : null;

    this.lastStatus = null;
    this.downFrom = null;

    this.job = new Job();
}

Instance.prototype = {
    runDefaultJob: function () {
        restartJob.apply(this, [checker.bind(this), config.defaultInterval]);
    },

    runAlertedJob: function () {
        let counter = 0;

        restartJob.apply(this, [checker.bind(this), config.alertedInterval]);

        this.job
            .runUntil(() => {
                return counter++ > 120;
            })
            .onEnd(() => {
                this.runDefaultJob();
            });
    },

    isDown: function () {
        return this.lastStatus === false;
    },

    getDownDate: function () {
        if (this.isDown()) {
            if (this.downFrom === null) {
                return "Never";
            }
            return this.downFrom.format(config.timeFormat);
        }
    },

    getLastCheckDate: function () {
        if (this.job.lastCheck) {
            return moment(this.job.lastCheck).format(config.timeFormat);
        }
    },

    getJobStatus: function (detailed) {
        const status = this.job ? this.job.status : null;

        if (typeof status === 'string') {
            return status;
        }

        if (status === null) {
            return "Not started";
        } else if (status === true) {
            let message = "Working";

            if (detailed && this.getLastCheckDate()) {
                message += ` | Last check on: ${this.getLastCheckDate()}`;
            }
            return message;
        }
    },

    getUpStatus: function (advanced) {
        if (this.lastStatus === null) {
            return "Checking";
        }
        if (!advanced) {
            return this.isDown() ? "DOWN" : "UP";
        }

        return this.isDown() ? `DOWN | Was up - ${this.getDownDate()}` : "UP";
    },

    resumeJob: function () {
        this.job.resume();
    },

    stopJob: function () {
        this.job.stop();
    }
};


module.exports = Instance;
