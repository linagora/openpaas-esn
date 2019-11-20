const sinon = require('sinon');
const mockery = require('mockery');
const { expect } = require('chai');
const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('../../../../backend/lib/domain-members/contants');

describe('The domain members address book, address book module', () => {
  let getModule, contactClientMock, utilsMock, technicalUser, options;

  const domainId = '123';
  const token = 'token';

  beforeEach(function() {
    technicalUser = { name: 'Sabre DAV' };
    options = {
      user: technicalUser,
      ESNToken: token
    };
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
    const addressbook = {
      id: DOMAIN_MEMBERS_ADDRESS_BOOK_NAME,
      'dav:name': 'Domain members',
      'carddav:description': 'Address book contains all domain members',
      'dav:acl': ['{DAV:}read'],
      type: 'group'
    };

    it('should reject if failed to create domain members addressbook', function(done) {
      contactClientMock.create = sinon.stub().returns(Promise.reject(new Error('Failed to create domain members addressbook')));

      getModule().createDomainMembersAddressbook(domainId, options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(contactClientMock.create).to.have.been.calledWith(addressbook);
          expect(err.message).to.equal('Failed to create domain members addressbook');
          done();
        });
    });

    it('should resolve if success to creat domain members addressbook', function(done) {
      contactClientMock.create = sinon.stub().returns(Promise.resolve());

      getModule().createDomainMembersAddressbook(domainId, options)
        .then(() => {
          expect(contactClientMock.create).to.have.been.calledWith(addressbook);
          done();
        })
        .catch(done);
    });
  });

  describe('The removeDomainMembersAddressbook function', () => {
    it('should reject if failed to remove domain members addressbook', function(done) {
      contactClientMock.remove = sinon.stub().returns(Promise.reject(new Error('Failed to remove domain members addressbook')));

      getModule().removeDomainMembersAddressbook(domainId, options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(contactClientMock.remove).to.have.been.called;
          expect(err.message).to.equal('Failed to remove domain members addressbook');
          done();
        });
    });

    it('should resolve if success to remove domain members addressbook', function(done) {
      contactClientMock.remove = sinon.stub().returns(Promise.resolve());

      getModule().removeDomainMembersAddressbook(domainId, options)
        .then(() => {
          expect(contactClientMock.remove).to.have.been.called;
          done();
        })
        .catch(done);
    });
  });

  describe('The getDomainMembersAddressbook funtion', function() {
    it('should reject if failed to get domain members addressbook', function(done) {
      contactClientMock.get = sinon.stub().returns(Promise.reject(new Error('Failed to get domain members addressbook')));

      getModule().getDomainMembersAddressbook(domainId, options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(contactClientMock.get).to.have.been.calledOnce;
          expect(err.message).to.equal('Failed to get domain members addressbook');
          done();
        });
    });

    it('should resolve if the domain members addressbook does not exist', function(done) {
      contactClientMock.get = sinon.stub().returns(Promise.reject({ statusCode: 404 }));

      getModule().getDomainMembersAddressbook(domainId, options)
        .then(_addressbook => {
          expect(_addressbook).to.be.undefined;
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });

    it('should resolve if success to get domain members addressbook', function(done) {
      const addressbook = { foo: 'bar' };

      contactClientMock.get = sinon.stub().returns(Promise.resolve(addressbook));

      getModule().getDomainMembersAddressbook(domainId, options)
        .then(_addressbook => {
          expect(_addressbook).to.deep.equal(addressbook);
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });

  describe('The getClientOptionsForDomain function', function() {
    it('should reject if failed to get technical user', function(done) {
      utilsMock.getTechnicalUser = () => Promise.reject(new Error('Failed to get technical user'));

      getModule().getClientOptionsForDomain(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).to.equal('Failed to get technical user');
          done();
        });
    });

    it('should reject if failed to get technical user token', function(done) {
      utilsMock.getTechnicalUser = () => Promise.reject(new Error('Failed to get token'));
      getModule().getClientOptionsForDomain(domainId)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err.message).to.equal('Failed to get token');
          done();
        });
    });

    it('should resolve if success to get technical user token', function(done) {
      getModule().getClientOptionsForDomain(domainId)
        .then(_options => {
          expect(_options).to.deep.equal(options);
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });
});
