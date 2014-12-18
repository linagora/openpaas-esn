'use strict';

var ObjectId = require('mongoose').Schema.ObjectId;

function project(collaboration) {

  var projectJSON = {
    title: {type: String, required: true, trim: true},
    description: {type: String, trim: true},
    startDate: {type: Date},
    endDate: {type: Date},
    type: {type: String, trim: true, required: true, default: 'open'},
    status: String,
    avatar: ObjectId,
    membershipRequests: [{
      user: {type: ObjectId, ref: 'User'},
      workflow: {type: String, required: true},
      timestamp: {
        creation: {type: Date, default: Date.now}
      }
    }]
  };

  var ProjectSchema = collaboration.schemaBuilder(projectJSON);

  ProjectSchema.statics.testTitleDomain = function(title, domains, cb) {
    var query = {title: title, domain_ids: domains};
    this.findOne(query, cb);
  };

  var ProjectModel = collaboration.registerCollaborationModel('project', 'Project', ProjectSchema);
  return ProjectModel;

}

module.exports = project;
