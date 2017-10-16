'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new mongoose.Schema({
  active: { type: Boolean, default: true },
  number: { type: Number, unique: true },
  contract: { type: Schema.ObjectId, ref: 'Contract' },
  title: { type: String, required: true },
  address: { type: String },
  administrator: { type: Schema.ObjectId, ref: 'User' },
  defaultSupportManager: { type: Schema.ObjectId, ref: 'User' },
  startDate: { type: Date, required: true },
  terminationDate: { type: Date, required: true },
  type: { type: String, enum: ['USPL', 'USP', 'USL'] },
  description: { type: String },
  permissions: [{
    actor: { type: Schema.ObjectId },
    right: { type: String, enum: ['submit', 'view'] }
  }],
  creation: { type: Date, default: Date.now },
  schemaVersion: {type: Number, default: 1}
});

const OrderModel = mongoose.model('Order', OrderSchema);

OrderSchema.pre('save', function(next) {
  const self = this;

  if (!self.isNew) {
    return next();
  }

  // Get the document which has maximum number
  OrderModel.findOne({}, {}, { sort: { number: -1 } }, (err, order) => {
    if (err) {
      return next(err);
    }

    self.number = order ? order.number + 1 : 1;

    next();
  });
});

module.exports = OrderModel;
