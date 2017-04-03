const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

function isValidObjectId(id) {
  try {
    new ObjectId(id);

    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  isValidObjectId
};
