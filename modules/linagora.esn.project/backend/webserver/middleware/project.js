'use strict';

module.exports = function(lib) {
  return {
    load: function(req, res, next) {
      if (!req.params.id) {
        return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Project id is required'}});
      }

      lib.query({_id: req.params.id}, function(err, project) {
        if (err) {
          return res.status(500).json({error: {code: 500, message: 'Server error', details: 'Error while loading project'}});
        }
        if (!project || project.length === 0) {
          return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Project not found'}});
        }
        req.project = project[0];
        next();
      });
    }
  };
};
