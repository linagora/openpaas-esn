(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);

  function esnAttachmentViewerGalleryService($compile, $window, $rootScope) {

    var defaultGallery = 'noname';
    var galleries = {};

    galleries[defaultGallery] = [];

    return {
      defaultGallery: defaultGallery,
      addFileToGallery: addFileToGallery,
      getAllFilesInGallery: getAllFilesInGallery,
      findOrderInArray: findOrderInArray,
      removeFileFromGallery: removeFileFromGallery
    };

    function addFileToGallery(file, gallery) {
      if (gallery) {
        if (!galleries[gallery]) {
          galleries[gallery] = [];
        }
        galleries[gallery].push(file);
      } else {
        galleries[defaultGallery].push(file);
      }
    }

    function getAllFilesInGallery(gallery) {
      return galleries[gallery];
    }

    function findOrderInArray(files, file) {
      return files.indexOf(file);
    }

    function removeFileFromGallery(file, gallery) {
      var files = [];
      var order;
      if (!gallery) {
        gallery = defaultGallery;
      }
      files = getAllFilesInGallery(gallery);
      order = findOrderInArray(files, file);
      files.splice(order, 1);
    }
  }

})();
