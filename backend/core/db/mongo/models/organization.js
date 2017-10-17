'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationSchema = new mongoose.Schema({
  parent: { type: Schema.ObjectId, ref: 'Organization' },
  shortName: { type: String, required: true },
  fullName: { type: String },
  type: { type: String },
  address: { type: String },
  administrator: { type: Schema.ObjectId, ref: 'User' },
  contract: { type: Schema.ObjectId, ref: 'Contract' },
  orders: [{ type: Schema.ObjectId, ref: 'Order' }],
  users: [{ type: Schema.ObjectId, ref: 'User' }],
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Organization', OrganizationSchema);
