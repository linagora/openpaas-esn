const mongoose = require('mongoose');
const { OBJECT_TYPE } = require('../constants');
const baseCollaboration = require('../../../../backend/core/db/mongo/models/base-collaboration');

var schema = {
  title: { type: String, default: 'OpenPaaS' },
  type: { type: String, trim: true, required: true, default: 'open' },
  membershipRequests: [
    {
      user: { type: mongoose.Types.ObjectId, ref: 'User'},
      workflow: {type: String, required: true},
      timestamp: {
        creation: {type: Date, default: Date.now}
      }
    }
  ]
};

const SimulatedCollaboration = baseCollaboration(schema, OBJECT_TYPE);

module.exports = mongoose.model('SimulatedCollaboration', SimulatedCollaboration);
