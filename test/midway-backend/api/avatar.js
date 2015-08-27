'use strict';

var expect = require('chai').expect,
  request = require('supertest');

describe('The avatar routes', function() {

  beforeEach(function() {
    this.app = this.helpers.requireBackend('webserver/application');
  });

  describe('GET /api/avatars', function() {

    it('should return 400 if there is no objectType parameter', function(done) {
      request(this.app).get('/api/avatars').expect(400).end(done);
    });

    describe('with email objectType', function() {
      it('should return 400 if there is no email parameter', function(done) {
        request(this.app).get('/api/avatars?objectType=email').expect(400).end(done);
      });

      it('should return 400 if email parameter is empty', function(done) {
        request(this.app).get('/api/avatars?objectType=email&email=').expect(400).end(done);
      });

      it('should return 200 with the generated avatar as an image', function(done) {
        request(this.app).get('/api/avatars?objectType=email&email=toto').expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.text).to.exist;
          done();
        });
      });
    });

  });

});
