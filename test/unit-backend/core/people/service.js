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
    let user1, user2, contact1, term, context;

    beforeEach(function() {
      user1 = { _id: 1 };
      user2 = { _id: 2 };
      contact1 = { uid: 1 };
      term = 'searchme';
      context = { user: 1, domain: 2 };
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
        const denormalizeUser = sinon.stub().returns((user => Promise.resolve(user)));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeContact = sinon.stub().returns(contact => Promise.resolve(contact));

        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ term, context }).then(result => {
          expect(result).to.have.lengthOf(3);
          expect(resolveUser).to.have.been.calledWith({ term, context });
          expect(denormalizeUser).to.have.been.calledWith(user1);
          expect(denormalizeUser).to.have.been.calledWith(user2);
          expect(resolveContact).to.have.been.calledWith({ term, context });
          expect(denormalizeContact).to.have.been.calledWith(contact1);
          done();
        }).catch(done);
      });

      it('should call the defined resolvers and send back denormalized data', function(done) {
        const service = new Service();
        const resolveUser = sinon.stub().returns(Promise.resolve([user1, user2]));
        const denormalizeUser = sinon.stub().returns((user => Promise.resolve(user)));
        const resolveContact = sinon.stub().returns(Promise.resolve([contact1]));
        const denormalizeContact = sinon.stub().returns(contact => Promise.resolve(contact));

        const userResolver = new PeopleResolver('user', resolveUser, denormalizeUser);
        const contactResolver = new PeopleResolver('contact', resolveContact, denormalizeContact);

        service.addResolver(userResolver);
        service.addResolver(contactResolver);

        service.search({ objectTypes: ['user'], term, context }).then(result => {
          expect(result).to.have.lengthOf(2);
          expect(resolveUser).to.have.been.calledWith({ term, context });
          expect(denormalizeUser).to.have.been.calledWith(user1);
          expect(denormalizeUser).to.have.been.calledWith(user2);
          expect(resolveContact).to.not.have.been.called;
          expect(denormalizeContact).to.not.have.been.called;
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

        service.search({ term, context })
          .then(result => {
            expect(result).to.has.lengthOf(1);
            expect(resolveUser).to.have.been.calledWith({ term, context });
            expect(resolveContact).to.have.been.calledWith({ term, context });
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

        service.search({ term, context })
          .then(result => {
            expect(result).to.have.lengthOf(2);
            expect(resolveUser).to.have.been.calledWith({ term, context });
            expect(resolveContact).to.have.been.calledWith({ term, context });
            expect(denormalizeUser).to.have.been.calledWith(user1);
            expect(denormalizeContact).to.have.been.calledWith(contact1);
            done();
          })
          .catch(done);
        });
    });
  });
});
