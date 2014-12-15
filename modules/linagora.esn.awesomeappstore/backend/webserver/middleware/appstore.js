'use strict';

module.exports = function(appstoremanager) {

  function load(req, res, next) {
    if (!req.params.id) {
      return res.json(400, { error: { code: 400, message: 'Bad request', details: 'missing parameter id'}});
    }

    appstoremanager.getById(req.params.id, function(err, application) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'Server error', details: 'Could not retreive application of id: ' + req.params.id}});
      }

      if (!application) {
        return res.json(404, { error: { code: 404, message: 'Not found', details: 'App not found'}});
      }

      req.application = application;
      return next();
    });
  }

  return { load: load};
};
