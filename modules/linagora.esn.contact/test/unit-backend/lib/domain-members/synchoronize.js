const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');
const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('../../../../backend/lib/domain-members/contants');

describe('The domain member address book synchronize module', function() {
  let getModule, technicalUser;
  let coreUserMock, coreTechnicalUserMock, esnConfigMock, clientMock, vcardMock;

  const domainId = '123';
  const TECHNICAL_USER_TYPE = 'dav';
  const token = 'token';

  beforeEach(function() {
    technicalUser = { _id: 'technical123' };

    coreUserMock = {
      getDisplayName: () => {},
      listByCursor: () => ({ next: () => Promise.resolve() }),
      CONSTANTS: {
        USER_ACTIONS: {
          login: 'login',
          searchable: 'searchable'
        },
        USER_ACTION_STATES: {
          disabled: 'diabled'
        }
      }
    };

    vcardMock = {
      removeMultiple: () => Promise.resolve([])
    };
    clientMock = {
      addressbookHome: bookHome => {
        expect(bookHome).to.equal(domainId);

        return clientMock;
      },
      addressbook: bookName => {
        expect(bookName).to.deep.equal(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME);

        return clientMock;
      },
      vcard: () => vcardMock
    };

    mockery.registerMock('../client', () =>
      function({ ESNToken, user }) {
        expect(ESNToken).to.equal(token);
        expect(user).to.deep.equal(technicalUser);

        return clientMock;
      }
    );

    coreTechnicalUserMock = {
      findByTypeAndDomain: function(technicalUserType, _domainId, callback) {
        expect(technicalUserType).to.equal(TECHNICAL_USER_TYPE);
        expect(_domainId).to.equal(domainId);

        return callback(null, [technicalUser]);
      },
      getNewToken: function(_technicalUser, TTL, callback) {
        expect(_technicalUser).to.deep.equal(technicalUser);
        expect(TTL).to.equal(20000);

        return callback(null, { token });
      }
    };

    esnConfigMock = {
      inModule: function() {
        return this;
      },
      esnConfig: {
        setDomainId: function() {
          return this;
        }
      },
      get: () => Promise.resolve()
    };

    this.moduleHelpers.addDep('user', coreUserMock);
    this.moduleHelpers.addDep('technical-user', coreTechnicalUserMock);
    this.moduleHelpers.addDep('esn-config', () => esnConfigMock);

    getModule = () => require('../../../../backend/lib/domain-members/synchronize')(this.moduleHelpers.dependencies);
  });

  it('should reject if failed to get technical user', function(done) {
    coreTechnicalUserMock.findByTypeAndDomain = sinon.spy(function(technicalUserType, _domainId, callback) {
      expect(technicalUserType).to.equal(TECHNICAL_USER_TYPE);
      expect(_domainId).to.equal(domainId);

      return callback(new Error('something wrong'));
    });

    getModule()(domainId)
      .then(() => done('should not resolve'))
      .catch(err => {
        expect(coreTechnicalUserMock.findByTypeAndDomain).to.have.been.calledOnce;
        expect(err.message).to.equal('something wrong');
        done();
      });
  });

  it('should reject if the domain has no technical user', function(done) {
    coreTechnicalUserMock.findByTypeAndDomain = sinon.spy(function(technicalUserType, _domainId, callback) {
      expect(technicalUserType).to.equal(TECHNICAL_USER_TYPE);
      expect(_domainId).to.equal(domainId);

      return callback(null, []);
    });

    getModule()(domainId)
      .then(() => done('should not resolve'))
      .catch(err => {
        expect(coreTechnicalUserMock.findByTypeAndDomain).to.have.been.calledOnce;
        expect(err.message).to.equal(`Cannot synchronize domain members address book for domain ${domainId} since there is no technical user`);
        done();
      });
  });

  it('should reject if failed to get ESN base URL', function(done) {
    esnConfigMock.get = sinon.stub().returns(Promise.reject(new Error('something wrong')));

    getModule()(domainId)
      .then(() => done('should not resolve'))
      .catch(err => {
        expect(esnConfigMock.get).to.have.been.calledOnce;
        expect(err.message).to.equal('something wrong');
        done();
      });
  });

  it('should reject if failed to get technical user token', function(done) {
    coreTechnicalUserMock.getNewToken = sinon.spy(function(_technicalUser, TTL, callback) {
      expect(_technicalUser).to.deep.equal(technicalUser);
      expect(TTL).to.equal(20000);

      return callback(new Error('something wrong'));
    });

    getModule()(domainId)
      .then(() => done('should not resolve'))
      .catch(err => {
        expect(coreTechnicalUserMock.getNewToken).to.have.been.calledOnce;
        expect(err.message).to.equal('something wrong');
        done();
      });
  });

  it('should reject if there is no technical user token', function(done) {
    coreTechnicalUserMock.getNewToken = sinon.spy(function(_technicalUser, TTL, callback) {
      expect(_technicalUser).to.deep.equal(technicalUser);
      expect(TTL).to.equal(20000);

      return callback(null);
    });

    getModule()(domainId)
      .then(() => done('should not resolve'))
      .catch(err => {
        expect(coreTechnicalUserMock.getNewToken).to.have.been.calledOnce;
        expect(err.message).to.equal('Can not generate technical token');
        done();
      });
  });

  it('should list ESN users by cursor with the correct parameter', function(done) {
    coreUserMock.listByCursor = sinon.stub().returns({ next: () => Promise.resolve() });

    getModule()(domainId)
      .then(() => {
        expect(coreUserMock.listByCursor).to.have.been.calledWith({
          domainIds: [domainId],
          canLogin: true,
          isSearchable: true
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
  });

  it('should send requests to create contacts if there is multiple ESN users', function(done) {
    const user1 = { _id: 'user1' };
    const user2 = { _id: 'user2' };
    const users = [user1, user2];
    let counter = 0;

    function next() {
      const user = users[counter];

      counter++;

      return Promise.resolve(user);
    }

    coreUserMock.listByCursor = () => ({ next });
    vcardMock.create = sinon.stub().returns(Promise.resolve());

    const mappingMock = {
      toVCard: sinon.spy(function(user) {
        return {
          toJSON: () => user,
          getFirstPropertyValue: () => user._id
        };
      })
    };

    mockery.registerMock('./mapping', () => mappingMock);

    getModule()(domainId)
      .then(() => {
        expect(mappingMock.toVCard).to.have.been.calledTwice;
        expect(mappingMock.toVCard).to.have.been.calledWith(user1);
        expect(mappingMock.toVCard).to.have.been.calledWith(user2);
        expect(vcardMock.create).to.have.been.calledTwice;
        expect(vcardMock.create).to.have.been.calledWith(user1);
        expect(vcardMock.create).to.have.been.calledWith(user2);
        done();
      })
      .catch(err => done(err || 'should resolve'));
  });

  it('should send request to clean outdate contacts from domain members address book', function(done) {
    vcardMock.removeMultiple = sinon.stub().returns(Promise.resolve([]));

    getModule()(domainId)
      .then(() => {
        expect(vcardMock.removeMultiple).to.have.been.calledOnce;
        done();
      })
      .catch(err => done(err || 'should resolve'));
  });
});
