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
        pre: noop,
        virtual: function() {
          return {
            get: noop
          };
        }
      };
    }
  };
  mongoose.Schema.Types = { ObjectId: null };
  mongoose.Types = { ObjectId: function() {} };
  return mongoose;
};
