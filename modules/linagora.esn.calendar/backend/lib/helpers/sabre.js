'use strict';

const PATH_SEPARATOR = '/';
const EVENT_UID_SUFFIX = '.ics';

module.exports = {
  parseEventPath
};

/**
 * An EventPath is a Sabre formated string that reference an event.
 * Its format is "/calendars/USER/CAL_ID/EVENT_UID.ics"
 * Where:
 * - USER is a user identifier like 5853fc57e71acc30b2623bd2 (note that with our current sabre-mongo implementation, it is the open-paas user's id)
 * - CAL_ID is the user's calendar identifier, the default user's calendar is "events".
 * - EVENT_UID is the real UUID of the event like 14203613-7642-488f-9b83-d325b5dfb19d,
 */
function parseEventPath(path) {
  const [,, userId, calendarId, eventUiidWithSuffix] = path.split(PATH_SEPARATOR);

  return {
    path,
    userId,
    calendarId,
    eventUiid: _removeEventUiidSuffix(eventUiidWithSuffix)
  };
}

function _removeEventUiidSuffix(eventUiid) {
  if (eventUiid.endsWith(EVENT_UID_SUFFIX)) {
    return eventUiid.slice(0, -EVENT_UID_SUFFIX.length);
  }

  return eventUiid;
}
