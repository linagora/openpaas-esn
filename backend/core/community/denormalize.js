'use strict';

var Community = require('mongoose').model('Community');

function denormalize(community) {
  function transform(doc, ret) {
    ret.id = ret._id;
  }
  var options = {virtuals: true, transform: transform};

  return community instanceof Community ? community.toObject(options) : new Community(community).toObject(options);
}
module.exports = denormalize;
