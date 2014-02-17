'use strict';

var expect = require('chai').expect;

describe('The user-template module', function() {

  beforeEach(function() {
    this.testEnv.writeDBConfigFile();
  });

  afterEach(function() {
    this.testEnv.removeDBConfigFile();
  });

  it('should store user-template.json into database : collection = templates, _id=user', function(done) {
    var esnConf = require('../../../backend/core/esn-config');
    var template = require('../../../backend/core/templates');

    template.user.store(function(err) {
      expect(err).to.be.null;

      var userDB = esnConf('user', 'templates');
      userDB.get(function(err, doc) {
        expect(doc._id).to.equal('user');
        done();
      });
    });
  });
});
