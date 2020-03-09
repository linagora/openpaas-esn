(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').service('boxOverlayManager', boxOverlayManager);

  function boxOverlayManager(_, $rootScope, $window, $compile, $http, $templateCache, notificationFactory, ESN_BOX_OVERLAY_MAX_WINDOWS) {
    var boxTemplateUrl = '/views/modules/box-overlay/box-overlay.html';
    var boxes = [];

    return {
      createElement: createElement,
      spaceLeftOnScreen: spaceLeftOnScreen,
      addBox: addBox,
      removeBox: removeBox,
      maximizedBoxExists: maximizedBoxExists,
      minimizeOthers: minimizeOthers,
      reorganize: reorganize,
      overflows: overflows,
      showAll: showAll,
      onShow: onShow,
      onHide: onHide,
      getContainer: getContainer,
      ensureContainerExists: ensureContainerExists,
      removeContainerIfPossible: removeContainerIfPossible
    };

    function overflows() {
      return getWidth() > getContainerWidth();
    }

    function getContainerWidth() {
      return getContainer()[0].offsetWidth;
    }

    function count() {
      return boxes.length;
    }

    function spaceLeftOnScreen() {
      return count() < ESN_BOX_OVERLAY_MAX_WINDOWS;
    }

    function onlyOneSpaceLeftOnScreen() {
      return count() === (ESN_BOX_OVERLAY_MAX_WINDOWS - 1);
    }

    function isBoxAlreadyOpened(box) {
      return box.$scope.id && boxes.some(function(b) { return b.$scope.id === box.$scope.id; });
    }

    function addBox(box) {
      if (isBoxAlreadyOpened(box)) {
        return false;
      }

      if (!spaceLeftOnScreen()) {
        notificationFactory.weakError('', 'Cannot open more than ' + ESN_BOX_OVERLAY_MAX_WINDOWS + ' windows. Please close one and try again');

        return false;
      }

      boxes.push(box);

      if (!spaceLeftOnScreen()) {
        $rootScope.$broadcast('box-overlay:no-space-left-on-screen');
      }

      return true;
    }

    function removeBox(box) {
      if (count() > 0) {
        var index = _findBoxIndex(box);

        if (index > -1) {
          boxes.splice(index, 1);

          if (onlyOneSpaceLeftOnScreen()) {
            $rootScope.$broadcast('box-overlay:space-left-on-screen');
          }
        }
      }
    }

    function maximizedBoxExists() {
      return boxes.some(function(box) { return box.$scope.isMaximized() || box.$scope.isFullScreen(); });
    }

    function minimizeOthers(box) {
      showAll();

      return boxes
        .filter(function(b) { return b.$scope !== box.$scope; })
        .forEach(function(b) { b.$scope.$minimize(); });
    }

    function reorganize(box) {
      if (count() === 1) {
        return;
      }

      if (!overflows()) {
        return;
      }

      var index = _findBoxIndex(box);

      if (index < 0) {
        return;
      }

      hideMinimizedRightUntilFits(index + 1);
      hideMinimizedLeftUntilFits(index);
      minimizeUntilFits(index);
    }

    function hideMinimizedRightUntilFits(from) {
      if (from !== count()) {
        while (overflows()) {
          hideIfMinimized(from);

          if (++from >= boxes.length) {
            break;
          }
        }
      }
    }

    function hideMinimizedLeftUntilFits(to) {
      var i = 0;

      while (overflows()) {
        if (i !== to) {
          hideIfMinimized(i);
        }

        if (++i >= to) {
          break;
        }
      }
    }

    function minimizeUntilFits(exclude) {
      var i = 0;

      while (overflows()) {
        if (i !== exclude) {
          minimize(i);
        }

        if (++i >= boxes.length) {
          break;
        }
      }
    }

    function hideIfMinimized(index) {
      if (boxes[index] && boxes[index].$scope.isMinimized()) {
        setDisplay(index, 'none');
      }
    }

    function minimize(index) {
      boxes[index].$scope.$minimize();
    }

    function setDisplay(index, display) {
      if (boxes[index]) {
        boxes[index].$element[0].style.display = display;
      }
    }

    function showAll() {
      boxes.forEach(function(box) {
        box.$element[0].style.display = 'flex';
      });
    }

    function getWidth() {
      return boxes.map(function(box) {
        return box.$element[0].offsetWidth;
      }).reduce(function(accumulator, width) {
        return accumulator + width + 6; // 6 is the margin, not available in offsetWidth and not standard with others methods...
      });
    }

    function onShow(box) {
      if (overflows()) {
        var index = _findBoxIndex(box);
        var i = 0;

        if (index < 0) {
          return;
        }

        while (overflows()) {
          if (i < index) {
            minimize(i);
          }

          if (++i === index) {
            break;
          }
        }
      }
    }

    function onHide() {
      removeContainerIfPossible();
    }

    function getContainer() {
      return angular.element('body .box-overlay-container');
    }

    function ensureContainerExists() {
      if (getContainer().length === 0) {
        angular.element($window.document.body).append($compile('<box-overlay-container></box-overlay-container>')($rootScope.$new()));
      }

      return getContainer();
    }

    function removeContainerIfPossible() {
      var container = getContainer();

      var openingBoxOverlayOpenElement = _.find(container.children(), function(child) {
        return child && child.className && child.className.indexOf('box-overlay-open') > -1;
      });

      if (!openingBoxOverlayOpenElement) {
        container.remove();
      }
    }

    function createElement(scope) {
      ensureContainerExists();

      return buildElement(scope).then(function(element) {
        element.addClass('box-overlay-open');
        getContainer().prepend(element);

        return element;
      });
    }

    function buildElement(scope) {
      return _fetchTemplate().then(function(template) {
        return $compile(template)(scope);
      });
    }

    function _fetchTemplate() {
      return $http.get(boxTemplateUrl, {cache: $templateCache}).then(function(res) {
        return res.data;
      });
    }

    function _findBoxIndex(box) {
      return _.findIndex(boxes, { $scope: box.$scope });
    }
  }

})(angular);
