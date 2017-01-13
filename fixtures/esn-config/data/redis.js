'use strict';

module.exports = function() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: +process.env.REDIS_PORT || 6379
  };
};
