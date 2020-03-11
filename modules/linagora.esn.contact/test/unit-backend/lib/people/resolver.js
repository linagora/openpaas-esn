const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const mockery = require('mockery');

describe('The contacts backend/lib/people/resolver module', function() {
  let getModule, clientMock, searchContactsMock, token;

  beforeEach(function() {
    token = 'token';

    this.moduleHelpers.addDep('auth', {
      token: {
        getNewToken: (options, callback) => {
          callback(null, { token });
        }
      }
    });

    this.moduleHelpers.addDep('people', {
      constants: {
        FIELD_TYPES: {}
      }
    });

    getModule = () => require(`${this.moduleHelpers.modulesPath}linagora.esn.contact/backend/lib/people/resolver`)(this.moduleHelpers.dependencies);

    searchContactsMock = sinon.stub().returns(Promise.resolve({}));
    clientMock = sinon.spy(() => ({
      searchContacts: searchContactsMock
    }));

    mockery.registerMock('../client', () => clientMock);
  });

  it('should search contacts with the correct arguments', function(done) {
    const value = 'foo';
    const context = { user: { _id: 'abc' } };

    getModule()({ fieldType: 'email', value, context })
      .then(() => {
        expect(clientMock).to.have.been.calledWith({ ESNToken: token });
        expect(searchContactsMock).to.have.been.calledWith({
          user: context.user,
          search: value
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
  });
});
