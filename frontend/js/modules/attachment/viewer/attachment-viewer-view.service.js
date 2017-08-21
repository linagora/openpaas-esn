(function () {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerViewService', esnAttachmentViewerViewService);

  function esnAttachmentViewerViewService($compile, $window, $rootScope, $timeout, ESN_AV_DEFAULT_OPTIONS, ESN_AV_VIEW_STATES) {

    var elements = {};
    var currentState;

    return {
      setState: setState,
      getState: getState,
      getElements: getElements,
      renderViewer: renderViewer,
      buildViewer: buildViewer,
      renderContent: renderContent,
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
      var template = renderDirective('esn-attachment-viewer');
      angular.element('body').append(template);
    }

    function buildViewer(viewer) {
      elements = {
        attachmentViewer: viewer,
        topBar: viewer.find('.av-topBar'),
        outerContainer: viewer.find('.av-outerContainer'),
        mainContent: viewer.find('.av-main'),
        nav: viewer.find('.av-nav'),
        loader: viewer.find('.av-loader')
      };
    }

    function renderContent(file, provider) {
      var scope = $rootScope.$new(true);
      var template;

      scope.file = file;
      scope.provider = provider;
      template = renderDirective(provider.directive, scope);

      elements.mainContent.html(template);
      setState(ESN_AV_VIEW_STATES.OPEN);
    }

    function renderDirective(directive, $scope) {
      var elem = angular.element('<' + directive + '></' + directive + '>');
      var scope = $scope || $rootScope.$new(true);
      var template = $compile(elem)(scope);

      return template;
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
        if (elements.loader.height() > 0) {
          elements.loader.newHeight = elements.loader.height();
        }
        elements.loader.css({
          top: (newHeight - elements.loader.newHeight - 2) / 2 + 'px'
        });
      }

      showContent();
    }

    function showContent() {
      $timeout(function () {
        setState(ESN_AV_VIEW_STATES.DISPLAY);
      }, 400);
    }

    function closeViewer(event) {
      if (event.target.className.indexOf('attachment-viewer') > -1 || (event.target.className.indexOf('av-closeButton') > -1)) {
        $timeout(function () {
          elements.mainContent.empty();
        }, 200);
        setState(ESN_AV_VIEW_STATES.CLOSE);
      }
    }

    function removeSelf() {
      elements.attachmentViewer.remove();
    }
  }

})();
