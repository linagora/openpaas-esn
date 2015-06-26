'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The Delete action', function() {

  var deps, dependencies;
  var url = 'http://dav:8001';

  beforeEach(function() {
    deps = {
      auth: {
        token: {
          getNewToken: function() {}
        }
      },

      logger: {
        debug: console.log,
        error: console.log
      },

      'esn-config': function() {
        return {
          get: function(callback) {
            return callback(null, {backend: {url: url}});
          }
        };
      }
    };

    dependencies = function(name) {
      return deps[name];
    };
  });

  function getModule() {
    return require('../../../../backend/lib/actions/delete')(dependencies);
  }

  it('should fail if context is undefined', function(done) {
    getModule()(null, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should fail if getNewToken fails', function(done) {
    deps.auth.token.getNewToken = function(options, callback) {
      return callback(new Error('You failed'));
    };

    getModule()({}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send HTTP DELETE request to dav server', function(done) {

    var token = 'IamAToken';

    var options = {
      bookId: '123',
      userId: '456',
      contactId: '876'
    };

    deps.auth.token.getNewToken = function(options, callback) {
      return callback(null, {token: token});
    };

    mockery.registerMock('request', {
      del: function(request) {
        console.log(request);
        expect(request.url).to.equal(url + '/addressbooks/' + options.bookId + '/contacts/' + options.contactId + '.vcf');
        expect(request.headers.ESNToken).to.equal(token);
        done();
      }
    });
    getModule()(options);
  });

  it('should send HTTP DELETE request to default dav server when esnconfig fails', function(done) {

    var token = 'IamAToken';

    var options = {
      bookId: '123',
      userId: '456',
      contactId: '876'
    };

    deps.auth.token.getNewToken = function(options, callback) {
      return callback(null, {token: token});
    };

    deps['esn-config'] = function() {
      return {
        get: function(callback) {
          return callback(new Error());
        }
      };
    };

    mockery.registerMock('request', {
      del: function(request) {
        expect(request.url).to.have.string('/addressbooks/' + options.bookId + '/contacts/' + options.contactId + '.vcf');
        expect(request.headers.ESNToken).to.equal(token);
        done();
      }
    });
    getModule()(options);
  });


  it('should send back error if HTTP request status code is != 204', function(done) {
    var token = 'IamAToken';
    var options = {
      bookId: '123',
      userId: '456',
      contactId: '876'
    };

    deps.auth.token.getNewToken = function(options, callback) {
      return callback(null, {token: token});
    };

    mockery.registerMock('request', {
      del: function(request, callback) {
        callback(null, {statusCode: 500}, {});
      }
    });
    getModule()(options, function(err) {
      expect(err.message).to.match(/Bad response from DAV server/);
      done();
    });
  });

  it('should send back error if HTTP request sends back error', function(done) {
    var token = 'IamAToken';
    var options = {
      bookId: '123',
      userId: '456',
      contactId: '876'
    };

    deps.auth.token.getNewToken = function(options, callback) {
      return callback(null, {token: token});
    };

    mockery.registerMock('request', {
      del: function(request, callback) {
        callback(new Error());
      }
    });
    getModule()(options, function(err) {
      console.log(err);
      expect(err.message).to.match(/Error while sending request to DAV server/);
      done();
    });
  });

});
