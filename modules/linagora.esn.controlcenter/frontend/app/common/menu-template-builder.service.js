'use strict';

angular.module('linagora.esn.controlcenter')

.service('controlCenterMenuTemplateBuilder', function($interpolate, featureFlags) {
  var templateHref = '<controlcenter-sidebar-menu-item icon="{{icon}}" href="{{href}}" label="{{label}}" />';
  var templateSref = '<controlcenter-sidebar-menu-item icon="{{icon}}" label="{{label}}" ui-sref="{{uiSref}}" ui-sref-active="selected" />';

  return function(href, icon, label, flag) {
    var template, uiSref;

    if (angular.isDefined(flag) && !featureFlags.isOn(flag)) {
      return '';
    }

    if (/^controlcenter\./.test(href)) {
      template = templateSref;
      uiSref = href;
    } else {
      template = templateHref;
    }

    return $interpolate(template)({
      href: href,
      uiSref: uiSref,
      icon: icon,
      label: label
    });
  };

});
