'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The davproxy Angular module services', function() {

  beforeEach(angular.mock.module('linagora.esn.davproxy'));

  describe('The davClient service', function() {

    var davClient;

    beforeEach(function() {
      davClient = null;
    });

    function injectService() {
      angular.mock.inject(function(_davClient_) {
        davClient = _davClient_;
      });
    }

    it('should append DAV_PATH to url when call $http', function(done) {
      var method = 'GET';
      var path = '/your/path/here';
      var headers = { field: 'headers' };
      var params = { field: 'params' };
      var body = 'body data';
      var DAV_PATH = '/dav/api';

      angular.mock.module(function($provide) {
        $provide.constant('DAV_PATH', DAV_PATH);

        $provide.value('$http', function(config) {
          expect(config.url).to.equal(DAV_PATH + path);
          done();
        });
      });

      injectService();

      davClient(method, path, headers, params, body);

    });

  });

});
