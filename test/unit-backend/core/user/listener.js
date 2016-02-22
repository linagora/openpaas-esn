'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The user listener module', function() {

  describe('The register function', function() {

    it('should add a listener into ES', function() {
      mockery.registerMock('../elasticsearch/listeners', {
        addListener: function(options) {
          expect(options.events.add).to.exist;
          expect(options.events.update).to.exist;
          expect(options.events.remove).to.exist;
          expect(options.denormalize).to.be.a.function;
          expect(options.type).to.exist;
          expect(options.index).to.exist;
        }
      });
      mockery.registerMock('./search', {
        denormalize: function() {}
      });
      this.helpers.rewireBackend('core/user/listener').register();
    });
  });
});
