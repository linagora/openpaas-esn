const { OBJECT_TYPE } = require('./constants');

module.exports = {
  getPath
};

function getPath(user) {
  return `api/avatars?objectType=${OBJECT_TYPE}&email=${user.preferredEmail}`;
}
