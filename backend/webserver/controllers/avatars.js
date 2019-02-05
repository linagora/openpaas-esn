const crypto = require('crypto');
const userModule = require('../../core/user');
const userController = require('./users');
const imageModule = require('../../core/image');
const collaborationController = require('./collaborations');
const collaborationMiddleware = require('../middleware/collaboration');
const avatarModule = require('../../core/avatar');
const { AVATAR_MIN_SIZE, AVATAR_MAX_SIZE } = require('../../core/avatar/constants');

module.exports = {
  get,
  getGeneratedAvatar
};

function get(req, res) {
  if (!req.query.objectType) {
    if (!req.query.email || typeof req.query.email !== 'string' || req.query.email.length === 0) {
      return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'When no objectType is provided, email is mandatory and must be a non-empty string'}});
    }

    return avatarModule.getAvatarFromEmail(req.query.email, (error, object, controller) => {
      if (error) {
        return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'Error while getting avatar'}});
      }
      if (!object) {
        return getGeneratedAvatar(req, res);
      }

      controller(object, req, res);
    });
  }

  if (req.query.objectType === 'user') {
    return getUserAvatarFromEmail(req, res);
  }

  if (req.query.objectType === 'community' || req.query.objectType === 'project') {
    return getCollaborationAvatar(req, res);
  }

  if (req.query.objectType === 'image') {
    return getAvatar(req, res);
  }

  if (req.query.objectType === 'email') {
    return getGeneratedAvatar(req, res);
  }

  return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Unknown objectType parameter'}});
}

function getUserAvatarFromEmail(req, res) {
  userModule.findByEmail(req.query.email, (err, user) => {
    if (err || !user) {
      return res.redirect('/images/not_a_user.png');
    }

    req.user = user;

    userController.getProfileAvatar(req, res);
  });
}

function getCollaborationAvatar(req, res) {
  if (!req.query.id) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Collaboration id is mandatory'}});
  }

  req.params.id = req.query.id;
  req.params.objectType = req.query.objectType;

  collaborationMiddleware.load(req, res, err => {
    if (err) {
      return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'Error while getting avatar'}});
    }

    collaborationController.getAvatar(req, res);
  });
}

function getAvatar(req, res) {
  if (!req.query.id) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Avatar id is mandatory'}});
  }

  imageModule.getAvatar(req.query.id, req.query.format, (err, fileStoreMeta, readable) => {
    if (err) {
      return res.redirect('/images/activitystream.png');
    }

    if (!readable) {
      return res.redirect('/images/activitystream.png');
    }

    if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
      return res.status(304).end();
    }

    res.header('Last-Modified', fileStoreMeta.uploadDate);
    res.status(200);

    readable.pipe(res);
  });
}

function getGeneratedAvatar(req, res) {
  if (!req.query.email || typeof req.query.email !== 'string' || req.query.email.length === 0) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Email is mandatory and must be a non-empty string' } });
  }

  const email = req.query.email;
  const size = Math.min(Math.max(Number.parseInt(req.query.size, 10) || 0, AVATAR_MIN_SIZE), AVATAR_MAX_SIZE);
  const displayName = req.query.displayName || email;
  const emailMD5Digest = crypto.createHash('md5').update(email).digest('hex');
  const colors = imageModule.avatarGenerationModule.getColorsFromUuid(emailMD5Digest);

  res.send(imageModule.avatarGenerationModule.generateFromText({
    text: displayName.charAt(0),
    bgColor: colors.bgColor,
    fgColor: colors.fgColor,
    size
  }));
}

avatarModule.registerProvider('user', {
  findByEmail: userModule.findByEmail,
  getAvatar: function(user, req, res) {
    req.user = user;

    return userController.getProfileAvatar(req, res);
  }
});

