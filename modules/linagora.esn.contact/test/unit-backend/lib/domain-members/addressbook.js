const sinon = require('sinon');
const mockery = require('mockery');
const { expect } = require('chai');
const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('../../../../backend/lib/domain-members/contants');

describe('The domain members address book, address book module', () => {
  let getModule, contactClientMock, utilsMock, technicalUser;

  const domainId = '123';
  const token = 'token';

  beforeEach(function() {
    technicalUser = { name: 'Sabre DAV' };
    contactClientMock = {
      addressbookHome: bookHome => {
        expect(bookHome).to.equal(domainId);

        return contactClientMock;
      },
      addressbook: bookName => {
        expect(bookName).to.deep.equal(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME);

        return contactClientMock;
      },
      get: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      create: () => Promise.resolve()
    };

    const jobQueueModuleMock = {
      lib: {
        submitJob: () => Promise.resolve()
      }
    };

    utilsMock = {
      getTechnicalUser: () => Promise.resolve(technicalUser),
      getTechnicalToken: () => Promise.resolve(token)
    };

    mockery.registerMock('../client', () =>
      function({ ESNToken, user }) {
        expect(ESNToken).to.equal(token);
        expect(user).to.equal(technicalUser);

        return contactClientMock;
      }
    );

    mockery.registerMock('./utils', () => utilsMock);

    this.moduleHelpers.addDep('jobqueue', jobQueueModuleMock);

    getModule = () => require('../../../../backend/lib/domain-members/addressbook')(this.moduleHelpers.dependencies);
  });

  describe('The createDomainMembersAddressbook function', () => {
    it('should reject if failed to get technical user', function(done) {
      utilsMock.getTechnicalUser = () => Promise.reject(new Error('Failed to get technical user'));

      getModule().createDomainMembersAddressbook(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).to.equal('Failed to get technical user');
          done();
        });
    });

    it('should reject if failed to get technical user token', function(done) {
      utilsMock.getTechnicalUser = () => Promise.reject(new Error('Failed to get token'));
      getModule().createDomainMembersAddressbook(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).to.equal('Failed to get token');
          done();
        });
    });

    it('should reject if failed to get domain members addressbook', function(done) {
      contactClientMock.get = () => Promise.reject(new Error('Failed to get domain members addressbook'));
      contactClientMock.create = sinon.spy(() => Promise.resolve());

      getModule().createDomainMembersAddressbook(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(contactClientMock.create).to.not.have.been.called;
          expect(err.message).to.equal('Failed to get domain members addressbook');
          done();
        });
    });

    it('should resolve without creating domain members addressbook if it already existed', function(done) {
      contactClientMock.get = () => Promise.resolve({ links: 'href/something'});
      contactClientMock.create = sinon.spy(() => Promise.reject(new Error('asdasd')));

      getModule().createDomainMembersAddressbook(domainId)
        .then(() => {
          expect(contactClientMock.create).to.not.have.been.called;
          done();
        })
        .catch(done);
    });

    it('should resolve after creating domain members addressbook if it does not exist', function(done) {
      contactClientMock.get = () => Promise.reject({ statusCode: 404 });
      contactClientMock.create = sinon.stub().returns(Promise.resolve());

      getModule().createDomainMembersAddressbook(domainId)
        .then(() => {
          expect(contactClientMock.create).to.have.been.called;
          done();
        })
        .catch(done);
    });
  });

  describe('The removeDomainMembersAddressbook function', () => {
    it('should reject if failed to get technical user', function(done) {
      utilsMock.getTechnicalUser = () => Promise.reject(new Error('Failed to get technical user'));

      getModule().removeDomainMembersAddressbook(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).to.equal('Failed to get technical user');
          done();
        });
    });

    it('should reject if failed to get technical user token', function(done) {
      utilsMock.getTechnicalUser = () => Promise.reject(new Error('Failed to get token'));
      getModule().removeDomainMembersAddressbook(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).to.equal('Failed to get token');
          done();
        });
    });

    it('should reject if failed to get domain members addressbook', function(done) {
      contactClientMock.get = () => Promise.reject(new Error('Failed to get domain members addressbook'));
      contactClientMock.remove = sinon.spy(() => Promise.resolve());

      getModule().removeDomainMembersAddressbook(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(contactClientMock.remove).to.not.have.been.called;
          expect(err.message).to.equal('Failed to get domain members addressbook');
          done();
        });
    });

    it('should resolve without removing domain members addressbook if it does not exist', function(done) {
      contactClientMock.get = () => Promise.reject({ statusCode: 404 });
      contactClientMock.remove = sinon.spy(() => Promise.reject(new Error('asdasd')));

      getModule().removeDomainMembersAddressbook(domainId)
        .then(() => {
          expect(contactClientMock.remove).to.not.have.been.called;
          done();
        })
        .catch(done);
    });

    it('should resolve after removing domain members addressbook if it exists', function(done) {
      contactClientMock.get = () => Promise.resolve({ links: 'href/something' });
      contactClientMock.remove = sinon.stub().returns(Promise.resolve());

      getModule().removeDomainMembersAddressbook(domainId)
        .then(() => {
          expect(contactClientMock.remove).to.have.been.called;
          done();
        })
        .catch(done);
    });
  });
});
