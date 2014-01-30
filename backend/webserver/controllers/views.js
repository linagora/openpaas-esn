'use strict';

function views(req, res, next) {
  res.render(req.params[0]);
}

exports = module.exports = function(application) {
  application.get('/views/*', views);
};

