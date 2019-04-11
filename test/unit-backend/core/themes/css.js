/* eslint-disable no-process-env */
const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The css module', function() {
  let initialNodeEnv, appName, domainId, getTheme, getStoreStub, memoryInstanceSpy, storeResult, less;

  describe('The generate function', function() {
    beforeEach(function() {
      initialNodeEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      delete process.env.ESN_CSS_CACHE_ON;
      delete process.env.ESN_CSS_CACHE_OFF;
    });

    beforeEach(function() {
      getTheme = sinon.stub().returns(Promise.resolve());
      getStoreStub = sinon.stub();
      memoryInstanceSpy = sinon.spy();
      appName = 'esn';
      domainId = '1234';

      mockery.registerMock('./index', {
        getTheme
      });

      less = {
        render: sinon.stub().returns(Promise.resolve())
      };
      mockery.registerMock('less', less);

      class MemoryStore {
        constructor() {
          memoryInstanceSpy();
          this.stub = getStoreStub;
        }

        get() {
          return this.stub.returns(storeResult)();
        }
      }

      mockery.registerMock('../../helpers/memory-store', MemoryStore);
    });

    afterEach(function() {
      process.env.NODE_ENV = initialNodeEnv;
    });

    describe('The cache', function() {
      it('should not be used in dev mode', function(done) {
        process.env.NODE_ENV = 'dev';

        const module = this.helpers.requireBackend('core/themes/css');

        module.generate(appName, domainId)
          .then(() => {
            expect(getStoreStub).to.not.have.been.called;
            expect(memoryInstanceSpy).to.not.have.been.called;
            done();
          })
          .catch(done);
      });

      it('should be used in production mode', function(done) {
        process.env.NODE_ENV = 'production';

        const module = this.helpers.requireBackend('core/themes/css');

        module.generate(appName, domainId)
          .then(() => {
            expect(memoryInstanceSpy).to.have.been.calledOnce;
            done();
          })
          .catch(done);
      });

      it('should not be used when process.env.ESN_CSS_CACHE_OFF is "true"', function(done) {
        process.env.ESN_CSS_CACHE_OFF = 'true';

        const module = this.helpers.requireBackend('core/themes/css');

        module.generate(appName, domainId)
          .then(() => {
            expect(memoryInstanceSpy).to.not.have.been.called;
            expect(less.render).to.have.been.called;
            done();
          })
          .catch(done);
      });

      it('should be used when process.env.ESN_CSS_CACHE_ON is "true"', function(done) {
        process.env.ESN_CSS_CACHE_ON = 'true';

        const module = this.helpers.requireBackend('core/themes/css');

        module.generate(appName, domainId)
          .then(() => {
            expect(memoryInstanceSpy).to.have.been.called;
            expect(less.render).to.have.been.called;
            done();
          })
          .catch(done);
      });

      it('should be instanciated once with the same domain', function(done) {
        process.env.ESN_CSS_CACHE_ON = 'true';

        const module = this.helpers.requireBackend('core/themes/css');

        module.generate(appName, domainId)
          .then(() => module.generate(appName, domainId))
          .then(() => {
            expect(memoryInstanceSpy).to.have.been.calledOnce;
            expect(less.render).to.have.been.calledOnce;
            expect(getStoreStub).to.have.been.calledTwice;
            done();
          })
          .catch(done);
      });

      it('should be instanciated once for each domain', function(done) {
        process.env.ESN_CSS_CACHE_ON = 'true';

        const module = this.helpers.requireBackend('core/themes/css');

        module.generate(appName, domainId)
          .then(() => module.generate(appName, `${domainId}${domainId}`))
          .then(() => {
            expect(memoryInstanceSpy).to.have.been.calledTwice;
            expect(less.render).to.have.been.calledTwice;
            expect(getStoreStub).to.have.been.calledTwice;
            done();
          })
          .catch(done);
      });
    });

    it('should concatenate injected less files', function(done) {
      const module = this.helpers.requireBackend('core/themes/css');
      const assets = this.helpers.requireBackend('core').assets;

      assets.app(appName).type('less').add(this.testEnv.fixtures + '/css/file.less', 'modX');
      module.generate(appName, domainId)
      .then(() => {
        expect(getTheme).to.have.been.calledWith(domainId);
        expect(less.render).to.have.been.calledWith(sinon.match(arg => arg.match(/frontend\/css\/styles.less'/)));
        expect(less.render).to.have.be.calledWith(sinon.match(arg => arg.match(/css\/file.less/)));
        done();
      })
      .catch(done);
    });

    it('should return the base CSS file', function(done) {
      const module = this.helpers.requireBackend('core/themes/css');

      module.generate(appName, domainId)
        .then(() => {
          expect(getTheme).to.have.been.calledWith(domainId);
          expect(less.render).to.have.been.calledWith(sinon.match(arg => arg.match(/frontend\/css\/styles.less'/)));
          done();
        })
        .catch(done);
    });

    describe('When resolving colors', function() {
      it('should resolve when domainId is not defined', function(done) {
        const module = this.helpers.requireBackend('core/themes/css');

        domainId = null;
        module.generate(appName, domainId)
          .then(() => {
            expect(getTheme).to.not.have.been.called;
            expect(less.render).to.have.been.called;
            done();
          })
          .catch(done);
      });

      it('should inject generated colors from theme', function(done) {
        const module = this.helpers.requireBackend('core/themes/css');
        const theme = {
          colors: [
            { key: 'primary', value: 'blue' },
            { key: 'secondary', value: 'yellow' }
          ]
        };

        getTheme.returns(Promise.resolve(theme));

        module.generate(appName, domainId)
          .then(() => {
            expect(getTheme).to.have.been.calledWith(domainId);
            expect(less.render).to.have.been.calledWith(sinon.match(arg => (arg.match(/@primary: blue;/) && arg.match(/@secondary: yellow;/))));
            done();
          })
          .catch(done);
      });

      it('should not fail when theme is not defined', function(done) {
        const module = this.helpers.requireBackend('core/themes/css');

        getTheme.returns(Promise.resolve());

        module.generate(appName, domainId)
          .then(() => {
            expect(getTheme).to.have.been.calledWith(domainId);
            expect(less.render).to.have.been.calledOnce;
            done();
          })
          .catch(done);
      });

      it('should not fail when theme colros are not defined', function(done) {
        const module = this.helpers.requireBackend('core/themes/css');

        getTheme.returns(Promise.resolve({}));

        module.generate(appName, domainId)
          .then(() => {
            expect(getTheme).to.have.been.calledWith(domainId);
            expect(less.render).to.have.been.calledOnce;
            done();
          })
          .catch(done);
      });

      it('should not reject when theme api rejects', function(done) {
        const module = this.helpers.requireBackend('core/themes/css');

        getTheme.returns(Promise.reject(new Error('I failed to get theme')));

        module.generate(appName, domainId)
          .then(() => {
            expect(getTheme).to.have.been.calledWith(domainId);
            expect(less.render).to.have.been.calledOnce;
            done();
          })
          .catch(done);
      });
    });
  });
});
