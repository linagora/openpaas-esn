'use strict';

var monitoring = require('../controllers/monitoring');

module.exports = function(router) {

  /**
   * @swagger
   * /api/monitoring:
   *   get:
   *     tags:
   *       - Monitoring
   *     description: |
   *       Get monitoring data.
   *
   *       The application provides a collection of monitoring data which may be useful to clients/managers.
   *     responses:
   *       200:
   *         $ref: "#/responses/mo_data"
   */
  router.get('/monitoring', monitoring);
};
