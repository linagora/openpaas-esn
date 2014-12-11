'use strict';

var async = require('async');
var eventMessage = require('../../core/message/event');
var localpubsub = require('../../core/pubsub').local;
var globalpubsub = require('../../core/pubsub').global;
var communityPermission = require('../../core/community/permission');
var activityStreamHelper = require('../../core/activitystreams/helpers');
var user = require('../../core/user');
var community = require('../../core/community');

/*
 * In this module, the data parameter is like :
 * {
 *    user: {User, String},
 *    community: {Community, String},
 *    event: {
 *      event_id: {string},
 *      type: {string},
 *      ...
 *    }
 * }
 *
 * See REST_calendars.md for the complete event structure
 */

/**
 * Check if the user has the right to create an eventmessage in that community and
 * create the event message and the timeline entry.
 *
 * @param {object} data the data which contain the user, the community and the event
 * @param {function} callback fn like callback(err, saved)
 *  (saved is the eventMessage saved or false if the user doesn't have write permission in the community)
 */
function create(data, callback) {

  communityPermission.canWrite(data.community, {objectType: 'user', id: data.user._id}, function(err, result) {
    if (err) {
      return callback(err);
    }
    if (!result) {
      return callback(null, false);
    }

    eventMessage.save({eventId: data.event.event_id, author: data.user}, function(err, saved) {
      if (err) {
        return callback(err);
      }

      var targets = [{
        objectType: 'activitystream',
        _id: data.community.activity_stream.uuid
      }];
      var activity = activityStreamHelper.userMessageToTimelineEntry(saved, 'post', data.user, targets);
      localpubsub.topic('message:activity').publish(activity);
      globalpubsub.topic('message:activity').publish(activity);
      return callback(null, saved);
    });
  });
}

/**
 * Validate the data structure and forward it to the right handler.
 *
 * @param {object} data the data which contain the user, the community and the event
 * @param {function} callback fn like callback(err, result) (result depend on the handler called)
 */
function dispatch(data, callback) {
  if (!data) {
    return callback(new Error('Data is missing'));
  }
  if (typeof data !== 'object') {
    return callback(new Error('The parameter data is not an object'));
  }
  if (!data.user) {
    return callback(new Error('The user field in data is missing'));
  }
  if (!data.community) {
    return callback(new Error('The community field in data is missing'));
  }
  if (typeof data.event !== 'object') {
    return callback(new Error('The field event in data is not an object'));
  }
  if (!data.event.event_id) {
    return callback(new Error('The event_id field in event in data is missing'));
  }
  if (!data.event.type) {
    return callback(new Error('The type field in event in data is missing'));
  }

  async.parallel([
      function(callback) {
        // If data.user is a string fetch the user with the id
        if (typeof data.user === 'string') {
          user.get(data.user, function(err, userObject) {
            if (err) { return callback(err); }
            return callback(null, userObject);
          });
        } else {
          return callback(null, data.user);
        }
      },
      function(callback) {
        // If data.community is a string fetch the community with the id
        if (typeof data.community === 'string') {
          community.load(data.community, function(err, communityObject) {
            if (err) { return callback(err); }
            return callback(null, communityObject);
          });
        } else {
          return callback(null, data.community);
        }
      }
    ],
    function(err, result) {
      if (err) {
        return callback(err);
      }
      data.user = result[0];
      data.community = result[1];

      if (data.event.type === 'created') {
        create(data, function(err, saved) {
          if (err) {
            return callback(err);
          }
          if (!saved) {
            return callback(null, false);
          }
          return callback(null, {type: 'created', saved: saved});
        });
      } else {
        return callback(new Error('Type ' + data.event.type + ' not implemented'));
      }
    });
}
module.exports.dispatch = dispatch;
