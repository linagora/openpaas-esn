(function() {
  'use strict';

  angular.module('esn.calendar')
    .service('calUIAuthorizationService', calUIAuthorizationService);

  function calUIAuthorizationService(
    calEventUtils,
    CAL_DEFAULT_CALENDAR_ID,
    CAL_CALENDAR_SHARED_RIGHT
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
      // this hack cause personal calendars do not have rights now. When we append rights to personal calendars
      // we should consider "sharee_owner" in requiredSharedRightToModifyPublicSelection
      if (calendar && calendar.rights) {
        var shareeRight = calendar.rights.getShareeRight(userId);
        var requiredSharedRightToModifyPublicSelection = [CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE, CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN];

        return (requiredSharedRightToModifyPublicSelection.indexOf(shareeRight) > -1);
      }

      return true;
    }
  }
})();
