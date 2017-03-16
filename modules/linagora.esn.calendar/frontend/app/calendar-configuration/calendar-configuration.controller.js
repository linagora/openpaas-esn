(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarConfigurationController', calendarConfigurationController);

  function calendarConfigurationController(
    $modal,
    $scope,
    $state,
    $stateParams,
    matchmedia,
    SM_XS_MEDIA_QUERY,
    uuid4,
    CalendarCollectionShell,
    calendarService,
    calendarHomeService,
    notificationFactory,
    CALENDAR_MODIFY_COMPARE_KEYS,
    CALENDAR_RIGHT,
    DEFAULT_CALENDAR_ID,
    CalendarRightShell,
    CalDelegationEditionHelper,
    $q,
    userAPI,
    _,
    userUtils,
    calendarAPI
  ) {
    var self = this;
    var calendarRight, originalCalendarRight;
    var CaldelegationEditionHelperInstance = new CalDelegationEditionHelper();

    self.submit = submit;
    self.openDeleteConfirmationDialog = openDeleteConfirmationDialog;
    self.delete = removeCalendar;
    self.cancel = cancel;
    self.cancelMobile = cancelMobile;
    self.getMainView = getMainView;
    self.getDelegationView = getDelegationView;
    self.addUserGroup = addUserGroup;
    self.removeUserGroup = removeUserGroup;
    self.$onInit = $onInit;
    self.activate = activate;
    self.onAddingUser = onAddingUser;

    ////////////

    function $onInit() {
      calendarHomeService.getUserCalendarHomeId()
        .then(function(calendarHomeId) {
          self.calendarHomeId = calendarHomeId;

          if ($stateParams.calendarId) {
            return calendarService.getCalendar(calendarHomeId, $stateParams.calendarId);
          }
        })
        .then(function(calendar) {
          self.calendar = calendar;

          return self.activate();
        })
        .then(function() {
          if ($stateParams.addUsersFromDelegationState) {
            self.newUsersGroups = $stateParams.addUsersFromDelegationState.newUsersGroups;
            self.selection = $stateParams.addUsersFromDelegationState.selection;

            self.addUserGroup();
            self.getDelegationView();
          }
        });
    }

    function activate() {
      self.newCalendar = !self.calendar;
      self.calendar = self.calendar || {};
      self.oldCalendar = {};
      self.newUsersGroups = [];
      self.selectedTab = 'main';
      self.isDefaultCalendar = self.calendar.id === DEFAULT_CALENDAR_ID;

      if (self.newCalendar) {
        calendarRight = $q.when(new CalendarRightShell());
      } else {
        calendarRight = calendarService.getRight(self.calendarHomeId, self.calendar);
      }

      angular.copy(self.calendar, self.oldCalendar);
      self.delegations = self.delegations || [];
      self.selection = 'none';
      self.delegationTypes = [{
        value: CALENDAR_RIGHT.NONE,
        name: 'None',
        access: 'all'
      }, {
        value: CALENDAR_RIGHT.SHAREE_ADMIN,
        name: 'Administration',
        access: 'users'
      }, {
        value: CALENDAR_RIGHT.READ_WRITE,
        name: 'Read and Write',
        access: 'users'
      }, {
        value: CALENDAR_RIGHT.SHAREE_READ,
        name: 'Read only',
        access: 'all'
      }, {
        value: CALENDAR_RIGHT.SHAREE_FREE_BUSY,
        name: 'Free/Busy',
        access: 'all'
      }];
      self.publicRights = [
        {
          value: CALENDAR_RIGHT.PUBLIC_READ,
          name: 'Read'
        },
        {
          value: CALENDAR_RIGHT.WRITE,
          name: 'Write'
        }, {
          value: CALENDAR_RIGHT.FREE_BUSY,
          name: 'Private'
        }
      ];

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
        calendarRight.then(function(calendarRightShell) {
          originalCalendarRight = calendarRightShell.clone();
          CaldelegationEditionHelperInstance.getAllRemovedUsersId().map(function(removedUserId) {
            calendarRightShell.removeUserRight(removedUserId);
          });

          self.delegations.forEach(function(line) {
            calendarRightShell.update(line.user._id, line.user.preferredEmail, line.selection);
          });

          var rightChanged = !calendarRightShell.equals(originalCalendarRight);
          var calendarChanged = _hasModifications(self.oldCalendar, self.calendar);
          var updateActions = [];
          var publicRightChanged = self.publicSelection !== calendarRightShell.getPublicRight();

          if (!rightChanged && !calendarChanged && !publicRightChanged) {
            if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
              $state.go('calendar.list');
            } else {
              $state.go('calendar.main');
            }

            return;
          }

          if (calendarChanged) {
            updateActions.push(calendarService.modifyCalendar(self.calendarHomeId, shell, calendarRightShell));
          }

          if (rightChanged) {
            updateActions.push(calendarService.modifyRights(self.calendarHomeId, shell, calendarRightShell, originalCalendarRight));
          }

          if (publicRightChanged) {
            switch (self.publicSelection) {
              case CALENDAR_RIGHT.PUBLIC_READ:
                updateActions.push(calendarAPI.modifyPublicRights(self.calendarHomeId, self.calendar.id, { public_right: '{DAV:}read' }));
                break;
              case CALENDAR_RIGHT.WRITE:
                updateActions.push(calendarAPI.modifyPublicRights(self.calendarHomeId, self.calendar.id, { public_right: '{DAV:}write' }));
                break;
              case CALENDAR_RIGHT.FREE_BUSY:
                updateActions.push(calendarAPI.modifyPublicRights(self.calendarHomeId, self.calendar.id, { public_right: '{urn:ietf:params:xml:ns:caldav}read-free-busy' }));
                break;
            }
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
        templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-delete-confirmation/calendar-configuration-delete-confirmation.html',
        controller: function($scope) {
          $scope.calendarName = self.calendar.name;
          $scope.delete = removeCalendar;
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

    function removeCalendar() {
      calendarService.removeCalendar(self.calendarHomeId, self.calendar).then(function() {
        $state.go('calendar.main');
      });
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

    function onAddingUser($tags) {
      var canBeAdded = !!$tags._id && !self.delegations.some(function(delegation) {
        return $tags._id === delegation.user._id;
      });

      return canBeAdded;
    }
  }
})();
