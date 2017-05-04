/**
 * Created by im on 4/29/17.
 */
'use strict';
const assert = require('assert');

const monitor = require('../');

describe("monitor", () => {
    
    describe("config", () => {
        
        it("should return default config", () => {
            const config = monitor.config();

            assert.notEqual(config, undefined);
            assert.equal(typeof config.defaultInterval, "number");
        });

        it("should throw on invalid config type", () => {
            assert.throws(() => {
                monitor.config(12);
            })
        });

        it("should ignore unknown property", () => {
            const clonedConfig = Object.assign({}, monitor.config());

            monitor.config({
                test: 2,
                line: 3
            });

            assert.deepEqual(monitor.config(), clonedConfig);
        });
        
        it("should set new config value", () => {
            const defaultInterval = monitor.config().defaultInterval;

            monitor.config({
                defaultInterval: 1
            });

            assert.equal(monitor.config().defaultInterval, 1);

            monitor.config({
                defaultInterval: defaultInterval
            });

            assert.equal(monitor.config().defaultInterval, defaultInterval);
        });

    });
    
    describe("register", () => {
        afterEach(() => {
            monitor.remove("localhost");
        });

        it("should throw on invalid host", () => {
            assert.throws(() => {
                monitor.register("host");
            });

            assert.throws(() => {
                monitor.register("");
            });
        });

        it("should throw on invalid params", () => {
            const onUp = ()=>{};

            assert.throws(() => {
                monitor.register("host", onUp); //onDown is missing
            });

        });

        it("should register new instance", () => {
            const host = "localhost";
            const instance = monitor.register(host, ()=>{}, ()=>{});

            assert.notEqual(instance, undefined);
            assert.equal(instance.host, host);
            assert.equal(instance.alias, "loc");
            assert.equal(instance.job.status, true);

            assert.deepEqual(monitor.get(host), instance);
            assert.equal(monitor.hasItems(), true);
            assert.equal(monitor.getItems().length, 1);
        });

        it("should create alias for instance", () => {
            assert.equal(monitor.register("localhost", ()=>{}, ()=>{}).alias, "loc");
            assert.equal(monitor.register("localhost:80", ()=>{}, ()=>{}).alias, "loca");
            assert.equal(monitor.register("localhost:81", ()=>{}, ()=>{}).alias, "local");

            assert.equal(monitor.getItems().length, 3);

            monitor.remove("loca");
            monitor.remove("local");
        })
    });

    describe("should remove instance by name or alias", () => {
        const host = "localhost";
        const alias = "loc";

        monitor.register(host, ()=>{}, ()=>{});
        assert.equal(monitor.remove("invalid"), false);
        assert.equal(monitor.remove(host), true);
        assert.equal(monitor.hasItems(), false);
        assert.equal(monitor.getItems().length, 0);

        monitor.register(host, ()=>{}, ()=>{});

        assert.equal(monitor.remove(alias), true);
        assert.equal(monitor.hasItems(), false);
        assert.equal(monitor.getItems().length, 0);
    });

    describe("getAndCall", () => {
        const host = "localhost";

        beforeEach(() => {
            monitor.register(host, ()=>{}, ()=>{});
        });

        afterEach(() => {
            monitor.remove(host);
        });

        it("should throw in invalid input", () => {
            assert.throws(() => {
                monitor.getAndCall();
            });

            assert.throws(() => {
                monitor.getAndCall(host);
            });

            assert.throws(() => {
                monitor.getAndCall(host, true); //second should be func
            });
        });

        it("should return false if can't find instance", () => {
            assert.equal(monitor.getAndCall("host", ()=>{}), false)
        });


        it("should run callback to instance", ()=>{
            let instance;

            const result = monitor.getAndCall(host, (inst)=>{
                instance = inst;
            });

            assert.equal(result, true);
            assert.notEqual(instance, undefined);
            assert.equal(instance.host, host);
        });
    });

    describe("other", () => {
        const host = "localhost";

        beforeEach(() => {
            monitor.register(host, ()=>{}, ()=>{});
        });

        afterEach(() => {
            monitor.remove(host);
        });

        it("should get instance by name or alias", () => {
            assert.equal(monitor.get("test"), undefined);

            const instance = monitor.get(host);

            assert.notEqual(instance, undefined);
            assert.equal(instance.host, host);
            assert.equal(instance, monitor.get("loc"));
        });

        it("should return true if has items", () => {
            assert.equal(monitor.hasItems(), true);

            monitor.remove(host);

            assert.equal(monitor.hasItems(), false);
        });

        it("should return all items", () => {
            const secondHost = "localhost:80";

            assert.equal(monitor.getItems().length, 1);

            monitor.register(secondHost, ()=>{}, ()=>{});

            assert.equal(monitor.getItems().length, 2);
            assert.equal(monitor.getItems()[1].host, secondHost);

            monitor.remove(secondHost);

            assert.equal(monitor.getItems().length, 1);
        });
    })
});