'use strict';

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function callback(req, res) {
    logger.info('Twitter callback for user', req.user._id);
    if (req.query.denied) {
      return res.redirect('/#/accounts?status=denied&provider=twitter&token=' + req.query.denied);
    }
    res.redirect('/#/accounts');
  }

  return {
    callback: callback
  };

};
