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
    it('should send back 200 with user except who are current members and on pending request membership', function(done) {
      helpers.api.applyDomainDeployment('linagora_IT', (err, models) => {
        if (err) return done(err);

        const manager = models.users[0].accounts[0];
        const community = models.communities[0];

        // Add manually membershipRequests for 3rd, 4th place in user model to community. 1st, 2nd place are members in default
        const membershipRequestsIds = [models.users[2]._id, models.users[3]._id];

        membershipRequestsIds.forEach(member => {
          const membershipObject = { user: member, workflow: 'invitation' };

          community.membershipRequests.push(membershipObject);
        });

        community.save((err, community) => {
          if (err) return done(err);

          helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', (err, loggedInAsUser) => {
            if (err) return done(err);

            const req = loggedInAsUser(request(webserver.application).post(`/api/collaborations/community/${community._id}/invitablepeople`));

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

              expect(bodyString).to.not.contains('itadmin@lng.net'); // Creator
              expect(bodyString).to.not.contains('jdoe@lng.net'); // Member
              expect(bodyString).to.not.contains('jdee@lng.net'); // MembershipRequest
              expect(bodyString).to.not.contains('kcobain@linagora.com'); // MembershipRequest
              done();
            });
          });
        });
      });
    });
  });
});
