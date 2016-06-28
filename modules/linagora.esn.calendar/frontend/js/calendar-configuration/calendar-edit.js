'use strict';

angular.module('esn.calendar')
  .controller('calendarEditionController', function($scope, $log, $state, $modal, uuid4, calendarService, CalendarCollectionShell, notificationFactory, screenSize, DelegationEditionHelper, CALENDAR_MODIFY_COMPARE_KEYS, CALENDAR_RIGHT, CalendarRightShell, $q, userAPI, _, userUtils) {
    var calendarRight, originalCalendarRight;

    $scope.newCalendar = !$scope.calendar;
    $scope.calendar = $scope.calendar || {};

    if ($scope.newCalendar) {
      calendarRight = $q.when(new CalendarRightShell());
    } else {
      calendarRight = calendarService.getRight($scope.calendarHomeId, $scope.calendar);
    }

    $scope.oldCalendar = {};
    angular.copy($scope.calendar, $scope.oldCalendar);
    $scope.delegations = [];
    $scope.selection = 'none';
    $scope.delegationTypes = [{
      value: CALENDAR_RIGHT.NONE,
      name: 'None',
      access: 'all'
    }, {
      value: CALENDAR_RIGHT.ADMIN,
      name: 'Administration',
      access: 'users'
    }, {
      value: CALENDAR_RIGHT.READ_WRITE,
      name: 'Read and Write',
      access: 'users'
    }, {
      value: CALENDAR_RIGHT.READ,
      name: 'Read only',
      access: 'all'
    }, {
      value:CALENDAR_RIGHT.FREE_BUSY,
      name: 'Free/Busy',
      access: 'all'
    }];

    var delegationEditionHelperInstance = new DelegationEditionHelper();

    calendarRight.then(function(calendarRightShell) {
      $scope.publicSelection = calendarRightShell.getPublicRight();
      $scope.isAdmin = calendarRightShell.getUserRight($scope.calendarHomeId) === CALENDAR_RIGHT.ADMIN;
      var usersRight = calendarRightShell.getAllUserRight().filter(function(usersRight) {
        return usersRight.userId !== $scope.calendarHomeId;
      });

      $q.all(_.chain(usersRight).map('userId').map(userAPI.user).values()).then(function(users) {
        _.chain(users).map('data').zip(usersRight).forEach(function(array) {
          var user = array[0];
          var right = array[1].right;

          user.displayName = userUtils.displayNameOf(user);
          $scope.delegations = delegationEditionHelperInstance.addUserGroup([user], right);
        });
      });
    });

    if ($scope.newCalendar) {
      $scope.calendar.href = CalendarCollectionShell.buildHref($scope.calendarHomeId, uuid4.generate());
      $scope.calendar.color = '#' + Math.random().toString(16).substr(-6);
    }

    function canSaveCalendar() {
      return !!$scope.calendar.name && $scope.calendar.name.length >= 1;
    }

    function hasModifications(oldCalendar, newCalendar) {
      return CALENDAR_MODIFY_COMPARE_KEYS.some(function(key) {
        return !angular.equals(oldCalendar[key], newCalendar[key]);
      });
    }

    function reset() {
      $scope.newUsersGroups = [];
      $scope.selection = CALENDAR_RIGHT.NONE;
    }

    $scope.submit = function() {
      if (!canSaveCalendar()) {
        return;
      }

      var shell = CalendarCollectionShell.from($scope.calendar);

      if ($scope.newCalendar) {
        calendarService.createCalendar($scope.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', $scope.calendar.name + ' has been created.');
            $state.go('calendar.main');
          });
      } else {
        calendarRight.then(function(calendarRight) {
          originalCalendarRight = calendarRight.clone();
          delegationEditionHelperInstance.getAllRemovedUsersId().map(calendarRight.removeUserRight.bind(calendarRight));

          $scope.delegations.forEach(function(line) {
            calendarRight.update(line.user._id, line.user.preferredEmail, line.selection);
          });

          var rightChanged = !calendarRight.equals(originalCalendarRight);
          var calendarChanged = hasModifications($scope.oldCalendar, $scope.calendar);
          var updateActions = [];

          if (!rightChanged && !calendarChanged) {
            if (screenSize.is('xs, sm')) {
              $state.go('calendar.list');
            } else {
              $state.go('calendar.main');
            }

            return;
          }

          if (calendarChanged) {
            updateActions.push(calendarService.modifyCalendar($scope.calendarHomeId, shell, calendarRight));
          }

          if (rightChanged) {
            updateActions.push(calendarService.modifyRights($scope.calendarHomeId, shell, calendarRight, originalCalendarRight));
          }

          $q.all(updateActions).then(function() {
            notificationFactory.weakInfo('Calendar - ', $scope.calendar.name + ' has been modified.');
            $state.go('calendar.main');
          });
        });
      }
    };

    $scope.addUserGroup = function() {
      $scope.delegations = delegationEditionHelperInstance.addUserGroup($scope.newUsersGroups, $scope.selection);
      if ($scope.newCalendar) {
        throw new Error('edition of right on new calendar are not implemented yet');
      }
      reset();
    };

    $scope.removeUserGroup = function(delegationSelected) {
      $scope.delegations = delegationEditionHelperInstance.removeUserGroup(delegationSelected);
    };

    $scope.openDeleteConfirmationDialog = function() {
      $scope.modal = $modal({scope: $scope, templateUrl: '/calendar/views/calendar-configuration/calendar-edit-delete-confirmation.html', backdrop: 'static', placement: 'center'});
    };

    $scope.delete = function() {
      $log.debug('Delete calendar not implemented yet');
    };

    $scope.cancel = function() {
      $state.go('calendar.main');
    };

    $scope.cancelMobile = function() {
      $state.go('calendar.list');
    };

    $scope.selectedTab = 'main';

    $scope.getMainView = function() {
      $scope.selectedTab = 'main';
    };

    $scope.getDelegationView = function() {
      $scope.selectedTab = 'delegation';
    };

    $scope.goToEditDelegation = function() {
      $state.go('calendar.edit-delegation');
    };

    $scope.goToCalendarEdit = function(isCancel) {
      $state.go('calendar.edit');
    };
  })
  .directive('calendarEdit', function() {
    return {
      restrict: 'E',
      scope: {
        calendar: '=?',
        calendarHomeId: '='
      },
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
      controller: 'calendarEditionController'
    };
  })
  .directive('calendarEditionHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit-header.html'
    };
  })
  .directive('calendarEditDelegationAddUsers', function(CALENDAR_RIGHT) {
    return {
      restrict: 'E',
      replace: true,
      controller: 'calendarEditionController',
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit-delegation-add-users',
      link: function(scope) {
        scope.permission = CALENDAR_RIGHT.NONE;
      }
    };
  })
  .directive('calendarEditDelegationAddUsersHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit-delegation-add-users-header.html',
      controller: 'calendarEditionController'
    };
  });
