'use strict';

module.exports = dependencies => {
  const logger = dependencies('logger');
  const userModule = dependencies('user');

  return {
    decodeJWT
  };

  function decodeJWT(req, res, next) {
    const payload = req.user;
    let badRequest;

    if (!payload.calendarURI) {
      badRequest = 'Calendar ID is required';
    }
    if (!payload.uid) {
      badRequest = 'Event uid is required';
    }
    if (!payload.attendeeEmail) {
      badRequest = 'Attendee email is required';
    }
    if (!payload.action) {
      badRequest = 'Action is required';
    }
    if (!payload.organizerEmail) {
      badRequest = 'Organizer email is required';
    }
    if (badRequest) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: badRequest}});
    }

    userModule.findByEmail(payload.organizerEmail, (err, organizer) => {
      if (err) {
        logger.error('Error while searching event organizer.', err);

        return res.status(500).json({error: {code: 500, message: 'Internal Server Error', details: 'Error while searching for the event organizer'}});
      }

      if (!organizer) {
        return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Organizer email is not valid.'}});
      }

      req.eventPayload = payload;
      req.user = organizer;
      next();
    });
  }
};
