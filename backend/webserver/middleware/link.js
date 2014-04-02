'use strict';

var mongoose = require('mongoose');
var Link = mongoose.model('Link');

module.exports.trackProfileView = function(req, res, next) {
  if (!req.user || !req.params.uuid) {
    next();
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
