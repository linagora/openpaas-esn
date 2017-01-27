(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .constant('INFINITE_LIST_EVENTS', {
      LOAD_MORE_ELEMENTS: 'infiniteList:loadMoreElements',
      REMOVE_ELEMENTS: 'infiniteList:removeElements',
      ADD_ELEMENTS: 'infiniteList:addElements'
    });
})();
