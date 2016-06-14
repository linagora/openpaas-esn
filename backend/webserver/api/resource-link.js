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

};
