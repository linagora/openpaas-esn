(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerViewService', esnAttachmentViewerViewService);

  function esnAttachmentViewerViewService(FileSaver, $compile, $window, $rootScope, $http) {

    var $el = angular.element;
    var $body = $el('body');
    var elements = {};

    var DEFAULT_OPTIONS = {
      initSize: {
        width: 250,
        height: 250
      },
      screenWidth: {
        more0: 0,
        more6: 600,
        more8: 800
      },
      minRatio: {
        more0: 0.8,
        more6: 0.5,
        more8: 0.3
      }
    };

    return {
      renderViewer: renderViewer,
      buildViewer: buildViewer,
      openViewer: openViewer,
      calculateSize: calculateSize,
      resizeElements: resizeElements,
      closeViewer: closeViewer
    };

    function renderViewer() {
      if (!elements.attachmentViewer) {
        var template = $el('<esn-attachment-viewer></esn-attachment-viewer>');
        var scope = $rootScope.$new(true);
        $body.append($compile(template)(scope));
      }
    }

    function buildViewer(viewer) {
      var attachmentViewer = viewer;
      elements = {
        attachmentViewer: attachmentViewer,
        topBar: attachmentViewer.find('.av-topBar'),
        outerContainer: attachmentViewer.find('.av-outerContainer'),
        container: attachmentViewer.find('.av-container'),
        mainContent: attachmentViewer.find('.av-main'),
        nav: attachmentViewer.find('.av-nav'),
        loader: attachmentViewer.find('.av-loader')
      };
    }

    function openViewer(files, order, provider) {
      var file = files[order];
      renderContent(files, order, provider);

      showInfo(file.name, order + 1, files.length);
      show(elements.loader);
      hide(elements.mainContent);
      show(elements.attachmentViewer);
    }

    function renderContent(files, order, provider) {
      var template = $el('<esn-' + provider.directive + '-viewer></esn-' + provider.directive + '-viewer>');
      var scope = $rootScope.$new(true);

      scope.file = files[order];
      scope.provider = provider;
      elements.mainContent.html($compile(template)(scope));
    }

    function calculateSize(size) {
      var desiredSize = {};
      var windowWidth = $el($window).width();
      var windowHeight = $el($window).height();

      if (size.desiredRatio) {
        calculateSizeByDesire();
      } else if (size.realSize) {
        calculateSizeByReal();
      }

      function calculateSizeByDesire() {
        var ratioWindow = size.desiredRatio.defaultRatioWindow;

        angular.forEach(DEFAULT_OPTIONS.screenWidth, function(value, key) {
          if (windowWidth > value && size.desiredRatio.defaultRatioWindow <= DEFAULT_OPTIONS.minRatio[key]) {
            ratioWindow = DEFAULT_OPTIONS.minRatio[key];
          }
        });
        if ((windowWidth / windowHeight) > size.desiredRatio.defaultRatioWH) {
          desiredSize.height = windowHeight * ratioWindow;
          desiredSize.width = parseInt(desiredSize.height * size.desiredRatio.defaultRatioWH, 10);
        } else {
          desiredSize.width = windowWidth * ratioWindow;
          desiredSize.height = parseInt(desiredSize.width / size.desiredRatio.defaultRatioWH, 10);
        }
      }

      function calculateSizeByReal() {
        var maxWidth = windowWidth - 100;
        var maxHeight = windowHeight - 140;
        var realWidth = size.realSize.width;
        var realHeight = size.realSize.height;

        if (realWidth === 0 && realHeight === 0) {
          desiredSize = DEFAULT_OPTIONS.innitSize;
        } else {
          if ((realWidth > maxWidth) || (realHeight > maxHeight)) {
            if ((realWidth / maxWidth) > (realHeight / maxHeight)) {
              desiredSize.width = maxWidth;
              desiredSize.height = parseInt(realHeight / (realWidth / desiredSize.width), 10);
            } else {
              desiredSize.height = maxHeight;
              desiredSize.width = parseInt(realWidth / (realHeight / desiredSize.height), 10);
            }
          } else {
            desiredSize = size.realSize;
          }
        }
      }

      return desiredSize;
    }

    function resizeElements(desiredSize) {
      var windowWidth = $el($window).width();
      var windowHeight = $el($window).height();
      var newWidth = desiredSize.width;
      var newHeight = desiredSize.height;

      resizeOuterContainer();
      resizeTopBar();
      resizeViewer();
      resizeNav();

      function resizeOuterContainer() {
        elements.outerContainer.css({
          'width': newWidth + 'px',
          'height': newHeight + 'px'
        });
      }

      function resizeTopBar() {
        var minWidth = 0.2 * windowWidth;
        var topBarW = newWidth;
        if (topBarW < minWidth) {
          topBarW = minWidth;
        }
        elements.topBar.css({
          'width': topBarW + 'px'
        });
      }

      function resizeViewer() {
        var paddingTop = (windowHeight - newHeight) / 2 - elements.topBar.height();
        if (paddingTop < 0) {
          paddingTop = 0;
        }
        elements.attachmentViewer.css({
          'padding-top': paddingTop + 'px'
        });
      }

      function resizeNav() {
        var extraWidth = 0.1 * windowWidth;
        var navHeight = elements.nav.height();
        if (windowWidth < 700) {
          extraWidth = 0.22 * windowWidth;
        }
        elements.nav.css({
          'width': newWidth + extraWidth + 'px',
          'left': extraWidth / -2 + 'px',
          'top': (newHeight - navHeight - 2) / 2 + 'px'
        });
      }

      showContent();
    }

    function showContent() {
      hide(elements.loader);
      show(elements.mainContent);
    }

    function showInfo(title, order, total) {
      var caption = elements.topBar.find('.av-caption');
      var number = elements.topBar.find('.av-number');
      var totalText = (total > 1 ? ' files' : ' file');
      caption.text(title);
      number.text('File ' + order + ' in ' + total + totalText);
    }

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

    function closeViewer(event) {
      if (event.target.id === 'attachmentViewer' || event.target.id === 'closeButton') {
        hide(elements.attachmentViewer);
        elements.mainContent.html('');
      }
    }
  }

})();
