'use strict';

var userModule = require('../../core/user');
var imageModule = require('../../core/image');
var communityController = require('./communities');

function getAvatarFromEmail(req, res) {
  userModule.findByEmail(req.query.email, function(err, user) {
    if (err || !user) {
      return res.redirect('/images/not_a_user.png');
    }

    imageModule.getAvatar(user.currentAvatar, req.query.format, function(err, fileStoreMeta, readable) {
      if (err) {
        logger.warn('Can not get user avatar : %s', err.message);
        return res.redirect('/images/user.png');
      }

      if (!readable) {
        logger.warn('Can not retrieve avatar stream for user %s', req.user._id);
        return res.redirect('/images/user.png');
      }

      if (!fileStoreMeta) {
        res.status(200);
        return readable.pipe(res);
      }

      if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
        return res.send(304);
      } else {
        res.header('Last-Modified', fileStoreMeta.uploadDate);
        res.status(200);
        return readable.pipe(res);
      }
    });
  });
}
module.exports.getAvatarFromEmail = getAvatarFromEmail;

module.exports.get = function(req, res) {
  if (!req.query.objectType) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'objectType parameter is mandatory'}});
  }

  if (req.query.objectType === 'user') {
    return getAvatarFromEmail(req, res);
  }

  if (req.query.objectType === 'community') {
    return communityController.getAvatar(req, res);
  }

  return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Unknown objectType parameter'}});
};