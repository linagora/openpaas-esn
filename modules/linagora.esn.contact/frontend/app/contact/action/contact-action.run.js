(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(injectContactActionDirectives);

  function injectContactActionDirectives(dynamicDirectiveService) {
    inject(isContactWritable, 'contact-edit-action-item');
    inject(isContactWritable, 'contact-delete-action-item', {
      priority: -1
    });
    inject(true, 'contact-action-copy', {
      attributes: [
        { name: 'contact', value: 'contact' },
        { name: 'class', value: 'contact-dropdown-action-item' }
      ]
    });
    inject(isContactWritable, 'contact-action-move', {
      attributes: [
        { name: 'contact', value: 'contact' },
        { name: 'class', value: 'contact-dropdown-action-item' }
      ]
    });

    function isContactWritable(scope) {
      return scope.displayShell.isWritable();
    }

    function inject(condition, directive, options) {
      var dynamicDirective = new dynamicDirectiveService.DynamicDirective(condition, directive, options);

      dynamicDirectiveService.addInjection('contact-list-menu-items', dynamicDirective);
    }
  }
})(angular);
