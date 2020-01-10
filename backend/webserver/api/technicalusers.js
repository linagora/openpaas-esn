const authorizationMW = require('../middleware/authorization');
const domainMW = require('../middleware/domain');
const controller = require('../controllers/technicalusers');
const technicalUserMW = require('../middleware/technicaluser');

module.exports = router => {
  /**
   * @swagger
   * /domains/{domain_id}/technicalusers:
   *   get:
   *     tags:
   *      - TechnicalUser
   *     description: |
   *       List all technical users from a specific domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_offset"
   *     responses:
   *       200:
   *         $ref: "#/responses/tu_technicalusers_list"
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
  router.get('/domains/:uuid/technicalusers',
    authorizationMW.requiresAPILogin,
    domainMW.load,
    authorizationMW.requirePlatformAdminOrDomainAdmin,
    controller.list);

  /**
   * @swagger
   * /domains/{domain_id}/technicalusers:
   *   post:
   *     tags:
   *      - TechnicalUser
   *     description: |
   *       Create a technical user for a specific domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/tu_technicaluser"
   *     responses:
   *       201:
   *         $ref: "#/responses/tu_technicaluser"
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
  router.post('/domains/:uuid/technicalusers',
    authorizationMW.requiresAPILogin,
    domainMW.load,
    authorizationMW.requirePlatformAdminOrDomainAdmin,
    controller.create);

  /**
   * @swagger
   * /domains/{domain_id}/technicalusers/{technicaluser_id}:
   *   put:
   *     tags:
   *      - TechnicalUser
   *     description: |
   *       Update a technical user belonging to a domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/tu_technicaluser_id"
   *       - $ref: "#/parameters/tu_technicaluser"
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
  router.put('/domains/:uuid/technicalusers/:technicalUserId',
    authorizationMW.requiresAPILogin,
    domainMW.load,
    technicalUserMW.load,
    authorizationMW.requirePlatformAdminOrDomainAdmin,
    controller.update);

  /**
   * @swagger
   * /domains/{domain_id}/technicalusers/{technicaluser_id}:
   *   delete:
   *     tags:
   *      - TechnicalUser
   *     description: |
   *       Delete a technical user belonging to a domain.
   *     parameters:
   *       - $ref: "#/parameters/dm_id"
   *       - $ref: "#/parameters/tu_technicaluser_id"
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
  router.delete('/domains/:uuid/technicalusers/:technicalUserId',
    authorizationMW.requiresAPILogin,
    domainMW.load,
    technicalUserMW.load,
    authorizationMW.requirePlatformAdminOrDomainAdmin,
    controller.remove);
};
