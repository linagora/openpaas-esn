'use strict';

angular.module('linagora.esn.contact.twitter', [
  'linagora.esn.contact'
])
  .config(function(dynamicDirectiveServiceProvider) {

    function hasTwitterDropDownMenu(scope) {
      return scope.displayShell.getDropDownMenu() === 'twitter-menu-items';
    }
    var dynamicDirective = new dynamicDirectiveServiceProvider.DynamicDirective(hasTwitterDropDownMenu, 'show-twitter-item');
    dynamicDirectiveServiceProvider.addInjection('contact-list-menu-items', dynamicDirective);
  })

  .run(function(DisplayShellProvider, TwitterDisplayShell, TwitterContactHelper) {
    DisplayShellProvider.addDisplayShell(TwitterDisplayShell, TwitterContactHelper.isTwitterContact);
  });
