'use strict';

module.exports = {
  OBJECT_TYPE: 'community',
  EVENTS: {
    communityCreated: 'communities:community:add',
    communityUpdated: 'communities:community:update',
    communityDeleted: 'communities:community:delete'
  },
  ELASTICSEARCH: {
    type: 'communities',
    index: 'communities.idx'
  },
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0
};
