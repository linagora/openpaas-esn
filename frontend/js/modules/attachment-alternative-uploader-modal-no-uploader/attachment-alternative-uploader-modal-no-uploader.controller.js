(function(angular) {
  'use strict';

  angular.module('esn.message')
    .controller('attachmentAlternativeUploaderModalNoUploaderController',
      attachmentAlternativeUploaderModalNoUploaderController);

  function attachmentAlternativeUploaderModalNoUploaderController(
    $q,
    $filter,
    $scope,
    $modal,
    _,
    esnConfig,
    MAX_SIZE_UPLOAD_DEFAULT
  ) {
    var self = this;

    self.uploadLargeFiles = uploadLargeFiles;
    self.onFileSelect = onFileSelect;

    function onFileSelect($files) {
      esnConfig('core.maxSizeUpload', MAX_SIZE_UPLOAD_DEFAULT).then(function(maxSizeUpload) {
        var largeFiles = [];
        var regularFiles = [];
        for (var i = 0, file = $files[i]; i < $files.length; file = $files[++i]) {
          if (file.size > maxSizeUpload) {
            largeFiles.push(file);
          } else {
            regularFiles.push(file);
          }
        }

        var regularFilesPromise = $scope.onFileSelect(regularFiles);
        var largeFilesPromise = largeFiles.length > 0 ?
                                self.uploadLargeFiles(largeFiles, maxSizeUpload) :
                                $q.when([]);

        return $q.all([regularFilesPromise, largeFilesPromise]);
      });
    }

    function uploadLargeFiles(files, maxSizeUpload) {
      var deferred = $q.defer();

      $modal({
        templateUrl: '/views/modules/attachment-alternative-uploader-modal-no-uploader/attachment-alternative-uploader-modal-no-uploader.html',
        container: 'body',
        backdrop: 'static',
        placement: 'center',
        controller: function() {
          var self = this;

          self.$onInit = $onInit;
          self.cancel = _.partial(deferred.resolve, []);

          function $onInit() {
            self.files = files.map(function(file) {
              return {
                name: file.name,
                size: file.size
              };
            });
            self.humanReadableMaxSizeUpload = $filter('bytes')(maxSizeUpload);
          }
        },
        controllerAs: '$ctrl'
      });

      return deferred.promise;
    }
  }
})(angular);
