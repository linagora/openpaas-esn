(function() {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationListener', esnCollaborationListener);

  function esnCollaborationListener($rootScope, livenotification, ESN_COLLABORATION_MEMBERSHIP_EVENTS) {

    return {
      destroy: destroy,
      init: init
    };

    function _getCollaborationNotification() {
      return livenotification('/collaboration');
    }

    function destroy() {
      _getCollaborationNotification().removeListener('join', join);
      _getCollaborationNotification().removeListener('leave', leave);
    }

    function init() {
      _getCollaborationNotification().on('join', join);
      _getCollaborationNotification().on('leave', leave);
    }

    function join(data) {
      $rootScope.$emit(ESN_COLLABORATION_MEMBERSHIP_EVENTS.JOIN, data);
    }

    function leave(data) {
      $rootScope.$emit(ESN_COLLABORATION_MEMBERSHIP_EVENTS.LEAVE, data);
    }
  }
})();
