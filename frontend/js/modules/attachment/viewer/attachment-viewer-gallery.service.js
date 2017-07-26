(function() {
  'use strict';

  angular.module('esn.attachment')
    .service('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);

  function esnAttachmentViewerGalleryService($compile, $window, $rootScope) {

    var self = this;

    self.galleries = {};
    self.defaultGallery = 'noname';
    self.galleries[self.defaultGallery] = [];

    self.addFileToGallery = addFileToGallery;
    self.getAllFilesInGallery = getAllFilesInGallery;
    self.findOrderInArray = findOrderInArray;
    self.removeFileFromGallery = removeFileFromGallery;

    function addFileToGallery(file, gallery) {
      if (gallery) {
        if (!self.galleries[gallery]) {
          self.galleries[gallery] = [];
        }
        self.galleries[gallery].push(file);
      } else {
        self.galleries[self.defaultGallery].push(file);
      }
    };

    function getAllFilesInGallery(gallery) {
      return self.galleries[gallery];
    };

    function findOrderInArray(files, file) {
      return files.indexOf(file);
    };

    function removeFileFromGallery(file, gallery) {
      var files = [];
      var order;
      if (!gallery) {
        gallery = self.defaultGallery;
      }
      files = self.getAllFilesInGallery(gallery);
      order = self.findOrderInArray(files, file);
      files.splice(order, 1);
    };
  }

})();
