'use strict';

var feedback = require('../../core/feedback');

function createFeedback(req, res) {
  var feedbackObject = {
    content: req.body.content,
    author: req.user._id
  };

  feedback.save(feedbackObject, function(err, response) {
    if (err) {
      return res.json(500, {error: {status: 500, message: 'Server Error', details: 'Cannot save feedback: ' + err.message}});
    }
    return res.json(201, response);
  });
}

module.exports.createFeedback = createFeedback;
