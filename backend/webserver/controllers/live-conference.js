'use strict';

module.exports.open = function(req, res) {
  return res.render('live-conference/index', {
    title: 'Conference'
  });
};
