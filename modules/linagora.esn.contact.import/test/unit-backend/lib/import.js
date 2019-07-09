const { expect } = require('chai');
const sinon = require('sinon');

describe('The contact import module', function() {
  let getModule;
  let jobQueueMock, contactModuleMock, contactClientMock;
  const domainId = '123';
  const { IMPORT, SYNCHRONIZE } = require('../../../backend/lib/constants').JOBQUEUE_WORKER_NAMES;

  beforeEach(function() {
    contactClientMock = {
      create: function() {
        return Promise.resolve([]);
      }
    };
    contactModuleMock = {
      lib: {
        constants: require('../../../../linagora.esn.contact/backend/lib/constants'),
        client: function() {
          return {
            addressbookHome: function() {
              return {
                addressbook: function() {
                  return {
                    vcard: function() {
                      return contactClientMock;
                    }
                  };
                }
              };
            }
          };
        }
      }
    };

    jobQueueMock = {
      lib: {
        submitJob: function() {},
        workers: {
          add: function() {}
        }
      }
    };

    this.moduleHelpers.addDep('jobqueue', jobQueueMock);
    this.moduleHelpers.addDep('contact', contactModuleMock);

    getModule = () => require('../../../backend/lib/import')(this.moduleHelpers.dependencies);
  });

  describe('The importAccountContactsByJobQueue function', function() {
    it('should submit import account contacts job with the correct params', function() {
      const user = { _id: '123' };
      const account = { foo: 'bar' };

      jobQueueMock.lib = {
        submitJob: sinon.spy()
      };

      getModule().importAccountContactsByJobQueue(user, account);

      expect(jobQueueMock.lib.submitJob).to.have.been.calledWith(IMPORT, { user, account });
    });
  });

  describe('The synchronizeAccountContactsByJobQueue function', function() {
    it('should submit synchronize account contacts job with the correct params', function() {
      const user = { _id: '123' };
      const account = { foo: 'bar' };

      jobQueueMock.lib = {
        submitJob: sinon.spy()
      };

      getModule().synchronizeAccountContactsByJobQueue(user, account);

      expect(jobQueueMock.lib.submitJob).to.have.been.calledWith(SYNCHRONIZE, { user, account });
    });
  });

  describe('The createContact method', function() {
    var vcardMock, optionsMock, vcarJson;
    var error = new Error('an error');
    beforeEach(function() {
      vcarJson = { uid: 1 };
      vcardMock = {
        getFirstPropertyValue: function() { return 1; },
        toJSON: function() { return vcarJson; }
      };
      optionsMock = {
        addressbook: {
          id: 1234
        },
        account: {
          type: 'oauth',
          data: {
            username: 'linagora',
            provider: 'twitter',
            token: 456,
            token_secret: 'abc'
          }
        },
        esnToken: 123,
        user: {
          _id: 'myId',
          id: 'myId',
          accounts: [
            {
              type: 'oauth',
              data: {
                provider: 'twitter',
                token: 456,
                token_secret: 'abc'
              }
            }
          ],
          preferredDomainId: domainId
        }
      };
    });

    it('should reject IMPORT_CONTACT_CLIENT_ERROR error when contact client reject', function(done) {

      contactClientMock.create = function() {
        return Promise.reject(error);
      };
      getModule().createContact(vcardMock, optionsMock).then(null, function(err) {
        expect(err).to.deep.equal({
          type: 'contact:import:contact:error',
          errorObject: error
        });
        done();
      });
    });

    it('should create contact client with the right paramters', function(done) {
      contactModuleMock.lib.client = function(options) {
        expect(options).to.deep.equal({
          ESNToken: optionsMock.esnToken,
          user: optionsMock.user
        });
        done();

        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() { return contactClientMock; }
                };
              }
            };
          }
        };
      };

      getModule().createContact(vcardMock, optionsMock);
    });
  });

  describe('The buildErrorMessage method', function() {
    var error, type;
    var CONTACT_IMPORT_ERROR = require('../../../backend/constants').CONTACT_IMPORT_ERROR;

    beforeEach(function() {
      error = { statusCode: 400 };
      type = 'type';
    });

    it('should build correct error object', function() {

      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: type,
        errorObject: error
      });

      type = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
        errorObject: error
      });

      error.statusCode = 500;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: type,
        errorObject: error
      });

      error.statusCode = 401;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
        errorObject: error
      });

      error.statusCode = 403;
      expect(getModule().buildErrorMessage(type, error)).to.deep.equal({
        type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
        errorObject: error
      });
    });
  });
});
