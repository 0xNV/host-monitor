/**
 * Created by im on 4/29/17.
 */
'use strict';
const assert = require('assert');
const Promise = require('promise');

const Job = require('../lib/Job');

describe("Job", () => {
    describe("constructor", () => {
        it("should create Job instance", () => {
            const job = new Job();

            assert.notEqual(job, undefined);
            assert.equal(job.status, false);
        });


    });
    describe("instance", () => {
        let job;

        beforeEach(() => {
            job = new Job();
        });

        afterEach(() => {
            job.reset();
            job = null;
        });

        it("should error on invalid start params", () => {
            const jobFunc = ()=>{};

            assert.throws(() => {
                job.start();
            });

            assert.throws(() => {
                job.restart();
            });

            assert.throws(() => {
                job.start(jobFunc());
            });

            assert.throws(() => {
                job.restart(jobFunc());
            });
        });


        it("should start new job", () => {
            job.start(()=>{}, 10);

            assert.equal(job.status, true);
        });

        it("should restart job", () => {
            job.restart(()=>{}, 10);

            assert.equal(job.status, true);
        });

        it("should reset instance", () => {
            job.start(()=>{}, 10);

            assert.equal(job.status, true);

            job.reset();

            assert.equal(job.status, false);
        });

        it("should stop job", () => {
            let callCounter = 1;

            job.start(() => {
                    callCounter++;
                }, 100);

            return new Promise((resolve) => {
                setTimeout(() => {
                    const save = callCounter;

                    assert.equal(callCounter > 1, true);
                    job.stop();
                    setTimeout(() => {
                        assert.equal(callCounter === save, true);
                        assert.equal(job.status, "Stopped");
                        resolve();
                    }, 500);
                }, 500);
            })
        });

        it("should resume stopped job", () => {
            let callCounter = 1;

            job.start(() => {
                callCounter++;
            }, 100);

            return new Promise((resolve) => {
                setTimeout(() => {
                    const save = callCounter;

                    assert.equal(callCounter > 1, true);
                    job.stop();
                    setTimeout(() => {
                        assert.equal(callCounter === save, true);
                        assert.equal(job.status, "Stopped");

                        job.resume();

                        setTimeout(() => {
                            assert.equal(callCounter > save, true);
                            assert.equal(job.status, true);
                            resolve();
                        }, 500);
                    }, 500);
                }, 500);
            })
        });

        it("should iterate job function", () => {
            let callCounter = 1;

            job.start(() => {
                callCounter++;
            }, 100);

            assert.equal(job.status, true);

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(callCounter >= 10, true);
                    resolve();
                }, 1100);
            })
        });

        it("functions shouldn't return instance and should do nothing on invalid input", () => {
            let callCounter = 1;

            job.start(() => {
                callCounter++;
            }, 100);

            assert.equal(job.pauseWhen(), undefined);
            assert.equal(job.pauseWhen(()=>{}), undefined);
            assert.equal(job.whenPaused(), undefined);
            assert.equal(job.runUntil(), undefined);
            assert.equal(job.onEnd("testString", "testString"), undefined);

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(callCounter > 5, true);
                    resolve();
                }, 600);
            })
        });

        it("pauseWhen should work", () => {
            let callCounter = 1;

            job.start(() => {
                callCounter++;
            }, 100);

            job.pauseWhen(() => {
                return callCounter === 5;
            }, 500);

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(callCounter > 5 && callCounter < 10, true);
                    resolve();
                }, 1100);
            })
        });

        it("whenPaused should work", () => {
            let callCounter = 1, pauseFlag;

            job.start(() => {
                callCounter++;
            }, 100);

            job.pauseWhen(() => {
                return callCounter === 5;
            }, 500);

            job.whenPaused(() => {
                pauseFlag = true;
            });

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(pauseFlag, true);
                    resolve();
                }, 1100);
            })
        });

        it("runUntil should work", () => {
            let callCounter = 1;

            job.start(() => {
                callCounter++;
            }, 100);

            job.runUntil(() => {
                return callCounter === 5;
            });

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(callCounter === 5, true);
                    assert.equal(job.status, "Ended");
                    resolve();
                }, 1100);
            })
        });

        it("onEnd should work", () => {
            let callCounter = 1, endFlag, afterEndFlag;

            job.start(() => {
                callCounter++;
            }, 100);

            job.runUntil(() => {
                return callCounter === 5;
            });

            job.onEnd(() => {
                endFlag = true;
            },() => {
                afterEndFlag = true;
            });

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(callCounter === 5, true);
                    assert.equal(endFlag, true);
                    assert.equal(afterEndFlag, true);
                    assert.equal(job.status, "Ended");
                    resolve();
                }, 1100);
            })
        });

        it("should chain functions", () => {
            let callCounter = 1, pauseFlag, endFlag;

            job
                .start(() => callCounter++, 100)
                .pauseWhen(() => callCounter === 3, 500)
                .whenPaused(() => pauseFlag = true)
                .runUntil(() => callCounter === 10)
                .onEnd(() => endFlag = true);

            return new Promise((resolve) => {
                setTimeout(() => {
                    assert.equal(job.status, "Ended");
                    assert.equal(callCounter === 10, true);
                    assert.equal(pauseFlag, true);
                    assert.equal(endFlag, true);
                    resolve();
                }, 1800);
            })
        })

    })
});