# Code-Huddle: Angular Browser Utilities

Provides library of re-usable classes and objects related to browser and HTML elements.

## Services

All services are provided via `AngularBrowserUtilitiesModule` using [tree-shakable provider](https://angular.io/guide/dependency-injection-providers#tree-shakable-providers).

### WindowService

> Provides common `window` and `HTMLElement` utilities and events.

* Access to native `window` and `document` objects
* Method to assign internal ID to HTMLElement (using `UUID`)
* Method to get `window` viewport size
* Methods to get `HTMLElement`(s) size
* Observable for `window` resize event (debounce=250ms)

### ContainerHeightService

> Provides utility to detect changes related to size (specifically for height) of a container and its contents.

* Creates containers (`window` or `HTMLElement`)
* Adds/removes one or more `HTMLElement`(s) as contents of a container
* Observable for container size change event (`.containerSizeEvent`)
* Observable for container available size change event (`.availableSizeEvent`)
* Observable for tallest content change event (`.tallestContentEvent`)

## Components

N/A

## Utility Classes

N/A

## Disclaimer

> These utilities are used across Angular apps that I build for my own purposes (either something fun on the side or some work). I'm publishing it to public for anyone to look at and may be able to use or may be able to modify for their own use. I will include GIT issues where comments/bugs/issues can be logged in the future.