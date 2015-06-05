'use strict';

var mongoose = require('mongoose');

module.exports = function(schemas) {
  var tuple = schemas.tuple;
  var Tuple = tuple.Tuple;

  var Artifact = new mongoose.Schema({
    id: {type: String, required: true},
    version: {type: String, required: true},
    changelog: {type: String},
    timestamps: {
      creation: {type: Date, default: Date.now}
    }
  }, {_id: false});

  var Deployment = new mongoose.Schema({
    target: {type: Tuple.tree, validate: [tuple.validateTuple, 'Bad object tuple']},
    state: {type: String, required: true, default: 'submit'},
    version: {type: String, required: true},
    installs: {type: [Tuple], validate: [tuple.validateTuples, 'Bad install tuples']},
    timestamps: {
      creation: {type: Date, default: Date.now}
    }
  }, {_id: false});

  var Injection = new mongoose.Schema({
    key: {type: String, required: true},
    values: [
      {
        directive: {type: String, required: true},
        attributes:
          [{
            name: {type: String, required: true},
            value: {type: String, required: true}
          }]
      }
    ]
  }, {_id: false});

  var ApplicationSchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true},
    moduleName: {type: String, trim: true},
    description: {type: String, trim: true},
    author: {type: String, trim: true},
    website: {type: String, trim: true},
    icon: {type: Tuple.tree, validate: [tuple.validateIconTuple, 'bad objectType']},
    avatar: {type: String},
    artifacts: {type: [Artifact]},
    deployments: {type: [Deployment]},
    timestamps: {
      creation: {type: Date, default: Date.now}
    },
    domainInjections: {type: [Injection]},
    targetInjections: {type: [Injection]},
    schemaVersion: {type: Number, default: 1}
  });

  ApplicationSchema.methods = {
    getArtifactFromVersion: function(version, callback) {
      if (!version) {
        return callback(new Error('Can not find archive for null version'));
      }

      var foundArtifacts = this.artifacts.filter(function(artifact) {
        return artifact.version === version;
      });

      if (foundArtifacts.length === 0) {
        return callback(null, null);
      }

      return callback(null, foundArtifacts[0]);
    }
  };

  mongoose.model('Application', ApplicationSchema);
};
