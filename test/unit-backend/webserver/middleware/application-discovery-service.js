const expect = require('chai').expect;
const mockery = require('mockery');

describe('the application discovery service middleware', function() {

  describe('the applicationExists method', function() {
    it('should send back 400 if the SPA does not exist', function(done) {
      mockery.registerMock('../../core/application-discovery-service', {
        getById() {
          return Promise.resolve();
        }
      });

      const req = {
        params: {
          spaId: 'videoconference'
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code, message) {
          expect(code).to.equals(400);
          expect(message.error).to.exists;
          expect(message.error.code).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      );
      const { applicationExists } = this.helpers.requireBackend('webserver/middleware/application-discovery-service');

      applicationExists(req, res, () => { });
    });
  });

  describe('the canCreateSPA method', function() {
    it('should send back 400 if the SPA does exist', function(done) {
      mockery.registerMock('../../core/application-discovery-service', {
        getById() {
          return Promise.resolve({ id: 'calendar' });
        }
      });

      const req = {
        body: {
          id: 'calendar'
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code, message) {
          expect(code).to.equals(400);
          expect(message.error).to.exists;
          expect(message.error.code).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      );
      const { canCreateSPA } = this.helpers.requireBackend('webserver/middleware/application-discovery-service');

      canCreateSPA(req, res, () => { });
    });
  });

  describe('the validateConfigBody method', function() {
    it('should send back 400 if the body is not valid', function(done) {
      const req = {
        body: {}
      };
      const res = this.helpers.express.jsonResponse(
        function(code, message) {
          expect(code).to.equals(400);
          expect(message.error).to.exists;
          expect(message.error.code).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      );
      const { validateConfigBody } = this.helpers.requireBackend('webserver/middleware/application-discovery-service');

      validateConfigBody(req, res, () => { });
    });
  });
});
