'use strict';

angular.module('esn.file-saver', ['ngFileSaver'])

.factory('esnFileSaver', function(FileSaver, Blob) {
  return {
    saveText: saveText
  };

  function saveText(textContent, filename) {
    var blob = new Blob([textContent], {type: 'text/plain;charset=utf-8'});

    FileSaver.saveAs(blob, filename);
  }

});
