'use strict';

const authorizeMW = require('../middleware/authorization');
const hellperMW = require('../middleware/helper');
const controller = require('../controllers/availability');

module.exports = function(router) {
  /**
   * @swagger
   * /availability:
   *   get:
   *     tags:
   *       - Availability
   *     description: Check the availability of a resource, currenty only email is supported.
   *     parameters:
   *       - $ref: "#/parameters/availability_resource_type"
   *       - $ref: "#/parameters/availability_resource_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/availability_result"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/availability',
    authorizeMW.requiresAPILogin,
    hellperMW.requireInQuery(['resourceId', 'resourceType']),
    controller.checkAvailability
  );
};
