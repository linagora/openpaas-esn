'use strict';

angular.module('esn.project')
.factory('projectCreationService', ['$q', '$log', '$timeout', 'projectAPI',
function($q, $log, $timeout, projectAPI) {

  function notifyProgress(d, step, percent) {
    d.notify({
      step: step,
      percent: percent
    });
  }

  function createProject(project) {
    if (!project) {
      $log.error('Missing project');
      return $q.reject('Project information is missing');
    }

    if (!project.title) {
      $log.error('Missing project title');
      return $q.reject('Project title is missing');
    }

    if (!project.startDate) {
      $log.error('Missing project start date');
      return $q.reject('Project start date is missing');
    }

    if (!project.endDate) {
      $log.error('Missing project end date');
      return $q.reject('Project end date is missing');
    }

    if (!project.domain_ids || project.domain_ids.length === 0) {
      $log.error('Missing project domain');
      return $q.error('Domain is missing, try reloading the page');
    }

    if (!project.type) {
      project.type = 'open';
    }

    var avatar = project.avatar;
    delete project.avatar;

    var d = $q.defer();

    $timeout(function() {
      notifyProgress(d, 'post', 1);
    },0);

    projectAPI.create(project).then(
      function(data) {
        var id = data.data._id;
        if (avatar.exists()) {
          notifyProgress(d, 'upload', 20);
          var mime = 'image/png';
          avatar.getBlob(mime, function(blob) {
            projectAPI.uploadAvatar(id, blob, mime)
            .progress(function(evt) {
              var value = 20 + parseInt(80.0 * evt.loaded / evt.total, 10);
              notifyProgress(d, 'upload', value);
            }).success(function() {
              return d.resolve(id);
            }).error(function(err) {
              $log.error(err);
              d.notify({uploadFailed: err});
              return d.resolve(id);
            });
          });
        } else {
          return d.resolve(id);
        }
      },
      function(err) {
        $log.error(err);
        d.reject(err);
      }
    );
    return d.promise;
  }
  return createProject;
}])
  .factory('projectAPI', ['Restangular', function(Restangular) {
    function list(domain, options) {
      var query = options || {};
      query.domain_id = domain;
      return Restangular.all('projects').getList(query);
    }

    function get(id) {
      return Restangular.one('projects', id).get();
    }

    function addMember(id, member) {
      return Restangular.one('projects', id).post(member);
    }

    function getInvitableMembers(id) {
      return Restangular.one('projects', id).all('invitableentities').get();
    }

    function create(body) {
      return Restangular.all('projects').post(body);
    }

    return {
      get: get,
      addMember: addMember,
      getInvitableMembers: getInvitableMembers,
      create: create,
      list: list
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

    function isManager(project, user) {
      return project.creator === user._id;
    }

    return {
      isMember: isMember,
      isManager: isManager,
      canRead: canRead
    };
  });
