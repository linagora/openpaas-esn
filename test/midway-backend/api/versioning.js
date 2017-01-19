'use strict';

var expect = require('chai').expect,
  request = require('supertest'),
  _ = require('lodash');

describe('The API versioning ', function() {

  var self;

  beforeEach(function() {

    self = this;
    self.app = self.helpers.requireBackend('webserver/application');
    self.api = self.helpers.requireBackend('webserver/api');
    self.arrayOfAvailablesVersions = _.map(self.api.API_VERSIONS, function(apiversion) {
      return apiversion;
    });
  });

  it('should exist versioning', function() {
    expect(self.arrayOfAvailablesVersions).to.have.length.above(0);
    expect(self.api.API_CURRENT_VERSION).to.exist;
  });

  // Does not work anymore with Express 4, but it looks crappy anyway. It feels like testing Express...
  it.skip('expose routes at both api/* and /api/v0.1/*', function() {
    expect(self.app._router.stack.some(function(elt) {
      return elt.regexp.toString() === '/^\\/api\\/?(?=/|$)/i' && !elt.regexp.test(/^\/api\/v[0-9]+(\.[0-9]+)?/i);
    })).to.equal(true);

    expect(self.app._router.stack.some(function(elt) {
      return elt.regexp.toString() === '/^\\/api\\/v0\\.1\\/?(?=/|$)/i';
    })).to.equal(true);

  });

  describe('GET /api/versions/', function() {

    it('should return the list of available versions', function(done) {

      var req = request(self.app).get('/api/versions');
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.be.an.array;
        expect(res.body).to.deep.equal(self.arrayOfAvailablesVersions);
        done();
      });

    });
  });

  describe('GET /api/versions/latest', function() {

    it('should return the latest version', function(done) {

      var req = request(self.app).get('/api/versions/latest');
      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.be.a.string;
        expect(res.body).to.deep.equal({ latest: self.api.API_CURRENT_VERSION });
        done();
      });

    });
  });

  describe('GET /api/versions/:id', function() {

    it('should return the requested version if available', function(done) {

      var req = request(this.app).get('/api/versions/' + self.arrayOfAvailablesVersions[0].path);

      req.expect(200);
      req.end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.deep.equal(self.arrayOfAvailablesVersions[0]);
        done();
      });
    });

    it('should return 404 if the requested version is not available', function(done) {
      request(this.app).get('/api/versions/vthatdoesntexist').expect(404).end(done);
    });

  });

});
