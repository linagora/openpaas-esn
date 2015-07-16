/**
 * Inject angular things globally, for use in frontend unit tests. Add your
 * instance names to the INJECTIONS array and don't forget to modify .jshintrc
 */
(function(global) {
  // Define things that should be globally injected here
  var INJECTIONS = ['$q'];

  // The rest of the code is boilerplate
  angular.module('esn.test.injector', []).run(INJECTIONS.concat([function() {
    for (var i = 0, len = arguments.length; i < len; i++) {
      global[INJECTIONS[i]] = arguments[i];
    }
  }]));
  beforeEach(angular.mock.module('esn.test.injector'));
})(this);
