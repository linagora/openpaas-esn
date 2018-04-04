const mongoose = require('mongoose');

const CommunityArchiveSchema = {
  creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  timestamps: {
    creation: { type: Date, default: Date.now }
  },
  source: mongoose.Schema.Types.Mixed
};

module.exports = mongoose.model('CommunityArchive', CommunityArchiveSchema);
