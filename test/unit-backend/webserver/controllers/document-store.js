const sinon = require('sinon');
const mockery = require('mockery');
const { expect } = require('chai');

describe('The document-store controller', function() {
  describe('The test function', function() {
    it('should call the mongodb.validateConnection method with credentials when they are set', function() {
      const validateConnection = sinon.spy();
      const requestMock = {
        params: {
          hostname: 'localhost',
          port: '42',
          dbname: 'rsetest'
        },
        body: {
          username: 'john',
          password: 'doe'
        }
      };

      mockery.registerMock('../../core', {
        db: {
          mongo: {
            validateConnection
          }
        }
      });

      this.helpers.requireBackend('webserver/controllers/document-store').test(requestMock);

      expect(validateConnection).to.have.been.calledWith(requestMock.params.hostname, requestMock.params.port, requestMock.params.dbname, requestMock.body.username, requestMock.body.password);
    });
  });
});
