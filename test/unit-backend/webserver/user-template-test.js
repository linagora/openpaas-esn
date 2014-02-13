'use strict';

require('../all');

var expect = require('chai').expect;
var fs = require('fs-extra');

describe('The user-template module', function() {
  var dbjson = null;

  beforeEach(function() {
    var fixtureDb = this.testEnv.fixtures + '/config/db.json';
    dbjson = this.testEnv.tmp + '/db.json';
    fs.copySync(fixtureDb, dbjson);
  });

  afterEach(function() {
    try {
      fs.unlinkSync(dbjson);
    } catch (err) {}
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
