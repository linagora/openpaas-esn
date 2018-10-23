'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The domains controller', function() {
  let helpers;

  beforeEach(function() {
    helpers = this.helpers;
    mockery.registerMock('./login', {});
  });

  describe('The create function', function() {
    let domain, user, domainId;
    let userIndexMock, coreDomainMock;

    beforeEach(function() {
      userIndexMock = {};
      coreDomainMock = {};

      mockery.registerMock('../../core/user/index', userIndexMock);
      mockery.registerMock('../../core/domain', coreDomainMock);
      mockery.registerMock('mongoose', {model: function() {}});

      domainId = 'domain123';
      domain = {
        name: 'awesome.domain',
        company_name: 'awesome company',
        hostnames: ['linagora']
      };

      user = {
        accounts: [{
          hosted: true,
          type: 'email',
          emails: ['abc@linagora.com']
        }],
        password: 'secret',
        domains: [{ domain_id: domainId }]
      };
    });

    const getController = () => helpers.requireBackend('webserver/controllers/domains');

    it('should return HTTP 500 if failed to create domain', function(done) {
      coreDomainMock = {
        create: sinon.spy(function(domain, callback) {
          callback(new Error());
        })
      };
      mockery.registerMock('../../core/domain', coreDomainMock);

      const req = {
        body: {
          name: domain.name,
          company_name: domain.company_name,
          administrator: {},
          hostnames: domain.hostnames
        }
      };
      const res = helpers.express.jsonResponse(
        function(status, response) {
          expect(status).to.equal(500);
          expect(response.error).to.deep.equal({
            code: 500,
            message: 'Server Error',
            details: `Error while creating domain ${domain.name}`
          });
          expect(coreDomainMock.create).to.have.been.calledOnce;
          expect(coreDomainMock.create).to.have.been.calledWith(domain);
          done();
        }
      );

      getController().create(req, res);
    });

    it('should return HTTP 500 if failed to save user', function(done) {
      coreDomainMock = {
        create: sinon.spy(function(domain, callback) {
          domain._id = domainId;
          callback(null, domain);
        }),
        removeById: sinon.spy(function(options, callback) {
          callback();
        })
      };
      userIndexMock = {
        recordUser: sinon.spy(function(user, callback) {
          callback(new Error());
        })
      };
      mockery.registerMock('../../core/domain', coreDomainMock);
      mockery.registerMock('../../core/user/index', userIndexMock);

      const req = {
        body: {
          name: domain.name,
          company_name: domain.company_name,
          administrator: {
            email: user.accounts[0].emails[0],
            password: user.password
          }
        }
      };
      const res = helpers.express.jsonResponse(
        function(status, response) {
          expect(status).to.equal(500);
          expect(response.error).to.deep.equal({
            code: 500,
            message: 'Server Error',
            details: `Error while creating domain ${domain.name}`
          });
          expect(userIndexMock.recordUser).to.have.been.calledOnce;
          expect(userIndexMock.recordUser).to.have.been.calledWith(user);
          expect(coreDomainMock.removeById).to.have.been.calledOnce;
          expect(coreDomainMock.removeById).to.have.been.calledWith(domainId);
          done();
        }
      );

      getController().create(req, res);
    });

    it('should return HTTP 500 if failed to update domain with administrator', function(done) {
      const userId = 'user123';

      coreDomainMock = {
        create: sinon.spy(function(domain, callback) {
          domain._id = domainId;
          callback(null, domain);
        }),
        updateById: sinon.spy(function(domainId, modified, callback) {
          const administrators = [{ user_id: userId }];

          expect(modified).to.deep.equal({ administrators });
          callback(new Error());
        }),
        removeById: sinon.spy(function(options, callback) {
          callback();
        })
      };
      userIndexMock = {
        recordUser: sinon.spy(function(user, callback) {
          user._id = userId;
          callback(null, user);
        })
      };
      mockery.registerMock('../../core/domain', coreDomainMock);
      mockery.registerMock('../../core/user/index', userIndexMock);

      const req = {
        body: {
          name: domain.name,
          company_name: domain.company_name,
          administrator: {
            email: user.accounts[0].emails[0],
            password: user.password
          }
        }
      };
      const res = helpers.express.jsonResponse(
        function(status, response) {
          expect(status).to.equal(500);
          expect(response.error).to.deep.equal({
            code: 500,
            message: 'Server Error',
            details: `Error while creating domain ${domain.name}`
          });
          expect(userIndexMock.recordUser).to.have.been.calledOnce;
          expect(coreDomainMock.updateById).to.have.been.calledOnce;
          expect(coreDomainMock.removeById).to.have.been.calledOnce;
          expect(coreDomainMock.removeById).to.have.been.calledWith(domainId);
          done();
        }
      );

      getController().create(req, res);
    });

    it('should return HTTP 500 if failed to remove domain when failed to create administrator', function(done) {
      coreDomainMock = {
        create: sinon.spy(function(domain, callback) {
          domain._id = domainId;
          callback(null, domain);
        }),
        removeById: sinon.spy(function(options, callback) {
          callback(new Error());
        })
      };
      userIndexMock = {
        recordUser: sinon.spy(function(user, callback) {
          callback(new Error());
        })
      };
      mockery.registerMock('../../core/domain', coreDomainMock);
      mockery.registerMock('../../core/user/index', userIndexMock);

      const req = {
        body: {
          name: domain.name,
          company_name: domain.company_name,
          administrator: {
            email: user.accounts[0].emails[0],
            password: user.password
          }
        }
      };
      const res = helpers.express.jsonResponse(
        function(status, response) {
          expect(status).to.equal(500);
          expect(response.error).to.deep.equal({
            code: 500,
            message: 'Server Error',
            details: `Error while creating domain ${domain.name}`
          });
          expect(userIndexMock.recordUser).to.have.been.calledOnce;
          expect(userIndexMock.recordUser).to.have.been.calledWith(user);
          expect(coreDomainMock.removeById).to.have.been.calledOnce;
          expect(coreDomainMock.removeById).to.have.been.calledWith(domainId);
          done();
        }
      );

      getController().create(req, res);
    });
  });

  describe('The getDomain fn', function() {

    it('should return HTTP 404 when domain is not available in the request', function(done) {
      mockery.registerMock('mongoose', {model: function() {
      }});
      var req = {
      };
      var res = helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(404);
          done();
        }
      );
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.getDomain(req, res);
    });

    it('should return HTTP 200 when domain is available in the request', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});
      var req = {
        domain: {}
      };
      var res = helpers.express.jsonResponse(
        function(status, domain) {
          expect(status).to.equal(200);
          expect(domain).to.exist;
          done();
        }
      );
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.getDomain(req, res);
    });
  });

  describe('The createMember fn', function() {
    let getController;
    let userIndexMock;

    beforeEach(function() {
      getController = () => this.helpers.requireBackend('webserver/controllers/domains');
      userIndexMock = {};

      mockery.registerMock('../../core/user/index', userIndexMock);
      mockery.registerMock('mongoose', { model: function() {} });
    });

    it('should respond 400 if body is empty', function(done) {
      const req = {
        body: {}
      };
      const res = {
        status(code) {
          expect(code).to.equal(400);

          return {
            json(json) {
              expect(json.error.details).to.equal('Missing input member');
              done();
            }
          };
        }
      };

      getController().createMember(req, res);
    });

    it('should respond 409 if it fails to record user because of email unavailability', function(done) {
      const errorMessage = 'Emails already in use: e@mail';

      userIndexMock.recordUser = sinon.spy((user, callback) => {
        callback(new Error(errorMessage));
      });

      const req = {
        body: { name: 'H' }
      };
      const res = {
        status(code) {
          expect(code).to.equal(409);

          return {
            json(json) {
              expect(json.error.details).to.equal(errorMessage);
              expect(userIndexMock.recordUser).to.have.been.calledOnce;
              expect(userIndexMock.recordUser).to.have.been.calledWith(req.body, sinon.match.func);
              done();
            }
          };
        }
      };

      getController().createMember(req, res);
    });

    it('should respond 500 if it fails to record user because of other reasons', function(done) {
      const errorMessage = 'an_error';

      userIndexMock.recordUser = sinon.spy((user, callback) => {
        callback(new Error(errorMessage));
      });

      const req = {
        body: { name: 'H' }
      };
      const res = {
        status(code) {
          expect(code).to.equal(500);

          return {
            json(json) {
              expect(json.error.details).to.equal('Error while creating member');
              expect(userIndexMock.recordUser).to.have.been.calledOnce;
              expect(userIndexMock.recordUser).to.have.been.calledWith(req.body, sinon.match.func);
              done();
            }
          };
        }
      };

      getController().createMember(req, res);
    });

    it('should respond 201 when user is successfully recored', function(done) {
      const createdUser = { name: 'created user' };

      userIndexMock.recordUser = sinon.spy((user, callback) => {
        callback(null, createdUser);
      });

      const req = {
        body: { name: 'H' }
      };
      const res = {
        status(code) {
          expect(code).to.equal(201);

          return {
            json(json) {
              expect(json).to.deep.equal(createdUser);
              expect(userIndexMock.recordUser).to.have.been.calledOnce;
              expect(userIndexMock.recordUser).to.have.been.calledWith(req.body, sinon.match.func);
              done();
            }
          };
        }
      };

      getController().createMember(req, res);
    });
  });
});
