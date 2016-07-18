'use strict';

var userModule = require('../../core').user;

function onFind(req, res, next, err, user) {
  if (err) {
    return res.status(500).json({error: {code: 500, message: 'Server error', details: err.message}});
  }

  if (!user) {
    return res.status(404).json({error: {code: 404, message: 'Not found', details: 'User not found'}});
  }

  req.user = user;
  next();
}

function load(req, res, next) {
  if (req.params.uuid) {
    return userModule.get(req.params.uuid, onFind.bind(null, req, res, next));
  } else if (req.body.email) {
    return userModule.findByEmail(req.body.email, onFind.bind(null, req, res, next));
  } else {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'uuid or email missing'}});
  }
}
module.exports.load = load;
