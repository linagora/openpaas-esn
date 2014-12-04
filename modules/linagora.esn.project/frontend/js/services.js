'use strict';

angular.module('esn.project')
  .factory('projectAPI', ['Restangular', function(Restangular) {

    function get(id) {
      return Restangular.one('projects', id).get();
    }

    function addMember(id, member) {
      return Restangular.one('projects', id).post(member);
    }

    function getInvitableMembers(id) {
      return Restangular.one('projects', id).all('invitableentities').get();
    }

    return {
      get: get,
      addMember: addMember,
      getInvitableMembers: getInvitableMembers
    };
  }])
  .factory('projectService', function() {

    function isMember(project) {
      if (!project || !project.member_status) {
        return false;
      }
      return project.member_status === 'member';
    }

    function canRead(project) {
      return project.type === 'open' ||
        project.type === 'restricted' ||
        isMember(project);
    }

    return {
      isMember: isMember,
      canRead: canRead
    };
  });
