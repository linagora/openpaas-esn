'use strict';

angular.module('linagora.esn.unifiedinbox')

.directive('inboxSidebarEmail', function() {
  return {
    restrict: 'E',
    //eslint-disable-next-line no-unused-vars
    templateUrl: function(element, attrs) {
      return '/unifiedinbox/views/sidebar/email/' + attrs.template + '.html';
    },
    scope: {},
    controller: 'inboxSidebarEmailController'
  };
})

.directive('inboxSidebarTwitter', function() {
  return {
    restrict: 'E',
    //eslint-disable-next-line no-unused-vars
    templateUrl: function(element, attrs) {
      return '/unifiedinbox/views/sidebar/twitter/' + attrs.template + '.html';
    },
    scope: {},
    controller: 'inboxSidebarTwitterController'
  };
});
