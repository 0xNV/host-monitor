/**
 * Created by im on 4/24/17.
 */
'use strict';

const runner = function (first) {
    this.timeoutId = setTimeout(() => {
        isFunction(this.mainFn) && this.mainFn();

        this.lastCheck = new Date();
        // when untilFn() returns true, call endFn and stop the runner
        if (isFunction(this.runUntilFn) && this.runUntilFn() === true) {
            isFunction(this.onEndFn) && this.onEndFn();
            this.stop();
            this.status = "Ended";

            isFunction(this.afterEndFn) && this.afterEndFn();

            return;
        }

        if (isFunction(this.pauseWhenFn) && this.pauseWhenFn() === true) {
            setTimeout(() => {
                runner.call(this);
            }, this.pauseInterval || 10);


            isFunction(this.whenPausedFn) && this.whenPausedFn();

            return;
        }
        runner.call(this);
    }, first ? 10 : (this.mainInterval || 10));
};

const isFunction = function (val) {
    return Object.prototype.toString.call(val) === '[object Function]';
};

const isInt = function (val) {
    return Number.isInteger(val);
};

function Job () {
    this.reset();
}

Job.prototype = {
    reset: function () {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        this.status = false;
        this.lastCheck = null;
        
        this.mainInterval = null;
        this.pauseInterval = null;
        
        this.mainFn = null;
        this.runUntilFn = null;
        this.onEndFn = null;
        this.afterEndFn = null;
        this.pauseWhenFn = null;

        return this;
    },
    
    start: function () {
        this.restart.apply(this, arguments);
        return this;
    },

    restart: function (jobFn, interval) {
        if (!isFunction(jobFn)) {
            throw Error("Invalid job func. Not started");
        }

        if (!isInt(interval)) {
            throw Error("Invalid interval fro job!");
        }

        if (this.status) {
            this.reset();
        }

        this.mainFn = jobFn;
        this.mainInterval = interval;

        this.status = true;
        runner.call(this, true);

        return this;
    },
    /**
     * resume stopped runner
     */
    resume: function () {
        if (this.status === "Stopped") {
            this.status = true;
            runner.call(this);
        }

        return this;
    },


    /**
     * stop runner
     */
    stop: function () {
        clearTimeout(this.timeoutId);
        this.status = "Stopped";
        return this;
    },

    /**
     * freeze for <time> when <callback> returns true
     */
    pauseWhen: function(callback, time) {
        if (!isFunction(callback)) {
            return console.log("Invalid pauseWhen function");
        }

        if (!isInt(time)) {
            return console.log("Invalid time for pauseWhen");
        }

        this.pauseWhenFn = callback;
        this.pauseInterval = time;
        return this;
    },

    /**
     * call the specified function when paused
     */
    whenPaused: function(callback) {
        if (!isFunction(callback)) {
            return console.log("Invalid whenPaused function");
        }

        this.whenPausedFn = callback;
        return this;
    },

    /**
     * stop running when untilFn() returns true
     */
    runUntil: function(callback) {
        if (!isFunction(callback)) {
            return console.log("Invalid runUntill function");
        }

        this.runUntilFn = callback;
        return this;
    },

    /**
     * call the handler after runner stopped
     */
    onEnd: function(endCallback, afterEndCallback) {
        if (endCallback) {
            if (!isFunction(endCallback)) {
                return console.log("Invalid onEnd function");
            }
            this.onEndFn = endCallback;
        }

        if (afterEndCallback) {
            if (!isFunction(afterEndCallback)) {
                return console.log("Invalid onEnd function");
            }
            this.afterEndFn = afterEndCallback;
        }

        return this;
    }

};

module.exports = Job;
