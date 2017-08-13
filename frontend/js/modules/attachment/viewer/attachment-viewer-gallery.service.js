(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);

  function esnAttachmentViewerGalleryService() {

    var DEFAULT_GALLERY = 'noname';
    var galleries = {};

    return {
      getDefaultGallery: getDefaultGallery,
      addFileToGallery: addFileToGallery,
      getAllFilesInGallery: getAllFilesInGallery,
      removeFileFromGallery: removeFileFromGallery
    };

    function getDefaultGallery() {
      return DEFAULT_GALLERY;
    }

    function addFileToGallery(file, gallery) {
      var galleryName = gallery || DEFAULT_GALLERY;

      if (!galleries[galleryName]) {
        galleries[galleryName] = [];
      }
      galleries[galleryName].push(file);
    }

    function getAllFilesInGallery(gallery) {
      return galleries[gallery];
    }

    function removeFileFromGallery(file, gallery) {
      var galleryName = gallery;
      if (!gallery) {
        galleryName = DEFAULT_GALLERY;
      }
      var files = galleries[galleryName];
      var order = files.indexOf(file);
      files.splice(order, 1);
    }
  }

})();
