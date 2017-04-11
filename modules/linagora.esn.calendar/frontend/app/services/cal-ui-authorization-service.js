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
      canModifyEventRecurrence: canModifyEventRecurrence,
      canModifyPublicSelection: canModifyPublicSelection,
      canModifyEvent: canModifyEvent,
      canShowDelegationTab: canShowDelegationTab
    };

    ////////////

    function canAccessEventDetails(calendar, event, userId) {
      return !!calendar && calendar.isOwner(userId) || (event.isPublic() && calendar.isReadable(userId));
    }

    function canDeleteCalendar(calendar) {
      return !!calendar && (calendar.id !== CAL_DEFAULT_CALENDAR_ID);
    }

    function canModifyEventRecurrence(calendar, event, userId) {
      return _isWritableForCalendar(calendar, userId) && !!event && !event.isInstance();
    }

    function canModifyEvent(calendar, event, userId) {
      if (calEventUtils.isNew(event)) {
        return true;
      }

      return _isWritableForCalendar(calendar, userId);
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

    function _isWritableForCalendar(calendar, userId) {
      return !!calendar && calendar.isWritable(userId);
    }
  }
})();
