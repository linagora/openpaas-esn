'use strict';

function checkFeedbackForm(req, res, next) {
  if (!req.body) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing body'});
  }

  if (!req.body.content) {
    return res.status(400).json({error: 400, message: 'Bad request', details: 'Missing content'});
  }

  next();
}

module.exports.checkFeedbackForm = checkFeedbackForm;
