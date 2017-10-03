'use strict';

const mongoose = require('mongoose');
const TechnicalUser = mongoose.model('TechnicalUser');

function sanitizeTechnicalUser(user) {
  return user instanceof TechnicalUser ? user.toJSON() : user;
}

module.exports = {
  sanitizeTechnicalUser
};
