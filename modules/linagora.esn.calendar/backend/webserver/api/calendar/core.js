'use strict';

const async = require('async');
const q = require('q');
const urljoin = require('url-join');
const extend = require('extend');
const jcal2content = require('../../../lib/helpers/jcal').jcal2content;

module.exports = dependencies => {
  const eventMessage = require('./../../../lib/message/eventmessage.core')(dependencies);
  const i18nLib = require('../../../lib/i18n')(dependencies);
  const userModule = dependencies('user');
  const collaborationModule = dependencies('collaboration');
  const messageHelpers = dependencies('helpers').message;
  const configHelpers = dependencies('helpers').config;
  const activityStreamHelper = dependencies('activitystreams').helpers;
  const localpubsub = dependencies('pubsub').local;
  const globalpubsub = dependencies('pubsub').global;
  const collaborationPermission = dependencies('collaboration').permission;
  const emailModule = dependencies('email');
  const jwt = dependencies('auth').jwt;
  const searchModule = require('../../../lib/search')(dependencies);
  const caldavClient = require('../../../lib/caldav-client')(dependencies);

  return {
    dispatch,
    generateActionLinks,
    inviteAttendees,
    searchEvents
  };

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
    const userData = {objectType: 'user', id: user._id};

    collaborationPermission.canWrite(collaboration, userData, (err, result) => {
      if (err || !result) {
        return callback(err, result);
      }
      const shares = [{
        objectType: 'activitystream',
        id: collaboration.activity_stream.uuid
      }];

      eventMessage.save({eventId: event.event_id, author: user, shares: shares}, (err, saved) => {
        if (err) {
          return callback(err);
        }

        const targets = messageHelpers.messageSharesToTimelineTarget(saved.shares);
        const activity = activityStreamHelper.userMessageToTimelineEntry(saved, 'post', user, targets);

        localpubsub.topic('message:activity').forward(globalpubsub, activity);

        callback(null, saved);
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
    eventMessage.findByEventId(event.event_id, (err, message) => {
      if (err) {
        return callback(err);
      }
      if (!message) {
        return callback(new Error('Could not find matching event message'));
      }

      // For now all we will do is send a new message:activity notification, but
      // with verb |update| instead of |post| to denote the update.
      const targets = messageHelpers.messageSharesToTimelineTarget(message.shares);
      const activity = activityStreamHelper.userMessageToTimelineEntry(message, 'update', user, targets);

      localpubsub.topic('message:activity').forward(globalpubsub, activity);

      callback(null, message);
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

    const retrievals = [
      function retrieveUser(callback) {
        if (typeof data.user === 'object') {
          return callback(null, data.user);
        } else if (typeof data.user === 'string') {
          userModule.get(data.user, callback);
        } else {
          callback('Invalid user data');
        }
      },
      function retrieveCollaboration(callback) {
        if (typeof data.collaboration === 'object') {
          return callback(null, data.collaboration);
        } else if (typeof data.collaboration === 'string' && data.objectType) {
          collaborationModule.queryOne(data.objectType, data.collaboration, callback);
        } else {
          callback('Missing collaboration');
        }
      }
    ];

    async.parallel(retrievals, (err, result) => {
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

  function generateActionLink(baseUrl, jwtPayload, action) {
    const deferred = q.defer();
    const payload = {};

    extend(true, payload, jwtPayload, {action: action});
    jwt.generateWebToken(payload, (err, token) => {
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
    const yesPromise = generateActionLink(baseUrl, jwtPayload, 'ACCEPTED');
    const noPromise = generateActionLink(baseUrl, jwtPayload, 'DECLINED');
    const maybePromise = generateActionLink(baseUrl, jwtPayload, 'TENTATIVE');

    return q.all([yesPromise, noPromise, maybePromise]).then(links => ({
      yes: links[0],
      no: links[1],
      maybe: links[2]
    }));
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

    const attendeePromise = q.nfbind(userModule.findByEmail)(attendeeEmail);
    const mailer = emailModule.getMailer(editor);

    return configHelpers.getBaseUrl(editor, (err, baseUrl) => {
      if (err) {
        return q.reject(err).nodeify(callback);
      }

      return attendeePromise.then(function(attendee) {
        const attendeePreferedEmail = attendee ? attendee.email || attendee.emails[0] : attendeeEmail;

        return i18nLib.getI18nForMailer(attendee).then(i18nConf => {
          const editorEmail = editor.email || editor.emails[0];
          const event = jcal2content(ics, baseUrl);
          let subject = 'Unknown method';
          let template = 'event.invitation';
          const i18n = i18nConf.i18n;
          let inviteMessage;

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

          const message = {
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
          const content = {
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

          let userIsInvolved = attendeeEmail === event.organizer.email;

          if (event.attendees && event.attendees[attendeeEmail]) {
            userIsInvolved = event.attendees[attendeeEmail].partstat ? event.attendees[attendeeEmail].partstat !== 'DECLINED' : true;
          }

          if (!userIsInvolved) {
            return q.reject(new Error('The user is not involved in the event')).nodeify(callback);
          }

          const jwtPayload = {
            attendeeEmail: attendeePreferedEmail,
            organizerEmail: event.organizer.email,
            uid: event.uid,
            calendarURI: calendarURI
          };

          return generateActionLinks(baseUrl, jwtPayload).then(function(links) {
            const contentWithLinks = {};
            const email = {};

            extend(true, contentWithLinks, content, links);
            extend(true, email, message, { to: attendeeEmail });

            const locals = {
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
    searchModule.searchEvents(query, (err, esResult) => {
      if (err) {
        return callback(err);
      }

      const output = {
        total_count: esResult.total_count,
        results: []
      };

      if (!esResult.list || esResult.list.length === 0) {
        return callback(null, output);
      }

      const eventPromises = esResult.list.map((esEvent, index) => {
        const eventUid = esEvent._id;

        return caldavClient.getEvent(query.userId, query.calendarId, eventUid).then(event => {
          output.results[index] = {
            uid: eventUid,
            path: caldavClient.getEventPath(query.userId, query.calendarId, eventUid),
            event: event
          };
        }, error => {
          output.results[index] = {
            uid: eventUid,
            error: error
          };
        });
      });

      q.allSettled(eventPromises).finally(() => {
        callback(null, output);
      });
    });
  }
};
