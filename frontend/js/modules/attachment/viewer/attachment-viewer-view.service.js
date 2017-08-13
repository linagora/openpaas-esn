(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerViewService', esnAttachmentViewerViewService);

  function esnAttachmentViewerViewService($compile, $window, $rootScope, $timeout, ESN_AV_DEFAULT_OPTIONS, ESN_AV_VIEW_STATES) {

    var elements = {};
    var body = angular.element('body');

    var currentState;

    return {
      setState: setState,
      getState: getState,
      getElements: getElements,
      renderViewer: renderViewer,
      buildViewer: buildViewer,
      openViewer: openViewer,
      calculateSize: calculateSize,
      resizeElements: resizeElements,
      closeViewer: closeViewer,
      removeSelf: removeSelf
    };

    function setState(state) {
      currentState = state;
    }

    function getState() {
      return currentState;
    }

    function getElements() {
      return elements;
    }

    function renderViewer() {
      var template = angular.element('<div class="av-fadeIn"></div><esn-attachment-viewer></esn-attachment-viewer>');
      var scope = $rootScope.$new(true);

      scope.onView = true;
      body.append($compile(template)(scope));
    }

    function buildViewer(viewer) {
      elements = {
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

      renderContent(file, order, provider);
      hide(elements.mainContent);
      show(elements.fadeIn);
      showDetail(file, order, files.length);

      setState(ESN_AV_VIEW_STATES.OPEN_STATE);
    }

    function renderContent(file, order, provider) {
      var template = angular.element('<esn-' + provider.directive + '-viewer></esn-' + provider.directive + '-viewer>');
      var scope = $rootScope.$new(true);

      scope.file = file;
      scope.provider = provider;
      elements.mainContent.html($compile(template)(scope));
    }

    function showDetail(file, order, total) {
      showInfo(file.name, order + 1, total);
      show(elements.loader);
      show(elements.attachmentViewer);

      total > 1 ? show(elements.nav) : hide(elements.nav);
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

        angular.forEach(ESN_AV_DEFAULT_OPTIONS.screenWidth, function(value, key) {
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
        } else if ((realWidth > maxWidth) || (realHeight > maxHeight)) {
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
        elements.outerContainer.css({
          width: newWidth + 'px',
          height: newHeight + 'px'
        });
      }

      function resizeTopBar() {
        var minWidth = 0.2 * windowWidth;
        var topBarW = newWidth;
        if (topBarW < minWidth) {
          topBarW = minWidth;
        }
        elements.topBar.css({
          width: topBarW + 'px'
        });
      }

      function resizeViewer() {
        var paddingTop;

        if (elements.topBar.height() > 0) {
          elements.topBar.newHeight = elements.topBar.height();
        }
        paddingTop = (windowHeight - newHeight) / 2 - elements.topBar.newHeight;
        paddingTop = paddingTop < 0 ? 0 : paddingTop;
        elements.attachmentViewer.find('.attachment-viewer').css({
          'padding-top': paddingTop + 'px'
        });
      }

      function resizeNav() {
        var extraWidth = 0.1 * windowWidth;

        if (windowWidth < 700) {
          extraWidth = 0.22 * windowWidth;
        }
        if (elements.nav.height() > 0) {
          elements.nav.newHeight = elements.nav.height();
        }
        elements.nav.css({
          width: newWidth + extraWidth + 'px',
          left: extraWidth / -2 + 'px',
          top: (newHeight - elements.nav.newHeight - 2) / 2 + 'px'
        });
      }

      function resizeLoader() {
        var loaderHeight = elements.loader.height();

        elements.loader.css({
          top: (newHeight - loaderHeight - 2) / 2 + 'px'
        });
      }

      showContent();
    }

    function showContent() {
      $timeout(function() {
        hide(elements.loader);
        show(elements.mainContent);
      }, 200);
    }

    function showInfo(title, order, total) {
      var caption = elements.topBar.find('.av-caption');
      var number = elements.topBar.find('.av-number');
      var totalText = (total > 1 ? ' files' : ' file');
      caption.text(title);
      number.text('File ' + order + ' in ' + total + totalText);
    }

    function show(elem) {
      elem.css({ display: 'block' });
    }

    function hide(elem) {
      elem.css({ display: 'none' });
    }

    function closeViewer(event) {
      if (event.target.className.indexOf('attachment-viewer') > -1 || (event.target.className.indexOf('av-closeButton') > -1)) {
        $timeout(function() {
          hide(elements.attachmentViewer);
          hide(elements.mainContent);
          elements.mainContent.html('');
        }, 200);
        hide(elements.fadeIn);

        setState(ESN_AV_VIEW_STATES.CLOSE_STATE);
      }
    }

    function removeSelf() {
      elements.attachmentViewer.remove();
      elements.fadeIn.remove();
    }
  }

})();
