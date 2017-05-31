(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalCalendarPublicConfigurationController', CalCalendarPublicConfigurationController);

  function CalCalendarPublicConfigurationController($log, $q, $state, _, notificationFactory, uuid4, calendarService, calendarHomeService, CalendarCollectionShell, userAndExternalCalendars) {
    var self = this;

    self.calendarsPerUser = [];
    self.selectedCalendars = [];
    self.users = [];
    self.getSelectedCalendars = getSelectedCalendars;
    self.onUserAdded = onUserAdded;
    self.onUserRemoved = onUserRemoved;
    self.subscribeToSelectedCalendars = subscribeToSelectedCalendars;

    function filterSubscribedCalendars(userCalendars) {
      return getSubscribedCalendarsForCurrentUser().then(function(subscribedCalendars) {
        var sources = subscribedCalendars.map(function(calendar) {
          return calendar.source;
        });

        return _.filter(userCalendars, function(userCalendar) {
          return !_.contains(sources, userCalendar.calendar.href);
        });
      });
    }

    function getSubscribedCalendarsForCurrentUser() {
      return calendarHomeService.getUserCalendarHomeId()
        .then(calendarService.listCalendars)
        .then(function(calendars) {
          return userAndExternalCalendars(calendars).publicCalendars || [];
        });
    }

    function getPublicCalendarsForUser(user) {
      return calendarService.listPublicCalendars(user._id).then(function(calendars) {
          return calendars.map(function(calendar) {
            return {
              user: user,
              calendar: calendar
            };
          });
        });
    }

    function getSelectedCalendars() {
      return _.chain(self.calendarsPerUser)
        .filter('isSelected')
        .map(function(selected) {
          return selected.calendar;
        })
        .value();
    }

    function onUserAdded(user) {
      if (!user) {
        return;
      }

      getPublicCalendarsForUser(user)
        .then(filterSubscribedCalendars)
        .then(function(userCalendars) {
          self.calendarsPerUser = self.calendarsPerUser.concat(userCalendars);
        })
        .catch(function(err) {
          $log.error('Can not get public calendars for user', user._id, err);
        });
    }

    function onUserRemoved(user) {
      if (!user) {
        return;
      }

      _.remove(self.calendarsPerUser, function(calendarPerUser) {
        return calendarPerUser.user._id === user._id;
      });
    }

    function subscribe(calendars) {
      return calendarHomeService.getUserCalendarHomeId().then(function(calendarHomeId) {
        return $q.all(calendars.map(function(calendar) {
          var id = uuid4.generate();
          var subscription = CalendarCollectionShell.from({
            color: calendar.color,
            description: calendar.description,
            href: CalendarCollectionShell.buildHref(calendarHomeId, id),
            id: id,
            name: calendar.name,
            source: calendar.href
          });

          return calendarService.subscribe(calendarHomeId, subscription);
        }));
      });
    }

    function subscribeToSelectedCalendars() {
      var selectedCalendars = getSelectedCalendars();

      selectedCalendars.length && subscribe(selectedCalendars).then(function() {
        notificationFactory.weakInfo('Subscription', 'Successfully subscribed to calendar' + (selectedCalendars.length ? 's' : ''));
      }, function() {
        notificationFactory.weakError('Subscription', 'Can not subscribe to calendar' + (selectedCalendars.length ? 's' : ''));
      });
    }
  }
})();
