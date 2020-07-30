'use strict';

const { requiresAPILogin } = require('../middleware/authorization');
const { requirePlatformAdmin } = require('../middleware/platformadmins');
const { canCreateSPA, applicationExists, validateConfigBody } = require('../middleware/application-discovery-service.js');
const controller = require('../controllers/application-discovery-service.js');

module.exports = router => {
  /**
  * @swagger
  * /api/ads:
  *   get:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Get the list of applications and services.
  *     responses:
  *       200:
  *         $ref: "#/responses/spa_list"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.get('/ads',
    requiresAPILogin,
    controller.list
  );

  /**
  * @swagger
  * /api/ads/platform:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Toggles (enabled or disabled ) an application for the platform.
  *     responses:
  *       204:
  *         $ref: "#/responses/cm_204"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.put('/ads/platform',
    requiresAPILogin,
    requirePlatformAdmin,
    controller.toggleForPlatform
  );

  /**
  * @swagger
  * /api/ads/domains/{domainId}:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Toggles (enabled or disabled ) an application for a specific domain.
  *     parameters:
  *       - $ref: "#/parameters/dm_id"
  *     responses:
  *       204:
  *         $ref: "#/responses/cm_204"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.put('/ads/domains/:domainId',
    requiresAPILogin,
    requirePlatformAdmin,
    controller.toggleForDomain
  );

  /**
  * @swagger
  * /api/ads/{spaId}:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Updates an SPA by id.
  *     parameters:
  *       - $ref: "#/parameters/spaId"
  *     responses:
  *       204:
  *         $ref: "#/responses/cm_204"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.put('/ads/:spaId',
    requiresAPILogin,
    requirePlatformAdmin,
    validateConfigBody,
    applicationExists,
    controller.update
  );

  /**
  * @swagger
  * /api/ads:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Creates a new SPA.
  *     responses:
  *       204:
  *         $ref: "#/responses/spa_object"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.put('/ads',
    requiresAPILogin,
    requirePlatformAdmin,
    validateConfigBody,
    canCreateSPA,
    controller.create
  );

  /**
  * @swagger
  * /api/ads/{spaId}:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Deletes an SPA by id.
  *     parameters:
  *       - $ref: "#/parameters/spaId"
  *     responses:
  *       204:
  *         $ref: "#/responses/cm_204"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.delete('/ads/:spaId',
    requiresAPILogin,
    requirePlatformAdmin,
    applicationExists,
    controller.deleteById
  );

  /**
  * @swagger
  * /api/ads/users/{userId}:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: Toggles (enabled or disabled ) an application for a specific user.
  *     parameters:
  *       - $ref: "#/parameters/uss_uuid"
  *     responses:
  *       204:
  *         $ref: "#/responses/cm_204"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.put('/ads/users/:userId',
    requiresAPILogin,
    requirePlatformAdmin,
    controller.toggleForUser
  );

  /**
  * @swagger
  * /api/user/ads:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: gets the SPA list for the current user by type.
  *     responses:
  *       204:
  *         $ref: "#/responses/spa_list"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.get('/user/ads',
    requiresAPILogin,
    controller.getForCurrentUser
  );

  /**
  * @swagger
  * /api/users/{userId}/ads:
  *   put:
  *     tags:
  *      - ApplicationDiscoveryService
  *     description: gets the SPA list for a given user by type.
  *     parameters:
  *       - $ref: "#/parameters/uss_uuid"
  *     responses:
  *       204:
  *         $ref: "#/responses/spa_list"
  *       401:
  *         $ref: "#/responses/cm_401"
  *       404:
  *         $ref: "#/responses/cm_404"
  *       500:
  *         $ref: "#/responses/cm_500"
  */
  router.get('/users/:userId/ads',
    requiresAPILogin,
    requirePlatformAdmin,
    controller.listForUser
  );
};
