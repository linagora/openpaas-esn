'use strict';

angular.module('esn.dynamic-menu', ['op.dynamicDirective'])
  .constant('MODAL_OPTIONS', {
    animation: 'am-fade-and-slide-top',
    prefixClass: 'aside',
    prefixEvent: 'aside',
    placement: 'top',
    contentTemplate: '/views/modules/dynamic-menu/dynamic-menu.html',
    container: false,
    element: null,
    backdrop: true,
    keyboard: true,
    html: false,
    show: false
  })
  .factory('$dynamicMenu', function($modal, MODAL_OPTIONS) {
    var $dynamicMenu = function(config) {
      var options = angular.extend({}, MODAL_OPTIONS, config);
      return $modal(options);
    }
    return $dynamicMenu;
  });
