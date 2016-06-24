'use strict';

var followModule = require('../../core/user/follow');
var userModule = require('../../core/user');
var logger = require('../../core/logger');

function canFollow(req, res, next) {
  var link = req.link;
  logger.debug('Check the user follow link', link);

  if (link.source.objectType !== 'user' || link.target.objectType !== 'user') {
    return next();
  }

  if (!req.user._id.equals(link.source.id)) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You can not follow a user for someone else'}});
  }

  if (req.user._id.equals(link.target.id)) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You can not follow yourself'}});
  }

  userModule.get(link.target.id, function(err, userToFollow) {
    if (err || !userToFollow) {
      logger.error('Can not find the user to follow', err);
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Can not find user to follow'}});
    }

    followModule.follows(req.user, userToFollow).then(function(result) {
      if (result) {
        return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You already follow this user'}});
      }

      followModule.canFollow(req.user, userToFollow).then(function(result) {
        if (!result) {
          return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You do not have permission to follow this user'}});
        }

        req.linkable = result;
        next();
      }, function(err) {
        logger.error('Error while checking if user is can follow other user', err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while checking if user is can follow other user'}});
      });

    }, function(err) {
      logger.error('Error while checking if user is already followed by user', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not check if user already follows other user'}});
    });
  });

}
module.exports.canFollow = canFollow;
