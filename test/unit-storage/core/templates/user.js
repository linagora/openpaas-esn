'use strict';

describe('The User template module', function() {

  describe('store function', function() {
    beforeEach(function() {
      this.testEnv.writeDBConfigFile();
    });
    afterEach(function() {
      this.testEnv.removeDBConfigFile();
    });

    it('should inject the user template in the templates collection', function(done) {
      var self = this;
      var userInject = require(this.testEnv.basePath + '/backend/core/templates/user');
      var template = require(this.testEnv.basePath + '/backend/core/templates/data/user-template').simple();
      this.testEnv.initCore();
      template._id = 'user';
      userInject.store(function(err) {
        if (err) {
          return done(err);
        }
        self.helpers.mongo.checkDoc('templates', 'user', template, done);
      });
    });
  });

});
