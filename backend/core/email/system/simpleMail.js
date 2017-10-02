'use strict';

const { promisify } = require('util');

module.exports = (userId, properties = {}) => {
  const getUser = promisify(require('../../user').get);
  const sendEmail = promisify(require('../index').getMailer().send);

  if (!properties.subject || !properties.text) {
    return Promise.reject(new Error('subject and text can not be null'));
  }

  if (!userId) {
    return Promise.reject(new Error('User Id can not be null'));
  }

  return getUser(userId)
    .then(user => {
      if (!user) {
        return Promise.reject(new Error('User not found'));
      }

      properties.to = user.preferredEmail;

      return sendEmail(properties);
    });
};
