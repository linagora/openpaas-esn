# Migration to Angular Material (last update 21/06/2017)

A first component has been migrated from Angular Strap to Angular Material, the purpose of this document is to detail some issues that occured.

## Current status

We currently use Bootstrap through Angular Strap, and on top of it we use a theme that mimic Material Design look and feel.

To implement Material Design guideline, we now can use Angular Material  [1][1]

This project is now complete and stable enough for our needs.

## Files included

In 'frontend/views/esn/index.jade' layout file, we load .css and .js of libraries used.

These libraries are located in 'frontend/components/', per example Angular-material is located in 'frontend/components/angular-material'.

To improve performance and reduce risk of css conflict, we only include the modules we actually use.

ie:
```javascript
    link(rel='stylesheet', href='/components/angular-material/modules/js/core/core.min.css')
    link(rel='stylesheet', href='/components/angular-material/modules/js/virtualRepeat/virtualRepeat.min.css')
    ...
    script(src='/components/angular-material/modules/js/core/core.min.js')
    script(src='/components/angular-material/modules/js/virtualRepeat/virtualRepeat.min.js')  

```

We don't include the whole Angular-material files.

```javascript
    link(rel='stylesheet', href='/components/angular-material/angular-material.css')
    ...
    script(src='/components/angular-material/angular-material.js')

```

But while developping, if we have missing Material Design behaviours, it can be useful to test with the whole Angular-material.
Then to include relevant missing modules, one by one.

To enable unit testing, 'frontend/components/angular-material/angular-material.min.js' has to be added to 'test/config/karma.conf'.


## Css conflicts

There can be conflicts between '/components/angular-material/modules/js/core/core.min.css' and our '/generated/css/esn/styles.css'.

There are some differences with IOS regarding user experience, with some known bugs, per example in their demo page, when a md-menu is opened, we can scroll the text below.

A good resource for issues is Angular Material Github page. [2][2]

## Components

To be more up to date with latest AngularJS good practices, we now try to use components as much as possible according to this guide [3][3].

The main idea is to separate controller, view and component in different files.
And to avoid using $scope inside the controller, the new approach is 

- to use 'this' ( with 'var self = this' to handle internal new scope cases)
- and expose the controller through "controllerAs: 'ctrl'" in the component file.

## Icons
To use Material Design icons.

- Download 'mdi.svg' from here [4][4].
- Add an icon provider to your module.
```javascript
   .config(function($mdIconProvider) {
     $mdIconProvider.defaultIconSet('images/mdi/mdi.svg', 24);
   })

```

- Then you can use icons this way.
```jade
md-icon(md-svg-icon="account",aria-label="Account Icon")
```

## Resources

1. [https://material.angularjs.org/latest/][1]
2. [https://github.com/angular/material/issues][2]
3. [https://toddmotto.com/exploring-the-angular-1-5-component-method/][3]
4. [https://materialdesignicons.com/getting-started][4]


[1]: https://material.angularjs.org/latest/
[2]: https://github.com/angular/material/issues
[3]: https://toddmotto.com/exploring-the-angular-1-5-component-method/
[4]: https://materialdesignicons.com/getting-started