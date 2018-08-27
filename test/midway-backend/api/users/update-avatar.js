'use strict';

const request = require('supertest'),
      expect = require('chai').expect;

describe('The update specific user\'s avatar API: PUT /users/:uuid/profile/avatar', () => {
  let app;
  let admin1Domain1, member1Domain1;
  let member1Domain2;
  let domain1;
  const password = 'secret';

  beforeEach(function(done) {
    this.testEnv.initCore(err => {
      expect(err).to.not.exist;

      app = this.helpers.requireBackend('webserver/application');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', (err, models) => {
        expect(err).to.not.exist;

        admin1Domain1 = models.users[0];
        member1Domain1 = models.users[1];
        domain1 = models.domain;

        this.helpers.api.applyDomainDeployment('linagora_test_domain2', (err, models2) => {
          expect(err).to.not.exist;

          member1Domain2 = models2.users[1];

          this.helpers.elasticsearch.saveTestConfiguration(this.helpers.callbacks.noError(done));
        });
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  it('should return 401 if not authenticated', function(done) {
    this.helpers.api.requireLogin(app, 'put', `/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}`, done);
  });

  it('should return 403 if the request user is not domain manager', function(done) {
    this.helpers.api.loginAsUser(app, member1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const req = loggedInAsUser(request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}`));

      req.send().expect(403).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('User is not the domain manager');
        done();
      });
    }));
  });

  it('should return 403 if domain manager trying to modify avatar of not domain member', function(done) {
    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(request(app).put(`/api/users/${member1Domain2._id}/profile/avatar?domain_id=${domain1._id}`));

      req.send().expect(403).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.details).to.equal('User does not belongs to the domain');
        done();
      });
    }));
  });

  it('should return 400 if no "size" query param is given', function(done) {
    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}&mimetype=image%2Fpng`)
      );

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'missing size in query'
          }
        });

        done();
      });
    }));
  });

  it('should return 400 if the "size" query param is not a number', function(done) {
    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}&mimetype=image%2Fpng&size=not-a-number`)
      );

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'size should be positive integer'
          }
        });

        done();
      });
    }));
  });

  it('should return 400 if the "size" query param is not a positive number', function(done) {
    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}&mimetype=image%2Fpng&size=-69`)
      );

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'size should be positive integer'
          }
        });

        done();
      });
    }));
  });

  it('should return 412 if the "size" query string is not equal to the actual image size', function(done) {
    const fileContent = require('fs').readFileSync(this.helpers.getFixturePath('image.png'));

    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}`)
      );

      req.query({ size: 123, mimetype: 'image/png' })
        .set('Content-Type', 'image/png')
        .send(fileContent).expect(412).end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body).to.shallowDeepEqual({
            error: {
              code: 412,
              message: 'Precondition Failed',
              details: 'Avatar size given by user agent is 123 and avatar size returned by storage system is 41096'
            }
          });

          done();
        });
    }));
  });

  it('should return 400 if no "mimetype" query param is given', function(done) {
    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}&size=123`)
      );

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'missing mimetype in query'
          }
        });
        done();
      });
    }));
  });

  it('should return 415 if the "mimetype" query param is not an accepted mime type', function(done) {
    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}&mimetype=not-accepted-type&size=123`)
      );

      req.send().expect(415).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 415,
            message: 'Unsupported Media Type',
            details: `Mimetype not-accepted-type is not accepted: should be one in ${this.helpers.requireBackend('core/image').CONSTANTS.ACCEPTED_MIME_TYPES.join(', ')}`
          }
        });
        done();
      });
    }));
  });

  it('should return 200 with the ID of updated avatar', function(done) {
    const fileContent = require('fs').readFileSync(this.helpers.getFixturePath('image.png'));

    this.helpers.api.loginAsUser(app, admin1Domain1.emails[0], password, this.helpers.callbacks.noErrorAnd(loggedInAsAdmin => {
      const req = loggedInAsAdmin(
        request(app).put(`/api/users/${member1Domain1._id}/profile/avatar?domain_id=${domain1._id}`)
      );

      req.query({ size: 41096, mimetype: 'image/png' })
        .set('Content-Type', 'image/png')
        .send(fileContent).expect(200).end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body._id).to.exist;

          done();
        });
    }));
  });
});
