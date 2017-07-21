'use strict';

angular
  .module('esn.attachment')
  .directive('esnAttachmentViewer', ['attachmentViewerService', '$compile', function(attachmentViewerService, $compile) {
    return {
      restrict: 'E',
      link: function($scope, $element) {
        var elem;
        var provider = attachmentViewerService.getProvider($scope.file.contentType);
        if (provider) {
          elem = angular.element('<esn-' + provider.name + '-viewer></esn-' + provider.name + '-viewer>');
        } else {
          provider = attachmentViewerService.getProvider('default');
          elem = angular.element(provider.render($scope.file));
        }
        var template = angular.element(elem);
        $element.html($compile(template)($scope));
      }
    };
  }]);