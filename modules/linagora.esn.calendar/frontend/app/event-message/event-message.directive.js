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
    var vm = this;

    vm.changeParticipation = changeParticipation;
    vm.isEventLoaded = false;
    vm.isLoadFailed = false;

    activate();

    ////////////

    function activate() {
      eventService.getEvent(vm.message.eventId).then(function(event) {
        // Set up dom nodes
        vm.event = event;

        // Load participation status
        var vcalendar = event.vcalendar;
        var emails = session.user.emails;
        var attendees = eventService.getInvitedAttendees(vcalendar, emails);
        var organizer = attendees.filter(function(att) {
          return att.name === 'organizer' && att.getParameter('partstat');
        });

        var attendee = organizer[0] || attendees[0];

        if (attendee) {
          vm.partstat = attendee.getParameter('partstat');
        }
        _updateAttendeeStats();
        vm.isEventLoaded = true;
      }, function(response) {
        var error = 'Could not retrieve event: ' + response.statusText;

        vm.isLoadFailed = true;
        $log.error(error);
      });
    }

    function changeParticipation(partstat) {
      var event = vm.event;
      var path = vm.event.path;
      var etag = vm.event.etag;
      var emails = session.user.emails;

      eventService.changeParticipation(path, event, emails, partstat, etag, false)
        .then(function(shell) {
          vm.partstat = partstat;
          if (shell) {
            vm.event = shell;
            _updateAttendeeStats();
          }
        });
    }

    function _updateAttendeeStats() {
      vm.attendeesPerPartstat = eventMessageService.computeAttendeeStats(vm.event.attendees);
      vm.hasAttendees = !!vm.event.attendees;
    }
  }

})();
