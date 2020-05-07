const express = require('express');

module.exports = dependencies => {
  const submitJob = require('./controllers')(dependencies);
  const { requiresAPILogin } = dependencies('authorizationMW');
  const {
    checkQueryFormat,
    checkAuthorization
  } = require('./middlewares')(dependencies);
  const router = express.Router();

  /**
   * @swagger
   * /contact/api/addressbooks/domainmembers/synchronize:
   *   post:
   *     tags:
   *       - synchoronize, addressbooks, domain-members
   *     description: To submit a synchronizing domain members address book job for a particular domain or all domains in the system <br>
   *       - In case of a particular domain, domain admin role and a domain id param in query are required <br>
   *       - In case of all domains in the system, platform admin role is required
   *     parameters:
   *       - $ref: "#/parameters/addressbook_domain_members_domain_id"
   *     responses:
   *       201:
   *         $ref: "#/responses/addressbook_domain_members_synchronize_job"
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
    submitJob
  );

  return router;
};
