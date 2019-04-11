const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The css controller', function() {
  let cssModule, user, domainId;

  it('should expose a getCss method', function() {
    const controller = this.helpers.requireBackend('webserver/controllers/css');

    expect(controller).to.have.property('getCss');
    expect(controller.getCss).to.be.a('function');
  });

  describe('The getCss function', function() {
    beforeEach(function() {
      domainId = '123';
      user = {
        domains: [{ domain_id: domainId }]
      };
      cssModule = {
        generate: sinon.stub().returns(Promise.resolve())
      };
      mockery.registerMock('../../core/themes/css', cssModule);

      this.controller = this.helpers.requireBackend('webserver/controllers/css');
    });

    it('should return a 404 error if the params.app is not defined', function(done) {
      const res = this.helpers.express.jsonResponse(code => {
        expect(code).to.equal(404);
        expect(cssModule.generate).to.not.have.been.called;
        done();
      });

      this.controller.getCss({ params: {} }, res);
    });

    it('should send back the generated css', function(done) {
      const generatedCss = 'foobar';
      const req = { user, params: { app: 'foo' }};
      const res = {
        set: sinon.spy(),
        send: css => {
          expect(css).to.deep.equals(generatedCss);
          expect(cssModule.generate).to.have.been.calledWith(req.params.app, domainId);
          expect(res.set).to.have.been.calledWith('Content-Type', 'text/css');
          done();
        }
      };

      cssModule.generate.returns(Promise.resolve({ css: generatedCss }));

      this.controller.getCss(req, res);
    });

    it('should send a 500 error when CSS generation fails', function(done) {
      const req = { user, params: { app: 'foo' }};
      const res = this.helpers.express.jsonResponse(code => {
        expect(code).to.equal(500);
        expect(cssModule.generate).to.have.been.calledWith(req.params.app, domainId);
        done();
      });

      this.controller.getCss(req, res);
    });
  });
});
