const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The module middleware', function() {
  let esnConfigMock;

  beforeEach(function() {
    esnConfigMock = sinon.stub();

    mockery.registerMock('../../core/esn-config', esnConfigMock);
  });

  describe('The requiresModuleIsEnabledInCurrentDomain function', function() {
    let moduleName, get, forUser, inModule;

    beforeEach(function() {
      moduleName = 'linagora.esn.communities';
      get = sinon.stub();
      forUser = sinon.stub().returns({ get });
      inModule = sinon.stub().returns({ forUser });
      esnConfigMock.returns({ inModule });
    });

    it('should 500 when esnConfig fails', function(done) {
      get.returns(Promise.reject(new Error('I failed')));
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(function(code) {
        expect(code).to.equal(500);
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(forUser).to.have.been.calledWith(req.user);
        expect(get).to.have.been.calledOnce;
        done();
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabledInCurrentDomain;

      middleware(moduleName)(req, res, () => done(new Error('Should not be called')));
    });

    it('should 403 when module is disabled', function(done) {
      const configuration = [{id: moduleName, enabled: false}];
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(code => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(forUser).to.have.been.calledWith(req.user);
        expect(get).to.have.been.calledOnce;
        expect(code).to.equal(403);
        done();
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabledInCurrentDomain;

      get.returns(Promise.resolve(configuration));
      middleware(moduleName)(req, res, () => done(new Error('Should not be called')));
    });

    it('should call next when module is enabled', function(done) {
      const configuration = [{id: moduleName, enabled: true}];
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(() => done(new Error('Should not be called')));
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabledInCurrentDomain;

      get.returns(Promise.resolve(configuration));
      middleware(moduleName)(req, res, () => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(forUser).to.have.been.calledWith(req.user);
        expect(get).to.have.been.calledOnce;
        done();
      });
    });

    it('should call next when module is not configured', function(done) {
      const configuration = [];
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(() => done(new Error('Should not be called')));
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabledInCurrentDomain;

      get.returns(Promise.resolve(configuration));
      middleware(moduleName)(req, res, () => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(forUser).to.have.been.calledWith(req.user);
        expect(get).to.have.been.calledOnce;
        done();
      });
    });

    it('should call next when modules are not configured', function(done) {
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(() => done(new Error('Should not be called')));
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabledInCurrentDomain;

      get.returns(Promise.resolve());
      middleware(moduleName)(req, res, () => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(forUser).to.have.been.calledWith(req.user);
        expect(get).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('The requiresModuleIsEnabled function', function() {
    let moduleName, get, inModule;

    beforeEach(function() {
      moduleName = 'linagora.esn.communities';
      get = sinon.stub();
      inModule = sinon.stub().returns({ get });
      esnConfigMock.returns({ inModule });
    });

    it('should 500 when esnConfig fails', function(done) {
      get.returns(Promise.reject(new Error('I failed')));
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(function(code) {
        expect(code).to.equal(500);
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(get).to.have.been.calledOnce;
        done();
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabled;

      middleware(moduleName)(req, res, () => done(new Error('Should not be called')));
    });

    it('should 403 when module is disabled', function(done) {
      const configuration = [{id: moduleName, enabled: false}];
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(code => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(get).to.have.been.calledOnce;
        expect(code).to.equal(403);
        done();
      });
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabled;

      get.returns(Promise.resolve(configuration));
      middleware(moduleName)(req, res, () => done(new Error('Should not be called')));
    });

    it('should call next when module is enabled', function(done) {
      const configuration = [{id: moduleName, enabled: true}];
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(() => done(new Error('Should not be called')));
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabled;

      get.returns(Promise.resolve(configuration));
      middleware(moduleName)(req, res, () => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(get).to.have.been.calledOnce;
        done();
      });
    });

    it('should call next when module is not configured', function(done) {
      const configuration = [];
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(() => done(new Error('Should not be called')));
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabled;

      get.returns(Promise.resolve(configuration));
      middleware(moduleName)(req, res, () => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(get).to.have.been.calledOnce;
        done();
      });
    });

    it('should call next when modules are not configured', function(done) {
      const req = { user: {_id: 1}, domain: {_id: 2} };
      const res = this.helpers.express.jsonResponse(() => done(new Error('Should not be called')));
      const middleware = this.helpers.requireBackend('webserver/middleware/module').requiresModuleIsEnabled;

      get.returns(Promise.resolve());
      middleware(moduleName)(req, res, () => {
        expect(esnConfigMock).to.have.been.calledWith('modules');
        expect(inModule).to.have.been.calledWith('core');
        expect(get).to.have.been.calledOnce;
        done();
      });
    });
  });
});
