'use strict';

var resourceLink = require('../resource-link');
var CONSTANTS = require('./constants');

function getNbOfLikes(targetTuple) {
  return resourceLink.count({target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}
module.exports.getNbOfLikes = getNbOfLikes;

function isLikedBy(sourceTuple, targetTuple) {
  return resourceLink.exists({source: sourceTuple, target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}
module.exports.isLikedBy = isLikedBy;

function like(sourceTuple, targetTuple) {
  return resourceLink.create({source: sourceTuple, target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}
module.exports.like = like;
