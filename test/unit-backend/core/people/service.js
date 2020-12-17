const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The people service module', function() {
  let logger, Service, PeopleSearcher, PeopleResolver;

  beforeEach(function() {
    logger = {
      error: sinon.spy(() => 'Logger error'),
      info: sinon.spy(),
      debug: sinon.spy()
    };
    mockery.registerMock('../logger', logger);
    mockery.registerMock('./constants', {
      LIMIT: 10,
      OFFSET: 0,
      FIELD_TYPES: {
        EMAIL_ADDRESS: 'emailaddress'
      },
      REQUEST_MAX_SEARCH_TIME: 900 // 900 ms limit
    });
    Service = this.helpers.requireBackend('core/people/service');
    PeopleSearcher = this.helpers.requireBackend('core/people/searcher');
    PeopleResolver = this.helpers.requireBackend('core/people/resolver');
  });

  describe('The addSearcher function', function() {
    it('should throw Error when searcher is undefined', function() {
      const service = new Service();

      expect(service.addSearcher).to.throw(/Wrong searcher definition/);
    });

    it('should add the searcher to the searchers', function() {
      const objectType = 'user';
      const service = new Service();
      const searcher = new PeopleSearcher(objectType, () => {}, () => {});

      service.addSearcher(searcher);

      expect(service.searchers.get(objectType)).to.deep.equal(searcher);
    });
  });

  describe('The search function', function() {
    let user1, user2, contact1, ldap1, ldap2, term, context, pagination, excludes;

    beforeEach(function() {
      user1 = { _id: 1 };
      user2 = { _id: 2 };
      contact1 = { uid: 1 };
      ldap1 = { ldap: 1 };
      ldap2 = { ldap: 2 };
      term = 'searchme';
      context = { user: 1, domain: 2 };
      pagination = { limit: 10, offset: 0 };
      excludes = [];
    });

    describe('When no searchers', function() {
      it('should return empty array', function(done) {
        const service = new Service();

        service.search().then(result => {
          expect(result).to.be.an('Array').and.to.be.empty;
          done();
        }).catch(done);
      });
    });

    describe('When some searchers are registered', function() {
      it('should call all the searchers and send back denormalized data as array', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeUser = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));

        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ term, context, pagination, excludes }).then(result => {
          expect(result).to.have.lengthOf(3);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          done();
        }).catch(done);
      });

      it('should call the defined searchers and send back denormalized data', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const denormalizeUser = sinon.stub();
        const resolveContact = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));

        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ objectTypes: ['user'], term, context, pagination, excludes }).then(result => {
          expect(result).to.have.lengthOf(2);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.not.have.been.called;
          expect(denormalizeContact).to.not.have.been.called;
          done();
        }).catch(done);
      });

      it('should call the searchers with the excludes list of each searcher objectType', function(done) {
        const excludes = [
          { id: 'user1', objectType: 'user'},
          { id: 'user2', objectType: 'user'},
          { id: 'contact1', objectType: 'contact'}
        ];
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeUser = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));

        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ term, context, pagination, excludes }).then(result => {
          expect(result).to.have.lengthOf(3);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes: excludes.filter(e => e.objectType === 'user') });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes: excludes.filter(e => e.objectType === 'contact') });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          done();
        }).catch(done);
      });

      it('should order the results from the searchers order', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const resolveLdap = sinon.stub().returns(Promise.resolve([ldap1, ldap2]));
        const denormalizeUser = sinon.stub();
        const denormalizeLdap = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact, 100);
        const ldapsearcher = new PeopleSearcher('ldap', resolveLdap, denormalizeLdap, 50);

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));
        denormalizeLdap.withArgs({ context, source: ldap1 }).returns(Promise.resolve(ldap1));
        denormalizeLdap.withArgs({ context, source: ldap2 }).returns(Promise.resolve(ldap2));
        service.addSearcher(ldapsearcher);
        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ objectTypes: ['user', 'contact', 'ldap'], term, context, pagination, excludes }).then(result => {
          expect(result).to.have.lengthOf(5);
          expect(result).to.deep.equals([contact1, ldap1, ldap2, user1, user2]);
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          done();
        }).catch(done);
      });

      it('should use the default timeout if it wasn\'t specified and ignore the providers exceeding it', function(done) {
        const service = new Service();
        const resolveUser = sinon.spy(function() {
          return new Promise(resolve => {
            setTimeout(() => resolve([user1, user2]), 1000); // wait 1 second
          });
        });
        const resolveContact = sinon.spy(function() {
          return new Promise(resolve => {
            setTimeout(() => resolve([contact1]), 1000); // wait 1 second
          });
        });
        const resolveLdap = sinon.stub().returns(Promise.resolve([ldap1, ldap2]));
        const denormalizeUser = sinon.stub();
        const denormalizeLdap = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact, 100);
        const ldapsearcher = new PeopleSearcher('ldap', resolveLdap, denormalizeLdap, 50);

        denormalizeLdap.withArgs({ context, source: ldap1 }).returns(Promise.resolve(ldap1));
        denormalizeLdap.withArgs({ context, source: ldap2 }).returns(Promise.resolve(ldap2));
        service.addSearcher(ldapsearcher);
        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ objectTypes: ['user', 'contact', 'ldap'], term, context, pagination, excludes } /* nothing extra passed here */).then(result => {
          expect(result).to.have.lengthOf(2); // only 2 providers responded in time
          expect(result).to.deep.equals([ldap1, ldap2]); // the users provider is excluded
          expect(denormalizeUser).to.not.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.not.have.been.calledWith({ context, source: user2 });
          expect(denormalizeContact).to.not.have.been.calledWith({ context, source: contact1 });
          expect(denormalizeLdap).to.have.been.calledWith({ context, source: ldap1 });
          expect(denormalizeLdap).to.have.been.calledWith({ context, source: ldap2 });
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(resolveLdap).to.have.been.calledWith({ term, context, pagination, excludes });
          done();
        }).catch(done);
      });

      it('should not wait for the providers that exceeded the specified timeout', function(done) {
        const service = new Service();
        const resolveUser = sinon.spy(function() {
          return new Promise(resolve => {
            setTimeout(() => resolve([user1, user2]), 1000); // wait 1 second
          });
        });
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const resolveLdap = sinon.stub().returns(Promise.resolve([ldap1, ldap2]));
        const denormalizeUser = sinon.stub();
        const denormalizeLdap = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact, 100);
        const ldapsearcher = new PeopleSearcher('ldap', resolveLdap, denormalizeLdap, 50);
        const timeout = 500; // maximum allowed search time is 500 ms

        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));
        denormalizeLdap.withArgs({ context, source: ldap1 }).returns(Promise.resolve(ldap1));
        denormalizeLdap.withArgs({ context, source: ldap2 }).returns(Promise.resolve(ldap2));
        service.addSearcher(ldapsearcher);
        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ objectTypes: ['user', 'contact', 'ldap'], term, context, pagination, excludes }, timeout).then(result => {
          expect(result).to.have.lengthOf(3); // only 3 providers responded in time
          expect(result).to.deep.equals([contact1, ldap1, ldap2]); // the users provider is excluded
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeUser).to.not.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.not.have.been.calledWith({ context, source: user2 });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          expect(denormalizeLdap).to.have.been.calledWith({ context, source: ldap1 });
          expect(denormalizeLdap).to.have.been.calledWith({ context, source: ldap2 });
          done();
        }).catch(done);
      });

      it('should wait for all the providers when the specified timeout is 0 even, if they exceed the default timeout', function(done) {
        const service = new Service();
        const resolveUser = sinon.spy(function() {
          return new Promise(resolve => {
            setTimeout(() => resolve([user1, user2]), 1000); // wait 1 second
          });
        });
        const resolveContact = sinon.spy(function() {
          return new Promise(resolve => {
            setTimeout(() => resolve([contact1]), 1000); // wait 1 second
          });
        });
        const resolveLdap = sinon.stub().returns(Promise.resolve([ldap1, ldap2]));
        const denormalizeUser = sinon.stub();
        const denormalizeLdap = sinon.stub();
        const denormalizeContact = sinon.stub();
        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact, 100);
        const ldapsearcher = new PeopleSearcher('ldap', resolveLdap, denormalizeLdap, 50);
        const timeout = 0; // maximum allowed search time is 0 ms, means no time limit

        denormalizeUser.withArgs({ context, source: user1 }).returns(Promise.resolve(user1));
        denormalizeUser.withArgs({ context, source: user2 }).returns(Promise.resolve(user2));
        denormalizeContact.withArgs({ context, source: contact1 }).returns(Promise.resolve(contact1));
        denormalizeLdap.withArgs({ context, source: ldap1 }).returns(Promise.resolve(ldap1));
        denormalizeLdap.withArgs({ context, source: ldap2 }).returns(Promise.resolve(ldap2));
        service.addSearcher(ldapsearcher);
        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ objectTypes: ['user', 'contact', 'ldap'], term, context, pagination, excludes }, timeout).then(result => {
          expect(result).to.have.lengthOf(5); // all providers responded
          expect(result).to.deep.equals([contact1, ldap1, ldap2, user1, user2]); // the users provider is excluded
          expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user2 });
          expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
          expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
          done();
        }).catch(done);
      });
    });

    describe('When a searcher function rejects', function() {
      it('should resolve with only resolved searchers', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.reject(new Error()));
        const denormalizeUser = sinon.stub().returns((user => Promise.resolve(user)));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeContact = sinon.stub().returns(contact => Promise.resolve(contact));

        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact);

        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ term, context, pagination, excludes })
          .then(result => {
            expect(result).to.has.lengthOf(1);
            expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
            expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
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

        const usersearcher = new PeopleSearcher('user', resolveUser, denormalizeUser);
        const contactsearcher = new PeopleSearcher('contact', resolveContact, denormalizeContact);

        service.addSearcher(usersearcher);
        service.addSearcher(contactsearcher);

        service.search({ term, context, pagination, excludes })
          .then(result => {
            expect(result).to.have.lengthOf(2);
            expect(resolveUser).to.have.been.calledWith({ term, context, pagination, excludes });
            expect(resolveContact).to.have.been.calledWith({ term, context, pagination, excludes });
            expect(denormalizeUser).to.have.been.calledWith({ context, source: user1 });
            expect(denormalizeContact).to.have.been.calledWith({ context, source: contact1 });
            done();
          })
          .catch(done);
        });
    });
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

  describe('The resolve function', function() {
    let user, contact, fieldType, value, context;

    beforeEach(function() {
      user = { _id: 1 };
      contact = { uid: 1 };
      value = 'resolveme';
      fieldType = 'field';
      context = { user: 1, domain: 2 };
    });

    describe('When no resolvers', function() {
      it('should return empty', function(done) {
        const service = new Service();

        service.resolve().then(result => {
          expect(result).to.be.empty;
          done();
        }).catch(done);
      });
    });

    describe('When some resolvers are registered', function() {
      it('should return the result of the resolver that has succesfully found resolved object', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve(user));
        const denormalizeUser = sinon.stub();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);

        denormalizeUser.withArgs({ context, source: user }).returns(Promise.resolve(user));

        service.addResolver(userResolver);

        service.resolve({ fieldType, value, objectTypes: ['user'], context }).then(result => {
          expect(result).to.equal(user);
          expect(resolveUser).to.have.been.calledWith({ fieldType, value, context });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user });
          done();
        }).catch(done);
      });

      it('should ignore later resolvers if one resolver has returned a result', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve(user));
        const resolveContact = sinon.stub().returns(Promise.resolve());
        const denormalizeUser = sinon.stub();
        const denormalizeContact = sinon.stub();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        denormalizeUser.withArgs({ context, source: user }).returns(Promise.resolve(user));
        denormalizeContact.withArgs({ context, source: contact }).returns(Promise.resolve(contact));

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.resolve({ fieldType, value, objectTypes: ['user', 'contact'], context }).then(result => {
          expect(result).to.equal(user);
          expect(resolveUser).to.have.been.calledWith({ fieldType, value, context });
          expect(denormalizeUser).to.have.been.calledWith({ context, source: user });
          expect(resolveContact).to.have.not.been.called;
          expect(denormalizeContact).to.have.not.been.called;
          done();
        }).catch(done);
      });

      it('should run the resolvers subsequently in order of object types', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve());
        const resolveContact = sinon.stub().returns(Promise.resolve());
        const denormalizeUser = () => Promise.resolve();
        const denormalizeContact = () => Promise.resolve();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.resolve({ fieldType, value, objectTypes: ['user', 'contact'], context }).then(result => {
          expect(result).to.be.empty;
          expect(resolveUser).to.have.been.calledWith({ fieldType, value, context });
          expect(resolveContact).to.have.been.calledWith({ fieldType, value, context });
          expect(resolveUser).to.have.been.calledBefore(resolveContact);
          done();
        }).catch(done);
      });

      it('should call the resolvers in default priority order if no object types is defined', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve());
        const resolveContact = sinon.stub().returns(Promise.resolve());
        const denormalizeUser = () => Promise.resolve();
        const denormalizeContact = () => Promise.resolve();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser, 10);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact, 20);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.resolve({ fieldType, value, objectTypes: [], context }).then(result => {
          expect(result).to.be.empty;
          expect(resolveUser).to.have.been.calledWith({ fieldType, value, context });
          expect(resolveContact).to.have.been.calledWith({ fieldType, value, context });
          expect(resolveContact).to.have.been.calledBefore(resolveUser);
          done();
        }).catch(done);
      });
    });

    describe('When a resolver function rejects', function() {
      it('should continue calling the next resolver', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.reject());
        const resolveContact = sinon.stub().returns(Promise.resolve());
        const denormalizeUser = () => Promise.resolve();
        const denormalizeContact = () => Promise.resolve();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.resolve({ fieldType, value, objectTypes: ['user', 'contact'], context }).then(result => {
          expect(result).to.be.empty;
          expect(resolveUser).to.have.been.calledWith({ fieldType, value, context });
          expect(resolveContact).to.have.been.calledWith({ fieldType, value, context });
          expect(resolveUser).to.have.been.calledBefore(resolveContact);
          done();
        }).catch(done);
      });

      it('should resolve null and log out the error when the last resolver rejects', function(done) {
        const service = new Service();
        const resolveUser = () => Promise.resolve();
        const resolveContact = () => Promise.reject();
        const denormalizeUser = () => Promise.resolve();
        const denormalizeContact = () => Promise.resolve();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.resolve({ fieldType, value, objectTypes: ['user', 'contact'], context }).then(result => {
          expect(result).to.be.empty;
          expect(logger.error).to.have.been.calledWith(sinon.match(/Failed to resolve contact/));
          done();
        }).catch(done);
      });

      it('should resolve null and logout the error when a denormalizer rejects', function(done) {
        const service = new Service();
        const resolveUser = () => Promise.resolve();
        const resolveContact = () => Promise.resolve({ id: 'contact1' });
        const denormalizeUser = () => Promise.resolve();
        const denormalizeContact = () => Promise.reject();
        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.resolve({ fieldType, value, objectTypes: ['user', 'contact'], context }).then(result => {
          expect(result).to.be.empty;
          expect(logger.error).to.have.been.calledWith(sinon.match(/Failed to denormalize contact/));
          done();
        }).catch(done);
      });
    });
  });
});
