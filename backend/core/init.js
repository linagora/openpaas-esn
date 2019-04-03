const db = require('./db');
const pubsub = require('./pubsub');

module.exports = callback => {
  db.mongo.init();
  pubsub.init();

  callback && callback();
};
