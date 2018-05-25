(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactShellDisplayBuilder', ContactShellDisplayBuilder);

  function ContactShellDisplayBuilder(DisplayShellProvider) {

    return {
      build: build
    };

    function build(shell) {
      return DisplayShellProvider.toDisplayShell(shell);
    }
  }
})(angular);
