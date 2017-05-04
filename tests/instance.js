/**
 * Created by im on 4/29/17.
 */
'use strict';
const assert = require('assert');
const express = require('express');
const Promise = require('promise');

const Instance = require('../lib/Instance');

describe("Instance", () => {
    describe("constructor", () => {
         it("should throw without require params", () => {
             const hostName = "host";
             const onUp = () => {};

             assert.throws(() => {
                 new Instance();
             });

             assert.throws(() => {
                 new Instance(hostName);
             });

             assert.throws(() => {
                 new Instance(hostName, onUp);
             });
         });

        it("should create new instance", () => {
            const instance = new Instance("host", ()=>{}, ()=>{});

            assert.equal(instance.host, "host");
            assert.equal(instance.alias, null);
            assert.equal(instance.job.status, false);
        })
    });
    describe("methods", () => {
        let instance, app, server, status = 0;

        before(() => {
            require("../").config({
                defaultInterval: 100,
                alertedInterval: 10
            });
        });

        beforeEach(() => {
            const host = "http://localhost:3005";
            const onUp = () => {
                status++;
            };
            const onDown = () => {
                status--;
            };

            app = express();
            server = app.listen("3005");
            instance = new Instance(host, onUp, onDown);
        });

        afterEach(() => {
            instance.stopJob();
            server.close();
            status = 0;

            // added timeout to wait for server close and job stopping
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            })
        });


        it("runDefaultJob()", () => {
            app.use("*", (req, res) => {
                res.sendStatus(200)
            });

            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(status, 1);
                    assert.equal(instance.job.status, true);
                    assert.equal(instance.lastStatus, true);
                    resolve();
                }, 400);
            })
        });

        it("runAlertedJob()", () => {
            instance.runAlertedJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(status, -1);
                    assert.equal(instance.isDown(), true);
                    assert.equal(instance.job.status, true);
                    assert.equal(instance.lastStatus, false);
                    resolve();
                }, 100);
            })
        });

        it("alerted job will become default after 120 checks", () => {
            let endFlag;

            instance.runAlertedJob();

            //overriding default onEnd function to check that it is calling
            instance.job.onEnd(() => {
                endFlag = true;
            });

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(endFlag, true);
                    resolve();
                }, 1500);
            })
        });

        it("should call upFunc if host is up", () => {
            app.use("*", (req, res) => {
                res.sendStatus(200)
            });

            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(status, 1);
                    assert.equal(instance.job.status, true);
                    assert.equal(instance.lastStatus, true);
                    resolve();
                }, 400);
            })
        });

        it("should call downFunc if host if off", () => {
            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(status, -1);
                    assert.equal(instance.job.status, true);
                    assert.equal(instance.isDown(), true);
                    assert.equal(instance.lastStatus, false);
                    resolve();
                }, 400);
            })
        });

        it("should return down date if host off", () => {
            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(typeof instance.getDownDate(), "string");
                    resolve();
                }, 400);
            })
        });

        it("shouldn't return down date if host on", () => {
            app.use("*", (req, res) => {
                res.sendStatus(200)
            });

            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(instance.getDownDate(), undefined);
                    resolve();
                }, 400);
            })
        });

        it("should return date of last check", () => {
            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(typeof instance.getLastCheckDate(), "string");
                    resolve();
                }, 400);
            })
        });

        it("should stop and resume instance job", () => {
            app.use("*", (req, res) => {
                res.sendStatus(200)
            });

            instance.runDefaultJob();

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(status == 1, true);

                    instance.stopJob();

                    setTimeout(() => {
                        assert.equal(instance.job.status, "Stopped");

                        instance.resumeJob();

                        setTimeout(() => {
                            assert.equal(instance.job.status, true);
                            resolve();
                        }, 400);
                    }, 400);
                }, 400);
            })
        });
    })
});