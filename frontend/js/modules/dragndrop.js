'use strict';

angular.module('esn.dragndrop', [
  'ng.deviceDetector',
  'esn.escape-html'
])

.constant('ESN_DRAG_ANIMATION_CLASS', 'esn-drag-tooltip')
.constant('ESN_DRAG_ANIMATION_DURATION', 500)
.constant('ESN_DRAG_DISTANCE_THRESHOLD', 10)

.factory('esnDragService', function() {
  var listeners = {};

  function addDroppableListener(scopeId, listener) {
    listeners[scopeId] = listener;
  }

  function removeDroppableListener(scopeId) {
    delete listeners[scopeId];
  }

  function onDragStart(data) {
    angular.forEach(listeners, function(listener) {
      listener.onDragStart(data);
    });
  }

  function onDragEnd(data) {
    var dropped = false;

    angular.forEach(listeners, function(listener) {
      if (listener.onDragEnd(data)) {
        dropped = true;
      }
    });

    return dropped;
  }

  return {
    addDroppableListener: addDroppableListener,
    removeDroppableListener: removeDroppableListener,
    onDragStart: onDragStart,
    onDragEnd: onDragEnd
  };
})

/**
 *
 * @example
 * <div
 * 	esn-draggable
 * 	esn-drag-message="This message is dragging"
 * 	esn-drag-data="data"
 * 	esn-drag-class="dragging"
 * 	esn-on-drag-start="onDragStart()"
 * 	esn-on-drag-end="onDragEnd($dropped)"
 * 	esn-on-drop-success="onDropSuccess()
 * 	esn-on-drop-failure="onDropFailure()">
 * </div>
 */
.directive('esnDraggable', function(
  $parse,
  $document,
  $timeout,
  $q,
  $rootScope,
  deviceDetector,
  esnDragService,
  escapeHtmlUtils,
  ESN_DRAG_ANIMATION_CLASS,
  ESN_DRAG_ANIMATION_DURATION,
  ESN_DRAG_DISTANCE_THRESHOLD) {

  function link(scope, element, attrs) {
    if (deviceDetector.isMobile()) { return; }

    var tooltipElement;
    var startX, startY;
    var centerX, centerY;

    var esnDragData = $parse(attrs.esnDragData)(scope);
    var esnDragClass = attrs.esnDragClass;
    var esnOnDragStart = $parse(attrs.esnOnDragStart);
    var esnOnDragEnd = $parse(attrs.esnOnDragEnd);
    var esnOnDropSuccess = $parse(attrs.esnOnDropSuccess);
    var esnOnDropFailure = $parse(attrs.esnOnDropFailure);

    // Exposed so that we can prevent clicks, mousover effect, etc. throughout OP
    $rootScope.esnIsDragging = false;

    initTooltip(attrs.esnDragMessage);

    element.attr('draggable', false); // disable native HTML5 drag
    element.on('mousedown', onMouseDown);

    function initTooltip(content) {
      content = escapeHtmlUtils.escapeHTML(content);

      tooltipElement = angular.element(
        '<div class="tooltip right">' +
          '<div class="tooltip-arrow"></div>' +
          '<div class="tooltip-inner">' + content + '</div>' +
        '</div>');

      tooltipElement.css('opacity', 1);
      tooltipElement.css('position', 'fixed');
    }

    function setTooltipPosition(top, left) {
      tooltipElement.css('top', (top - tooltipElement.height() / 2) + 'px');
      tooltipElement.css('left', left + 'px');
    }

    function showTooltip() {
      tooltipElement.appendTo(document.body);
    }

    function hideTooltip() {
      tooltipElement.remove();
    }

    function addDragClass() {
      esnDragClass && element.addClass(esnDragClass);
    }

    function removeDragClass() {
      esnDragClass && element.removeClass(esnDragClass);
    }

    function onDragStart() {
      addDragClass();
      esnOnDragStart(scope);
      esnDragService.onDragStart(esnDragData);

      var offset = element.offset();

      centerX = offset.left + element.width() / 2;
      centerY = offset.top + element.height() - $document.scrollTop();

      showTooltip();
    }

    function onDrag(event) {
      setTooltipPosition(event.clientY, event.clientX);
    }

    function onDragEnd() {
      removeDragClass();

      var dropped = esnDragService.onDragEnd({
        onDropSuccess: esnOnDropSuccess.bind(null, scope),
        onDropFailure: esnOnDropFailure.bind(null, scope)
      });

      esnOnDragEnd(scope, { $dropped: dropped });

      if (dropped) {
        hideTooltip();

        return $q.when();
      } else {
        tooltipElement.addClass(ESN_DRAG_ANIMATION_CLASS);
        setTooltipPosition(centerY, centerX);

        return $timeout(function() {
          tooltipElement.removeClass(ESN_DRAG_ANIMATION_CLASS);
          hideTooltip();
        }, ESN_DRAG_ANIMATION_DURATION, false);
      }

    }

    function onMouseMove(event) {
      if ($rootScope.esnIsDragging) {
        onDrag(event);
      } else {
        if (Math.abs(event.clientX - startX) > ESN_DRAG_DISTANCE_THRESHOLD ||
            Math.abs(event.clientY - startY) > ESN_DRAG_DISTANCE_THRESHOLD) {
          $rootScope.esnIsDragging = true;
          onDragStart();
          onDrag(event);
        }
      }
    }

    function onMouseUp(event) {
      if (event.button !== 0) { // right-click
        return;
      }

      if ($rootScope.esnIsDragging) {
        onDragEnd().then(function() {
          $rootScope.esnIsDragging = false;
        });
      }

      $document.off('mousemove', onMouseMove);
      $document.off('mouseup', onMouseUp);
    }

    function onMouseDown(event) {
      if (event.button !== 0) { // right-click
        return;
      }

      event.preventDefault(); // to prevent text selection

      $rootScope.esnIsDragging = false;
      startX = event.clientX;
      startY = event.clientY;

      $document.on('mousemove', onMouseMove);
      $document.on('mouseup', onMouseUp);
    }
  }

  return {
    restrict: 'A',
    link: link
  };
})

/**
 * @example
 * <div
 * 	esn-droppable
 * 	esn-droptarget-class="droptarget",
 * 	esn-on-drag-enter="onDragEnter()"
 * 	esn-on-drag-exit="onDragExit()"
 * 	esn-on-drop="onDrop($dragData)",
 * 	esn-is-drop-zone="isDropZone($dragData)">
 * </div>
 */
.directive('esnDroppable', function(
  $parse,
  esnDragService,
  deviceDetector) {

  function link(scope, element, attrs) {
    if (deviceDetector.isMobile()) { return; }

    var $dragData;
    var isDropCandidate = false;
    var isDropZone = false;

    var esnDroptargetClass = attrs.esnDroptargetClass;
    var esnOnDragEnter = $parse(attrs.esnOnDragEnter);
    var esnOnDragExit = $parse(attrs.esnOnDragExit);
    var esnOnDrop = $parse(attrs.esnOnDrop);
    var esnIsDropZone = $parse(attrs.esnIsDropZone);

    function addDroptargetClass() {
      esnDroptargetClass && element.addClass(esnDroptargetClass);
    }

    function removeDroptargetClass() {
      esnDroptargetClass && element.removeClass(esnDroptargetClass);
    }

    function onMouseEnter(event) {
      addDroptargetClass();
      esnOnDragEnter(scope);
      isDropCandidate = true;
    }

    function onMouseLeave(event) {
      removeDroptargetClass();
      esnOnDragExit(scope);
      isDropCandidate = false;
    }

    function onDragStart(data) {
      $dragData = data;
      isDropZone = esnIsDropZone(scope, { $dragData: $dragData });

      if (isDropZone) {
        element.on('mouseenter', onMouseEnter);
        element.on('mouseleave', onMouseLeave);
      }
    }

    function onDragEnd(callbacks) {
      if (!isDropZone) { return false; }

      esnOnDragExit(scope);

      element.off('mouseenter', onMouseEnter);
      element.off('mouseleave', onMouseLeave);

      if (isDropCandidate) {
        isDropCandidate = false;
        removeDroptargetClass();
        esnOnDrop(scope, { $dragData: $dragData })
          .then(callbacks.onDropSuccess, callbacks.onDropFailure);

        return true;
      }

      return false;
    }

    esnDragService.addDroppableListener(scope.$id, {
      onDragStart: onDragStart,
      onDragEnd: onDragEnd
    });

    scope.$on('$destroy', function() {
      esnDragService.removeDroppableListener(scope.$id);
    });
  }

  return {
    restrict: 'A',
    link: link
  };
});
