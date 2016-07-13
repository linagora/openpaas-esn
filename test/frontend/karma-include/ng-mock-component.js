'use strict';

/**
 * @ngdoc service
 * @name $componentController
 * @description
 * A service that can be used to create instances of component controllers.
 * <div class="alert alert-info">
 * Be aware that the controller will be instantiated and attached to the scope as specified in
 * the component definition object. If you do not provide a `$scope` object in the `locals` param
 * then the helper will create a new isolated scope as a child of `$rootScope`.
 * </div>
 * @param {string} componentName the name of the component whose controller we want to instantiate
 * @param {Object} locals Injection locals for Controller.
 * @param {Object=} bindings Properties to add to the controller before invoking the constructor. This is used
 *                           to simulate the `bindToController` feature and simplify certain kinds of tests.
 * @param {string=} ident Override the property name to use when attaching the controller to the scope.
 * @return {Object} Instance of requested controller.
 */
angular.mock.$ComponentControllerProvider = ['$compileProvider', function($compileProvider) {
  this.$get = ['$controller', '$injector', '$rootScope', function($controller, $injector, $rootScope) {
    return function $componentController(componentName, locals, bindings, ident) {
      // get all directives associated to the component name
      var directives = $injector.get(componentName + 'Directive');
      // look for those directives that are components
      var candidateDirectives = directives.filter(function(directiveInfo) {
        // components have controller, controllerAs and restrict:'E'
        return directiveInfo.controller && directiveInfo.controllerAs && directiveInfo.restrict === 'E';
      });
      // check if valid directives found
      if (candidateDirectives.length === 0) {
        throw new Error('No component found');
      }
      if (candidateDirectives.length > 1) {
        throw new Error('Too many components found');
      }
      // get the info of the component
      var directiveInfo = candidateDirectives[0];
      // create a scope if needed
      locals = locals || {};
      locals.$scope = locals.$scope || $rootScope.$new(true);
      return $controller(directiveInfo.controller, locals, bindings, ident || directiveInfo.controllerAs);
    };
  }];
}];

angular.module('ngMock').provider({
  $componentController: angular.mock.$ComponentControllerProvider
});
