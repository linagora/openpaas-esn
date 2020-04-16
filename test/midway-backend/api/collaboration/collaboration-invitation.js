const { expect } = require('chai');
const request = require('supertest');

describe('The collaborations members API', function() {
  let app, helpers;
  let user, user1, user2, user3, privateSimulatedCollaboration;

  beforeEach(function(done) {
    helpers = this.helpers;
    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');

      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }

        user = models.users[0];
        user1 = models.users[1];
        user2 = models.users[2];
        user3 = models.users[3];

        privateSimulatedCollaboration = models.simulatedCollaborations[1];
        done();
      });
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  describe('POST /collaborations/:objectType/:id/invitablepeople', function() {
    it('should send back 200 with user except who are current members and on pending request membership', function(done) {
      privateSimulatedCollaboration.membershipRequests = [
        { user: user2._id, workflow: 'invitation' },
        { user: user3._id, workflow: 'invitation' }
      ];

      privateSimulatedCollaboration.save(err => {
        if (err) return done(err);

        helpers.api.loginAsUser(app, user.emails[0], 'secret', (err, loggedInAsUser) => {
          if (err) return done(err);

          const req = loggedInAsUser(request(app).post(`/api/collaborations/simulatedCollaboration/${privateSimulatedCollaboration._id}/invitablepeople`));

          req.expect(200);
          req.end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(3);
            expect(res.body[0]).to.exist;
            expect(res.body[0]._id).to.exist;
            expect(res.body[0].password).to.be.undefined;
            expect(res.body[0].accounts).to.be.undefined;

            const bodyString = JSON.stringify(res.body);

            expect(bodyString).to.not.contains(user.email); // Creator
            expect(bodyString).to.not.contains(user1.email); // Member
            expect(bodyString).to.not.contains(user2.email); // MembershipRequest
            expect(bodyString).to.not.contains(user3.email); // MembershipRequest
            done();
          });
        });
      });
    });
  });
});
