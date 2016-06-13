'use strict';

var authorize = require('../middleware/authorization');
var feedback = require('../controllers/feedback');
var feedbackMiddleware = require('../middleware/feedback');

module.exports = function(router) {

  /**
   * @swagger
   * /feedback:
   *   post:
   *     tags:
   *      - Feedback
   *     description: Create a new feedback.
   *     parameters:
   *       - $ref: "#/parameters/fb_content"
   *     responses:
   *       201:
   *         $ref: "#/responses/fb_feedback"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/feedback', authorize.requiresAPILogin, feedbackMiddleware.checkFeedbackForm, feedback.createFeedback);
};
