/* eslint-disable no-process-env */
const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The platformadmin init module', function() {
  let isPlatformAdminDefined, addPlatformAdmin, provisionUser, init, mongo, topic, debugLoggerSpy, warnLoggerSpy, errorLoggerSpy;
  let username, password;

  beforeEach(function() {
    const logger = this.helpers.requireBackend('core/logger');

    username = 'admin@open-paas.org';
    password = 'secret';

    provisionUser = sinon.stub();
    isPlatformAdminDefined = sinon.stub();
    addPlatformAdmin = sinon.stub();

    mockery.registerMock('./index', {
      isPlatformAdminDefined,
      addPlatformAdmin
    });

    mockery.registerMock('../user', {
      provisionUser
    });

    mongo = {
      isConnected: sinon.stub().returns(true)
    };
    mockery.registerMock('../db', {
      mongo
    });

    topic = {
      subscribe: sinon.stub()
    };
    mockery.registerMock('../pubsub', {
      local: {
        topic: sinon.stub().returns(topic)
      }
    });

    debugLoggerSpy = sinon.spy(logger, 'debug');
    warnLoggerSpy = sinon.spy(logger, 'warn');
    errorLoggerSpy = sinon.spy(logger, 'error');
  });

  it('should resolve with false when process.env.INIT_PLATFORMADMIN_USERNAME is not defined', function(done) {
    init = this.helpers.requireBackend('core/platformadmin/init');

    init()
      .then(result => {
        expect(result).to.be.false;
        expect(debugLoggerSpy).to.have.been.calledWith('PlatformAdmin.init - No username set, skipping');
        expect(warnLoggerSpy).to.not.have.been.called;
        expect(provisionUser).to.not.have.been.called;
        expect(isPlatformAdminDefined).to.not.have.been.called;
        done();
      })
      .catch(done);
  });

  it('should resolve with false when process.env.INIT_PLATFORMADMIN_PASSWORD is not defined', function(done) {
    process.env.INIT_PLATFORMADMIN_USERNAME = username;
    init = this.helpers.requireBackend('core/platformadmin/init');

    init()
      .then(result => {
        expect(result).to.be.false;
        expect(debugLoggerSpy).to.not.have.been.called;
        expect(warnLoggerSpy).to.have.been.calledWith('PlatformAdmin.init - No password set');
        expect(provisionUser).to.not.have.been.called;
        expect(isPlatformAdminDefined).to.not.have.been.called;
        done();
      })
      .catch(done);
  });

  describe('when env variables are defined', function() {
    describe('if a platform admin is already defined', function() {
      it('should resolve', function(done) {
        process.env.INIT_PLATFORMADMIN_USERNAME = username;
        process.env.INIT_PLATFORMADMIN_PASSWORD = password;
        isPlatformAdminDefined.returns(Promise.resolve(true));
        init = this.helpers.requireBackend('core/platformadmin/init');

        init()
          .then(result => {
            expect(result).to.be.false;
            expect(isPlatformAdminDefined).to.have.been.calledOnce;
            expect(provisionUser).to.not.have.been.called;
            done();
          })
          .catch(done);
      });
    });

    describe('if a platform admin is not defined', function() {
      it('should provision it from env variables', function(done) {
        const user = { _id: 1 };

        process.env.INIT_PLATFORMADMIN_USERNAME = username;
        process.env.INIT_PLATFORMADMIN_PASSWORD = password;
        isPlatformAdminDefined.returns(Promise.resolve(false));
        provisionUser.yields(null, user);
        addPlatformAdmin.returns(Promise.resolve());
        init = this.helpers.requireBackend('core/platformadmin/init');

        init()
          .then(() => {
            expect(isPlatformAdminDefined).to.have.been.calledOnce;
            expect(provisionUser).to.have.been.calledWith({ accounts: [{ emails: [username], type: 'email' }], password });
            expect(addPlatformAdmin).to.have.been.calledWith(user);
            done();
          })
          .catch(done);
      });

      it('should not add platform admin is user creation fails', function(done) {
        const error = new Error();

        process.env.INIT_PLATFORMADMIN_USERNAME = username;
        process.env.INIT_PLATFORMADMIN_PASSWORD = password;

        isPlatformAdminDefined.returns(Promise.resolve(false));
        provisionUser.yields(error);
        addPlatformAdmin.returns(Promise.resolve(true));
        init = this.helpers.requireBackend('core/platformadmin/init');

        init()
          .then(() => {
            expect(isPlatformAdminDefined).to.have.been.calledOnce;
            expect(addPlatformAdmin).to.not.have.been.called;
            expect(provisionUser).to.have.been.calledWith({ accounts: [{ emails: [username], type: 'email' }], password });
            expect(errorLoggerSpy).to.have.been.calledWith('PlatformAdmin.init - email=admin@open-paas.org: Can not provision correctly platform admin');
            done();
          })
          .catch(done);
      });

      it('should warn if setting user as platform admin fails', function(done) {
        const error = new Error();
        const user = { _id: 1 };

        process.env.INIT_PLATFORMADMIN_USERNAME = username;
        process.env.INIT_PLATFORMADMIN_PASSWORD = password;

        isPlatformAdminDefined.returns(Promise.resolve(false));
        provisionUser.yields(null, user);
        addPlatformAdmin.returns(Promise.reject(error));
        init = this.helpers.requireBackend('core/platformadmin/init');

        init()
          .then(() => {
            expect(isPlatformAdminDefined).to.have.been.calledOnce;
            expect(addPlatformAdmin).to.have.been.calledWith(user);
            expect(provisionUser).to.have.been.calledWith({ accounts: [{ emails: [username], type: 'email' }], password });
            expect(errorLoggerSpy).to.have.been.calledWith('PlatformAdmin.init - email=admin@open-paas.org: Can not provision correctly platform admin', error);
            done();
          })
          .catch(done);
      });

      it('provision as soon as database connection is available', function(done) {
        const user = { _id: 1 };

        process.env.INIT_PLATFORMADMIN_USERNAME = username;
        process.env.INIT_PLATFORMADMIN_PASSWORD = password;

        mongo.isConnected.returns(false);
        isPlatformAdminDefined.returns(Promise.resolve(false));
        addPlatformAdmin.returns(Promise.resolve(true));
        provisionUser.yields(null, user);
        init = this.helpers.requireBackend('core/platformadmin/init');

        init();

        expect(isPlatformAdminDefined).to.not.have.been.called;
        expect(provisionUser).to.not.have.been.called;
        expect(addPlatformAdmin).to.not.have.been.called;

        const listener = topic.subscribe.firstCall.args[0];

        listener()
          .then(() => {
            expect(isPlatformAdminDefined).to.have.been.calledOnce;
            expect(provisionUser).to.have.been.calledWith({ accounts: [{ emails: [username], type: 'email' }], password });
            expect(addPlatformAdmin).to.have.been.calledWith(user);
            done();
          })
          .catch(done);
      });
    });
  });
});
