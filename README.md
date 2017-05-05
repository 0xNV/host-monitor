# host-monitor

[![Build Status](https://travis-ci.org/toxity/host-monitor.svg?branch=master)](https://travis-ci.org/toxity/host-monitor)
[![npm version](https://badge.fury.io/js/host-monitor.svg)](https://travis-ci.org/toxity/host-monitor)

> node.js tool for host status monitoring

## Install
```
$ npm install host-monitor
```

## Usage
> By default monitor will check host availability each 1 hour

### Register host
> monitor will start to check host constantly right after registration

```javascript
    monitor.register(host, onUpFunction, onDonwFunction);
```

#### Example:
```javascript
    var monitor = require("host-monitor");

    var onUp = function () {
        console.log("Host is UP");
    };
    var onDonw = function () {
        console.log("Host is DOWN");
    }

    monitor.register("127.0.0.1:8080", onUp, onDown);
```
--------

### Config
You can override monitor's default config.

To check current available options use:
```javascript
    monitor.config();
```
To override option use:
```javascript
    monitor.config({
        defaultInterval: 5000
    })
```

It will force monitor to check host availability each 5 seconds

--------

### Remove
You can remove host from monitor by:
```javascript
    monitor.remove(hostName);
```

--------

### Get
If you need some extra manipulation with working monitor you get Instance by:
```javascript
    monitor.get(hostName);
```

> check Instance.js for additional info about Instance methods