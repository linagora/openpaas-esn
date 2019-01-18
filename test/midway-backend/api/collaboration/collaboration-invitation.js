const { expect } = require('chai');
const request = require('supertest');

describe('The collaborations members API', function() {

  let webserver, helpers;

  beforeEach(function() {
    const self = this;

    helpers = this.helpers;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = self.helpers.requireBackend('webserver').webserver;
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('POST /collaborations/:objectType/:id/invitablepeople', function() {
    it('should send back 200 with denormalized invitable user', function(done) {
      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }

        helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }

          const req = loggedInAsUser(request(webserver.application).post('/api/collaborations/community/' + models.communities[0]._id + '/invitablepeople'));

          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(5);
            expect(res.body[0]).to.exist;
            expect(res.body[0]._id).to.exist;
            expect(res.body[0].password).to.be.undefined;
            expect(res.body[0].accounts).to.be.undefined;

            const bodyString = JSON.stringify(res.body);

            expect(bodyString).to.not.contains('itadmin@lng.net'); // Creator
            expect(bodyString).to.not.contains('jdoe@lng.net'); // Member
            done();
          });
        });
      });
    });
  });
});
