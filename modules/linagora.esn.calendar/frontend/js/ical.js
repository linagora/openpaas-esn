/*global ICAL */

'use strict';

angular.module('esn.ical', [])
  .constant('ICAL', ICAL)
  .constant('ICAL_PROPERTIES', {
    partstat: {
      needsaction: 'NEEDS-ACTION',
      accepted: 'ACCEPTED',
      declined: 'DECLINED',
      tentative: 'TENTATIVE'
    },
    rsvp: {
      true: 'TRUE',
      false: 'FALSE'
    },
    role: {
      reqparticipant: 'REQ-PARTICIPANT',
      chair: 'CHAIR'
    }
  });
