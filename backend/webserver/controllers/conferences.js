'use strict';

var conference = require('../../core/conference');

module.exports.load = function(req, res, next) {
  if (req.params.id) {
    conference.get(req.params.id, function(err, conf) {
      req.conference = conf;
      next();
    });
  } else {
    next();
  }
};

module.exports.get = function(req, res) {
  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }
  return res.json(200, conf);
};

module.exports.list = function(req, res) {
  conference.list(function(err, list) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(200, list);
  });
};

module.exports.create = function(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  conference.create(user, function(err, created) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(201, created);
  });
};

module.exports.updateAttendee = function(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  if (!req.param('action')) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Action is missing'}});
  }

  var action = req.param('action');
  if (action === 'join') {
    return this.join(req, res);
  } else if (action === 'leave') {
    return this.leave(req, res);
  } else {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Unknown action'}});
  }
};

module.exports.join = function(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  conference.join(conf, user, function(err, updated) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(204);
  });
};

module.exports.leave = function(req, res) {
  var user = req.user;
  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  var conf = req.conference;
  if (!conf) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Conference is missing'}});
  }

  conference.leave(conf, user, function(err, updated) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(204);
  });
};

module.exports.addAttendee = function(req, res) {
  return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Not implemented'}});
};

module.exports.removeAttendee = function(req, res) {
  return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Not implemented'}});
};
