(function() {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationClientService', esnCollaborationClientService);

  function esnCollaborationClientService(esnRestangular) {

    return {
      cancelRequestMembership: cancelRequestMembership,
      getInvitablePeople: getInvitablePeople,
      getMember: getMember,
      getMembers: getMembers,
      getRequestMemberships: getRequestMemberships,
      getWhereMember: getWhereMember,
      join: join,
      leave: leave,
      requestMembership: requestMembership,
      removeMember: removeMember
    };

    function cancelRequestMembership(objectType, id, member) {
      return esnRestangular.one('collaborations').one(objectType, id).one('membership', member).remove();
    }

    function getInvitablePeople(objectType, id, options, excludeUserIds) {
      var query = options || {};

      return esnRestangular.one('collaborations').one(objectType, id).customPOST({ exclude: { users: excludeUserIds || [] }}, 'invitablepeople', query);
    }

    function getMember(objectType, id, member) {
      return esnRestangular.one('collaborations').one(objectType, id).one('members', member).get();
    }

    function getMembers(objectType, id, options) {
      return esnRestangular.one('collaborations').one(objectType, id).all('members').getList(options);
    }

    function getRequestMemberships(objectType, id, options) {
      var query = options || {};

      return esnRestangular.one('collaborations').one(objectType, id).all('membership').getList(query);
    }

    function getWhereMember(tuple) {
      return esnRestangular.all('collaborations/membersearch').getList(tuple);
    }

    function join(objectType, id, member) {
      return esnRestangular.one('collaborations').one(objectType, id).one('members', member).put();
    }

    function leave(objectType, id, member) {
      return esnRestangular.one('collaborations').one(objectType, id).one('members', member).remove();
    }

    function requestMembership(objectType, id, member) {
      return esnRestangular.one('collaborations').one(objectType, id).one('membership', member).put();
    }

    function removeMember(objectType, id, member) {
      return esnRestangular.one('collaborations').one(objectType, id).one('members', member).remove();
    }
  }

})();
