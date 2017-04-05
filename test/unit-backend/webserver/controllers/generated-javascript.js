const expect = require('chai').expect;
const sinon = require('sinon');
const q = require('q');

describe('The generated-javascript controller', function() {

  describe('jsApp() method', function() {
    let core;

    beforeEach(function() {
      core = this.helpers.requireBackend('core');
      sinon.stub(core.assets, 'prepareJsFiles', core.assets.prepareJsFiles);
    });

    it('should call assets.prepareJsFiles', function(done) {
      const ctrl = this.helpers.requireBackend('webserver/controllers/generated-javascript');

      ctrl.jsApp({params: {
        appName: 'testApp',
        namespace: 'm1'
      }}, {type: () => {}, end: () => {
        expect(core.assets.prepareJsFiles).to.have.been.calledWith('jsApp', 'testApp', 'm1');
        done();
      }});

    });

    it('should set content-type to application/javascript', function(done) {
      const ctrl = this.helpers.requireBackend('webserver/controllers/generated-javascript');

      ctrl.jsApp({params: {
        appName: 'testApp',
        namespace: 'm1'
      }}, {type: type => {
        expect(type).to.equal('application/javascript');
        done();
      }, end: () => {}});

    });

    it('should call assets.prepareJsFiles only once', function(done) {
      const ctrl = this.helpers.requireBackend('webserver/controllers/generated-javascript');
      const req = {params: {
        appName: 'testApp',
        namespace: 'm1'
      }};

      ctrl.jsApp(req, {type: () => {}, end: () => {
        ctrl.jsApp(req, {type: () => {}, end: () => {
          expect(core.assets.prepareJsFiles).to.have.callCount(1);
          done();
        }});
      }});

    });

    it('should send back a 500 code if something fails', function(done) {
      core.assets.prepareJsFiles.restore();
      sinon.stub(core.assets, 'prepareJsFiles', function() {
        return q.reject(new Error('err'));
      });
      const ctrl = this.helpers.requireBackend('webserver/controllers/generated-javascript');
      const req = {params: {
        appName: 'testApp',
        namespace: 'm1'
      }};

      ctrl.jsApp(req, {status: code => {
        expect(code).to.equal(500);
        done();

        return {
          end: () => {}
        };
      }});

    });
  });

});
