(function() {
  'use strict';

  angular.module('esn.calendar')
    .service('calendarAuthorizationHelper', calendarAuthorizationHelper);

  function calendarAuthorizationHelper(calEventUtils, CAL_CALENDAR_AUTHORIZATIONS) {

    return {
      isAllowedTo: isAllowedTo
    };

    ////////////

    /**
     * Check if action is authorized for event
     * @param  {String} action The action to check, must be defined in CAL_CALENDAR_AUTHORIZATIONS constant
     * @param  {Event} event The event to check
     * @returns {Boolean} true if the action is allowed for event. If action in unknown, returns false.
     */
    function isAllowedTo(action, event) {
      var isAllowed = false;
      switch (action) {
        case CAL_CALENDAR_AUTHORIZATIONS.ACCESS_EVENT_DETAIL: isAllowed = event.isPublic() || calEventUtils.isOrganizer(event);
          break;
      }

      return isAllowed;
    }

  }
})();
