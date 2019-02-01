const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The people service module', function() {
  let logger, Service, PeopleResolver;

  beforeEach(function() {
    logger = {
      error: sinon.spy(),
      info: sinon.spy(),
      debug: sinon.spy()
    };
    mockery.registerMock('../logger', logger);
    Service = this.helpers.requireBackend('core/people/service');
    PeopleResolver = this.helpers.requireBackend('core/people/resolver');
  });

  describe('The addResolver function', function() {
    it('should throw Error when resolver is undefined', function() {
      const service = new Service();

      expect(service.addResolver).to.throw(/Wrong resolver definition/);
    });

    it('should throw Error when resolver is undefined', function() {
      const service = new Service();

      expect(() => service.addResolver({})).to.throw(/Wrong resolver definition/);
    });

    it('should add the resolver to the resolvers', function() {
      const objectType = 'user';
      const service = new Service();
      const resolver = new PeopleResolver(objectType, () => {}, () => {});

      service.addResolver(resolver);

      expect(service.resolvers.get(objectType)).to.deep.equal(resolver);
    });
  });

  describe('The search function', function() {
    let user1, user2, contact1, ldap1, ldap2, term, context, pagination;

    beforeEach(function() {
      user1 = { _id: 1 };
      user2 = { _id: 2 };
      contact1 = { uid: 1 };
      ldap1 = { ldap: 1 };
      ldap2 = { ldap: 2 };
      term = 'searchme';
      context = { user: 1, domain: 2 };
      pagination = { limit: 10, offset: 0 };
    });

    describe('When no resolvers', function() {
      it('should return empty array', function(done) {
        const service = new Service();

        service.search().then(result => {
          expect(result).to.be.an('Array').and.to.be.empty;
          done();
        }).catch(done);
      });
    });

    describe('When some resolvers are registered', function() {
      it('should call all the resolvers and send back denormalized data as array', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeUser = sinon.stub();
        const denormalizeContact = sinon.stub();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ term, context, pagination }).then(result => {
          expect(result).to.have.lengthOf(3);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          done();
        }).catch(done);
      });

      it('should call the defined resolvers and send back denormalized data', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const denormalizeUser = sinon.stub();
        const resolveContact = sinon.stub();
        const denormalizeContact = sinon.stub();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ objectTypes: ['user'], term, context, pagination }).then(result => {
          expect(result).to.have.lengthOf(2);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.not.have.been.called;
          expect(denormalizeContact).to.not.have.been.called;
          done();
        }).catch(done);
      });

      it('should order the results from the resolvers order', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const resolveLdap = sinon.stub().returns(Promise.resolve([ldap1, ldap2]));
        const denormalizeUser = sinon.stub();
        const denormalizeLdap = sinon.stub();
        const denormalizeContact = sinon.stub();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact, 100);
        const ldapResolver = new PeopleResolver('ldap', resolveLdap, denormalizeLdap, 50);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));
        denormalizeLdap.withArgs({ context, source: ldap1 }).returns(Promise.resolve(ldap1));
        denormalizeLdap.withArgs({ context, source: ldap2 }).returns(Promise.resolve(ldap2));
        service.addResolver(ldapResolver);
        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ objectTypes: ['user', 'contact', 'ldap'], term, context, pagination }).then(result => {
          expect(result).to.have.lengthOf(5);
          expect(result).to.deep.equals([contact1, ldap1, ldap2, user1, user2]);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          done();
        }).catch(done);
      });
    });

    describe('When a resolver function rejects', function() {
      it('should resolve with only resolved resolvers', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.reject(new Error()));
        const denormalizeUser = sinon.stub().returns((user => Promise.resolve(user)));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeContact = sinon.stub().returns(contact => Promise.resolve(contact));

        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ term, context, pagination })
          .then(result => {
            expect(result).to.has.lengthOf(1);
            expect(resolveUser).to.have.been.calledWith({ term, context, pagination });
            expect(resolveContact).to.have.been.calledWith({ term, context, pagination });
            expect(denormalizeUser).to.not.have.been.called;
            expect(denormalizeContact).to.have.been.called;
            done();
          })
          .catch(done);
      });

      it('should resolve with resolve people when a denormalize function rejects', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const denormalizeUser = sinon.stub().returns((user => Promise.resolve(user)));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeContact = sinon.stub().returns(Promise.reject(new Error()));

        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ term, context, pagination })
          .then(result => {
            expect(result).to.have.lengthOf(2);
            expect(resolveUser).to.have.been.calledWith({ term, context, pagination });
            expect(resolveContact).to.have.been.calledWith({ term, context, pagination });
            expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
            expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
            done();
          })
          .catch(done);
        });
    });
  });
});
