'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The events listener module', function() {

  var deps;

  beforeEach(function() {
    deps = {
      logger: {
        error: function() {},
        debug: function() {},
        info: function() {},
        warning: function() {}
      }
    };
  });

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The register function', function() {

    it('should add a listener into ES', function(done) {

      deps.elasticsearch = {
        listeners: {
          addListener: function(options) {
            expect(options.events.add).to.exist;
            expect(options.events.update).to.exist;
            expect(options.events.remove).to.exist;
            expect(options.denormalize).to.be.a.function;
            expect(options.getId).to.be.a.function;
            expect(options.type).to.exist;
            expect(options.index).to.exist;
            done();
          }
        }
      };

      var module = require('../../../../backend/lib/search/searchHandler')(dependencies);

      module.register();
    });

    it('should return addListener result', function() {
      var result = {foo: 'bar'};

      deps.elasticsearch = {
        listeners: {
          addListener: function() {
            return result;
          }
        }
      };
      expect(require('../../../../backend/lib/search/searchHandler')(dependencies).register()).to.deep.equal(result);
    });
  });
});
