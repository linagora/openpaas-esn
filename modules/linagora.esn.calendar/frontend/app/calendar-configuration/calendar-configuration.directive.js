(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarConfiguration', calendarConfiguration);

  function calendarConfiguration() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendar-configuration/calendar-configuration.html',
      scope: {
        calendar: '=?',
        calendarHomeId: '='
      },
      replace: true,
      controller: CalendarConfigurationController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  function CalendarConfigurationController(
    $log,
    $modal,
    $scope,
    $state,
    matchmedia,
    SM_XS_MEDIA_QUERY,
    uuid4,
    CalendarCollectionShell,
    calendarService,
    notificationFactory,
    CALENDAR_MODIFY_COMPARE_KEYS,
    CALENDAR_RIGHT,
    CalendarRightShell,
    CalDelegationEditionHelper,
    $q,
    userAPI,
    _,
    userUtils
  ) {
    var self = this;
    var calendarRight, originalCalendarRight;
    var CaldelegationEditionHelperInstance = new CalDelegationEditionHelper();

    self.newCalendar = !self.calendar;
    self.calendar = self.calendar || {};
    self.oldCalendar = {};
    self.newUsersGroups = [];
    self.selectedTab = 'main';
    self.submit = submit;
    self.openDeleteConfirmationDialog = openDeleteConfirmationDialog;
    self.delete = deleteCalendar;
    self.cancel = cancel;
    self.cancelMobile = cancelMobile;
    self.getMainView = getMainView;
    self.getDelegationView = getDelegationView;
    self.addUserGroup = addUserGroup;
    self.removeUserGroup = removeUserGroup;
    self.goToEditDelegation = goToEditDelegation;
    self.goToCalendarEdit = goToCalendarEdit;

    activate();

    ////////////

    function activate() {
      if (self.newCalendar) {
        calendarRight = $q.when(new CalendarRightShell());
      } else {
        calendarRight = calendarService.getRight(self.calendarHomeId, self.calendar);
      }
      angular.copy(self.calendar, self.oldCalendar);
      self.delegations = [];
      self.selection = 'none';
      self.delegationTypes = [{
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
        value: CALENDAR_RIGHT.FREE_BUSY,
        name: 'Free/Busy',
        access: 'all'
      }];

      calendarRight.then(function(calendarRightShell) {
        self.publicSelection = calendarRightShell.getPublicRight();
        self.isAdmin = calendarRightShell.getUserRight(self.calendarHomeId) === CALENDAR_RIGHT.ADMIN;
        var usersRight = calendarRightShell.getAllUserRight().filter(function(usersRight) {
          return usersRight.userId !== self.calendarHomeId;
        });

        $q.all(_.chain(usersRight).map('userId').map(userAPI.user).values()).then(function(users) {
          _.chain(users).map('data').zip(usersRight).forEach(function(array) {
            var user = array[0];
            var right = array[1].right;

            user.displayName = userUtils.displayNameOf(user);
            self.delegations = CaldelegationEditionHelperInstance.addUserGroup([user], right);
          });
        });
      });
      if (self.newCalendar) {
        self.calendar.href = CalendarCollectionShell.buildHref(self.calendarHomeId, uuid4.generate());
        self.calendar.color = '#' + Math.random().toString(16).substr(-6);
      }
    }

    function _canSaveCalendar() {
      return !!self.calendar.name && self.calendar.name.length >= 1;
    }

    function _hasModifications(oldCalendar, newCalendar) {
      return CALENDAR_MODIFY_COMPARE_KEYS.some(function(key) {
        return !angular.equals(oldCalendar[key], newCalendar[key]);
      });
    }

    function submit() {
      if (!_canSaveCalendar()) {
        return;
      }

      var shell = CalendarCollectionShell.from(self.calendar);

      if (self.newCalendar) {
        calendarService.createCalendar(self.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', self.calendar.name + ' has been created.');
            $state.go('calendar.main');
          });
      } else {
        calendarRight.then(function(calendarRight) {
          originalCalendarRight = calendarRight.clone();
          CaldelegationEditionHelperInstance.getAllRemovedUsersId().map(calendarRight.removeUserRight.bind(calendarRight));

          self.delegations.forEach(function(line) {
            calendarRight.update(line.user._id, line.user.preferredEmail, line.selection);
          });

          var rightChanged = !calendarRight.equals(originalCalendarRight);
          var calendarChanged = _hasModifications(self.oldCalendar, self.calendar);
          var updateActions = [];

          if (!rightChanged && !calendarChanged) {
            if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
              $state.go('calendar.list');
            } else {
              $state.go('calendar.main');
            }

            return;
          }

          if (calendarChanged) {
            updateActions.push(calendarService.modifyCalendar(self.calendarHomeId, shell, calendarRight));
          }

          if (rightChanged) {
            updateActions.push(calendarService.modifyRights(self.calendarHomeId, shell, calendarRight, originalCalendarRight));
          }

          $q.all(updateActions).then(function() {
            notificationFactory.weakInfo('Calendar - ', self.calendar.name + ' has been modified.');
            $state.go('calendar.main');
          });
        });
      }
    }

    function openDeleteConfirmationDialog() {
      self.modal = $modal({
        templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-delete-confirmation.html',
        controller: function($scope) {
          $scope.delete = function deleteCalendar() {
            $log.debug('Delete calendar not implemented yet');
          };
        },
        backdrop: 'static',
        placement: 'center'
      });
    }

     function addUserGroup() {
      self.delegations = CaldelegationEditionHelperInstance.addUserGroup(self.newUsersGroups, self.selection);
      if (self.newCalendar) {
        throw new Error('edition of right on new calendar are not implemented yet');
      }
      reset();
    }

    function removeUserGroup(delegationSelected) {
      self.delegations = CaldelegationEditionHelperInstance.removeUserGroup(delegationSelected);
    }

    function reset() {
      self.newUsersGroups = [];
      self.selection = CALENDAR_RIGHT.NONE;
    }

    function deleteCalendar() {
      $log.debug('Delete calendar not implemented yet');
    }

    function cancel() {
      $state.go('calendar.main');
    }

    function cancelMobile() {
      $state.go('calendar.list');
    }

    function getMainView() {
      self.selectedTab = 'main';
    }

    function getDelegationView() {
      self.selectedTab = 'delegation';
    }

    function goToEditDelegation() {
      $state.go('calendar.edit-delegation');
    }

    function goToCalendarEdit(isCancel) {
      $state.go('calendar.edit');
    }
  }
})();
