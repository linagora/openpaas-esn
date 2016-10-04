'use strict';

angular.module('esn.file-preview', [])
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
  .factory('filePreviewService', function($log, _) {
    var providers = {};

    function getProvider(contentType) {
      var result = _.find(providers, function(provider) {
        return provider.contentType.indexOf(contentType) > -1;
      });

      if (!result) {
        $log.debug('No providers for this contentType');
        return null;
      }

      return result;
    }

    /**
     *  {provider: 'name', contentType: [contentType]}
     */
    function addFilePreviewProvider(provider) {
      if (provider && !providers[provider.name]) {
        providers[provider.name] = provider;
        $log.debug('The provider : ' + provider.name + ' is registered');
        return true;
      }

      return false;
    }

    function getFilePreviewProviders() {
      return providers;
    }

    return {
      getProvider: getProvider,
      getFilePreviewProviders: getFilePreviewProviders,
      addFilePreviewProvider: addFilePreviewProvider
    };
  });
