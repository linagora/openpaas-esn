'use strict';

var async = require('async');
const q = require('q');
var jcal2content = require('../../../lib/helpers/jcal').jcal2content;
var urljoin = require('url-join');
var extend = require('extend');
var eventMessage,
    i18nLib,
    userModule,
    collaborationModule,
    messageHelpers,
    activityStreamHelper,
    localpubsub,
    globalpubsub,
    collaborationPermission,
    emailModule,
    jwt,
    configHelpers,
    searchModule,
    caldavClient;

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

    return deferred.resolve(urljoin(baseUrl, '/calendar/api/calendars/event/participation/?jwt=' + token));
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

function inviteAttendees(editor, attendeeEmail, notify, method, ics, calendarURI, callback) {
  if (!notify) {
    return q({}).nodeify(callback);
  }

  if (!editor || !editor.domains || !editor.domains.length) {
    return q.reject(new Error('Organizer must be an User object')).nodeify(callback);
  }

  if (!attendeeEmail) {
    return q.reject(new Error('AttendeeEmails is required')).nodeify(callback);
  }

  if (!method) {
    return q.reject(new Error('The method is required')).nodeify(callback);
  }

  if (!ics) {
    return q.reject(new Error('The ics is required')).nodeify(callback);
  }

  function userDisplayName(user) {
    return user.firstname + ' ' + user.lastname;
  }

  var attendeePromise = q.nfbind(userModule.findByEmail)(attendeeEmail);

  var mailer = emailModule.getMailer(editor);

  return configHelpers.getBaseUrl(editor, function(err, baseUrl) {
    if (err) {
      return q.reject(err).nodeify(callback);
    }

    return attendeePromise.then(function(attendee) {
      var attendeePreferedEmail = attendee ? attendee.email || attendee.emails[0] : attendeeEmail;

      return i18nLib.getI18nForMailer(attendee).then(i18nConf => {
        var editorEmail = editor.email || editor.emails[0];
        var event = jcal2content(ics, baseUrl);
        var inviteMessage;
        var subject = 'Unknown method';
        var template = 'event.invitation';
        const i18n = i18nConf.i18n;

        function _i18nHelper(phrase, isSummaryExist = false, isUserDisplayNameExists = false) {
          const option = Object.assign(
            {},
            isSummaryExist ? { summary: event.summary } : {},
            isUserDisplayNameExists ? { userDisplayName: userDisplayName(editor) } : {}
          );

          return i18n.__({phrase: phrase, locale: i18nConf.locale}, option);
        }

        switch (method) {
          case 'REQUEST':
            if (event.sequence > 0) {
              subject = _i18nHelper('Event {{summary}} from {{userDisplayName}} updated', true, true);
              template = 'event.update';
              inviteMessage = _i18nHelper('has updated a meeting!');
            } else {
              subject = _i18nHelper('New event from {{userDisplayName}}: {{summary}}', true, true);
              template = 'event.invitation';
              inviteMessage = _i18nHelper('has invited you to a meeting!');
            }
            break;
          case 'REPLY':
            subject = _i18nHelper('Participation updated: {{summary}}', true);
            template = 'event.reply';
            inviteMessage = _i18nHelper('has changed his participation!');
            break;
          case 'CANCEL':
            subject = _i18nHelper('Event {{summary}} from {{userDisplayName}} canceled', true, true);
            template = 'event.cancel';
            inviteMessage = _i18nHelper('has canceled a meeting!');
            break;
        }

        var message = {
          from: editorEmail,
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
        var content = {
          baseUrl: baseUrl,
          inviteMessage: inviteMessage,
          event: event,
          editor: {
            displayName: userDisplayName(editor),
            email: editor.email || editor.emails[0]
          },
          calendarHomeId: editor._id
        };

        function filter(filename) {
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

        var userIsInvolved = attendeeEmail === event.organizer.email;

        if (event.attendees && event.attendees[attendeeEmail]) {
          userIsInvolved = event.attendees[attendeeEmail].partstat ? event.attendees[attendeeEmail].partstat !== 'DECLINED' : true;
        }

        if (!userIsInvolved) {
          return q.reject(new Error('The user is not involved in the event')).nodeify(callback);
        }

        var jwtPayload = {
          attendeeEmail: attendeePreferedEmail,
          organizerEmail: event.organizer.email,
          uid: event.uid,
          calendarURI: calendarURI
        };

        return generateActionLinks(baseUrl, jwtPayload).then(function(links) {
          var contentWithLinks = {};
          var email = {};

          extend(true, contentWithLinks, content, links);
          extend(true, email, message, { to: attendeeEmail });

          var locals = {
            content: contentWithLinks,
            filter: filter,
            translate: i18nConf.translate
          };

          return mailer.sendHTML(email, template, locals);
        });
      });
    }).nodeify(callback);
  });
}

function searchEvents(query, callback) {
  searchModule.searchEvents(query, function(err, esResult) {
    if (err) {
      return callback(err);
    }
    var output = {
      total_count: esResult.total_count,
      results: []
    };

    if (!esResult.list || esResult.list.length === 0) {
      return callback(null, output);
    }

    var eventPromises = esResult.list.map(function(esEvent, index) {
      var eventUid = esEvent._id;

      return caldavClient.getEvent(query.userId, query.calendarId, eventUid).then(function(event) {
        output.results[index] = {
          uid: eventUid,
          path: caldavClient.getEventPath(query.userId, query.calendarId, eventUid),
          event: event
        };
      }, function(error) {
        output.results[index] = {
          uid: eventUid,
          error: error
        };
      });
    });

    q.allSettled(eventPromises).finally(function() {
      callback(null, output);
    });
  });
}

module.exports = function(dependencies) {
  eventMessage = require('./../../../lib/message/eventmessage.core')(dependencies);
  i18nLib = require('../../../lib/i18n')(dependencies);
  userModule = dependencies('user');
  collaborationModule = dependencies('collaboration');
  messageHelpers = dependencies('helpers').message;
  configHelpers = dependencies('helpers').config;
  activityStreamHelper = dependencies('activitystreams').helpers;
  localpubsub = dependencies('pubsub').local;
  globalpubsub = dependencies('pubsub').global;
  collaborationPermission = dependencies('collaboration').permission;
  emailModule = dependencies('email');
  jwt = dependencies('auth').jwt;
  searchModule = require('../../../lib/search')(dependencies);
  caldavClient = require('../../../lib/caldav-client')(dependencies);

  return {
    dispatch: dispatch,
    inviteAttendees: inviteAttendees,
    generateActionLinks: generateActionLinks,
    searchEvents: searchEvents
  };
};
