'use strict';

var request = require('supertest');

describe('The Basic authentication on REST API', function() {

  var app, email = 'itadmin@lng.net', password = 'secret';

  function encoreAuthorization(email, password) {
    return 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');
  }

  beforeEach(function(done) {
    var self = this;

    this.mongoose = require('mongoose');

    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver').webserver.application;

      self.helpers.api.applyDomainDeployment('linagora_IT', done);
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  it('should fail when trying to authenticate without credentials', function(done) {
    request(app)
      .get('/api/user')
      .expect(401)
      .end(done);
  });

  it('should fail when trying to authenticate with invalid password', function(done) {
    request(app)
      .get('/api/user')
      .set('Authorization', encoreAuthorization(email, 'bad password'))
      .expect(401)
      .end(done);
  });

  it('should be able to authenticate with valid credentials', function(done) {
    request(app)
      .get('/api/user')
      .set('Authorization', encoreAuthorization(email, password))
      .expect(200)
      .end(done);
  });

});
