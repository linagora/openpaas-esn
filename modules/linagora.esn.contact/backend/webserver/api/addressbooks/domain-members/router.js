const express = require('express');

module.exports = dependencies => {
  const submitJob = require('./controllers')(dependencies);
  const { requiresAPILogin } = dependencies('authorizationMW');
  const {
    checkQueryFormat,
    checkAuthorization,
    requireFeatureEnabledForDomain
  } = require('./middlewares')(dependencies);
  const router = express.Router();

  /**
   * @swagger
   * /addressbooks/domainmembers/synchronize:
   *   post:
   *     tags:
   *       - synchoronize, addressbooks, domain-members
   *     description:
   *       Synchronize domain members address book (DMAB):
   *
   *       Notes:
   *       - Synchronize DMAB can be launched in platform or domain scope. The different scopes present the different queries
   *       - Synchronize DMAB in platform: POST /contact/api/addressbooks/domain-members/synchronize
   *       - Synchronize DMAB in domain: POST /contact/api/addressbooks/domain-members/synchronize?domain_id={Objectid}
   *
   *     query:
   *       - $ref: "#/parameters/addressbook_domain_members_domain_id"
   *     responses:
   *       201:
   *         $ref: "#/responses/addressbook_domain_members_synchronize_jobs"
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

  router.post('/domainmembers/synchronize',
    requiresAPILogin,
    checkQueryFormat,
    checkAuthorization,
    requireFeatureEnabledForDomain,
    submitJob
  );

  return router;
};
