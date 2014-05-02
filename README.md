# Injekter

version: 0.2.1

A very simple dependency injector. Just me playing around with dependency injection. May become more later.

### Release notes

Removed the jQuery dependency. Now using contentloaded.js by Diego Perini for managing cross-browser DOMContentLoaded. 

Added module privacy. You can define a module and define services only visible to that module. You can also define dependencies. When a module depends on another module it has access to services from both modules. Services are not added to a global store.

## Usage

Injekter exposes one global variable, "injekter".

To define a module:

     injekter.module('mymodule');

To define module dependencies:

     injekter.module('anothermodule').needs('mymodule');

Can also pass an array to the needs method:

     injekter.module('thirdmodule').needs(['mymodule', 'anothermodule']);

Register a global service. Global services are visible accross all modules.

     injekter.define(name, [dep, dep, fn]);

Register a service on a module:

     injekter.module(name).define(name, [dep, dep, fn]);

A helper method exists for application bootstraping, 'run'. All of the dependencies are resolved on DOMContentLoaded. Functions passed to run are executed immediately after all dependencies have been resolved. You can also inject dependencies into your run function. More than one run function can be defined. All will be executed.

     injekter.module(name).run([dep, dep, fn]);