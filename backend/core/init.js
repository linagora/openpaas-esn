const db = require('./db');
const pubsub = require('./pubsub');
const platformAdmin = require('./platformadmin/init');
const amqp = require('./amqp');

module.exports = callback => {
  db.mongo.init();
  pubsub.init();
  amqp.init();
  platformAdmin();

  callback && callback();
};
