(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);

  function esnAttachmentViewerGalleryService($compile, $window, $rootScope) {

    var DEFAULT_GALLERY = 'noname';
    var galleries = {};

    galleries[DEFAULT_GALLERY] = [];

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
      var galleryName = gallery ? gallery : DEFAULT_GALLERY

      if (!galleries[galleryName]) {
        galleries[galleryName] = [];
      }
      galleries[galleryName].push(file);
    }

    function getAllFilesInGallery(gallery) {
      return galleries[gallery];
    }

    function removeFileFromGallery(file, gallery) {
      var galleryName = gallery ? gallery : DEFAULT_GALLERY
      var files = galleries[galleryName];
      var order = files.indexOf(file);
      files.splice(order, 1);
    }
  }

})();
