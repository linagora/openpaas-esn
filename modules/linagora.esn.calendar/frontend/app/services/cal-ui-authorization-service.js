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
      canShowDelegationTab: canShowDelegationTab
    };

    ////////////

    function canAccessEventDetails(event) {
      return event.isPublic() || calEventUtils.isOrganizer(event);
    }

    function canDeleteCalendar(calendar) {
      return !!calendar && (calendar.id !== CAL_DEFAULT_CALENDAR_ID);
    }

    function canModifyEventRecurrence(calendar, event, userId) {
      return !!calendar && calendar.isWritable(userId) && !!event && !event.isInstance();
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
  }
})();
