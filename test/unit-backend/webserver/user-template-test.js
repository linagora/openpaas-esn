'use strict';

var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');

var BASEPATH = '../../../';

var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');

var fixture = __dirname + '/fixtures/config/default.json';
var defaultjson = tmp + '/default.json';

var fixtureDb = __dirname + '/fixtures/config/db.json';
var dbjson = tmp + '/db.json';

describe('The user-template module', function() {

  beforeEach(function() {
    process.env.NODE_CONFIG = tmp;
    if (!fs.exists(tmp)) {
      try {
        fs.mkdirSync(tmp);
      } catch (err) {
      }
    }

    var data = fs.readFileSync(fixture);
    fs.writeFileSync(defaultjson, data);

    data = fs.readFileSync(fixtureDb);
    fs.writeFileSync(dbjson, data);
  });

  afterEach(function() {
    process.env.NODE_CONFIG = null;
    try {
      fs.unlinkSync(defaultjson);
    } catch (err) {
    }
    try {
      fs.unlinkSync(dbjson);
    } catch (err) {
    }
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
