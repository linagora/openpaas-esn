'use strict';

var mongoose = require('mongoose');
var Link = mongoose.model('Link');

module.exports.trackProfileView = function(req, res, next) {
  if (!req.user || !req.params.uuid) {
    return res.json(400, {
      error: 400,
      message: 'Bad parameters',
      details: 'Missing User or UUID'
    });
  } else {
    var target = req.params.uuid;
    var link = new Link({
      user: req.user,
      target: {
        resource: mongoose.Types.ObjectId(target),
        type: 'User'
      },
      type: 'profile'
    });

    link.save(function(err, saved) {
      // do not fail when link is not created
      next();
    });
  }
};
