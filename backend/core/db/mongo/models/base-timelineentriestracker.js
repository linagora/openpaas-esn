'use strict';

/**
 * {
 *   _id: UID (the mongodb id of the user),
 *   timelines: {
 *     ASID (mongodb id of the activity stream) : ID (mongodb id of the last timelineentry id handled on behalf of the user)
 *   }
 * }
 */
module.exports = {
  timelines: {type: Object}
};
