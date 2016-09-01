'use strict';

function isValidLink(link) {
  return (link.target && link.target.objectType && link.target.id && link.source && link.source.objectType && link.source.id && link.type);
}

function isOwnerLink(owner, id) {
  return id.equals(owner);
}

module.exports.isValidLink = isValidLink;
module.exports.isOwnerLink = isOwnerLink;
