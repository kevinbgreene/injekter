/**
* A global dependency injector. 'injekter' is defined on the
* global name space with the methods 'define' and 'inject'.
*
* @module Injekter
*/

/**
* TODO: add automatic namespacing
*/
(function(global, $) {

	'use strict';

    function isUndefined(value) {
        return typeof value == 'undefined';
    }

    function isDefined(value) {
        return typeof value != 'undefined';
    }

    function isObject(value) {
        return value != null && typeof value == 'object';
    }

    function isString(value) {
        return typeof value == 'string';
    }

    function isNumber(value) {
        return typeof value == 'number';
    }

    function isDate(value) {
        return toString.apply(value) == '[object Date]';
    }

    function isArray(value) {
        return toString.apply(value) == '[object Array]';
    }

    function isFunction(value) {
        return typeof value == 'function';
    }

    function isBoolean(value) {
        return typeof value == 'boolean';
    }

    function size(obj, ownPropsOnly) {

        var count = 0,
            key;

        if (isArray(obj) || isString(obj)) {
            return obj.length;
        }
        else if (isObject(obj)) {

            for (key in obj) {

                if (!ownPropsOnly || obj.hasOwnProperty(key)) {
                    count++;
                }
            }

            return count;
        }
    }

    function toDash(str) {

		return str.replace(/([A-Z])/g, function($1) {
			return "-"+$1.toLowerCase();
		});
	}

	function Injector() {

		/*
		* Just a hash to store our modules
		*/
		var modules = {};
		var injectorQueue = [];
		var runQueue = [];

		var isReady = false;

		/*
		* Takes an array of dependencies and injects them into a function
		*
		* @method inject	
		* @param {Array} arr - array of dependencies
		* @param {Function} [fn] - invocation function
		*/
		function inject(arr, fn) {

			var mod;

			if (isString(arr)) {
				arr = [arr];
			}

			mod = {
				deps : arr,
				fn : fn
			};

			if (!isReady) {
				injectorQueue.push(mod);
			}
			else {
				return getDependencies(mod);
			}

			return null;
		}

		/*
		* Takes an array of dependencies and injects them into a function
		*
		* @method runQueue
		* @param {Array} arr - array of dependencies
		* @param {Function} [fn] - invocation function
		*/
		function _runQueue(arr, fn) {
			
			if (isReady) {
				throw new Error('Items can only be added to the run queue before run is called');
			}
			else {
				runQueue.push({
					deps : arr,
					fn : fn
				});
			}
		}

		/*
		* Registers a module.
		*
		* @method define
		* @param {String} name - a name for the module
		* @param {Array|Function} arr - an array of dependencies and the 
		* invocation funciton or just the invocation function.
		*/
		function define(name, arr) {

			if (isUndefined(arr)) {
				return modules[name] || null;
			}
			else if (modules[name]) {
				throw new Error('A service with name ' + name + ' already exists');
			}
			else {
				modules[name] = process(arr);
			}

			return this;
		}

		/*
		* Processes the dependencies of a module in preparation to resolve those dependencies.
		*
		* @method process
		* @param {array | function} arr - an array of dependencies and the 
		* invocation funciton or just the invocation function.
		*/
		function process(arr) {

			var fn = null;
			var deps = [];

			if (isArray(arr)) {

				arr.forEach(function(el) {

					if (isFunction(el)) {
						fn = el;
					}
					else {
						deps.push(el);
					}
				});
			}
			else if (isDefined(arr)) {
				fn = arr;
			}

			return {
				fn : fn,
				deps : deps,
				configured : false
			};
		}

		function resolve(container, str) {

			var temp = container[str];

			if (temp && !temp.configured) {

				container[str].fn = getDependencies(temp, str);

				return container[str].fn;
			}
			else if (temp && temp.fn) {
				return temp.fn;
			}
		}

		function getDependencies(mod) {

			var deps = [];
			var fn = mod.fn;
			var i = 0;
			var temp = null;

			for (i=0;i<mod.deps.length;i++) {

				temp = mod.deps[i];

				if (isString(temp)) {

					deps.push(resolve(modules, temp));
				}
				else if (isFunction(temp)) {
					fn = temp;
				}
			}

			if (fn) {
				mod.configured = true;
				return fn.apply(window, deps);
			}

			return null;
		}

		function prepServies() {

			var key = null;

			for (key in modules) {
				resolve(modules, key);
			}
		}

		function clearRunQueue() {

			runQueue.forEach(function(mod) {
				getDependencies(mod);
			});
		}

		function clearInjectorQueue() {

			injectorQueue.forEach(function(mod) {
				getDependencies(mod);
			});
		}

		/*
		* Overrides the default run loop
		* Builds modules without performing app config.
		*
		* @method override
		*/
		function override() {

			var key = null;

			prepServies();

			isReady = true;
			injectorQueue = [];
			runQueue = [];
		}

		function run() {

			if (isReady) {
				return;
			}

			var key = null;

			prepServies();

			clearRunQueue();

			clearInjectorQueue();

			isReady = true;
			injectorQueue = [];
			runQueue = [];
		}

		return {
			define : define,
			inject : inject,
			run : _runQueue,
			override : override,
			start : run
		};
	}

	function Injekter() {

		var injector = Injector();

		injector.define('injekter.inject', function() {
			injector.inject
		});

		injector.define('injekter.utils', function() {

			var utility = {};

			utility.size = size;
		    utility.isUndefined = isUndefined;
		    utility.isDefined = isDefined;
		    utility.isObject = isObject;
		    utility.isString = isString;
		    utility.isNumber = isNumber;
		    utility.isDate = isDate;
		    utility.isArray = isArray;
		    utility.isFunction = isFunction;
		    utility.isBoolean = isBoolean;
		    utility.toDash = toDash;

			return utility;
		});

		/*
		* Ladies and Gentlemen,
		* Start your engines.
		*/
		$(injector.start);

		return {
			define : injector.define,
			inject : injector.inject,
			run : injector.run,
			override : injector.override
		}
	}

	if (typeof global.injekter === 'undefined') {
		global.injekter = Injekter();
	}

}(window, window.jQuery));