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
        company_name: 'awesome company'
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
          administrator: {}
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

  describe('The sendInvitations fn', function() {

    beforeEach(function() {
      var helpersMock = {
        config: {
          getBaseUrl: function(user, callback) {
            callback(null, 'http://localhost:8080');
          }
        }
      };

      mockery.registerMock('../../helpers', helpersMock);
    });

    it('should fail if request body is empty', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);
      var req = {};
      var res = helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(400);
          done();
        }
      );
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should fail if request body is not an array', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);

      var req = {
        body: {}
      };
      var res = helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(400);
          done();
        }
      );
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should send HTTP 202 if request body is an array', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/invitation', {});
      mockery.registerMock('./invitation', {getInvitationURL: function() {return 'http://localhost';}});

      var req = {
        body: [],
        user: {
          _id: 123
        },
        domain: {
          _id: 456
        }
      };
      var res = helpers.express.response(
        function(status) {
          expect(status).to.equal(202);
          done();
        }
      );
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub when invitations are sent', function(done) {
      var mock = {
        model: function() {
          return function(invitation) {
            return {
              save: function(callback) {
                return callback(null, invitation);
              }
            };
          };
        }
      };
      mockery.registerMock('mongoose', mock);

      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(null, true);
        },
        init: function(invitation, cb) {
          return cb(null, true);
        }
      };

      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        }
      };

      var res = helpers.express.response();

      var pubsub = helpers.requireBackend('core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        done();
      });
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub even if handler#validate is throwing an error', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);

      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(new Error('Fail!'));
        },
        init: function(invitation, cb) {
          return cb(null, true);
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        }
      };

      var res = helpers.express.response();

      var pubsub = helpers.requireBackend('core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        expect(message.emails).to.be.empty;
        done();
      });
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub even if handler#init is throwing an error', function(done) {
      var mock = {
        model: function() {
          return function(invitation) {
            return {
              save: function(callback) {
                return callback(null, invitation);
              }
            };
          };
        }
      };
      mockery.registerMock('mongoose', mock);

      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(null, true);
        },
        init: function(invitation, cb) {
          return cb(new Error('Fail!'));
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        }
      };

      var res = helpers.express.response();

      var pubsub = helpers.requireBackend('core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        expect(message.emails).to.be.empty;
        done();
      });
      var controller = helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });
  });
});
