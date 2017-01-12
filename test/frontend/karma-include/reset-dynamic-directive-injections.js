/**
 * Angular providers do not reset between each test, only service instance do.
 */
(function(angular) {

  angular
    .module('linagora.esn.tests.reset-dynamic-directive-injections', [
      'op.dynamicDirective'
    ])
    .config(function(dynamicDirectiveServiceProvider) {
      dynamicDirectiveServiceProvider.resetAllInjections();
    });

  beforeEach(angular.mock.module('linagora.esn.tests.reset-dynamic-directive-injections'));

})(angular);
