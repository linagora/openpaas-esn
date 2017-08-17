'use strict';

angular.module('esn.file-saver', ['ngFileSaver'])

.factory('esnFileSaver', function(FileSaver, Blob, $http, $log) {
  return {
    saveText: saveText,
    saveFile: saveFile
  };

  function saveText(textContent, filename) {
    var blob = new Blob([textContent], {type: 'text/plain;charset=utf-8'});

    FileSaver.saveAs(blob, filename);
  }

  function saveFile(fileUrl, fileName) {
    return getFile(fileUrl, 'blob').then(function(data) {
      FileSaver.saveAs(data, fileName);
    });
  }

  function getFile(fileUrl, responseType) {
    var req = {
      method: 'GET',
      url: fileUrl,
      responseType: responseType
    };

    return $http(req)
            .then(getFileComplete)
            .catch(getFileFailed);

    function getFileComplete(response) {
      return response.data;
    }

    function getFileFailed(error) {
      $log.debug('XHR Failed for getFile.' + error.data);
    }
  }

})

.directive('esnDownloadFile', function(esnFileSaver) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.on('click', function(event) {
        event.preventDefault();

        var fileName = attrs.esnDownloadFile;
        var fileUrl = attrs.href;
        esnFileSaver.saveFile(fileUrl, fileName);
      });
    }
  };
});
