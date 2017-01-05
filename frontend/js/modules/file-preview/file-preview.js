'use strict';

angular.module('esn.file-preview', [
  'esn.registry'
])

  .directive('filePreview', function($log, $compile, filePreviewService) {
    return {
      restrict: 'E',
      scope: {
        file: '='
      },
      link: function($scope, $element) {
        var elem;
        if (!$scope.file || !$scope.file._id) {
          $log.debug('File does not exist or incomplete');
          return;
        }
        var provider = filePreviewService.getProvider($scope.file.contentType);
        if (provider) {
          elem = angular.element('<file-preview-' + provider.name + '></file-preview-' + provider.name + '>');
          elem.attr({file: 'file'});
        } else {
          elem = angular.element('<message-attachment></message-attachment>');
          elem.attr({attachment: 'file'});
        }
        var template = angular.element(elem);
        var newElt = $compile(template)($scope);
        $element.append(newElt);
      }
    };
  })

  .factory('filePreviewService', function(esnRegistry) {
    var registry = esnRegistry('file-preview', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    return {
      getProvider: registry.get.bind(registry),
      getFilePreviewProviders: registry.getAll.bind(registry),
      addFilePreviewProvider: registry.add.bind(registry)
    };
  });
