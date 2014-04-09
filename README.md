# Injekter

version: 0.0.1

A very simple dependency injector. Just me playing around with dependency injection. May become more later.

## Usage

Injekter exposes one global variable, "injekter", and has one dependency, jQuery.

Most of the functionality is housed in two methods, 'define' and 'inject'.

Register a module.

     injekter.define(name, [dep, dep, fn]);

Inject dependencies into a funciton without creating a new module.

     injekter.inject([dep], fn]);

A helper method exists for application bootstraping, 'run'. All of the dependencies are resolved on jQuery.ready. Functions passed to run are executed immediately after all dependencies have been resolved. You can also inject dependencies into your run function. More than one run function can be defined. All will be run.

     injekter.run([dep, dep], fn);

or

     injekter.run([dep, dep, fn]);