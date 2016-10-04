(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventMessage', eventMessage);

  function eventMessage() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-message/event-message.html',
      scope: {
        activitystream: '=',
        message: '=',
        parentMessage: '=',
        lastPost: '='
      },
      replace: true,
      controller: EventMessageController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  EventMessageController.$inject = [
    '$log',
    'eventMessageService',
    'eventService',
    'session'
  ];

  function EventMessageController($log, eventMessageService, eventService, session) {
    var self = this;

    self.changeParticipation = changeParticipation;
    self.isEventLoaded = false;
    self.isLoadFailed = false;

    activate();

    ////////////

    function activate() {
      eventService.getEvent(self.message.eventId).then(function(event) {
        // Set up dom nodes
        self.event = event;

        // Load participation status
        var vcalendar = event.vcalendar;
        var emails = session.user.emails;
        var attendees = eventService.getInvitedAttendees(vcalendar, emails);
        var organizer = attendees.filter(function(att) {
          return att.name === 'organizer' && att.getParameter('partstat');
        });

        var attendee = organizer[0] || attendees[0];

        if (attendee) {
          self.partstat = attendee.getParameter('partstat');
        }
        _updateAttendeeStats();
        self.isEventLoaded = true;
      }, function(response) {
        var error = 'Could not retrieve event: ' + response.statusText;

        self.isLoadFailed = true;
        $log.error(error);
      });
    }

    function changeParticipation(partstat) {
      var event = self.event;
      var path = self.event.path;
      var etag = self.event.etag;
      var emails = session.user.emails;

      eventService.changeParticipation(path, event, emails, partstat, etag, false)
        .then(function(shell) {
          self.partstat = partstat;
          if (shell) {
            self.event = shell;
            _updateAttendeeStats();
          }
        });
    }

    function _updateAttendeeStats() {
      self.attendeesPerPartstat = eventMessageService.computeAttendeeStats(self.event.attendees);
      self.hasAttendees = !!self.event.attendees;
    }
  }

})();
