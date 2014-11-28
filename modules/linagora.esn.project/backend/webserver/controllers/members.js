'use strict';

module.exports = function(lib, deps) {

  var controllers = {};

  controllers.add = function(req, res) {
    if (!req.project) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Project is required'}});
    }

    if (!req.body.id || !req.body.objectType) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Member is malformed'}});
    }

    lib.addMember(req.project, req.user, req.body, function(err, update) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return res.json(201, update);
    });
  };

  return controllers;
};
