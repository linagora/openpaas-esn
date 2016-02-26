'use strict';

module.exports = {
  TYPE: 'openpaas',
  EVENTS: {
    userCreated: 'users:user:add',
    userUpdated: 'users:user:update',
    userDeleted: 'users:user:delete'
  },
  ELASTICSEARCH: {
    type: 'users',
    index: 'users.idx'
  }
};
