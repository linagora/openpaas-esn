'use strict';

var authorize = require('../middleware/authorization');
var feedback = require('../controllers/feedback');
var feedbackMiddleware = require('../middleware/feedback');

module.exports = function(router) {
  router.post('/feedback', authorize.requiresAPILogin, feedbackMiddleware.checkFeedbackForm, feedback.createFeedback);
};
