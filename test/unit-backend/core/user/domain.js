'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The user domain core module', function() {

  describe('The getUserDomains fn', function() {
    it('should send back error when user is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});
      var module = this.helpers.requireBackend('core/user/domain');
      module.getUserDomains(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when mongoose#User fails', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                populate: function() {
                  return {
                    exec: function(callback) {
                      return callback(new Error());
                    }
                  };
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var module = this.helpers.requireBackend('core/user/domain');
      module.getUserDomains({_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back nothing when mongoose#User does not send back result', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                populate: function() {
                  return {
                    exec: function(callback) {
                      return callback();
                    }
                  };
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var module = this.helpers.requireBackend('core/user/domain');
      module.getUserDomains({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
        done();
      });
    });

    it('should send back nothing when mongoose#User does not send back result.domains', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                populate: function() {
                  return {
                    exec: function(callback) {
                      return callback(null, {});
                    }
                  };
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var module = this.helpers.requireBackend('core/user/domain');
      module.getUserDomains({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
        done();
      });
    });

    it('should send back domains when mongoose#User send back result.domains', function(done) {
      var mongoose = {
        model: function() {
          return {
            findById: function() {
              return {
                populate: function() {
                  return {
                    exec: function(callback) {
                      return callback(null, {domains: [{domain_id: 123}, {domain_id: 234}]});
                    }
                  };
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongoose);

      var module = this.helpers.requireBackend('core/user/domain');
      module.getUserDomains({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(2);
        done();
      });
    });
  });
});
