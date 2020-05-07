const db = require('./db');
const pubsub = require('./pubsub');
const platformAdmin = require('./platformadmin/init');
const amqp = require('./amqp');
const elasticsearch = require('./elasticsearch');

module.exports = callback => {
  db.mongo.init();
  pubsub.init();
  amqp.init();
  elasticsearch.init();
  platformAdmin();

  callback && callback();
};
