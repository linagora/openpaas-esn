(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(injectContactActionDirectives);

  function injectContactActionDirectives(dynamicDirectiveService, contactConfiguration) {
    contactConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      inject(can('canEditContact'), 'contact-edit-action-item');
      inject(can('canDeleteContact'), 'contact-delete-action-item', {
        priority: -1
      });
      inject(can('canCopyContact'), 'contact-action-copy', {
        attributes: [
          { name: 'contact', value: 'contact' },
          { name: 'class', value: 'contact-dropdown-action-item' }
        ]
      });
      inject(can('canMoveContact'), 'contact-action-move', {
        attributes: [
          { name: 'contact', value: 'contact' },
          { name: 'class', value: 'contact-dropdown-action-item' }
        ]
      });

      function can(action) {
        return function(scope) {
          if (scope.displayShell.shell.addressbook[action]) {
            return scope.displayShell.shell.addressbook[action];
          }

          return false;
        };
      }

      function inject(condition, directive, options) {
        var dynamicDirective = new dynamicDirectiveService.DynamicDirective(condition, directive, options);

        dynamicDirectiveService.addInjection('contact-list-menu-items', dynamicDirective);
      }
    });
  }
})(angular);
