'use strict';

module.exports = dependencies => {
  dependencies('invitation').registerHandler('signup', require('./handlers/signup')(dependencies));
};
