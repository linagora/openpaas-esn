const mockery = require('mockery');
const sinon = require('sinon');
const { expect } = require('chai');

describe('The openid-connect passport strategy', function() {
  describe('The oidcCallback', function() {
    let module, user, domainName, oidcModule, userModule, domainModule, ldapModule, accessToken, reqMock;

    beforeEach(function() {
      domainName = 'open-paas.org';
      accessToken = 'accessToken1978';
      user = { email: `chamerling@${domainName}` };
      oidcModule = {
        getUserInfosFromProvider: sinon.stub()
      };
      userModule = {
        findByEmail: sinon.stub(),
        provisionUser: sinon.stub(),
        translate: sinon.stub()
      };
      domainModule = {
        getByName: sinon.stub(),
        load: sinon.stub()
      };
      ldapModule = {
        findDomainsBoundToEmail: sinon.stub()
      };

      reqMock = {
        logging: {
          log: () => {}
        }
      };

      mockery.registerMock('../../../core/auth/openid-connect', oidcModule);
      mockery.registerMock('../../../core/user', userModule);
      mockery.registerMock('../../../core/domain', domainModule);
      mockery.registerMock('../../../core/ldap', ldapModule);
    });

    beforeEach(function() {
      module = this.helpers.requireBackend('webserver/auth/api/openid-connect');
    });

    it('should call the callback with (null, false, message) if no provider matches the access token', function(done) {
      oidcModule.getUserInfosFromProvider.returns(Promise.reject('getUserInfosFromProvider failed'));
      module.oidcCallback(reqMock, accessToken, (err, result, message) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
        expect(oidcModule.getUserInfosFromProvider).to.have.been.calledWith(accessToken);
        done();
      });
    });

    it('should call the callback with (null, false, message) if nothing is returned from getUserInfosFromProvider()', function(done) {
      oidcModule.getUserInfosFromProvider.returns(Promise.resolve(undefined));
      module.oidcCallback(reqMock, accessToken, (err, result, message) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
        expect(oidcModule.getUserInfosFromProvider).to.have.been.calledWith(accessToken);
        done();
      });
    });

    describe('when provider matches access token', function() {
      it('sould call the callback with (null, false, message) if the response is invalid', function(done) {
        oidcModule.getUserInfosFromProvider.returns(Promise.resolve(null));
        module.oidcCallback(reqMock, accessToken, (err, result, message) => {
          expect(err).to.not.exist;
          expect(result).to.be.false;
          expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
          expect(oidcModule.getUserInfosFromProvider).to.have.been.calledWith(accessToken);
          done();
        });
      });

      it('sould call the callback with (null, false, message) if there is no infos property', function(done) {
        oidcModule.getUserInfosFromProvider.returns(Promise.resolve({}));
        module.oidcCallback(reqMock, accessToken, (err, result, message) => {
          expect(err).to.not.exist;
          expect(result).to.be.false;
          expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
          expect(oidcModule.getUserInfosFromProvider).to.have.been.calledWith(accessToken);
          done();
        });
      });

      it('sould call the callback with (null, false, message) if there is no email field in the user\'s profile', function(done) {
        oidcModule.getUserInfosFromProvider.returns(Promise.resolve({infos: {user: 'user1'}}));
        module.oidcCallback(reqMock, accessToken, (err, result, message) => {
          expect(err).to.not.exist;
          expect(result).to.be.false;
          expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
          expect(oidcModule.getUserInfosFromProvider).to.have.been.calledWith(accessToken);
          done();
        });
      });

      describe('and the response is valid', function() {
        const userEmail = 'user1@acme.org';
        const domainId = 'ABDC';

        it.skip('should call user.findByEmail', function(done) {
          oidcModule.getUserInfosFromProvider.returns(Promise.resolve({infos: {email: userEmail}}));
          module.oidcCallback(reqMock, accessToken, () => {});
          Promise.resolve(true).then(() => {
            expect(userModule.findByEmail).to.have.been.calledWith(userEmail);
            done();
          });
        });

        describe('and user.findByEmail answers', function() {
          it('should returns with the user object if the user is returned', function(done) {
            oidcModule.getUserInfosFromProvider.returns(Promise.resolve({infos: {email: userEmail}}));
            userModule.findByEmail.callsArgWithAsync(1, null, {email: userEmail});
            module.oidcCallback(reqMock, accessToken, (err, result) => {
              expect(err).to.not.exist;
              expect(result).to.shallowDeepEqual({email: userEmail});
              done();
            });
          });

          it('should autoProvision user if the user is not returned', function(done) {
            oidcModule.getUserInfosFromProvider.returns(Promise.resolve({infos: {email: userEmail}}));
            userModule.findByEmail.callsArgWithAsync(1, null, null);
            ldapModule.findDomainsBoundToEmail.callsArgWithAsync(1, null, [domainId]);
            domainModule.load.callsArgWithAsync(1, null, { _id: domainId, name: 'domainname'});
            userModule.provisionUser.callsArgWithAsync(1, null, { _id: 'user1', email: userEmail});
            userModule.translate.returnsArg(1);
            module.oidcCallback(reqMock, accessToken, err => {
              expect(err).to.not.exist;
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.called;
              expect(userModule.provisionUser).to.have.been.called;
              done();
            });
          });
        });
      });
    });

    describe('When token is valid', function() {
      beforeEach(function() {
        oidcModule.getUserInfosFromProvider.returns(Promise.resolve({infos: {email: user.email}}));
      });

      describe('When searching user from email', function() {
        it('should send back user when found', function(done) {
          const user = { id: 1 };

          userModule.findByEmail.yields(null, user);

          module.oidcCallback(reqMock, accessToken, (err, result, message) => {
            expect(err).to.not.exist;
            expect(result).to.equals(user);
            expect(message).to.not.exist;
            done();
          });
        });

        it('should send back error when user search fails', function(done) {
          const error = new Error('I failed to search user from email');

          userModule.findByEmail.yields(error);

          module.oidcCallback(reqMock, accessToken, (err, result, message) => {
            expect(err).to.not.exist;
            expect(result).to.be.false;
            expect(userModule.findByEmail).to.have.been.calledWith(user.email);
            expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
            expect(message.message).to.contain(error.message);
            done();
          });
        });
      });

      describe('When user is not registered in OpenPaaS', function() {
        beforeEach(function() {
          userModule.findByEmail.yields(null, null);
        });

        describe('When searching in LDAPs', function() {
          it('should fallback to domain name search when LDAP domain search fails', function(done) {
            ldapModule.findDomainsBoundToEmail.yields(new Error('I failed to get domain from LDAP'));
            domainModule.getByName.returns(Promise.reject(new Error('I failed to get domain from name')));

            module.oidcCallback(reqMock, accessToken, (err, result, message) => {
              expect(err).to.not.exist;
              expect(result).to.be.false;
              expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
              expect(message.message).to.contains(`Can not find any valid domain for ${user.email}`);
              expect(domainModule.getByName).to.have.been.calledWith(domainName);
              expect(domainModule.load).to.not.have.been.called;
              expect(userModule.provisionUser).to.not.have.been.called;
              done();
            });
          });

          it('should try to find domain from email domain name when LDAP domain search send back a result but domain can not be loaded from it', function(done) {
            const domains = [1];
            const error = new Error('I can not load domain');

            ldapModule.findDomainsBoundToEmail.yields(null, domains);
            domainModule.getByName.returns(Promise.reject(new Error('I failed to get domain from name')));
            domainModule.load.yields(error);

            module.oidcCallback(reqMock, accessToken, (err, result, message) => {
              expect(err).to.not.exist;
              expect(result).to.be.false;
              expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
              expect(message.message).to.contains(`Can not find any valid domain for ${user.email}`);
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.calledWith(user.email);
              expect(domainModule.load).to.have.been.calledWith(domains[0]);
              expect(domainModule.getByName).to.have.been.calledWith(domainName);
              expect(userModule.provisionUser).to.not.have.been.called;
              done();
            });
          });

          it('should provision user from LDAP result', function(done) {
            const domains = [1, 2];
            const domain = { _id: 1, name: 'open-paas.org' };

            ldapModule.findDomainsBoundToEmail.yields(null, domains);
            domainModule.getByName.returns(Promise.resolve(domain));
            domainModule.load.yields(null, domain);
            userModule.provisionUser.yields(null, user);
            userModule.translate.returns(user);

            module.oidcCallback(reqMock, accessToken, (err, result) => {
              expect(err).to.not.exist;
              expect(result).to.equal(user);
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.calledWith(user.email);
              expect(domainModule.load).to.have.been.calledWith(domains[0]);
              expect(domainModule.getByName).to.not.have.been.called;
              expect(userModule.translate).to.have.been.calledWith({}, { email: user.email, username: user.email, domainId: domain._id });
              expect(userModule.provisionUser).to.have.been.calledWith(user);
              done();
            });
          });

          it('should provision user from email domain when when LDAP returns nothing', function(done) {
            const domain = { _id: 1, name: 'open-paas.org' };

            ldapModule.findDomainsBoundToEmail.yields(null, null);
            domainModule.getByName.returns(Promise.resolve(domain));
            domainModule.load.yields(null, domain);
            userModule.provisionUser.yields(null, user);
            userModule.translate.returns(user);

            module.oidcCallback(reqMock, accessToken, (err, result) => {
              expect(err).to.not.exist;
              expect(result).to.equal(user);
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.calledWith(user.email);
              expect(domainModule.load).to.not.have.been.called;
              expect(domainModule.getByName).to.have.been.calledWith(domainName);
              expect(userModule.translate).to.have.been.calledWith({}, { email: user.email, username: user.email, domainId: domain._id });
              expect(userModule.provisionUser).to.have.been.calledWith(user);
              done();
            });
          });

          it('should provision user from email domain when when LDAP returns empty array', function(done) {
            const domain = { _id: 1, name: 'open-paas.org' };

            ldapModule.findDomainsBoundToEmail.yields(null, []);
            domainModule.getByName.returns(Promise.resolve(domain));
            domainModule.load.yields(null, domain);
            userModule.provisionUser.yields(null, user);
            userModule.translate.returns(user);

            module.oidcCallback(reqMock, accessToken, (err, result) => {
              expect(err).to.not.exist;
              expect(result).to.equal(user);
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.calledWith(user.email);
              expect(domainModule.load).to.not.have.been.called;
              expect(domainModule.getByName).to.have.been.calledWith(domainName);
              expect(userModule.translate).to.have.been.calledWith({}, { email: user.email, username: user.email, domainId: domain._id });
              expect(userModule.provisionUser).to.have.been.calledWith(user);
              done();
            });
          });

          it('should fail when provisioning does not return new user', function(done) {
            const domains = [1];
            const domain = { _id: 1, name: 'open-paas.org' };

            ldapModule.findDomainsBoundToEmail.yields(null, domains);
            domainModule.getByName.returns(Promise.resolve(domain));
            domainModule.load.yields(null, domain);
            userModule.provisionUser.yields(null, null);
            userModule.translate.returns(user);

            module.oidcCallback(reqMock, accessToken, (err, result, message) => {
              expect(err).to.not.exist;
              expect(result).to.be.false;
              expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
              expect(message.message).to.match(/No user found nor created from accessToken/);
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.calledWith(user.email);
              expect(domainModule.load).to.have.been.calledWith(domains[0]);
              expect(domainModule.getByName).to.not.have.been.called;
              expect(userModule.provisionUser).to.have.been.calledWith(user);
              done();
            });
          });

          it('should fail when provisioning fails', function(done) {
            const domains = [1];
            const error = new Error('I failed to provision user');
            const domain = { _id: 1, name: 'open-paas.org' };

            ldapModule.findDomainsBoundToEmail.yields(null, domains);
            domainModule.getByName.returns(Promise.resolve(domain));
            domainModule.load.yields(null, domain);
            userModule.provisionUser.yields(error);
            userModule.translate.returns(user);

            module.oidcCallback(reqMock, accessToken, (err, result, message) => {
              expect(err).to.not.exist;
              expect(result).to.be.false;
              expect(message.message).to.match(/Cannot validate OpenID Connect accessToken/);
              expect(message.message).to.contains(error.message);
              expect(ldapModule.findDomainsBoundToEmail).to.have.been.calledWith(user.email);
              expect(domainModule.load).to.have.been.calledWith(domains[0]);
              expect(domainModule.getByName).to.not.have.been.called;
              expect(userModule.provisionUser).to.have.been.calledWith(user);
              done();
            });
          });
        });
      });
    });
  });
});
