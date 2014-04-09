# Injekter

version: 0.0.1

A very simple dependency injector. Just me playing around with dependency injection. May become more later.

## Usage

Injekter exposes one global variable, "injekter", and has one dependency, jQuery.

Most of the functionality is housed in two methods, 'define' and 'inject'.

Register a module.

     injecter.define(name, [dep, dep, fn]);

Inject dependencies into a funciton without creating a new module.

     injecter.inject([dep], fn]);