(function(angular) {
  'use strict';

  angular.module('esn.message')
    .factory('esnMessageService', esnMessageService);

  function esnMessageService(esnMessageRegistry, esnMessageHelpers) {
    return {
      canRemove: canRemove,
      canShare: canShare,
      canUpdate: canUpdate
    };

    function canRemove(message, activitystream, user) {
      var registry = _getRegistryByActivitystream(activitystream);

      if (registry && registry.message && registry.message.canRemove) {
        return registry.message.canRemove(message, user);
      }

      return esnMessageHelpers.isMessageCreator(user, message);
    }

    function canShare(message, activitystream, user) {
      var registry = _getRegistryByActivitystream(activitystream);

      if (registry && registry.message && registry.message.canShare) {
        return registry.message.canShare(message, user);
      }

      return true;
    }

    function canUpdate(message, activitystream, user) {
      var registry = _getRegistryByActivitystream(activitystream);

      if (registry && registry.message && registry.message.canUpdate) {
        return registry.message.canUpdate(message, user);
      }

      return true;
    }

    function _getRegistryByActivitystream(activitystream) {
      return activitystream && activitystream.objectType && esnMessageRegistry.get(activitystream.objectType);
    }
  }
})(angular);
