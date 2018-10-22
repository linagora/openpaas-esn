(function(angular) {
  angular.module('linagora.esn.contact').config(configBlock);

  function configBlock(dynamicDirectiveServiceProvider) {
    var dynamicDirective = new dynamicDirectiveServiceProvider.DynamicDirective(hasUserDropdownMenu, 'contact-user-virtual-show-user-profile-item');

    dynamicDirectiveServiceProvider.addInjection('contact-list-menu-items', dynamicDirective);

    function hasUserDropdownMenu(scope) {
      return scope.displayShell.getDropDownMenu() === 'virtual-user-menu-items';
    }
  }

})(angular);
