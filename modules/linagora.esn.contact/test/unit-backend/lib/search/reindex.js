const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The reindex contact module', function() {
  const DAV_PREFIX = '/dav/api';
  const TOKEN = 'davToken';
  const DOMAIN_ID = '123456';
  let deps;
  let listenerGetOptionsMock, coreDomainMock, coreTechnicalUserMock, davClientMock;

  beforeEach(function() {
    const technicalUserMock = { foo: 'bar' };

    listenerGetOptionsMock = sinon.stub().returns({});

    coreDomainMock = {
      list: (options, callback) => {
        expect(options).to.deep.equal({});
        callback(null, [{ _id: DOMAIN_ID }]);
      }
    };

    coreTechnicalUserMock = {
      findByTypeAndDomain: (technicalUserType, domainId, callback) => {
        expect(domainId).to.equal(DOMAIN_ID);
        expect(technicalUserType).to.equal('dav');
        callback(null, [technicalUserMock]);
      },
      getNewToken: (technicalUser, tokenTTL, callback) => {
        expect(technicalUser).to.deep.equal(technicalUserMock);
        expect(tokenTTL).to.equal(20000);
        callback(null, { token: TOKEN });
      }
    };

    davClientMock = {
      rawClient: sinon.spy((options, callback) => {
        let body = {};

        if (options.url === '/dav/api/addressbooks') {
          body = ['bookHome1', 'bookHome2'];
        } else {
          body = {
            _embedded: {
              'dav:addressbook': []
            }
          };
        }

        callback(
          null,
          { statusCode: 200 },
          body
        );
      })
    };

    deps = {
      davserver: {
        utils: {
          getDavEndpoint: callback => callback(DAV_PREFIX)
        }
      },
      'technical-user': coreTechnicalUserMock,
      domain: coreDomainMock
    };

    mockery.registerMock('./listener', () => ({ getOptions: listenerGetOptionsMock }));
    mockery.registerMock('../dav-client', davClientMock);
  });

  function dependencies(name) {
    return deps[name];
  }

  function getModule() {
    return require('../../../../backend/lib/search/reindex')(dependencies);
  }
  describe('The buildReindexOptions function', function() {
    it('should resolve with the reindex options', function(done) {
      getModule().buildReindexOptions()
        .then(options => {
          expect(options.name).to.equal('contacts.idx');
          expect(davClientMock.rawClient).to.have.been.calledThrice;
          done();
        })
        .catch(err => done(err || 'should resolve'));
    });
  });
});
