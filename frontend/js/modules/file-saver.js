'use strict';

angular.module('esn.file-saver', ['ngFileSaver'])

.factory('esnFileSaver', function($http, $log, FileSaver, Blob) {
  return {
    saveText: saveText,
    saveFile: saveFile,
    getFile: getFile
  };

  function saveText(textContent, filename, type) {
    var blob = new Blob([textContent], {type: type || 'text/plain;charset=utf-8'});

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
      .then(function(response) {
        return response.data;
      })
      .catch(function(error) {
        $log.debug('XHR Failed for getFile.' + error.data);
      });
  }

})

.directive('esnDownloadFile', function(esnFileSaver) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var fileName, fileUrl;

      element.on('click', function(event) {
        event.preventDefault();
        fileName = attrs.esnDownloadFile;
        fileUrl = attrs.href;
        esnFileSaver.saveFile(fileUrl, fileName);
      });
    }
  };
});
