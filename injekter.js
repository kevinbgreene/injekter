/**
* A global dependency injector. 'injekter' is defined on the
* global namespace with the methods 'module', 'define', 'inject' 'config' and 'run'.
*
* @module Injekter
* @version 0.1.0
* @license MIT
* @author Kevin B. Greene <hightimesteddy@gmail.com>
*/
(function(global, document) {

	'use strict';

	var toString = Object.prototype.toString;
	var slice = [].slice;
	var push = [].push;

	/*!
	 * contentloaded.js
	 *
	 * Author: Diego Perini (diego.perini at gmail.com)
	 * Summary: cross-browser wrapper for DOMContentLoaded
	 * Updated: 20101020
	 * License: MIT
	 * Version: 1.2
	 *
	 * URL:
	 * http://javascript.nwbox.com/ContentLoaded/
	 * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
	 *
	 */
	function contentLoaded(win, fn) {

		var done = false;
		var top = true;

		var doc = win.document;
		var root = doc.documentElement;

		var add = doc.addEventListener ? 'addEventListener' : 'attachEvent';
		var rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent';
		var pre = doc.addEventListener ? '' : 'on';

		var init = function(e) {

			if (e.type == 'readystatechange' && doc.readyState != 'complete') {
				return;
			}
			
			(e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
			
			if (!done && (done = true)) {
				fn.call(win, e.type || e);
			}
		};

		var poll = function() {
			
			try {
				root.doScroll('left');
			}
			catch(e) {
				setTimeout(poll, 50);
				return;
			}
			
			init('poll');
		};

		if (doc.readyState == 'complete') {
			fn.call(win, 'lazy');
		}
		else {

			if (doc.createEventObject && root.doScroll) {
				
				try {
					top = !win.frameElement;
				} catch(e) { }
				
				if (top) {
					poll();
				}
			}
			doc[add](pre + 'DOMContentLoaded', init, false);
			doc[add](pre + 'readystatechange', init, false);
			win[add](pre + 'load', init, false);
		}

	}

	// cross browser logging. stoopid IE.
	var logger = (function() {

		return {

			log : function(str, obj) {

				if (isDefined(console)) {

					if (isDefined(obj)) {
						console.log(str, obj);
					}
					else {
						console.log(str);
					}
				}
			}
		}

	}());

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

        var count = 0;
        var key;

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

    function forEach(arr, fn) {

    	var i = 0;
    	var len = arr.length;
    	var r;

    	for (i=0;i<len;i++) {

    		r = fn(arr[i], i);

    		if (r === false) {
    			return
    		}
    	}
    }

    function toDash(str) {

		return str.replace(/([A-Z])/g, function($1) {
			return "-"+$1.toLowerCase();
		});
	}

	function Injekter() {

		// collection of all modules for this Injekter instance.
		var modules = {};

		function Module(moduleName) {

			// instance is the external interface that is returned to the user.
			var instance = null;
			
			// services is the collection of services defined in this module.
			var services = {};
			
			// serviceCache is a local reference to external services once they have
			// been resolved.
			var serviceCache = {};

			// includes are the names of other modules this module depends on.
			var includes = [];

			// an array of functions to run once this module is ready.
			var runQueue = [];

			// an array of functions to run once this module is ready.
			var injectorQueue = [];

			// Boolean flag flipped once all the dependencies have been resolved and
			// the runQueue has been cleared.
			var isReady = false;

			/**
			 * A constructor for module services. The only reason we have this as a 
			 * constructor is so that we can test against instanceof when resolving
			 * services.
			 * 
			 * @constructor
			 * @name Service
			 * @param {Object} options
			 */
			function Service(options) {
				this.config = options.config;
				this.deps = options.deps;
			}

			/*
			 * Takes an array of dependencies and injects them into a function
			 *
			 * @method inject	
			 * @param {Array} arr - array of dependencies and a function to call
			 * with those dependencies. The function must be the last item in the
			 * array.
			 */
			function inject(arr) {

				if (!isReady) {
					injectorQueue.push(process(arr));
				}
				else {
					return getDependencies(mod);
				}

				return null;
			}

			/*
			 * Takes an array of dependencies and injects them into a function
			 *
		     * @method
		     * @name addToRunQueue
		     * @param {Array} arr - array of dependencies
		     */
			function addToRunQueue(arr) {
				
				if (isReady) {
					throw new Error('Items can only be added to the run queue before run is called');
				}
				else {
					runQueue.push(process(arr));
				}

				return instance;
			}

			/**
			 * Adds the name of a module to list of includes for this module.
			 *
			 * @function
			 * @name addInclude
			 * @param {String|Array} name - The name of a module to include. Can also be
			 * an array of names to include.
			 */
			function addInclude(name) {

				var shouldAdd = true;

				// check to see if this module has already been included.
				forEach(includes, function(item) {

					if (item === name) {
						shouldAdd = false;
						return false;
					}
				});

				if (shouldAdd) {
					includes.push(name);
				}
			}

			/**
			 * Define a service for this module.
			 *
			 * @method
			 * @name define
			 * @param {String} name
			 * @param {Array} arr
			 */
			function define(name, arr) {

				if (!services[name]) {
					services[name] = process(arr);
				}

				return instance;
			}

			/**
			 * Process the arguments passes in to define a service and
			 * normalize them into a service object.
			 *
			 * @function
			 * @name process
			 * @param {Array|Function} arr - An array containing the names of dependencies
			 * for this service and a function used to configure this servie, or just a
			 * function used to configure this service. If the config function is missing
			 * the function will throw.
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
				else if (isFunction(arr)) {
					fn = arr;
				}
				else {
					throw new Error('Service must have a config function');
				}

				return new Service({
					config : fn,
					deps : deps
				});
			}

			/**
			 * Receives the name of a service and tries to find that service, either locally
			 * or in one of the included modules. If the parameter passed in is not a string
			 * it is assumed to be the service itself and is returned.
			 *
			 * @function
			 * @name getService
			 * @param {String} name - Name of the service to find.
			 */
			function getService(name) {

				var i = 0;
				var len = includes.length;
				var tempMod = null;

				// if we already have a service, return it.
				if (name instanceof Service) {
					return name;
				}

				// if the name is a string we need to find the service by name.
				if (isString(name)) {

					// if a service by this name is local, easy enough, just return that.
					if (services[name]) {
						return services[name];
					}

					// if we've already resolved this service a reference is in cache.
					else if (serviceCache[name]) {
						return serviceCache[name];
					}
					
					// if it's not local and not in the cache, we need to find it 
					// in the includes.
					else {

						for (i=0;i<len;i++) {

							tempMod = modules[includes[i]] || null;

							if (tempMod && tempMod.get(name)) {
								serviceCache[name] = tempMod.get(name);
								return serviceCache[name];
							}
						}

						// if it's not in the includes return null.
						return null;
					}
				}

				return null;
			}

			/**
			 * Resolves the dependencies for a service
			 *
			 * @function
			 * @name resolve
			 * @param {String|Object} serviceToResolve - This is either the string name of
			 * a service to resolve or an actual Service instance.
			 */
			function resolve(serviceToResolve) {

				// this function can receive several types of arguments as the 
				// serviceToResolve, we need to normalize this argument before moving on.
				var service = getService(serviceToResolve);

				// if no service, get out.
				if (!service) {
					return null;
				}

				// if the service has been resolved already it will have an fn property.
				// return the funtion contained there.
				if (service.fn) {
					return service.fn;
				}

				// if the service is an instance of service but doesn't have fn defined,
				// it hasn't been resolved yet. get the dependencies for this services
				// and then return the service function.
				else if (service instanceof Service) {
					service.fn = getDependencies(service);
					return service.fn;
				}

				// otherwise returned whatever object has been defined as the service.
				else {
					return service;
				}
			}

			function getDependencies(service) {

				var resolvedDeps = [];
				var fn = service.config;
				
				forEach(service.deps, function(dep) {

					// if the dependency is a string it hasn't been resolved yet.
					// resolve it and push it to resolved array
					if (isString(dep)) {
						resolvedDeps.push(resolve(dep));
					}
					// otherwise, if the dependency is a function, it has been resolved.
					else if (isFunction(dep)) {
						fn = dep;
					}
				});

				if (fn) {

					service.config = null;

					try {
						return fn.apply(null, resolvedDeps);
					}
					catch(err) {
						logger.log('ERROR: Unable to get dependency: ' + err);
						return null;
					}
				}

				return null;
			}

			/**
			 * Include a module as a dependency for this module.
			 *
			 * @method
			 * @name needs
			 * @param {String|Array} name - Name (or array of names) of a module that
			 * this module depends on.
			 */
			function needs(name) {

				if (isArray(name)) {

					forEach(name, function(item) {

						addInclude(item);
					});
				}
				else {
					addInclude(name);
				}

				return instance;
			}

			/**
			 * Return a resolved service from this modules set of services.
			 *
			 * @method
			 * @name get
			 * @param {String} name - Name of the service to return.
			 */
			function get(name) {

				// only get if the service is local.
				if (services[name]) {
					return resolve(name);
				}

				return null;
			}

			/**
			 * List the names of the modules this module depends on.
			 *
			 * @method
			 * @name list
			 */
			function list() {

				forEach(includes, function(item) {
					logger.log(item);
				});

				return instance;
			}

			function clearQueues() {

				forEach(runQueue, function(mod) {
					getDependencies(mod);
				});

				forEach(injectorQueue, function(mod) {
					getDependencies(mod);
				});

				runQueue = null;
				injectorQueue = null;
			}

			/**
			 * Resolve all the services and their dependenies and call all the functions
			 * in the runQueue.
			 *
			 * @method
			 * @name start
			 */
			function start() {

				var key;

				for (key in services) {
					resolve(key);
				}

				clearQueues();

				isReady = true;
			}

			// public interface exposed to users.
			instance = {
				services : services,
				name : moduleName,
				define : define,
				needs : needs,
				get : get,
				list : list,
				run : addToRunQueue,
				inject : inject,
				start : start
			};

			return instance;
		}

		var config = (function() {

			// a collection of global config values.
			var store = {};

			return {

				get : function(key) {
					return store[key] || null;
				},

				set : function(key, value) {
					store[key] = value;
				}
			};

		}());

		// default module for global defines.
		// All other modules have access to this module.
		modules['global'] = Module('global');

		// let's populate the global module with some useful stuff.
		modules['global']

		// collection of utilities. mostly for checking the type of a value.
		.define('injekter.utils', [function() {

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
		    utility.forEach = forEach;

			return utility;
		}])

		// expose the cross browser logger to all modules.
		.define('logger', [function() {
			return logger;
		}])

		// global config hash.
		.define('config', [function() {
			return config;
		}]);

		/**
		 * Gets the module with the given name. If the module doesn't exist, one
		 * is created and the new module is returned.
		 *
		 * @method
		 * @name getModule
		 * @param {String} name - The name of the module to return.
		 */
		function getModule(name) {

			// if the module doesn't exist, create one.
			if (!modules[name]) {

				modules[name] = Module(name);

				// all modules, except the global module, include the global module.
				// having a module depend on itself causes a circular dependency and 
				// nasty errors insue.
				// TODO: check for circular dependencies.
				modules[name].needs('global');
			}

			return modules[name];
		}

		/**
		 * Called once the DOM is ready. Tells each module to resolve it's dependencies,
		 * and clear their run queues.
		 *
		 * @function
		 * @name start
		 */
		function start() {

			var key;

			for (key in modules) {
				modules[key].start();
			}
		}

		// Ladies and Gentlemen,
		// Start your engines.
		contentLoaded(global, start);

		// the public interface for injekter.
		return {

			module : getModule,
			config : config,

			// methods exposing the global module.
			define : modules['global'].define,
			inject : modules['global'].inject,
			run : modules['global'].run
		};
	}

	global.injekter = Injekter();

}(window, window.document));