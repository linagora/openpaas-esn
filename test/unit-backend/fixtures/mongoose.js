'use strict';

var noop = function() {};

module.exports.mongoose = function() {

  var mongoose = {
    connection: {
      on: noop
    },
    model: noop,
    Schema: function() {
      return {
        pre: noop
      };
    }
  };
  mongoose.Schema.Types = { ObjectId: null };
  return mongoose;
};
