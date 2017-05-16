/**
 * Created by im on 4/24/17.
 */
'use strict';

var runner = function runner(first) {
    var _this = this;

    this.timeoutId = setTimeout(function () {
        isFunction(_this.mainFn) && _this.mainFn();

        _this.lastCheck = new Date();
        // when untilFn() returns true, call endFn and stop the runner
        if (isFunction(_this.runUntilFn) && _this.runUntilFn() === true) {
            isFunction(_this.onEndFn) && _this.onEndFn();
            _this.stop();
            _this.status = "Ended";
            return;
        }

        if (isFunction(_this.pauseWhenFn) && _this.pauseWhenFn() === true) {
            setTimeout(function () {
                runner.call(_this);
            }, _this.pauseInterval || 10);

            isFunction(_this.whenPausedFn) && _this.whenPausedFn();

            return;
        }
        runner.call(_this);
    }, first ? 10 : this.mainInterval || 10);
};

var isFunction = function isFunction(val) {
    return Object.prototype.toString.call(val) === '[object Function]';
};

var isInt = function isInt(val) {
    return Number.isInteger(val);
};

function Job() {
    this.reset();
}

Job.prototype = {
    reset: function reset() {
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
        this.pauseWhenFn = null;

        return this;
    },

    start: function start() {
        this.restart.apply(this, arguments);
        return this;
    },

    restart: function restart(jobFn, interval) {
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
    resume: function resume() {
        if (this.status == "Stopped") {
            this.status = true;
            runner.call(this);
        }

        return this;
    },

    /**
     * stop runner
     */
    stop: function stop() {
        clearTimeout(this.timeoutId);
        this.status = "Stopped";
        return this;
    },

    /**
     * freeze for <time> when <callback> returns true
     */
    pauseWhen: function pauseWhen(callback, time) {
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
    whenPaused: function whenPaused(callback) {
        if (!isFunction(callback)) {
            return console.log("Invalid whenPaused function");
        }

        this.whenPausedFn = callback;
        return this;
    },

    /**
     * stop running when untilFn() returns true
     */
    runUntil: function runUntil(callback) {
        if (!isFunction(callback)) {
            return console.log("Invalid runUntill function");
        }

        this.runUntilFn = callback;
        return this;
    },

    /**
     * call the handler after runner stopped
     */
    onEnd: function onEnd(callback) {
        if (!isFunction(callback)) {
            return console.log("Invalid onEnd function");
        }

        this.onEndFn = callback;
        return this;
    }

};

module.exports = Job;
//# sourceMappingURL=Job.js.map