'use strict';

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function callback(req, res) {
    logger.info('Twitter callback for user', req.user._id);
    if (req.query.denied) {
      return res.redirect('/#/accounts?status=denied&provider=twitter&token=' + req.query.denied);
    }

    if (req.oauth && req.oauth.status) {
      var status = req.oauth.status;
      return res.redirect('/#/accounts?provider=twitter&status=' + status);
    }
    res.redirect('/#/accounts?provider=twitter');
  }

  return {
    callback: callback
  };

};
