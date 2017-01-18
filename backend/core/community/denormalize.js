'use strict';

const Community = require('mongoose').model('Community');

module.exports = {
  denormalize,
  getId
};

function denormalize(community) {
  function transform(doc, ret) {
    ret.id = getId(ret);
    delete ret._id;
  }
  var options = {virtuals: true, transform: transform};

  return community instanceof Community ? community.toObject(options) : new Community(community).toObject(options);
}

function getId(community) {
  return community._id;
}
