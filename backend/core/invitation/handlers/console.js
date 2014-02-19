'use strict';

module.exports.init = function(invitation, done) {
  console.log('Handling invitation ', invitation);
  var result = {
    status: 'delivered'
  };
  return done(null, result);
};

module.exports.process = function(req, res, next) {
  if (req.invitation) {
    console.log('Process the invitation ', req.invitation);
    res.redirect('/');
  } else {
    console.log('No invitation found');
    next();
  }
};
