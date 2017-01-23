'use strict';

module.exports = {
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0,
  COLLABORATION_TYPES: {
    OPEN: 'open',
    PRIVATE: 'private',
    RESTRICTED: 'restricted',
    CONFIDENTIAL: 'confidential'
  },
  MEMBERSHIP_TYPES: {
    invitation: 'invitation',
    request: 'request'
  },
  STATUS: {
    joined: 'joined'
  },
  WORKFLOW_NOTIFICATIONS_TOPIC: {
    request: 'collaboration:membership:request',
    invitation: 'collaboration:membership:invite'
  }
};
