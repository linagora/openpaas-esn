'use strict';

angular
  .module('esn.attachment')
  .service('esnAttachmentViewerService', attachmentViewerService);

function attachmentViewerService($compile, $window) {

  var $el = angular.element;
  var $body = $el('body');
  this.elements = {};

  this.getFileUrl = function(fileId) {
    var fileUrl = '/api/files/' + fileId;
    return fileUrl;
  };

  this.renderModal = function() {
    var self = this;
    var template = '<div class="attachment-viewer" id="attachmentViewer"><div class="av-dataContainer"><div class="av-data"><div class="av-details"> <span class="av-caption"></span> <span class="av-number"></span> </div><div class="av-closeContainer"> <span class="av-close"><i class="mdi mdi-close mdi-hc-fw"></i></span></div></div></div><div class="av-outerContainer"><div class="av-container"><div class="av-main"></div><div class="av-nav"> <span class="av-prev"> <i class="mdi mdi-chevron-left mdi-hc-fw"> </i> </span> <span class="av-next"> <i class="mdi mdi-chevron-right mdi-hc-fw"> </i></span></div><div class="av-loader"> <span class="av-cancel"></span></div></div></div></div>';
    $body.append(template);
    self.buildModal();
  };

  this.buildModal = function() {
    var self = this;
    var $attachmentViewer = $el('#attachmentViewer');
    this.elements = {
      attachmentViewer: $attachmentViewer,
      dataContainer: $attachmentViewer.find('.av-dataContainer'),
      outerContainer: $attachmentViewer.find('.av-outerContainer'),
      container: $attachmentViewer.find('.av-container'),
      mainContent: $attachmentViewer.find('.av-main'),
      nav: $attachmentViewer.find('.av-nav'),
      loader: $attachmentViewer.find('.av-loader')
    };
    this.elements.attachmentViewer.on('click', function(e) {
      if ($el(e.target).attr('id') === 'attachmentViewer') {
        self.hide(self.elements.attachmentViewer);
      }
      return false;
    });
    this.elements.attachmentViewer.find('.av-closeContainer').on('click', function() {
      self.hide(self.elements.attachmentViewer);
      return false;
    });
  };

  this.openViewer = function(scope) {
    var self = this;
    var template = $el('<esn-attachment-viewer></esn-attachment-viewer>');
    this.elements.mainContent.html($compile(template)(scope));
    self.show(this.elements.loader);
    self.show(this.elements.attachmentViewer);
  };

  this.fittingSize = function(elemWidth, elemHeight, type) {
    var windowWidth = $el($window).width();
    var windowHeight = $el($window).height();
    var maxWidth = windowWidth - 20;
    var maxHeight = windowHeight - 120;
    var minWidth = 0.75 * windowWidth;
    var minHeight = 0.8 * windowHeight;
    var elemSize = {
      width: elemWidth,
      height: elemHeight
    };

    if ((elemWidth > maxWidth) || (elemHeight > maxHeight)) {
      if ((elemWidth / maxWidth) > (elemHeight / maxHeight)) {
        elemSize.width = maxWidth;
        elemSize.height = parseInt(elemHeight / (elemWidth / elemSize.width), 10);
      } else {
        elemSize.height = maxHeight;
        elemSize.width = parseInt(elemWidth / (elemHeight / elemSize.height), 10);
      }
    }
    if (type === 'video') {
      if (elemWidth < minWidth || elemHeight < minHeight) {
        elemSize.width = minWidth;
        elemSize.height = minHeight;
      }
    }
    return elemSize;
  };

  this.resizeContainer = function(elemWidth, elemHeight) {
    var self = this;
    var newWidth = elemWidth;
    var newHeight = elemHeight;
    var windowHeight = $el($window).height();
    var paddingTop = (windowHeight - newHeight) / 2 - 10;

    this.elements.outerContainer.css({
      'width': newWidth + 'px',
      'height': newHeight + 'px'
    });
    this.elements.dataContainer.css({
      'width': newWidth + 'px'
    });
    this.elements.attachmentViewer.css({
      'padding-top': paddingTop + 'px'
    });
    self.showContent();
  };

  this.showContent = function() {
    var self = this;
    self.hide(this.elements.loader);
  };

  this.show = function($elem) {
    $elem.css({
      'display': 'block'
    });
  }

  this.hide = function($elem) {
    $elem.css({
      'display': 'none'
    });
  }

  this.onHide = function() {
    var self = this;
    if (self.elements.attachmentViewer.css('display') === 'none') {
      return true;
    } else {
      return false;
    }
  };
}
