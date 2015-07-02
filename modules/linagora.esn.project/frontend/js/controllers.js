'use strict';

angular.module('esn.project')
  .controller('projectController', function($scope, projectService, session, project) {
      $scope.project = project;
      $scope.streams = [];

      $scope.canRead = function() {
        return projectService.canRead(project);
      };

      $scope.isProjectManager = function() {
        return projectService.isManager($scope.project, session.user);
      };

      $scope.canWrite = function() {
        return projectService.canWrite($scope.project);
      };

      $scope.writable = $scope.canWrite();
    })
  .controller('projectsController', function($scope, $log, $location, projectAPI, domain, user) {
      $scope.projects = [];
      $scope.error = false;
      $scope.loading = false;
      $scope.user = user;
      $scope.domain = domain;
      $scope.selected = '';

      $scope.getAll = function() {
        $scope.selected = 'all';
        $scope.loading = true;
        projectAPI.list(domain._id).then(
          function(response) {
            $scope.projects = response.data;
          },
          function(err) {
            $log.error('Error while getting projects', err);
            $scope.error = true;
            $scope.projects = [];
          }
        ).finally (
          function() {
            $scope.loading = false;
          }
        );
      };

      $scope.getMembership = function() {
        $scope.selected = 'membership';
        return $scope.getAll();
      };

      $scope.getModerator = function() {
        $scope.selected = 'moderator';
        return $scope.getAll();
      };

      $scope.getAll();
  })
  .controller('projectsAStrackerController', function($rootScope, $scope, $log, AStrackerHelpers, ASTrackerNotificationService, projectAPI) {
      $scope.activityStreams = ASTrackerNotificationService.streams;
      $scope.show = false;
      $scope.load = true;

      AStrackerHelpers.getActivityStreamsWithUnreadCount('project', function(err, result) {
        if (err) {
          $scope.error = 'Error while getting unread message: ' + err;
          return;
        }

        var tracked = 0;

        result.forEach(function(element) {
          element.objectType = 'project';
          element.href = '/#/project/' + element.target._id;
          element.img = '/project/api/projects/' + element.target._id + '/avatar';

          var registered = ASTrackerNotificationService.subscribeToStreamNotification(element.uuid);
          if (registered) {
            tracked++;
            ASTrackerNotificationService.addItem(element);
          }
        });
        $scope.load = false;
        $scope.show = tracked > 0;
      });
  })
  .controller('projectMembersController', function($scope, collaborationAPI, session, usSpinnerService) {
      var project_id = $scope.project._id;
      $scope.spinnerKey = 'membersSpinner';

      var opts = {
        offset: 0,
        limit: 20
      };

      $scope.total = 0;
      $scope.domain = session.domain;
      $scope.members = [];
      $scope.restActive = false;
      $scope.error = false;
      $scope.offset = 0;

      function updateMembersList() {
        $scope.error = false;
        if ($scope.restActive) {
          return;
        }
        $scope.restActive = true;
        usSpinnerService.spin($scope.spinnerKey);

        collaborationAPI.getMembers('project', project_id, opts).then(function(result) {
          $scope.total = parseInt(result.headers('X-ESN-Items-Count'));
          $scope.offset += result.data.length;

          var members = result.data.filter(function(member) {
            return member.user !== undefined;
          });

          $scope.members = $scope.members.concat(members.map(function(member) {
            return member.user;
          }));
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.restActive = false;
          usSpinnerService.stop($scope.spinnerKey);
        });
      }

      $scope.init = function() {
        updateMembersList();
      };

      $scope.loadMoreElements = function() {
        if ($scope.offset === 0 || $scope.offset < $scope.total) {
          opts.offset = $scope.offset;
          updateMembersList();
        }
      };
      $scope.init();
    });
