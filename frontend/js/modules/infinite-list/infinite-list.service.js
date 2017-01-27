(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .factory('infiniteListService', infiniteListService);

  function infiniteListService($rootScope, $q, INFINITE_LIST_EVENTS) {

    return {
      actionRemovingElement: actionRemovingElement,
      actionRemovingElements: actionRemovingElements,
      addElement: addElement,
      addElements: addElements,
      loadMoreElements: loadMoreElements,
      removeElement: removeElement,
      removeElements: removeElements
    };

    function actionRemovingElement(action, element, getRejectedElements) {
      return actionRemovingElements(action, [element], getRejectedElements);
    }

    function actionRemovingElements(action, elements, getRejectedElements) {
      removeElements(elements);

      return action().catch(function(err) {
        // This gives a chance to the caller to customize the list of rejected elements.
        // This is particularly useful for actions that may fail partially; in this case
        // you only want to add the elements that failed to the list, not the whole list of
        // elements. If no callback is given, all elements are added back to the list
        addElements(getRejectedElements ? getRejectedElements(err, elements) : elements);

        return $q.reject(err);
      });
    }

    function addElement(element) {
      addElements([element]);
    }

    function addElements(elements) {
      $rootScope.$broadcast(INFINITE_LIST_EVENTS.ADD_ELEMENTS, elements);
    }

    function loadMoreElements() {
      $rootScope.$broadcast(INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS);
    }

    function removeElement(element) {
      removeElements([element]);
    }

    function removeElements(elements) {
      $rootScope.$broadcast(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, elements);
    }
  }
})();
