'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The Collaboration permission module', function() {

  describe('The filterWritable function', function() {

    beforeEach(function() {
      mockery.registerMock('./index', {});
    });

    it('should fail when collaborations is undefined', function(done) {
      var module = this.helpers.requireBackend('core/collaboration/permission');
      module.filterWritable(null, {}, this.helpers.callbacks.error(done));
    });

    it('should fail when tuple is undefined', function(done) {
      var module = this.helpers.requireBackend('core/collaboration/permission');
      module.filterWritable([], null, this.helpers.callbacks.error(done));
    });

    it('should return only writable collaborations', function(done) {

      var collaborations = [1, 2, 3];
      var user = {objectType: 'user', id: 123456789};
      var module = this.helpers.rewireBackend('core/collaboration/permission');
      module.__set__('canWrite', function(collaboration, tuple, callback) {
        expect(tuple).to.deep.equal(user);
        if (collaboration === 1) {
          return callback(null, false);
        }
        return callback(null, true);
      });
       module.filterWritable(collaborations, user, function(err, result) {
         expect(result.length).to.exist;
         expect(result).to.not.include(collaborations[0]);
         expect(result).to.include(collaborations[1]);
         expect(result).to.include(collaborations[2]);
         done();
       });
    });
  });
});
