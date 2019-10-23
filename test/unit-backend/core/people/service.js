const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The people service module', function() {
  let logger, Service, PeopleSearcher;

  beforeEach(function() {
    logger = {
      error: sinon.spy(),
      info: sinon.spy(),
      debug: sinon.spy()
    };
    mockery.registerMock('../logger', logger);
    Service = this.helpers.requireBackend('core/people/service');
    PeopleSearcher = this.helpers.requireBackend('core/people/searcher');
  });

  describe('The addSearcher function', function() {
    it('should throw Error when searcher is undefined', function() {
      const service = new Service();

      expect(service.addSearcher).to.throw(/Wrong searcher definition/);
    });

    it('should throw Error when searcher is undefined', function() {
      const service = new Service();

      expect(() => service.addSearcher({})).to.throw(/Wrong searcher definition/);
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
});
