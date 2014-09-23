'use strict';

var mongoose = require('mongoose');
var emailMessageModule = require('./email');
var whatsupMessageModule = require('./whatsup');

var objectTypeToSchemaName = {
  email: 'EmailMessage',
  whatsup: 'Whatsup'
};

function get(uuid, callback) {
  var whatsupModel = mongoose.model('Whatsup');
  var ouuid = new mongoose.Types.ObjectId(uuid);
  whatsupModel.collection.findOne({_id: ouuid}, function(err, doc) {
    if (err) {
      return callback(err);
    }
    if (!doc) {
      return callback(new Error('Document not found (id = ' + uuid + ')'));
    }
    var modelName = objectTypeToSchemaName[doc.objectType];
    if (!modelName) {
      return callback(new Error('Unkown object type: ', doc.objectType));
    }
    var Model = mongoose.model(modelName);
    var instance = new Model(doc);
    instance.isNew = false;
    return callback(null, instance);
  });
}

module.exports = {
  type: {
    email: emailMessageModule,
    whatsup: whatsupMessageModule
  },
  permission: require('./permission'),
  get: get
};
