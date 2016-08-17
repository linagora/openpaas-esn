'use strict';

var authorize = require('../middleware/authorization');
var linkMiddleware = require('../middleware/resource-link');
var linkController = require('../controllers/resource-link');

module.exports = function(router) {

  /**
   * @swagger
   * /api/resource-links:
   *   post:
   *     description:
   *       Create a new typed link between resources. For example, create a 'like' link between a user (source) and a message (target)
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resource-link
   *         in: body
   *         required: true
   *         schema:
   *           $ref: "#/definitions/ResourceLinkRequest"
   *     responses:
   *       "201":
   *         description: Created.
   *         schema:
   *           type: object
   *           items:
   *             $ref: "#/definitions/ResourceLink"
   *       "400":
   *         description: Bad request
   *       "500":
   *         description: Internal server error - Something went bad on the server side.
   *       default:
   *         description: Error
   *         schema:
   *           $ref: "#/definitions/ErrorResponse"
   */
  router.post('/resource-links',
    authorize.requiresAPILogin,
    linkMiddleware.isResourceLink,
    linkMiddleware.canCreate,
    linkMiddleware.isLinkable,
    linkController.create);

  /**
   * @swagger
   * /api/resource-links:
   *   delete:
   *     Delete an existant link between resources. For example, delete a 'like' link between a user (source) and a message (target)
   *     parameters:
   *       - name: resource-link
   *         in: query
   *         required: true
   *         schema:
   *           $ref: "#/definitions/ResourceLinkRequest"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/resource-links',
    authorize.requiresAPILogin,
    linkMiddleware.isResourceLink,
    linkMiddleware.canDelete,
    linkController.remove);
};
