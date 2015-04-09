'use strict';

describe('Simple digest weight processor', function() {

  describe('The computeMessageWeightInCollaboration fn', function(done) {
    it('should return a promise', function() {
      var module = this.helpers.requireBackend('core/digest/weight/simple');
      module.computeMessageWeightInCollaboration({}, {}).then(done);
    });
  });

  describe('The computeMessageWeightInCollaboration fn', function(done) {
    it('should return a promise', function() {
      var module = this.helpers.requireBackend('core/digest/weight/simple');
      module.computeMessageWeightInCollaboration({}, {}).then(done);
    });
  });
});
