'use strict';

angular.module('esn.project')
  .factory('projectAPI', ['Restangular', function(Restangular) {

    function addMember(id, member) {
      return Restangular.one('projects', id).post(member);
    }

    function getInvitableMembers(id) {
      return Restangular.one('projects', id).all('invitableentities').get();
    }

    return {
      addMember: addMember,
      getInvitableMembers: getInvitableMembers
    };
  }]);
