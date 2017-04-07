(function() {
  'use strict';

  angular.module('esn.calendar')
    .service('calUIAuthorizationService', calUIAuthorizationService);

  function calUIAuthorizationService(
    calEventUtils,
    CAL_DEFAULT_CALENDAR_ID
  ) {

    return {
      canAccessEventDetails: canAccessEventDetails,
      canDeleteCalendar: canDeleteCalendar,
      canModifyPublicSelection: canModifyPublicSelection
    };

    ////////////

    function canAccessEventDetails(event) {
      return event.isPublic() || calEventUtils.isOrganizer(event);
    }

    function canDeleteCalendar(calendar) {
      return !!calendar && (calendar.id !== CAL_DEFAULT_CALENDAR_ID);
    }

    function canModifyPublicSelection(calendar, userId) {
      return !!calendar && calendar.isAdmin(userId);
    }
  }
})();
