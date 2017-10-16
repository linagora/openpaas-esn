'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractSchema = new mongoose.Schema({
  active: { type: Boolean, default: true },
  number: { type: String },
  title: { type: String, required: true },
  organization: { type: Schema.ObjectId, ref: 'Organization', required: true },
  administrator: { type: Schema.ObjectId, ref: 'User' },
  defaultSupportManager: { type: Schema.ObjectId, ref: 'User' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  openingHours: { type: String },
  orders: [{ type: Schema.ObjectId, ref: 'Order' }],
  permissions: [{
    actor: { type: Schema.ObjectId },
    right: { type: String, enum: ['submit', 'view'] }
  }],
  users: [{ type: Schema.ObjectId, ref: 'User' }],
  creation: { type: Date, default: Date.now },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Contract', ContractSchema);
