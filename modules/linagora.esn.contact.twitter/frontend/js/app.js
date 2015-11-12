'use strict';

angular.module('linagora.esn.contact.twitter', [
  'linagora.esn.contact'
])
  .run(function(DisplayShellProvider, TwitterDisplayShell) {
    var isTwitterContact = function(shell) {
      return shell.social.some(function (element) {
        return (element.type === 'Twitter') && (element.value[0] === '@');
      });
    };
    DisplayShellProvider.addDisplayShell(TwitterDisplayShell, isTwitterContact);
  });
