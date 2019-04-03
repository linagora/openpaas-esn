require('./env');

const fs = require('fs');

exports = module.exports = {};

fs.readdirSync(__dirname).forEach(filename => {
  const stat = fs.statSync(__dirname + '/' + filename);

  if (!stat.isDirectory()) { return; }

  function load() { return require('./' + filename); }
  exports.__defineGetter__(filename, load); // eslint-disable-line no-restricted-properties
});

exports.init = init;

function init(callback) {
  exports.db.mongo.init();
  exports.pubsub.init();
  if (callback) {
    callback();
  }
}
