(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarConfigurationController', calendarConfigurationController);

  function calendarConfigurationController(
    $state,
    $stateParams,
    $q,
    _,
    CalendarCollectionShell,
    calendarService,
    calPublicCalendarStore,
    calendarHomeService,
    calendarAPI,
    matchmedia,
    notificationFactory,
    uuid4,
    userAPI,
    userUtils,
    SM_XS_MEDIA_QUERY,
    CAL_CALENDAR_MODIFY_COMPARE_KEYS,
    CAL_CALENDAR_PUBLIC_RIGHT,
    CAL_CALENDAR_SHARED_RIGHT,
    CalDelegationEditionHelper
  ) {
    var self = this;
    var CaldelegationEditionHelperInstance = new CalDelegationEditionHelper();

    self.submit = submit;
    self.addUserGroup = addUserGroup;
    self.removeUserGroup = removeUserGroup;
    self.$onInit = $onInit;
    self.activate = activate;

    ////////////

    function $onInit() {
      calendarHomeService.getUserCalendarHomeId()
        .then(function(calendarHomeId) {
          self.calendarHomeId = calendarHomeId;

          return calendarHomeId;
        })
        .then(function(calendarHomeId) {
          if ($stateParams.calendarUniqueId) {
            if (self.getFromPublicCalendarStore) {
              return calPublicCalendarStore.getById($stateParams.calendarUniqueId);
            } else {
              var splitUniqueId = CalendarCollectionShell.splitUniqueId($stateParams.calendarUniqueId);

              return calendarService.getCalendar(calendarHomeId, splitUniqueId.calendarId);
            }
          }
        })
        .then(function(calendar) {
          self.calendar = calendar;

          return self.activate();
        })
        .then(function() {
          if ($stateParams.addUsersFromDelegationState) {
            self.newUsersGroups = $stateParams.addUsersFromDelegationState.newUsersGroups;
            self.selectedShareeRight = $stateParams.addUsersFromDelegationState.selectedShareeRight;

            self.addUserGroup();
            self.selectedTab = 'delegation';
          }
        });
    }

    function activate() {
      self.newCalendar = !self.calendar;
      self.calendar = self.calendar || {};
      self.oldCalendar = {};
      self.newUsersGroups = [];
      self.selectedTab = 'main';
      self.delegations = [];

      angular.copy(self.calendar, self.oldCalendar);

      if (self.newCalendar) {
        var initCalendar = {};

        initCalendar.href = CalendarCollectionShell.buildHref(self.calendarHomeId, uuid4.generate());
        initCalendar.color = '#' + Math.random().toString(16).substr(-6);

        self.calendar = CalendarCollectionShell.from(initCalendar);
        self.calendar.name = '';
      }

      resetDelegationFields();
      self.publicSelection = self.calendar.rights.getPublicRight();
      var allShareeRights = self.calendar.rights.getAllShareeRights();

      $q.all(_.chain(allShareeRights).map('userId').map(userAPI.user).values()).then(function(users) {
        _.chain(users).map('data').zip(allShareeRights).forEach(function(array) {
          var user = array[0];
          var right = array[1].right;

          user.displayName = userUtils.displayNameOf(user);
          self.delegations = CaldelegationEditionHelperInstance.addUserGroup([user], right);
        });
      });
    }

    function _canSaveCalendar() {
      return !!self.calendar.name && self.calendar.name.length >= 1;
    }

    function _hasModifications(oldCalendar, newCalendar) {
      return CAL_CALENDAR_MODIFY_COMPARE_KEYS.some(function(key) {
        return !angular.equals(oldCalendar[key], newCalendar[key]);
      });
    }

    function submit() {
      if (!_canSaveCalendar()) {
        return;
      }

      if (self.newCalendar) {
        calendarService.createCalendar(self.calendarHomeId, self.calendar)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', self.calendar.name + ' has been created.');
            $state.go('calendar.main');
          });
      } else {
        CaldelegationEditionHelperInstance.getAllRemovedUsersId().map(function(removedUserId) {
          self.calendar.rights.removeShareeRight(removedUserId);
        });

        self.delegations.forEach(function(line) {
          self.calendar.rights.updateSharee(line.user._id, line.user.preferredEmail, line.selection);
        });

        var rightChanged = !self.calendar.rights.equals(self.oldCalendar.rights);
        var calendarChanged = _hasModifications(self.oldCalendar, self.calendar);
        var updateActions = [];
        var publicRightChanged = self.publicSelection !== self.calendar.rights.getPublicRight();

        if (!rightChanged && !calendarChanged && !publicRightChanged) {
          if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
            $state.go('calendar.list');
          } else {
            $state.go('calendar.main');
          }

          return;
        }

        if (calendarChanged) {
          updateActions.push(calendarService.modifyCalendar(self.calendarHomeId, self.calendar));
        }

        if (rightChanged) {
          updateActions.push(calendarService.modifyRights(self.calendarHomeId, self.calendar, self.calendar.rights, self.oldCalendar.rights));
        }

        if (publicRightChanged) {
          switch (self.publicSelection) {
            case CAL_CALENDAR_PUBLIC_RIGHT.READ:
            case CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE:
            case CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY:
              updateActions.push(calendarAPI.modifyPublicRights(self.calendarHomeId, self.calendar.id, { public_right: self.publicSelection }));
          }
        }

        $q.all(updateActions).then(function() {
          notificationFactory.weakInfo('Calendar - ', self.calendar.name + ' has been modified.');
          $state.go('calendar.main');
        });
      }
    }

    function addUserGroup() {
      self.delegations = CaldelegationEditionHelperInstance.addUserGroup(self.newUsersGroups, self.selectedShareeRight);

      if (self.newCalendar) {
        throw new Error('edition of right on new calendar are not implemented yet');
      }

      resetDelegationFields();
    }

    function removeUserGroup(delegationSelected) {
      self.delegations = CaldelegationEditionHelperInstance.removeUserGroup(delegationSelected);
    }

    function resetDelegationFields() {
      self.newUsersGroups = [];
      self.selectedShareeRight = CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ;
    }
  }
})();
