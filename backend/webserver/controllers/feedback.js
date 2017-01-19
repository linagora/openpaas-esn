'use strict';

var feedback = require('../../core/feedback');

function createFeedback(req, res) {
  var feedbackObject = {
    subject: req.body.subject,
    content: req.body.content,
    author: req.user._id
  };

  feedback.save(feedbackObject, function(err) {
    if (err) {
      return res.status(500).json({error: {status: 500, message: 'Server Error', details: 'Cannot save feedback: ' + err.message}});
    }
    feedback.sendEmail(feedbackObject, req.user, function(err, response) {
      if (err) {
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Cannot send email feedback: ' + err.message}});
      }
      return res.status(200).json(response);
    });
  });
}
module.exports.createFeedback = createFeedback;
