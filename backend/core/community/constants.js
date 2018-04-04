'use strict';

module.exports = {
  OBJECT_TYPE: 'community',
  MODEL_NAME: 'Community',
  EVENTS: {
    communityCreated: 'communities:community:add',
    communityUpdated: 'communities:community:update',
    communityDeleted: 'communities:community:delete',
    communityUpdate: 'communities:community:update',
    communityArchived: 'communities:community:archive'
  },
  ELASTICSEARCH: {
    type: 'communities',
    index: 'communities.idx'
  },
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0
};
