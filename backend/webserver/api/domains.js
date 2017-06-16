'use strict';

const authorize = require('../middleware/authorization');
const domains = require('../controllers/domains');
const domainMiddleware = require('../middleware/domain');
const platformadminsMw = require('../middleware/platformadmins');

module.exports = function(router) {

  /**
   * @swagger
   * /domains:
   *   get:
   *     tags:
   *      - Domain
   *     description: |
   *       List ESN domains.
   *     parameters:
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_offset"
   *     responses:
   *       200:
   *         $ref: "#/responses/dm_domains"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/domains', authorize.requiresAPILogin, platformadminsMw.requirePlatformAdmin, domains.list);

  /**
   * @swagger
   * /domains:
   *   post:
   *     tags:
   *      - Domain
   *     description: |
   *       Create an ESN domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_name"
   *       - $ref: "#/parameters/dm_company_name"
   *       - $ref: "#/parameters/dm_administrators"
   *     responses:
   *       201:
   *         $ref: "#/responses/cm_201"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/domains', domains.createDomain);

  /**
   * @swagger
   * /domains/{domain_id}:
   *   get:
   *     tags:
   *      - Domain
   *     description: Get the domain information.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/dm_domain"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.get('/domains/:uuid', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.getDomain);

  /**
   * @swagger
   * /domains/{domain_id}/members:
   *   get:
   *     tags:
   *      - Domain
   *     description: Get the list of members for a domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/cl_limit"
   *       - $ref: "#/parameters/cl_offset"
   *       - $ref: "#/parameters/cl_search"
   *     responses:
   *       200:
   *         $ref: "#/responses/dm_members"
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
  router.get('/domains/:uuid/members', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.getMembers);

  /**
   * @swagger
   * /domains/{domain_id}/members:
   *   post:
   *     tags:
   *      - Domain
   *     description: |
   *       Create member for domain
   *       Only the domain manager is able to create people to join a domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/dm_member"
   *     responses:
   *       201:
   *         $ref: "#/responses/dm_member"
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
  router.post('/domains/:uuid/members', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.createMember);

  /**
   * @swagger
   * /domains/{domain_id}/invitations:
   *   post:
   *     tags:
   *      - Domain
   *     description: |
   *       Invite people to join a domain.
   *       Only the domain manager is able to invite people to join a domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/dm_adresses"
   *     responses:
   *       202:
   *         $ref: "#/responses/dm_invitations"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.post('/domains/:uuid/invitations', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.sendInvitations);

  /**
   * @swagger
   * /domains/{domain_id}/manager:
   *   get:
   *     tags:
   *      - Domain
   *     description: Check if the authenticated user is the domain manager.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/dm_domain"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.get('/domains/:uuid/manager', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.getDomain);

  /**
   * @swagger
   * /domains/{domain_id}/administrators:
   *   get:
   *     tags:
   *      - Domain
   *     description: get list administrators of a domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/dm_members"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/domains/:uuid/administrators', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.getDomainAdministrators);

  /**
   * @swagger
   * /domains/{domain_id}/administrators:
   *   post:
   *     tags:
   *      - Domain
   *     description: Add administrators to a domain
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
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
  router.post('/domains/:uuid/administrators', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.addDomainAdministrator);

  /**
   * @swagger
   * /domains/{domain_id}/administrators/{administrator_id}:
   *   delete:
   *     tags:
   *      - Domain
   *     description: Remove an administrator from a domain
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/dm_administrator_id"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/domains/:uuid/administrators/:administratorId', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.removeDomainAdministrator);
};
