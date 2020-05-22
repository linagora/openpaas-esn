'use strict';

var express = require('express');

module.exports = function(lib, dependencies) {

  var router = express.Router();

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(lib, dependencies);
  var middleware = require('./middleware')(lib, dependencies);

  /**
   * @swagger
   * /graceperiod/api/tasks/{id}:
   *   delete:
   *     tags:
   *       - GracePeriod
   *     description: Aborts a task which has been added to the grace period component.
   *     parameters:
   *       - $ref: "#/parameters/gp_id"
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
  router.delete('/tasks/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.isUserTask, controller.cancel);

  /**
   * @swagger
   * /graceperiod/api/tasks/{id}:
   *   put:
   *     tags:
   *       - GracePeriod
   *     description: Flushs a pending task. Its job will be directly processed.
   *     parameters:
   *       - $ref: "#/parameters/gp_id"
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
  router.put('/tasks/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.isUserTask, controller.flush);

  return router;
};
