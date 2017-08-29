/**
 * Created by im on 4/21/17.
 */
'use strict';

const moment = require("moment");

const config = require('./monitor').config();

const Job = require("./Job");
const logger = (() => {
    const manager = require('simple-log-manager');

    if (process.env.LOG && process.env.LOG === 'false') {
        return manager.createDummyLogger("instance");

    }

    if (Boolean(process.env.DEBUG)) {
        return manager.createConsoleLogger("instance");
    }
    return manager.createFileLogger("instance", {
        fileNamePattern: "instance-<DATE>.log",
        dir: process.env.LOG_DIR || require('path').join(__dirname, "..", "logs")
    })
})();

const checker = function () {
    require("is-reachable")(this.url).then(reachable => {
        logger.info(`${moment().format('DD/MMM_HH:mm')} | ${reachable ? " UP " : "DOWN"} | ${this.url} `);
        const firstCheck = this.lastStatus === null;
        const wasUp = this.lastStatus === true;

        if (reachable) {
            if (!wasUp && !firstCheck) {
                this.lastStatus = true;
                this.downFromDate = null;
                this.onUp.call(this);
                this.runDefaultJob();
            }
            this.wasUpDate = moment();
        } else {
            if (wasUp) {
                this.downFromDate = moment();
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

const clearUrl =  function  (url) {
    if (url.match(/^<http(.*)\|.*>/)) {
        return url.match(/[^\/>\|]+(?=>$)/i)[0]
    }

    return url.match(/(?:\:\/{2})?([^:\/]+(:\d+)?)(?=\/|$)/i)[1]
};

class Instance {
    constructor (url, onUp, onDown, alias) {
        if (!url || typeof url !== 'string') {
            throw Error ("Host is invalid or not specified");
        }
        if (!onUp || !onDown) {
            throw Error ("onUp and onDown callbacks should be specified!");
        }

        this.onUp = onUp;
        this.onDown = onDown;

        this.url = url;
        this.host = clearUrl(url);
        this.alias = alias ? alias : null;

        this.lastStatus = null;
        this.downFromDate = null;
        this.wasUpDate = null;

        this.job = new Job();
    }

    runDefaultJob () {
        restartJob.apply(this, [checker.bind(this), config.defaultInterval]);
    }

    runAlertedJob () {
        let counter = 0;

        restartJob.apply(this, [checker.bind(this), config.alertedInterval]);

        this.job
            .runUntil(() => {
                return counter++ > config.alertedCheckCount;
            })
            .onEnd(null, () => {
                this.runDefaultJob();
            });
    }

    isDown () {
        return this.lastStatus === false;
    }

    getUpDateFormatted () {
        if (this.wasUpDate === null) {
            return "Never";
        }
        return this.wasUpDate.format(config.timeFormat);
    }

    getDownDateFormatted () {
        if (this.isDown()) {
            if (this.downFromDate === null) {
                return "Never";
            }
            return this.downFromDate.format(config.timeFormat);
        }
    }

    getLastCheckDate () {
        if (this.job.lastCheck) {
            return moment(this.job.lastCheck).format(config.timeFormat);
        }
    }

    getJobStatus (detailed) {
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
    }

    getUpStatus (advanced) {
        if (this.lastStatus === null) {
            return "Checking";
        }
        if (!advanced) {
            return this.isDown() ? "DOWN" : "UP";
        }

        return this.isDown() ? `DOWN | Was up - ${this.getDownDateFormatted()}` : "UP";
    }

    resumeJob () {
        this.job.resume();
    }

    stopJob () {
        this.job.stop();
    }
}

module.exports = Instance;
