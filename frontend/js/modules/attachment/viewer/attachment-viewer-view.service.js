(function () {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerViewService', esnAttachmentViewerViewService);

  function esnAttachmentViewerViewService($compile, $window, $rootScope, $timeout, ESN_AV_DEFAULT_OPTIONS) {

    var elementsView = {};
    var body = angular.element('body');

    return {
      renderViewer: renderViewer,
      buildViewer: buildViewer,
      openViewer: openViewer,
      calculateSize: calculateSize,
      resizeElements: resizeElements,
      closeViewer: closeViewer,
      removeSelf: removeSelf
    };

    function renderViewer() {
      var template = angular.element('<div class="av-fadeIn"></div><esn-attachment-viewer ng-if="onView" class="av-animate"></esn-attachment-viewer>');
      var scope = $rootScope.$new(true);

      scope.onView = true;
      body.append($compile(template)(scope));
    }

    function buildViewer(viewer) {
      elementsView = {
        fadeIn: body.find('.av-fadeIn'),
        attachmentViewer: viewer,
        topBar: viewer.find('.av-topBar'),
        outerContainer: viewer.find('.av-outerContainer'),
        container: viewer.find('.av-container'),
        mainContent: viewer.find('.av-main'),
        nav: viewer.find('.av-nav'),
        loader: viewer.find('.av-loader')
      };
    }

    function openViewer(files, order, provider) {
      var file = files[order];
      
      show(elementsView.fadeIn);
      renderContent(file, order, provider);
      showInfo(file.name, order + 1, files.length);
      show(elementsView.loader);
      hide(elementsView.mainContent);
      show(elementsView.attachmentViewer);
    }

    function renderContent(file, order, provider) {
      var template = angular.element('<esn-' + provider.directive + '-viewer></esn-' + provider.directive + '-viewer>');
      var scope = $rootScope.$new(true);

      scope.file = file;
      scope.provider = provider;
      elementsView.mainContent.html($compile(template)(scope));
    }

    function calculateSize(sizeOptions) {
      var desiredSize = {};
      var windowWidth = angular.element($window).width();
      var windowHeight = angular.element($window).height();

      if (sizeOptions.desiredRatio) {
        calculateSizeByDesire();
      } else if (sizeOptions.realSize) {
        calculateSizeByReal();
      }

      function calculateSizeByDesire() {
        var ratioWindow = sizeOptions.desiredRatio.desiredRatioWindow;

        angular.forEach(ESN_AV_DEFAULT_OPTIONS.screenWidth, function (value, key) {
          if (windowWidth > value && sizeOptions.desiredRatio.desiredRatioWindow <= ESN_AV_DEFAULT_OPTIONS.minRatio[key]) {
            ratioWindow = ESN_AV_DEFAULT_OPTIONS.minRatio[key];
          }
        });
        if ((windowWidth / windowHeight) > sizeOptions.desiredRatio.desiredRatioSize) {
          desiredSize.height = windowHeight * ratioWindow;
          desiredSize.width = parseInt(desiredSize.height * sizeOptions.desiredRatio.desiredRatioSize, 10);
        } else {
          desiredSize.width = windowWidth * ratioWindow;
          desiredSize.height = parseInt(desiredSize.width / sizeOptions.desiredRatio.desiredRatioSize, 10);
        }
      }

      function calculateSizeByReal() {
        var maxWidth = windowWidth - 100;
        var maxHeight = windowHeight - 140;
        var realWidth = sizeOptions.realSize.width;
        var realHeight = sizeOptions.realSize.height;

        if (realWidth === 0 && realHeight === 0) {
          desiredSize = ESN_AV_DEFAULT_OPTIONS.innitSize;
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
            desiredSize = sizeOptions.realSize;
          }
        }
      }

      return desiredSize;
    }

    function resizeElements(desiredSize) {
      var windowWidth = angular.element($window).width();
      var windowHeight = angular.element($window).height();
      var newWidth = desiredSize.width;
      var newHeight = desiredSize.height;

      resizeOuterContainer();
      resizeTopBar();
      resizeViewer();
      resizeNav();
      resizeLoader();

      function resizeOuterContainer() {
        elementsView.outerContainer.css({
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
        elementsView.topBar.css({
          'width': topBarW + 'px'
        });
      }

      function resizeViewer() {
        var paddingTop = (windowHeight - newHeight) / 2 - elementsView.topBar.height();
        if (paddingTop < 0) {
          paddingTop = 0;
        }
        elementsView.attachmentViewer.find('.attachment-viewer').css({
          'padding-top': paddingTop + 'px'
        });
      }

      function resizeNav() {
        var extraWidth = 0.1 * windowWidth;
        var navHeight = elementsView.nav.height();
        if (windowWidth < 700) {
          extraWidth = 0.22 * windowWidth;
        }
        elementsView.nav.css({
          'width': newWidth + extraWidth + 'px',
          'left': extraWidth / -2 + 'px',
          'top': (newHeight - navHeight - 2) / 2 + 'px'
        });
      }

      function resizeLoader() {
        var loaderHeight = elementsView.loader.height();
        elementsView.loader.css({
          'top': (newHeight - loaderHeight - 2) / 2 + 'px'
        });
      }

      showContent();
    }

    function showContent() {
      $timeout(function () {
        hide(elementsView.loader);
        show(elementsView.mainContent);
      }, 200);
    }

    function showInfo(title, order, total) {
      var caption = elementsView.topBar.find('.av-caption');
      var number = elementsView.topBar.find('.av-number');
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
      if (event.target.className === 'attachment-viewer' || (event.target.className.indexOf('av-closeButton') > -1)) {
        hide(elementsView.attachmentViewer);
        hide(elementsView.mainContent);
        hide(elementsView.fadeIn);
        elementsView.mainContent.html('');
      }
    }

    function removeSelf() {
      elementsView.attachmentViewer.remove();
    }
  }

})();
