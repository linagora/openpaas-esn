'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var rewire = require('rewire');

describe('The contacts dav-client Module', function() {

  function getModule() {
    return require('../../../backend/lib/dav-client');
  }

  function rewireModule() {
    return rewire('../../../backend/lib/dav-client');
  }

  describe('The rawClient function', function() {
    it('should send back error when options is undefined', function(done) {
      getModule().rawClient(null, function(err) {
        expect(err.message).to.match(/Options is required/);
        done();
      });
    });

    it('should set default header when undefined in options', function(done) {
      mockery.registerMock('request', function(options, callback) {
        expect(options.headers).to.deep.equal({});
        done();
      });
      getModule().rawClient({});
    });
  });

  describe('The get function', function() {
    it('should reject when options is undefined', function(done) {
      getModule().get().then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.error(done));
    });

    it('should call rawClient with right parameters', function(done) {
      var opts = {
        url: 'http://host'
      };

      var module = rewireModule();
      module.__set__('rawClient', function(options, callback) {
        expect(options).to.deep.equal({
          headers: {
            accept: 'application/vcard+json'
          },
          json: true,
          url: opts.url
        });
        done();
      });
      module.get(opts);
    });

    it('should reject when rawClient fails', function(done) {
      var module = rewireModule();
      module.__set__('rawClient', function(options, callback) {
        return callback(new Error());
      });
      module.get({}).then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.called(done));
    });

    it('should reject if HTTP status code is < 200', function(done) {
      var module = rewireModule();
      module.__set__('rawClient', function(options, callback) {
        return callback(null, {statusCode: 100});
      });
      module.get({}).then(this.helpers.callbacks.notCalled(done), function(err) {
        console.log(err);
        expect(err.message).to.match(/Error while getting the contact/);
        done();
      });
    });

    it('should reject if HTTP status code is > 299', function(done) {
      var module = rewireModule();
      module.__set__('rawClient', function(options, callback) {
        return callback(null, {statusCode: 300});
      });
      module.get({}).then(this.helpers.callbacks.notCalled(done), function(err) {
        console.log(err);
        expect(err.message).to.match(/Error while getting the contact/);
        done();
      });
    });

    it('should resolve with rawClient response body', function(done) {
      var body = {
        _id: 1
      };
      var module = rewireModule();
      module.__set__('rawClient', function(options, callback) {
        return callback(null, {statusCode: 200}, body);
      });
      module.get({}).then(function(data) {
        expect(data).to.deep.equal(data);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });
  });

});
