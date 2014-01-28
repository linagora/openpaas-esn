'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var BASEPATH = '../../../..';

describe('The Core module config jsonstore', function() {

  it('should exist', function() {
    var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore');
    expect(jsonstore).to.exist;
    expect(jsonstore).to.be.a.Module;
  });

  describe('The all function', function() {

    it('should throw error if jsonstore config file does not exist', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fail.json');
      jsonstore.all(function(err, json) {
        expect(err).to.be.not.null;
      });
    });

    it('should return content from existing file', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/jsonstore-mongo.json');
      jsonstore.all(function(err, json) {
        expect(err).to.be.null;
        expect(json).to.be.not.null;
        expect(json).to.be.an.Object;
      });
    });

    it('should be able to get the mongo URL value', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/jsonstore-mongo.json');
      jsonstore.all(function(err, json) {
        expect(err).to.be.null;
        expect(json).to.be.not.null;
        expect(json).to.be.an.Object;
        /*jshint -W069 */
        expect(json['mongo']).to.be.not.null;
        expect(json['mongo'].url).to.be.not.null;
        expect(json['mongo'].url).to.equal('mongodb://locahost:27017/foo');
      });
    });

    it('should not fail reading empty file', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/jsonstore-empty.json');
      jsonstore.all(function(err, json) {
        expect(err).to.be.null;
        expect(json).to.be.empty;
      });
    });
  });

  describe('The get function', function() {
    it('should return error if file does not exists', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/fail.json');
      jsonstore.get('foo', function(err, json) {
        expect(err).to.be.not.null;
      });
    });

    it('should return error if key does not exists', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/jsonstore-mongo.json');
      jsonstore.get('foo', function(err, json) {
        expect(err).to.be.not.null;
      });
    });

    it('should return error if key is null', function () {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/jsonstore-mongo.json');
      jsonstore.get(null, function(err, json) {
        expect(err).to.be.not.null;
      });
    });

    it('should return the data if key exists', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(__dirname + '/../fixtures/jsonstore-mongo.json');
      jsonstore.get('mongo', function(err, json) {
        expect(err).to.be.null;
        expect(json).to.be.not.null;
        expect(json.url).to.be.not.null;
        expect(json.url).to.equal('mongodb://locahost:27017/foo');
      });
    });
  });

  describe('The push function', function() {
    var tmp = __dirname + '/' + BASEPATH + '/tmp';

    beforeEach(function() {
      var p = path.resolve(tmp);
      if (fs.exists(p)) {
        fs.mkdirSync(p);
      }
    });

    afterEach(function() {
      //fs.rmdirSync(path.resolve(tmp));
    });

    it('should fail on null key', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')();
      jsonstore.push(null, {}, function(err) {
        expect(err).to.be.not.null;
      });
    });

    it('should fail on null data', function() {
      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')();
      jsonstore.push('url', null, function(err) {
        expect(err).to.be.not.null;
      });
    });

    it('should create the file if it does not exists', function() {
      var file = tmp + '/testcreatepush.json';

      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }

      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(file);
      jsonstore.push('foo', { bar: 'baz'}, function(err) {
        // FIXME : Why undefined here and not null?
        expect(err).to.be.undefined;
        expect(fs.existsSync(file)).to.be.true;
      });
    });

    it('should add data into an existing file', function() {
      // copy an existing file to a folder then add data
      var file = __dirname + '/../fixtures/jsonstore-mongo.json';
      var out = __dirname + '/' + BASEPATH + '/tmp/testpushconfig.json';

      // do not do it with stream for now
      //fs.createReadStream(file).pipe(fs.createWriteStream(tmp));
      var json = JSON.parse(fs.readFileSync(file));
      fs.writeFileSync(out, JSON.stringify(json));

      var data = { stmp: 'smtp.linagora.com'};

      var jsonstore = require(BASEPATH + '/backend/core/config/jsonstore')(out);
      jsonstore.push('email', data, function(err) {
        expect(err).to.be.undefined;
        var config = JSON.parse(fs.readFileSync(out));

        expect(config).is.not.null;
        expect(config.email).is.not.null;
        expect(config.email.smtp).is.not.null;
        expect(config.email.smtp).is.equal(data.smtp);
        expect(config.mongo).is.not.null;
      });
    });
  });
});
