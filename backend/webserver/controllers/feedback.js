'use strict';

var feedback = require('../../core/feedback');
var email = require('../../core/email');

function createFeedback(req, res) {
  var feedbackObject = {
    subject: req.body.subject,
    content: req.body.content,
    author: req.user._id
  };

  feedback.save(feedbackObject, function(err, response) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Cannot save feedback: ' + err.message}});
    }
    return res.status(201).json(response);
  });

  feedback.sendEmail(feedbackObject, req, function(err, response) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Cannot send email feedback: ' + err.message}});
    }
    return res.status(200).json(response || []);
  });
}

module.exports.createFeedback = createFeedback;
