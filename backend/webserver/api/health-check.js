const controller = require('../controllers/health-check');
const healthCheckMW = require('../middleware/health-check');

module.exports = router => {
  /**
   * @swagger
   * /healthcheck:
   *   get:
   *     tags:
   *      - Healthcheck
   *     description:
   *       Get health status of services.
   *     responses:
   *       200:
   *         $ref: "#/responses/hc_response"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/healthcheck',
    healthCheckMW.checkAPIAuthorization,
    controller.getAllServices
  );

  /**
   * @swagger
   * /healthcheck/services:
   *   get:
   *     tags:
   *      - Healthcheck
   *     description:
   *       Get all available services for health check.
   *     responses:
   *       200:
   *         $ref: "#/responses/hc_available"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/healthcheck/services',
    controller.getAvailableServices
  );

  /**
   * @swagger
   * /healthcheck/:name:
   *   get:
   *     tags:
   *      - Healthcheck
   *     description:
   *       Get health status of a single service by name.
   *     parameters:
   *       - $ref: "#/parameters/hc_name"
   *     responses:
   *       200:
   *         $ref: "#/responses/hc_response_single"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get(
    '/healthcheck/:name',
    healthCheckMW.checkAPIAuthorization,
    controller.getOneService
  );
};
