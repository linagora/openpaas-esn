'use strict';

const fs = require('fs'),
      path = require('path'),
      request = require('supertest');

describe('The /js/ routes', function() {

  let app;

  function loadConstantsFileFixture(basePath, filename) {
    return fs.readFileSync(path.resolve(basePath, 'test/fixtures/code-generation', filename), 'utf-8');
  }

  beforeEach(function() {
    this.testEnv.initCore(() => {
      app = this.helpers.requireBackend('webserver/application');
    });
  });

  describe('GET /js/constants.js', function() {

    it('should return 200 with default configuration when there is no overrides in database', function(done) {
      request(app)
        .get('/js/constants.js')
        .expect(200, loadConstantsFileFixture(this.testEnv.basePath, 'constants.js'))
        .end(done);
    });

    it('should return 200 with updated configuration when there are overrides in database', function(done) {
      this.helpers.requireBackend('core/esn-config')('constants')
        .inModule('core')
        .store({
          ELEMENTS_PER_PAGE: 20,
          ELEMENTS_PER_REQUEST: 20,
          AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE: 20,
          INFINITE_LIST_DISTANCE: 0,
          CACHE_DEFAULT_TTL: 30000
        }, this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/js/constants.js')
            .expect(200, loadConstantsFileFixture(this.testEnv.basePath, 'constants-with-overrides.js'))
            .end(done);
        }));
    });

  });

});
