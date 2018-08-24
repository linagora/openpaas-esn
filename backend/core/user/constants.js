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
  USER_ACTIONS: {
    login: 'login',
    searchable: 'searchable'
  },
  USER_ACTION_STATES: {
    disabled: 'disabled',
    enabled: 'enabled'
  },
  ELASTICSEARCH: {
    type: 'users',
    index: 'users.idx'
  },
  USERS_SEARCH_DEFAULT_LIMIT: 50,
  USERS_SEARCH_DEFAULT_OFFSET: 0
};
