'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The http-client module', function() {

  var getModule = function() {
    return require('../../../../backend/webserver/proxy/http-client');
  };

  it('should default to GET method', function(done) {
    mockery.registerMock('request', function(options, callback) {
      expect(options.method).to.equal('GET');
      callback();
    });

    getModule()({}, function() {
      done();
    });
  });

  it('should set required properties', function(done) {
    var method = 'PUT';
    var json = true;
    var url = 'http://dav:8080';
    var headers = {foo: 'bar', bar: 'baz'};

    mockery.registerMock('request', function(options, callback) {
      expect(options.method).to.equal(method);
      expect(options.json).to.equal(json);
      expect(options.url).to.equal(url);
      expect(options.headers).to.deep.equal(headers);
      callback();
    });

    getModule()({method: method, json: json, url: url, headers: headers}, function() {
      done();
    });
  });

  it('should set body when defined', function(done) {
    var body = {foo: 'bar'};

    mockery.registerMock('request', function(options, callback) {
      expect(options.body).to.deep.equal(body);
      callback();
    });

    getModule()({body: body}, function() {
      done();
    });
  });

  it('should update the host header', function(done) {
    var url = 'http://davbackend';
    var headers = {foo: 'bar', bar: 'baz', host: 'localhost'};

    mockery.registerMock('request', function(options, callback) {
      expect(options.headers.host).to.equal('davbackend');
      callback();
    });

    getModule()({method: 'GET', json: true, url: url, headers: headers}, function() {
      done();
    });
  });

});
