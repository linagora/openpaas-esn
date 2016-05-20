'use strict';

var invitation = require('../controllers/invitation');

module.exports = function(router) {
  router.post('/invitations', invitation.create);
  router.put('/invitations/:uuid', invitation.load, invitation.finalize);
  router.get('/invitations/:uuid', invitation.load, invitation.get);
};
