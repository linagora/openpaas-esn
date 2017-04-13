(function() {
  'use strict';

  angular.module('esn.calendar')
    .service('calUIAuthorizationService', calUIAuthorizationService);

  function calUIAuthorizationService(
    calEventUtils,
    CAL_DEFAULT_CALENDAR_ID,
    CAL_CALENDAR_PUBLIC_RIGHT,
    CAL_CALENDAR_SHARED_RIGHT
  ) {

    return {
      canAccessEventDetails: canAccessEventDetails,
      canDeleteCalendar: canDeleteCalendar,
      canModifyEventRecurrence: canModifyEventRecurrence,
      canModifyPublicSelection: canModifyPublicSelection,
      canModifyEvent: canModifyEvent,
      canShowDelegationTab: canShowDelegationTab
    };

    ////////////

    function canAccessEventDetails(calendar, event, userId) {
      return !!calendar && !!event && (calEventUtils.isOrganizer(event) || (event.isPublic() && calendar.isReadable(userId)));
    }

    function canDeleteCalendar(calendar) {
      return !!calendar && (calendar.id !== CAL_DEFAULT_CALENDAR_ID);
    }

    function canModifyEventRecurrence(calendar, event, userId) {
      return _canModifyEvent(calendar, event, userId) && !!event && !event.isInstance();
    }

    function canModifyEvent(calendar, event, userId) {
      if (!!event && calEventUtils.isNew(event)) {
        return true;
      }

      return _canModifyEvent(calendar, event, userId);
    }

    function canModifyPublicSelection(calendar, userId) {
      return _isAdminForCalendar(calendar, userId);
    }

    function canShowDelegationTab(calendar, userId) {
      return _isAdminForCalendar(calendar, userId);
    }

    function _isAdminForCalendar(calendar, userId) {
      return !!calendar && calendar.isAdmin(userId);
    }

    function _canModifyEvent(calendar, event, userId) {
      var publicRight, sharedRight;

      if (!!calendar && !!event) {
        sharedRight = calendar.rights.getShareeRight(userId);
        publicRight = calendar.rights.getPublicRight();

        return calEventUtils.isOrganizer(event) ||
        sharedRight === CAL_CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE ||
        sharedRight === CAL_CALENDAR_SHARED_RIGHT.SHAREE_ADMIN ||
        publicRight === CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE;
      }

      return false;
    }
  }
})();
