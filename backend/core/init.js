const db = require('./db');
const pubsub = require('./pubsub');
const platformAdmin = require('./platformadmin/init');
const amqp = require('./amqp');
const elasticsearch = require('./elasticsearch');
const ldap = require('./ldap');

module.exports = callback => {
  db.mongo.init();
  db.redis.initHealthCheck();
  pubsub.init();
  amqp.init();
  elasticsearch.init();
  ldap.initHealthCheck();
  platformAdmin();

  callback && callback();
};
