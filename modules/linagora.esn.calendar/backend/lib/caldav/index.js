'use strict';

var logger;
var dav = require('dav');

var EVENTS_PATH = '/events';

function _getDavClient(url, user) {
  var client = new dav.Client(
    new dav.transport.Basic(
      new dav.Credentials({
        username: user.username,
        password: user.password
      })
    ),
    {
      baseUrl: url
    }
  );
  return client;
}

function _getClient(url) {
  return {
    createCalendar: function(calendar, creator, callback) {
      logger.debug('Calling createCalendar on caldav server at', url);

      if (!calendar.displayName) {
        return callback(new Error('Calendar displayName is required'));
      }

      if (!calendar.id) {
        return callback(new Error('Calendar id is required'));
      }

      var davClient = _getDavClient(url, creator);
      var opts = {
        props: [
          {
            name: 'displayname',
            namespace: dav.ns.DAV,
            value: calendar.displayName
          }
        ]
      };

      if (calendar.description) {
        opts.props.push(
          {
            name: 'calendar-description',
            namespace: dav.ns.CALDAV,
            value: calendar.description
          }
        );
      }

      var request = dav.request.mkcalendar(opts);

      davClient.send(request, '/calendars/' + calendar.id + EVENTS_PATH).then(function(response) {
        logger.debug('Calendar has been created', response);
        return callback(null, response);
      }, function(error) {
        logger.error('Error while creating calender', error);
        return callback(error);
      });
    },

    deleteCalendar: function(calendar, callback) {
      return callback(null, {});
    },

    updateCalendar: function(calendar, callback) {
      return callback(null, {});
    },

    getCalendar: function(calendar, callback) {
      return callback(null, {});
    },

    getEvents: function(calendar, callback) {
      return callback(null, callback);
    },

    getEvent: function(event, callback) {
      return callback(null, {});
    },

    deleteEvent: function(event, callback) {
      return callback(null, {});
    },

    updateEvent: function(event, callback) {
      return callback(null, {});
    }
  };
}

module.exports = function(dependencies) {
  logger = dependencies('logger');
  return _getClient;
};
