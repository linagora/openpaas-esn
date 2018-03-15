(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(injectContactActionsDirective);

  function injectContactActionsDirective(dynamicDirectiveService) {

    function isContactWritable(scope) {
      return scope.displayShell.isWritable();
    }

    function injectDynamicDirective(condition, directive, destination, options) {
      var dynamicDirective = new dynamicDirectiveService.DynamicDirective(condition, directive, options);

      dynamicDirectiveService.addInjection(destination, dynamicDirective);
    }

    injectDynamicDirective(isContactWritable, 'contact-edit-action-item', 'contact-list-menu-items');
    injectDynamicDirective(isContactWritable, 'contact-delete-action-item', 'contact-list-menu-items');
    injectDynamicDirective(true, 'contact-action-copy', 'contact-list-menu-items', {
      attributes: [{ name: 'contact', value: 'contact' }, { name: 'class', value: 'contact-dropdown-action-item' }]
    });
    var contact = new dynamicDirectiveService.DynamicDirective(true, 'application-menu-contact', {priority: 35});

    dynamicDirectiveService.addInjection('esn-application-menu', contact);
  }
})(angular);
