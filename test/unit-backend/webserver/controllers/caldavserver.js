'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The caldavserver controller', function() {

  describe('The getCaldavUrl function', function() {

    it('should send back 500 if caldav.getCaldavServerUrlForClient() fail', function(done) {
      var caldavMock = {
        getCaldavServerUrlForClient: function(callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/caldav', caldavMock);

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var caldavserver = this.helpers.requireBackend('webserver/controllers/caldavserver');
      caldavserver.getCaldavUrl(null, res);
    });

    it('should send back 200 with the url', function(done) {
      var url = 'http://open-paas.org:80';
      var caldavMock = {
        getCaldavServerUrlForClient: function(callback) {
          return callback(null, url);
        }
      };
      mockery.registerMock('../../core/caldav', caldavMock);

      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.deep.equal({
            url: url
          });
          done();
        }
      };

      var caldavserver = this.helpers.requireBackend('webserver/controllers/caldavserver');
      caldavserver.getCaldavUrl(null, res);
    });
  });
});
