/*
 * loader.js
 *
 * Copyright (c) 2012 'PerfectWorks' Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint browser: true*/

(function (window) {
    'use strict';
    if (window.define) {
        return;
    }

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    }

    var MM = {};
    var initModuleName = 'index';
    var scripts = window.document.getElementsByTagName('script');

    var i;
    for (i = 0; i < scripts.length && !initModuleName; i++) {
        initModuleName = scripts[i].getAttribute('data-main');
    }

    if (!initModuleName) {
        throw new Error('No data-main attribute in script tag.');
    }

    var require;

    var runModule = function runModule(name) {
        var exports = {};
        var module = MM[name];

        if (isFunction(MM[name].factory)) {
            var ret = MM[name].factory.apply(undefined, [require, exports, module]); // Argument 'module' hasn't been implemented yet.
            module.ret = ret === undefined ? (module.exports ? module.exports : exports) : ret;
        } else {
            module.ret = MM[name].factory;
        }
        module.inited = true;
    };

    require = function require(name) {
        if (!MM[name]) {
            throw new Error('Module ' + name + ' is not defined.');
        }

        var module = MM[name];

        if (module.inited === false) {
            runModule(name);
        }

        return module.ret;
    };

    var define = function define(name, deps, factory) {
        if (MM[name]) {
            throw new Error('Module ' + name + ' has been defined already.');
        }

        if (isFunction(deps)) {
            factory = deps;
        }

        MM[name] = {
            factory: factory,
            inited: false
        };

        if (name === initModuleName) {
            runModule(name);
        }
    };

    window.define = define;
}(window));
;
define("begin", function(require, exports, module) {
    var Class = require("util/class");
    var Step = require("step");
    var Begin = Class({
        extend: Step,
        construct: function(options) {
            this.callsuper(options);
        }
    });
    module.exports = Begin;
});;
define("condition", function(require, exports, module) {
    var Class = require("util/class");
    var Step = require("step");
    var Condition = Class({
        extend: Step,
        construct: function(options) {
            this.callsuper(options);
            this._cases = options.cases || {};
            this._default = options.defaultCase || function(){};
        },
        methods: {
            _select: function(condition) {
                var fn = this._cases[condition] || this._default;
                fn();
            },
            cases: function() {
                return {
                    "default": this._default,
                    cases: this._cases
                };
            }
        }
    });
    module.exports = Condition;
});;
define("flow", function(require, exports, module) {
    var Class = require("util/class");
    var EventPlugin = require("util/eventPlugin");
    var extend = require("util/extend");
    var Begin = require("begin");
    var Step = require("step");
    var Queue = require("util/queue");
    var Data = require("util/flowData");
    var Flow = Class({
        plugins: [ new EventPlugin() ],
        construct: function(options) {
            this._begin = new Begin({
                description: "Begin",
                struct: {}
            });
            this._steps = options.steps;
            this._curr = this._begin;
            this._queue = new Queue();
            this._started = false;
            this._timer = null;
            this._prev = this._begin;
            this._data = new Data();
        },
        methods: {
            //初始化流程
            start: Class.abstractMethod,
            go: function(step, data) {
                var _this = this;
                this._queue.enqueue({
                    step: step,
                    data: data
                });
                if (this._prev) {
                    this._prev.next(step);
                }
                this._prev = step;
                if (this._timer) {
                    clearTimeout(this._timer);
                }
                this._timer = setTimeout(function() {
                    step.end();
                    _this._start();
                }, 0);
            },
            _start: function() {
                var item = this._queue.dequeue();
                if (item) {
                    this._process(item.step, item.data || this._getStepData(item.step));
                }
            },
            _process: function(step, data) {
                this._enter(step, data, function(result) {
                    if (result) {
                        this._saveData(result);
                    }
                    var next = this._getNext(step);
                    if (next) {
                        var nextData = this._getStepData(next);
                        this._process(next, nextData);
                    }
                });
            },
            _saveData: function(result) {
                for (var key in result) {
                    if (result.hasOwnProperty(key)) {
                        this._data.setData(key, result[key]);
                    }
                }
            },
            _getNext: function(step) {
                var result = step.__result, next = null;
                var item = this._queue.dequeue();
                var next = null;
                if (item) {
                    next = item.step;
                } else {
                    next = step.next();
                }
                return next;
            },
            _getStepData: function(step) {
                var struct = step.getStruct();
                var dataNames = [];
                if (struct && struct.input) {
                    for (var key in struct.input) {
                        if (struct.input.hasOwnProperty(key)) {
                            dataNames.push(key);
                        }
                    }
                }
                return this._data.getData(dataNames);
            },
            _enter: function(step, data, callback) {
                var _this = this;
                this._curr = step;
                step.enter(data, function(err, result) {
                    step.__result = result;
                    callback.call(_this, result);
                });
            }
        }
    });
    module.exports = Flow;
});;
define("input", function(require, exports, module) {
    var Class = require("util/class");
    var Step = require("step");
    var Condition = Class({
        extend: Step,
        construct: function(options) {
            this.callsuper(options);
            this._inputs = options.inputs || {};
            this._waiting = false;
        },
        methods: {
            _wait: function(callback) {
                if (!this._waiting) {
                    this._waiting = true;
                    callback();
                }
            },
            inputs: function() {
                return this._inputs;
            }
        }
    });
    module.exports = Condition;
});

;
define("step", function(require, exports, module) {
    var Class = require("util/class");
    var EventPlugin = require("util/eventPlugin");
    var checkData = require("util/checkData");
    var Step = Class({
        plugins: [ new EventPlugin() ],
        construct: function(options) {
            options = options || {};
            if (!options.description) {
                throw new Error("Need a description.");
            }
            this._data = {};
            this._data.description = options.description;
            this._struct = this._describeData();
            this._next = null;
            this._end = false;
        },
        methods: {
            enter: function(data, callback) {
                if (!this.__checkInput(data)) {
                    throw new Error("Data error.");
                }
                var _this = this;
                this._process(data, function(err, result) {
                    if (!_this.__checkOutput(result)) {
                        throw new Error("Result error.");
                    }
                    callback(err, result);
                });
            },
            _process: Class.abstractMethod,
            _describeData: function() {
                return {};
            },
            next: function(step) {
                if (step) {
                    if (!this.isEnd()) {
                        this._next = step;
                    }
                } else {
                    return this._next;
                }
            },
            end: function() {
                this._end = true;
            },
            isEnd: function() {
                return this._end;
            },
            data: function() {
                return this._data;
            },
            getStruct: function() {
                return this._struct;
            },
            __checkInput: function(data) {
                return checkData.check(this._struct.input, data);
            },
            __checkOutput: function(data) {
                return checkData.check(this._struct.output, data);
            }
        }
    });
    module.exports = Step;
});;
define("util/baseobject", function(require, exports, module) {
    var _Object = function() {};
    var proto = new Object();
    proto.superclass = Object;
    // proto.__NAME__ = 'Object';
    proto.callsuper = function(methodName) {
        var _this = this;
        /* 在一次调用过程中，逐级记录父类引用，保证正确调用父类方法。不支持在异步过程中调用callsuper */
        if (!this._realsuper) {
            this._realsuper = this.superclass;
        } else {
            this._realsuper = this._realsuper.prototype.superclass;
        }
        if (typeof methodName == "string") {
            var args = Array.prototype.slice.call(arguments, 1);
            _this._realsuper.prototype[methodName].apply(_this, args);
        } else {
            var args = Array.prototype.slice.call(arguments, 0);
            _this._realsuper.apply(_this, args);
        }
        this._realsuper = null;
    };
    _Object.prototype = proto;
    module.exports = _Object;
});;
define("util/checkData", function(require, exports, module) {
    var tool = require("util/tool");
    module.exports = {
        check: function(struct, data) {
            var self = this;
            if (!struct) {
                return true;
            }
            var result = true;
            for (var key in struct) {
                var item = struct[key];
                //空值检测
                if (struct[key].empty !== true && self.isEmpty(struct[key], data[key])) {
                    throw new Error("字段[" + key + "]值为空");
                } else if (struct[key].empty === true && self.isEmpty(struct[key], data[key])) {
                    continue;
                } else if (struct[key].type == "number" && typeof data[key] != "number") {
                    throw new Error("字段[" + key + "]不是数字");
                } else if (struct[key].type == "string" && typeof data[key] != "string") {
                    throw new Error("字段[" + key + "]不是字符串");
                } else if (struct[key].type == "array") {
                    if (!self.checkArray(struct[key], data[key])) {
                        throw new Error("字段[" + key + "]值与定义不符");
                    }
                } else if (struct[key].type == "object") {
                    if (!self.checkObject(struct[key].struct, data[key])) {
                        throw new Error("字段[" + key + "]值与定义不符");
                    }
                }
            }
            return result;
        },
        checkArray: function(rule, data) {
            var self = this;
            if (tool.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    if (!self.checkData(rule.item, item)) {
                        return false;
                    }
                }
                return true;
            } else {
                return false;
            }
        },
        checkObject: function(rule, data) {
            return this.check(rule, data);
        },
        isEmpty: function(rule, data) {
            if (data === undefined) {
                return true;
            }
            if (rule.type == "object") {
                return data === null;
            } else if (rule.type == "array") {
                return data.length == 0;
            } else {
                return data === "" || data === undefined || data === null;
            }
        },
        checkData: function(rule, data) {
            if (rule.type == "number" && typeof data == "number") {
                return true;
            } else if (rule.type == "string" && typeof data == "string") {
                return true;
            } else if (rule.type == "boolean" && typeof data == "boolean") {
                return true;
            } else if (rule.type == "array") {
                return this.checkArray(rule.item, data);
            } else if (rule.type == "object") {
                return this.checkObject(rule.struct, data);
            }
            return false;
        }
    };
});;
define("util/class", function(require, exports, module) {
    var _Object = require("util/baseobject");
    var Class = function(data) {
        var superclass = data.extend || _Object;
        var superproto = function() {};
        var plugins = data.plugins || [];
        superproto.prototype = superclass.prototype;
        var constructor = data.construct || function() {};
        var properties = data.properties || {};
        var methods = data.methods || {};
        var statics = data.statics || {};
        var proto = new superproto();
        for (var key in proto) {
            if (proto.hasOwnProperty(key)) {
                delete proto[key];
            }
        }
        for (var key in properties) {
            proto[key] = properties[key];
        }
        for (var key in methods) {
            proto[key] = methods[key];
        }
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            for (var key in plugin) {
                proto[key] = plugin[key];
            }
        }
        proto.constructor = constructor;
        proto.superclass = superclass;
        // proto.__NAME__ = name;
        constructor.prototype = proto;
        for (var key in statics) {
            constructor[key] = statics[key];
        }
        return constructor;
    };
    Class.abstractMethod = function() {
        throw new Error("Not implement.");
    };
    module.exports = Class;
});;
//event plugin
define("util/eventPlugin", function(require, exports, module) {
    var Class = require("util/class");
    var EventPlugin = Class({
        methods: {
            on: function(type, listener) {
                this._ep_createList();
                //todo realListener是干嘛用的？ addby caowenlong
                var realListener = function(ev) {
                    listener(ev);
                };
                type = type.toLowerCase();
                this._ep_lists[type] = this._ep_lists[type] || [];
                this._ep_lists[type].push({
                    type: type,
                    listener: listener,
                    realListener: realListener
                });
                return this;
            },
            un: function(type, listener) {
                this._ep_createList();
                if (type) {
                    type = type.toLowerCase();
                    var listeners = this._ep_lists[type];
                    if (listeners) {
                        var len = listeners.length, isRemoveAll = !listener;
                        if (listeners && listeners.length > 0) {
                            if (isRemoveAll == true) {
                                this._ep_lists[type] = [];
                            } else {
                                listeners.forEach(function(obj, index) {
                                    if (obj.listener === listener) {
                                        listeners.splice(index, 1);
                                    }
                                });
                            }
                        }
                    }
                } else {
                    this._ep_clearList();
                }
                return this;
            },
            fire: function(ev) {
                this._ep_createList();
                var type = ev.type.toLowerCase();
                var data = ev.data;
                var listeners = this._ep_lists[type];
                if (listeners && listeners.length > 0) {
                    listeners.forEach(function(obj, index) {
                        obj.listener({
                            type: type,
                            data: data
                        });
                    });
                }
                return this;
            },
            _ep_clearList: function() {
                this._ep_lists = null;
            },
            _ep_createList: function() {
                if (!this._ep_lists) {
                    this._ep_lists = {};
                }
            }
        }
    });
    module.exports = EventPlugin;
});;
define("util/extend", function(require, exports, module) {
    var extend = function(target, source) {
        for (var p in source) {
            if (source.hasOwnProperty(p)) {
                target[p] = source[p];
            }
        }
        return target;
    };
    module.exports = extend;
});;
/*
 *
 * 流程共享数据
 *
 *
 */
define("util/flowData", function(require, exports, module) {
    var Class = require("util/class");
    var tool = require("util/tool");
    var FlowData = Class({
        construct: function(options) {
            /*
             *   data
             *       "name":
             *           exp:  过期时间
             *           data:
             *
             * */
            this._data = {};
        },
        methods: {
            /*
             * getData
             * param:
             *   dataNames  array/string
             *
             * */
            getData: function(dataNames) {
                var result = {};
                var now = new Date().getTime();
                if (tool.isArray(dataNames)) {
                    var length = dataNames.length;
                    for (var i = 0; i < length; i++) {
                        var name = dataNames[i];
                        if (this._data.hasOwnProperty(name)) {
                            result[name] = this._data[name];
                        }
                    }
                } else {
                    result[dataNames.toString()] = this_data[dataNames.toString()];
                }
                return result;
            },
            setData: function(dataName, data) {
                this._data[dataName] = data;
                return false;
            }
        }
    });
    module.exports = FlowData;
});;
/**
 *  队列
 */
define("util/queue", function(require, exports, module) {
    var Class = require("util/class");
    module.exports = Class({
        construct: function() {
            this._queue = [];
            this._event = {};
        },
        methods: {
            enqueue: function(obj) {
                this._queue.push(obj);
            },
            dequeue: function() {
                var _this = this;
                if (this._queue.length == 0) {
                    this.end();
                    return null;
                } else {
                    return this._queue.splice(0, 1)[0];
                }
            },
            isEmpty: function() {
                return this._queue.length == 0;
            },
            end: function(data) {
                this.fire("end", data);
            },
            on: function(type, callback) {
                if (!this._event[type]) {
                    this._event[type] = [];
                }
                this._event[type].push(callback);
            },
            fire: function(type, data) {
                if (this._event[type]) {
                    for (var i = 0; i < this._event[type].length; i++) {
                        this._event[type][i](data);
                    }
                }
            },
            clear: function() {
                this._queue = [];
            }
        }
    });
});;
/*
 *
 * 简易工具
 *
 *
 */
define("util/tool", function(require, exports, module) {
    module.exports = {
        isArray: Array.isArray || function(arg) {
            return Object.prototype.toString.call(arg) == "[object Array]";
        }
    };
});;
define("index", function(require, exports, module) {
    window.Flowjs = {
        Class: require("util/class"),
        Flow: require("flow"),
        Step: require("step"),
        Condition: require("condition"),
        Input: require("input")
    };
});
;//@ sourceMappingURL=index.combo.js.map