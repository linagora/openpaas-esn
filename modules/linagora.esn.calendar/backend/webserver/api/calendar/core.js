'use strict';

var async = require('async');
var q = require('q');
var jcal2content = require('../../../lib/jcal/jcalHelper').jcal2content;
var urlBuilder = require('url');
var extend = require('extend');
var eventMessage,
    i18n,
    userModule,
    collaborationModule,
    messageHelpers,
    arrayHelpers,
    activityStreamHelper,
    localpubsub,
    globalpubsub,
    collaborationPermission,
    contentSender,
    esnconfig,
    staticConfig,
    jwt;

/**
 * Check if the user has the right to create an eventmessage in that
 * collaboration and create the event message and the timeline entry. The
 * callback function is called with either the saved event message or false if
 * the user doesn't have write permissions.
 *
 * @param {object} user             The user object from req.user
 * @param {object} collaboration    The collaboration object from req.collaboration
 * @param {object} event            The event data, see REST_calendars.md
 * @param {function} callback       The callback function
 */
function _create(user, collaboration, event, callback) {
  var userData = {objectType: 'user', id: user._id};

  collaborationPermission.canWrite(collaboration, userData, function(err, result) {
    if (err || !result) {
      return callback(err, result);
    }
    var shares = [{
      objectType: 'activitystream',
      id: collaboration.activity_stream.uuid
    }];

    eventMessage.save({eventId: event.event_id, author: user, shares: shares}, function(err, saved) {
      if (err) {
        return callback(err);
      }

      var targets = messageHelpers.messageSharesToTimelineTarget(saved.shares);
      var activity = activityStreamHelper.userMessageToTimelineEntry(saved, 'post', user, targets);
      localpubsub.topic('message:activity').forward(globalpubsub, activity);
      return callback(null, saved);
    });
  });
}

/**
 * Update the event message belonging to the specified calendar event
 *
 * @param {object} user             The user object from req.user
 * @param {object} collaboration    The collaboration object from req.collaboration
 * @param {object} event            The event data, see REST_calendars.md
 * @param {function} callback       The callback function
 */
function _update(user, collaboration, event, callback) {
  eventMessage.findByEventId(event.event_id, function(err, message) {
    if (err) {
      return callback(err);
    }
    if (!message) {
      return callback(new Error('Could not find matching event message'));
    }

    // For now all we will do is send a new message:activity notification, but
    // with verb |update| instead of |post| to denote the update.
    var targets = messageHelpers.messageSharesToTimelineTarget(message.shares);
    var activity = activityStreamHelper.userMessageToTimelineEntry(message, 'update', user, targets);
    localpubsub.topic('message:activity').forward(globalpubsub, activity);
    return callback(null, message);
  });
}

/**
 * Validate the data structure and forward it to the right handler. This method
 * can be used to process message queue data. The message data format is as
 * follows:
 *   {
 *     user: "userid", // This can be the user id or a user object
 *     collaboration: "collabid", // This can be the collab id or object
 *     event: {  // The message event data
 *       event_id: '/path/to/event', // An event identifier
 *       type: 'created', // The operation to execute
 *       event: 'BEGIN:VCALENDAR...', /// The event ics data
 *     }
 *   }
 *
 * The callback result is false if there was a permission issue. Otherwise it
 * is an object with the event message data created or updated.
 *
 * @param {object} data         The data which contain the user, the community
 *                                and the event
 * @param {function} callback   Callback function for results: function(err, result)
 */
function dispatch(data, callback) {
  if (!data || typeof data !== 'object') {
    return callback(new Error('Data is missing'));
  }
  if (!data.user) {
    return callback(new Error('Invalid user specified'));
  }
  if (!data.collaboration) {
    return callback(new Error('Invalid collaboration specified'));
  }
  if (!data.event || !data.event.event_id) {
    return callback(new Error('Invalid event specified'));
  }

  var retrievals = [
    function retrieveUser(callback) {
      if (typeof data.user === 'object') {
        return callback(null, data.user);
      } else if (typeof data.user === 'string') {
        userModule.get(data.user, callback);
      } else {
        return callback('Invalid user data');
      }
    },
    function retrieveCollaboration(callback) {
      if (typeof data.collaboration === 'object') {
        return callback(null, data.collaboration);
      } else if (typeof data.collaboration === 'string' && data.objectType) {
        collaborationModule.queryOne(data.objectType, data.collaboration, callback);
      } else {
        return callback('Missing collaboration');
      }
    }
  ];

  async.parallel(retrievals, function(err, result) {
    if (err) {
      return callback(new Error('Error dispatching event: ' + err));
    }
    data.user = result[0]; data.collaboration = result[1];

    switch (data.event.type) {
      case 'created':
        return _create(data.user, data.collaboration, data.event, callback);
      case 'updated':
        return _update(data.user, data.collaboration, data.event, callback);
      default:
        return callback(new Error('Invalid type specified'));
    }
  });
}
module.exports.dispatch = dispatch;

function generateActionLink(baseUrl, jwtPayload, action) {
  var deferred = q.defer();
  var payload = {};
  extend(true, payload, jwtPayload, {action: action});
  jwt.generateWebToken(payload, function(err, token) {
    if (err) {
      return deferred.reject(err);
    }
    return deferred.resolve(urlBuilder.resolve(baseUrl, '/calendar/api/calendars/event/participation/?jwt=' + token));
  });
  return deferred.promise;
}

/**
 * Generates action links for the invitation email.
 * The links will match the following scheme : {baseUrl}/api/calendars/event/participation/?jwt={aToken}
 * where aToken is built from jwtPayload and the action for the link
 *
 * @param {String} baseUrl the baseUrl of the ESN
 * @param {Object} jwtPayload the payload which to be used to generate the JWT for the link
 * @returns {Promise} a promise resolving to an object containing the yes, no and maybe links
 */
function generateActionLinks(baseUrl, jwtPayload) {
  var yesPromise = generateActionLink(baseUrl, jwtPayload, 'ACCEPTED');
  var noPromise = generateActionLink(baseUrl, jwtPayload, 'DECLINED');
  var maybePromise = generateActionLink(baseUrl, jwtPayload, 'TENTATIVE');
  return q.all([yesPromise, noPromise, maybePromise]).then(function(links) {
    return {
      yes: links[0],
      no: links[1],
      maybe: links[2]
    };
  });
}

function inviteAttendees(organizer, attendeeEmails, notify, method, ics, calendarId, callback) {
  if (!notify) {
    return q({}).nodeify(callback);
  }

  if (!organizer) {
    return q.reject(new Error('Organizer must be an User object')).nodeify(callback);
  }

  if (arrayHelpers.isNullOrEmpty(attendeeEmails)) {
    return q.reject(new Error('AttendeeEmails must an array with at least one email')).nodeify(callback);
  }

  if (!method) {
    return q.reject(new Error('The method is required')).nodeify(callback);
  }

  if (!ics) {
    return q.reject(new Error('The ics is required')).nodeify(callback);
  }

  if (!calendarId) {
    return q.reject(new Error('The calendar id is required')).nodeify(callback);
  }

  function userDisplayName(user) {
    return user.firstname + ' ' + user.lastname;
  }

  var getAllUsersAttendees = attendeeEmails.map(function(attendeeEmail) {
    var deferred = q.defer();
    userModule.findByEmail(attendeeEmail, function(err, found) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(found || { emails: [attendeeEmail] });
      }
    });
    return deferred.promise;
  });
  return esnconfig('web').get(function(err, web) {
    if (err) {
      return q.reject(err).nodeify(callback);
    }
    var baseUrl = 'http://localhost:';
    if (web && web.base_url) {
      baseUrl = web.base_url;
    } else {
      var port = staticConfig.webserver.port || '8080';
      baseUrl += port;
    }
    return q.all(getAllUsersAttendees).then(function(users) {
      var from = { objectType: 'email', id: organizer.email || organizer.emails[0] };
      var event = jcal2content(ics, baseUrl);
      var inviteMessage;
      var subject = 'Unknown method';
      var template = 'event.invitation';
      switch (method) {
        case 'REQUEST':
          if (event.sequence) {
            subject = i18n.__('Event %s from %s updated', event.summary, userDisplayName(organizer));
            template = 'event.update';
            inviteMessage = i18n.__('has updated a meeting!');
          } else {
            subject = i18n.__('New event from %s: %s', userDisplayName(organizer), event.summary);
            template = 'event.invitation';
            inviteMessage = i18n.__('has invited you to a meeting!');
          }
          break;
        case 'REPLY':
          subject = i18n.__('Participation updated: %s', event.summary);
          template = 'event.reply';
          inviteMessage = i18n.__('has changed his participation!');
          break;
        case 'CANCEL':
          subject = i18n.__('Event %s from %s canceled', event.summary, userDisplayName(organizer));
          template = 'event.cancel';
          inviteMessage = i18n.__('has canceled a meeting!');
          break;
      }

      var message = {
        subject: subject,
        encoding: 'base64',
        alternatives: [{
          content: ics,
          contentType: 'text/calendar; charset=UTF-8; method=' + method
        }],
        attachments: [{
          filename: 'meeting.ics',
          content: ics,
          contentType: 'application/ics'
        }]
      };
      var options = {
        template: template,
        message: message,
        // this filter is to be used in om-mailers
        filter: function(filename) {
          switch (filename) {
            case 'map-marker.png':
              return !!event.location;
            case 'format-align-justify.png':
              return !!event.description;
            case 'folder-download.png':
              return !!event.files;
            case 'check.png':
              return !(event.allDay && event.durationInDays === 1);
            default:
              return true;
          }
        }
      };

      var content = {
        baseUrl: baseUrl,
        inviteMessage: inviteMessage,
        event: event
      };

      var sendMailToAllAttendees = users.map(function(user) {
        var attendeeEmail = user.email || user.emails[0];
        var to = { objectType: 'email', id: attendeeEmail };

        var jwtPayload = {
          attendeeMail: attendeeEmail,
          organizerMail: organizer.preferredEmail,
          event: ics,
          calendarId: calendarId
        };
        return generateActionLinks(baseUrl, jwtPayload).then(function(links) {
          var contentWithLinks = {};
          extend(true, contentWithLinks, content, links);
          return contentSender.send(from, to, contentWithLinks, options, 'email');
        });
      });

      return q.all(sendMailToAllAttendees);
    }).nodeify(callback);
  });
}

module.exports = function(dependencies) {
  eventMessage = require('./../../../lib/message/eventmessage.core')(dependencies);
  i18n = require('../../../lib/i18n')(dependencies);
  userModule = dependencies('user');
  collaborationModule = dependencies('collaboration');
  messageHelpers = dependencies('helpers').message;
  arrayHelpers = dependencies('helpers').array;
  activityStreamHelper = dependencies('activitystreams').helpers;
  localpubsub = dependencies('pubsub').local;
  globalpubsub = dependencies('pubsub').global;
  collaborationPermission = dependencies('collaboration').permission;
  contentSender = dependencies('content-sender');
  esnconfig = dependencies('esn-config');
  staticConfig = dependencies('config')('default');
  jwt = dependencies('auth').jwt;

  return {
    dispatch: dispatch,
    inviteAttendees: inviteAttendees,
    generateActionLinks: generateActionLinks
  };
};
