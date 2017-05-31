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
      canModifyCalendarProperties: canModifyCalendarProperties,
      canModifyEvent: canModifyEvent,
      canModifyEventAttendees: canModifyEventAttendees,
      canModifyEventRecurrence: canModifyEventRecurrence,
      canModifyPublicSelection: canModifyPublicSelection,
      canShowDelegationTab: canShowDelegationTab
    };

    ////////////

    function canAccessEventDetails(calendar, event, userId) {
      return !!calendar && !!event && (calEventUtils.isOrganizer(event) || (event.isPublic() && calendar.isReadable(userId)));
    }

    function canDeleteCalendar(calendar, userId) {
      return !!calendar && (calendar.id !== CAL_DEFAULT_CALENDAR_ID) && canModifyCalendarProperties(calendar, userId);
    }

    function canModifyEvent(calendar, event, userId) {
      if (!!event && calEventUtils.isNew(event)) {
        return true;
      }

      return _canModifyEvent(calendar, event, userId);
    }

    function canModifyEventAttendees(event) {
      //Sharees with Write permissions cannot modify attendee list according to the RFC
      //https://github.com/apple/ccs-calendarserver/blob/master/doc/Extensions/caldav-sharing.txt#L847
      return !!event && calEventUtils.isOrganizer(event);
    }

    function canModifyEventRecurrence(calendar, event, userId) {
      return _canModifyEvent(calendar, event, userId) && !!event && !event.isInstance();
    }

    function canModifyPublicSelection(calendar, userId) {
      return _isAdminForCalendar(calendar, userId);
    }

    function canModifyCalendarProperties(calendar, userId) {
      // the owner of a Subscription is not the same the current user, so we need to check for calendar.isSubscription()
      // to allow the user to unsubscribe from a public calendar
      return !!calendar && (calendar.isOwner(userId) || calendar.isShared(userId) || calendar.isSubscription());
    }

    function canShowDelegationTab(calendar, userId) {
      return _isAdminForCalendar(calendar, userId);
    }

    function _isAdminForCalendar(calendar, userId) {
      return !!calendar && calendar.isAdmin(userId) && !calendar.isSubscription();
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
