'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var collaborations = require('../controllers/collaborations');
var collaborationMW = require('../middleware/collaboration');

module.exports = function(router) {
  router.get('/collaborations/membersearch',
    authorize.requiresAPILogin,
    collaborations.searchWhereMember);
  router.get('/collaborations/writable',
    authorize.requiresAPILogin,
    collaborations.getWritable);

  router.get('/collaborations/:objectType/:id/invitablepeople',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborations.getInvitablePeople);

  router.get('/collaborations/:objectType/:id/members',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.canRead,
    collaborations.getMembers);

  router.get('/collaborations/:objectType/:id/members/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.canRead,
    requestMW.castParamToObjectId('user_id'),
    collaborations.getMember);
  router.put('/collaborations/:objectType/:id/members/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.flagCollaborationManager,
    collaborations.join);
  router.delete('/collaborations/:objectType/:id/members/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.checkUserIdParameterIsCurrentUser,
    collaborationMW.requiresCollaborationMember,
    collaborationMW.canLeave,
    collaborations.leave);

  router.get('/collaborations/:objectType/:id/membership',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.flagCollaborationManager,
    collaborations.getMembershipRequests);

  router.put('/collaborations/:objectType/:id/membership/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.checkUserParamIsNotMember,
    collaborationMW.flagCollaborationManager,
    collaborationMW.ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser,
    collaborations.addMembershipRequest);
  router.delete('/collaborations/:objectType/:id/membership/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.flagCollaborationManager,
    collaborations.removeMembershipRequest);
};
