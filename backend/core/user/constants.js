'use strict';

module.exports = {
  TYPE: 'openpaas',
  OBJECT_TYPE: 'user',
  FOLLOW_LINK_TYPE: 'follow',
  EVENTS: {
    userCreated: 'users:user:add',
    userUpdated: 'users:user:update',
    userDeleted: 'users:user:delete',
    userDisabled: 'users:user:disable'
  },
  ELASTICSEARCH: {
    type: 'users',
    index: 'users.idx'
  }
};
