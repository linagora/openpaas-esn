const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The group address book home module', function() {
  let utilsMock, davClientMock, getModule, options;
  const user = { _id: 'userId' };
  const davEndpoint = '/dav/api';

  beforeEach(function() {
    utilsMock = {
      getDavEndpoint: () => Promise.resolve(davEndpoint)
    };
    davClientMock = {
      rawClient: () => {}
    };
    options = {
      davServerUrl: 'davUrl',
      ESNToken: 'token'
    };

    mockery.registerMock('./utils', () => utilsMock);
    mockery.registerMock('../dav-client', davClientMock);

    getModule = () => require('../../../../backend/lib/client/group-addressbook-home')();
  });

  describe('The getGroupAddressbookHomes method', function() {
    it('should reject if failed to get dav endpoint', function(done) {
      utilsMock.getDavEndpoint = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getModule().getGroupAddressbookHomes(user, options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(utilsMock.getDavEndpoint).to.have.been.calledWith(user);
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if failed to get user principal', function(done) {
      davClientMock.rawClient = sinon.spy();
      utilsMock.checkResponse = sinon.spy(function(deferred, method, errorMessage) {
        expect(method).to.equal('PROPFIND');
        expect(errorMessage).to.equal('Error while getting user principals');
        deferred.reject(new Error('something wrong'));
      });

      getModule().getGroupAddressbookHomes(user, options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(davClientMock.rawClient).to.have.been.calledWith({
            method: 'PROPFIND',
            headers: {
              ESNToken: options.ESNToken,
              accept: 'application/json'
            },
            url: `${davEndpoint}/principals/users/${user._id}`,
            json: true
          });
          expect(utilsMock.checkResponse).to.have.been.calledOnce;
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve if success to get group membership', function(done) {
      davClientMock.rawClient = sinon.spy();
      utilsMock.checkResponse = sinon.spy(function(deferred, method, errorMessage) {
        expect(method).to.equal('PROPFIND');
        expect(errorMessage).to.equal('Error while getting user principals');
        deferred.resolve({
          body: {
            'group-membership': [
              'principals/groups/groupId1',
              'principals/groups/groupId2'
            ]
          }
        });
      });

      getModule().getGroupAddressbookHomes(user, options)
        .then(bookHomes => {
          expect(davClientMock.rawClient).to.have.been.calledWith({
            method: 'PROPFIND',
            headers: {
              ESNToken: options.ESNToken,
              accept: 'application/json'
            },
            url: `${davEndpoint}/principals/users/${user._id}`,
            json: true
          });
          expect(utilsMock.checkResponse).to.have.been.calledOnce;
          expect(bookHomes).to.deep.equal(['groupId1', 'groupId2']);
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });
});
