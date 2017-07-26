(function() {
  'use strict';

  angular.module('esn.attachment')
    .service('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService(esnAttachmentViewerGalleryService, $compile, $window, $rootScope) {

    var self = this;

    var $el = angular.element;
    var $body = $el('body');
    var galleryService = esnAttachmentViewerGalleryService;

    self.elements = {};
    self.currentItem = {};

    self.getFileUrl = getFileUrl;
    self.getFileType = getFileType;
    self.renderModal = renderModal;
    self.buildModal = buildModal;
    self.openViewer = openViewer;
    self.displayViewer = displayViewer;
    self.fittingSize = fittingSize;
    self.resizeElements = resizeElements;
    self.showContent = showContent;
    self.show = show;
    self.hide = hide;
    self.onHide = onHide;

    function getFileUrl(fileId) {
      var fileUrl = '/api/files/' + fileId;
      return fileUrl;
    };

    function getFileType(contentType) {
      if (contentType.indexOf('image') > -1) {
        return 'image';
      } else if (contentType.indexOf('video') > -1) {
        return 'video';
      } else {
        return 'other';
      }
    };

    function renderModal() {
      var template = '<div class="attachment-viewer" id="attachmentViewer"> <div class="av-dataContainer"> <div class="av-data"> <div class="av-details"> <span class="av-caption">attachment viewer</span> <span class="av-number">2/7</span> </div> <div class="av-closeContainer"> <span class="av-close"><i class="mdi mdi-close mdi-hc-fw"></i></span></div> </div> </div> <div class="av-outerContainer"> <div class="av-container"> <div class="av-main"></div> <div class="av-loader"> <span class="av-cancel"></span></div> <div class="av-nav"> <span class="av-prev nav"> <i class="mdi mdi-chevron-left mdi-hc-fw"> </i> </span> <span class="av-next nav"> <i class="mdi mdi-chevron-right mdi-hc-fw"> </i></span></div> </div> </div> </div>';
      $body.append(template);
      self.buildModal();
    };

    function buildModal() {
      var attachmentViewer = $el('#attachmentViewer');
      self.elements = {
        attachmentViewer: attachmentViewer,
        dataContainer: attachmentViewer.find('.av-dataContainer'),
        outerContainer: attachmentViewer.find('.av-outerContainer'),
        container: attachmentViewer.find('.av-container'),
        mainContent: attachmentViewer.find('.av-main'),
        nav: attachmentViewer.find('.av-nav'),
        loader: attachmentViewer.find('.av-loader')
      };
      self.elements.attachmentViewer.on('click', function(e) {
        if ($el(e.target).attr('id') === 'attachmentViewer') {
          self.hide(self.elements.attachmentViewer);
        }
        return false;
      });
      self.elements.attachmentViewer.find('.av-closeContainer').on('click', function() {
        self.hide(self.elements.attachmentViewer);
        return false;
      });
      self.elements.nav.find('.av-prev').on('click', function() {
        var files = galleryService.getAllFilesInGallery(self.currentItem.gallery);
        if (self.currentItem.index === 0) {
          self.currentItem.index = files.length - 1;
        } else {
          self.currentItem.index = self.currentItem.index - 1;
        }
        self.displayViewer(files);
        return false;
      });

      self.elements.nav.find('.av-next').on('click', function() {
        var files = galleryService.getAllFilesInGallery(self.currentItem.gallery);
        if (self.currentItem.index === files.length - 1) {
          self.currentItem.index = 0;
        } else {
          self.currentItem.index = self.currentItem.index + 1;
        }
        self.displayViewer(files);
        return false;
      });
    };

    function openViewer(file, gallery) {
      var files = [];
      var orderFile;
      if (gallery) {
        self.currentItem.gallery = gallery;
      } else {
        self.currentItem.gallery = galleryService.defaultGallery;
      }
      files = galleryService.getAllFilesInGallery(self.currentItem.gallery);
      orderFile = galleryService.findOrderInArray(files, file);
      if (orderFile > -1) {
        self.currentItem.index = orderFile;
        self.displayViewer(files);
      } else {
        console.log('No matched file in this ' + gallery + ' gallery');
      }
    };

    function displayViewer(files) {
      var scope = $rootScope.$new(true);
      var template = $el('<esn-attachment-viewer></esn-attachment-viewer>');
      scope.file = files[self.currentItem.index];
      scope.order = self.currentItem.index;
      scope.gallery = self.currentItem.gallery;
      self.elements.mainContent.html($compile(template)(scope));

      self.show(self.elements.loader);
      self.hide(self.elements.mainContent);
      self.show(self.elements.attachmentViewer);
    };

    // * defaultSize is optional, it depends on type of file
    // * defaultSize must contain desired ratio between displayed file size (W/H) and 
    //   desired ratio between displayed file size and window size
    // * without defaultSize, elemWidth and elemHeight are required, they must be actual size of the file
    function fittingSize(elemWidth, elemHeight, defaultSize) {
      var windowWidth = $el($window).width();
      var windowHeight = $el($window).height();
      var maxWidth = windowWidth - 20;
      var maxHeight = windowHeight - 120;
      var elemSize = {};

      if (defaultSize) {
        if ((windowWidth / windowHeight) > defaultSize.defaultRatioWH) {
          elemSize.height = windowHeight * defaultSize.defaultRatioWindow;
          elemSize.width = parseInt(elemSize.height * defaultSize.defaultRatioWH, 10);
        } else {
          elemSize.width = windowWidth * defaultSize.defaultRatioWindow;
          elemSize.height = parseInt(elemSize.width / defaultSize.defaultRatioWH, 10);
        }
      } else {
        if (elemWidth === 0 && elemHeight === 0) {
          elemSize.width = 120;
          elemSize.height = 120;
        } else {
          elemSize.width = elemWidth;
          elemSize.height = elemHeight;
          if ((elemWidth > maxWidth) || (elemHeight > maxHeight)) {
            if ((elemWidth / maxWidth) > (elemHeight / maxHeight)) {
              elemSize.width = maxWidth;
              elemSize.height = parseInt(elemHeight / (elemWidth / elemSize.width), 10);
            } else {
              elemSize.height = maxHeight;
              elemSize.width = parseInt(elemWidth / (elemHeight / elemSize.height), 10);
            }
          }
        }
      }
      return elemSize;
    };

    function resizeElements(elemWidth, elemHeight) {
      var newWidth = elemWidth;
      var newHeight = elemHeight;
      var windowWidth = $el($window).width();
      var windowHeight = $el($window).height();

      function resizeOuterContainer() {
        self.elements.outerContainer.css({
          'width': newWidth + 'px',
          'height': newHeight + 'px'
        });
      }

      function resizeDataContainer() {
        self.elements.dataContainer.css({
          'width': newWidth + 'px'
        });
      }

      function resizeViewer() {
        var paddingTop = (windowHeight - newHeight) / 2 - self.elements.dataContainer.height();
        self.elements.attachmentViewer.css({
          'padding-top': paddingTop + 'px'
        });
      }

      function resizeNav() {
        var extraWidth = 0.1 * windowWidth;
        var navHeight = self.elements.nav.height();
        self.elements.nav.css({
          'width': newWidth + extraWidth + 'px',
          'left': extraWidth / -2 + 'px',
          'top': (newHeight - navHeight - 2) / 2 + 'px'
        });
      }

      resizeOuterContainer();
      resizeDataContainer();
      resizeViewer();
      resizeNav();

      self.showContent();
    };

    function showContent() {
      self.hide(self.elements.loader);
      self.show(self.elements.mainContent);
    };

    function show(elem) {
      elem.css({
        'display': 'block'
      });
    }

    function hide(elem) {
      elem.css({
        'display': 'none'
      });
    }

    // often use for pausing video whenever closing modal
    function onHide(callback) {
      self.elements.attachmentViewer.on('click', function() {
        if (self.elements.attachmentViewer.css('display') === 'none') {
          callback();
        }
      });
      self.elements.attachmentViewer.find('.av-closeContainer').on('click', function() {
        if (self.elements.attachmentViewer.css('display') === 'none') {
          callback();
        }
      });
    };
  }

})();
