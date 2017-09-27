'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var collaborations = require('../controllers/collaborations');
var collaborationMW = require('../middleware/collaboration');
const helperMW = require('../middleware/helper');

module.exports = function(router) {

  /**
   * @swagger
   * /collaborations/membersearch :
   *   get:
   *     tags:
   *       - Collaboration
   *     description: Get all the collaborations where the given tuple is a member.
   *     parameters:
   *       - $ref: "#/parameters/cl_search_type"
   *       - $ref: "#/parameters/cl_search_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_search"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/collaborations/membersearch',
    authorize.requiresAPILogin,
    helperMW.requireInQuery(['objectType', 'id']),
    collaborations.searchWhereMember);

  /**
   * @swagger
   * /collaborations/writable :
   *   get:
   *     tags:
   *       - Collaboration
   *     description: Get all the collaborations in which the connected user has write permission.
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_writable"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/collaborations/writable',
    authorize.requiresAPILogin,
    collaborations.getWritable);

  /**
   * @swagger
   * /collaborations/{object_type}/{community_id}/invitablepeople :
   *   get:
   *     tags:
   *       - Collaboration
   *     description: Get the list of peoples (for now only users of the ESN) who can be invited in the {type}.
   *     parameters:
   *       - $ref: "#/parameters/cl_invitable_object_type"
   *       - $ref: "#/parameters/cl_community_id"
   *       - $ref: "#/parameters/cl_invitable_limit"
   *       - $ref: "#/parameters/cl_search"
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_people"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/collaborations/:objectType/:id/invitablepeople',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborations.getInvitablePeople);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/members :
   *   get:
   *     tags:
   *       - Collaboration
   *     description: List all members of the {objectType} collaboration of id {id}.
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_limit"
   *       - $ref: "#/parameters/cl_offset"
   *       - $ref: "#/parameters/cl_object_type_filter"
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_members"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/collaborations/:objectType/:id/members',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.canRead,
    collaborations.getMembers);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/members/{user_id} :
   *   get:
   *     tags:
   *       - Collaboration
   *     description: Returns ok if the user defined by user_id is a member of the {objectType} collaboration of id {id}.
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_user_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_is_member"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/collaborations/:objectType/:id/members/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.canRead,
    requestMW.castParamToObjectId('user_id'),
    collaborations.getMember);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/members/{user_id} :
   *   put:
   *     tags:
   *       - Collaboration
   *     description: join the user defined by user_id to the {objectType} collaboration of id {id}.
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_user_id"
   *       - $ref: "#/parameters/cl_withoutInvite"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/collaborations/:objectType/:id/members/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.flagCollaborationManager,
    collaborations.join);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/members/{user_id} :
   *   delete:
   *     tags:
   *       - Collaboration
   *     description: |
   *       Remove the user defined by user_id from the {objectType} collaboration of id {id}.
   *
   *       Can't be the creator. Must be the user that sent the request.
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_user_id"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/collaborations/:objectType/:id/members/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.checkUserIdParameterIsCurrentUser,
    collaborationMW.requiresCollaborationMember,
    collaborationMW.canLeave,
    collaborations.leave);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/membership :
   *   get:
   *     tags:
   *       - Collaboration
   *     description: |
   *       Get the membership requests for the given {objectType}.
   *       Only private and restricted {objectType} support membership requests.
   *       Only {objectType} manager/creator can issue this type of request.
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_limit"
   *       - $ref: "#/parameters/cl_offset"
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_requests"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/collaborations/:objectType/:id/membership',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.flagCollaborationManager,
    collaborations.getMembershipRequests);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/membership/{user_id} :
   *   put:
   *     tags:
   *       - Collaboration
   *     description: |
   *       Adds an item in the {objectType} membership requests list i.e. the user request to be part of the {objectType}.
   *
   *       Only private and restricted {objectType} support membership requests.
   *
   *       A user cannot make a membership request for a {objectType} he is already member of.
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_user_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/cl_membership_put"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/collaborations/:objectType/:id/membership/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.checkUserParamIsNotMember,
    collaborationMW.flagCollaborationManager,
    collaborationMW.ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser,
    collaborations.addMembershipRequest);

  /**
   * @swagger
   * /collaborations/{object_type}/{id}/membership/{user_id} :
   *   delete:
   *     tags:
   *       - Collaboration
   *     description: |
   *       Removes an item in the {objectType} membership requests list i.e. the user request to be part of the {objectType}.
   *
   *       Only private and restricted {objectType} support membership requests.
   *
   *       According to the workflow property and if the user is a manager of the community:
   *        -----------------------------------------------------------
   *
   *        (workflow = INVITATION and isCommunityManager = yes)
   *        manager cancel the invitation of the user
   *
   *        -----------------------------------------------------------
   *
   *        (workflow = INVITATION and isCommunityManager = no)
   *        attendee declines the invitation
   *
   *        -----------------------------------------------------------
   *
   *        (workflow = REQUEST and isCommunityManager = yes)
   *        manager refuses the user's request to enter the community
   *
   *        -----------------------------------------------------------
   *
   *        (workflow = REQUEST and isCommunityManager = no)
   *        user cancels her request to enter the commity
   *
   *        -----------------------------------------------------------
   *     parameters:
   *       - $ref: "#/parameters/cl_members_object_type"
   *       - $ref: "#/parameters/cl_object_id"
   *       - $ref: "#/parameters/cl_user_id"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/collaborations/:objectType/:id/membership/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.flagCollaborationManager,
    collaborations.removeMembershipRequest);
};
