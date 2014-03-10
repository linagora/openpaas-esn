'use strict';

var conf = require('../../core')['esn-config']('session');

// 30*24*60*60*1000 = 30 days
var maxAge = 2592000000;

exports.rememberMe = function(req, res, next) {
  if (req.body.rememberme) {
    conf.get(function(err, data) {
      console.log(err);
      console.log(data);
      if (err) {
        req.session.cookie.maxAge = maxAge;
      } else if (!data ||   !data.remember) {
        req.session.cookie.maxAge = maxAge;
      } else {
        req.session.cookie.maxAge = data.remember;
      }
      next();
    });
  } else {
    req.session.cookie.expires = false;
    next();
  }
};
