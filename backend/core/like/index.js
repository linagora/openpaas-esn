const resourceLink = require('../resource-link');
const CONSTANTS = require('./constants');

module.exports = {
  getNbOfLikes,
  isLikedBy,
  like,
  unlike
};

function getNbOfLikes(targetTuple) {
  return resourceLink.count({target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}

function isLikedBy(sourceTuple, targetTuple) {
  return resourceLink.exists({source: sourceTuple, target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}

function like(sourceTuple, targetTuple) {
  return resourceLink.create({source: sourceTuple, target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}

function unlike(sourceTuple, targetTuple) {
  return resourceLink.remove({source: sourceTuple, target: targetTuple, type: CONSTANTS.LIKE_LINK_TYPE});
}
