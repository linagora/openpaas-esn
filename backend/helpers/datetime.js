const momentTimeZone = require('moment-timezone');

module.exports = {
  isSupportedTimeZone
};

function isSupportedTimeZone(timeZone) {
  return timeZone && !!momentTimeZone.tz.zone(timeZone);
}
