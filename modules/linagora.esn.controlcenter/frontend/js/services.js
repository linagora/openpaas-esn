'use strict';

angular.module('linagora.esn.controlcenter')

.service('controlCenterMenuTemplateBuilder', function(_) {
  var template = '<controlcenter-sidebar-menu-item icon="<%- icon %>" href="<%- href %>" label="<%- label %>" />';

  return function(href, icon, label) {
    return _.template(template)({
      href: href,
      icon: icon,
      label: label
    });
  };

});
