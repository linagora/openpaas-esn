const db = require('./db');
const pubsub = require('./pubsub');
const platformAdmin = require('./platformadmin/init');

module.exports = callback => {
  db.mongo.init();
  pubsub.init();
  platformAdmin();

  callback && callback();
};
