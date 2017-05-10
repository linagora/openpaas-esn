'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The login controller', function() {

  describe('The index function', function() {
    let redirectSpy;

    beforeEach(function() {
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/user/login', {});
      redirectSpy = sinon.spy();
    });

    describe('When user is authenticated', function() {
      it('should redirect to ?continue when defined', function() {
        const continueUrl = '/foo/bar/baz';
        const login = this.helpers.requireBackend('webserver/controllers/login');
        const req = {
          isAuthenticated: function() {
            return true;
          },
          query: { continue: continueUrl }
        };
        const res = {
          redirect: redirectSpy
        };

        login.index(req, res);

        expect(redirectSpy).to.have.been.calledWith(continueUrl);
      });

      it('should redirect to / when ?continue is not defined', function() {
        const login = this.helpers.requireBackend('webserver/controllers/login');
        const req = {
          isAuthenticated: function() {
            return true;
          },
          query: {}
        };
        const res = {
          redirect: redirectSpy
        };

        login.index(req, res);

        expect(redirectSpy).to.have.been.calledWith('/');
      });
    });

    describe('When not authenticated', function() {
      it('should send back error when recaptcha config fails', function(done) {
        const error = new Error('I failed to get recaptcha');
        const esnConfigMock = sinon.spy(function() {
          return {
            get: function(callback) {
              callback(error);
            }
          };
        });

        mockery.registerMock('../../core/esn-config', esnConfigMock);

        const login = this.helpers.requireBackend('webserver/controllers/login');
        const req = {
          isAuthenticated: function() {
            return false;
          },
          query: {}
        };
        const res = {
          render: function() {
            done(new Error('Should not be called'));
          },
          status: function(status) {
            expect(status).to.equal(500);

            return {
              json: function(options) {
                expect(options).to.shallowDeepEqual({error: 500});
                done();
              }
            };
          }
        };

        login.index(req, res);
      });

      it('should send back a valid express response', function(done) {
        const assets = {foo: 'bar'};
        const tplPath = '/foo/bar/baz';
        const alterMock = sinon.spy();
        const esnAwareAppMock = sinon.spy(function() {
          return assets;
        });
        const recaptcha = {
          publickey: '123'
        };
        const esnConfigMock = sinon.spy(function() {
          return {
            get: function(callback) {
              callback(null, recaptcha);
            }
          };
        });

        mockery.registerMock('../../core/esn-config', esnConfigMock);
        mockery.registerMock('../middleware/templates', {
          alterTemplatePath: alterMock
        });
        mockery.registerMock('../../core', {
          config: function() {},
          assets: {
            envAwareApp: esnAwareAppMock
          }
        });

        const login = this.helpers.requireBackend('webserver/controllers/login');
        const req = {
          isAuthenticated: function() {
            return false;
          },
          query: {}
        };
        const res = {
          locals: {},
          render: function(templatePath, options) {
            expect(res.locals.assets).to.deep.equal(assets);
            expect(templatePath).to.equal(tplPath);
            expect(options).to.deep.equal({title: 'Home', recaptchaPublicKey: recaptcha.publickey});
            done();
          },
          status: function() {
            done(new Error('Should not be called'));
          }
        };

        login.index(req, res);

         expect(alterMock).to.have.been.calledWith('welcome/index', sinon.match.func.and(sinon.match(function(func) {
          func(tplPath);

          return true;
        })));
      });
    });
  });
});
