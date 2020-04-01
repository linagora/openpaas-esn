'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The user domain core module', function() {

  describe('The joinDomain function', function() {

    var model;

    beforeEach(function() {
      model = {
        findOneAndUpdate: function() {}
      };
      mockery.registerMock('mongoose', {model: function() {
        return model;
      }});
    });

    it('should fail if user is undefined', function(done) {
      var module = this.helpers.requireBackend('core/user/domain');

      module.joinDomain(null, {}, function(err) {
        expect(err.message).to.match(/User must not be null/);
        done();
      });
    });

    it('should fail if domain is undefined', function(done) {
      var module = this.helpers.requireBackend('core/user/domain');

      module.joinDomain({}, null, function(err) {
        expect(err.message).to.match(/Domain must not be null/);
        done();
      });
    });

    it('should send back error when user is already in domain', function(done) {
      var id = 1;
      var user = {domains: [{domain_id: id}]};
      var module = this.helpers.requireBackend('core/user/domain');

      module.joinDomain(user, id, function(err) {
        expect(err.message).to.match(/User is already in domain/);
        done();
      });
    });

    it('should call model.findOneAndUpdate', function(done) {
      var id = 2;
      var userId = 1;
      var user = {
        _id: userId,
        domains: []
      };

      model.findOneAndUpdate = function(query, update) {
        expect(query).to.deep.equal({_id: userId});
        expect(update).to.deep.equal({$push: {domains: {domain_id: id}}});
        done();
      };

      var module = this.helpers.requireBackend('core/user/domain');

      module.joinDomain(user, id);
    });

    it('should emit a notification in the pubsub channel', function(done) {
      var CONSTANTS = require('../../../../backend/core/user/constants');

      mockery.registerMock('../../core/pubsub', {
        local: {
          topic: function(name) {
            expect(name).to.equal(CONSTANTS.EVENTS.userUpdated);

            return {
              publish: function(user) {
                expect(user.domains.length).to.equal(1);
              }
            };
          }
        }
      });

      var id = 2;
      var user = {
        domains: []
      };

      model.findOneAndUpdate = function(query, update, options, callback) {
        user.domains.push({domain_id: id});

        return callback(null, user);
      };

      var module = this.helpers.requireBackend('core/user/domain');

      module.joinDomain(user, id, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        done();
      });
    });
  });

  describe('The isMemberOfDomain function', function() {

    beforeEach(function() {
      mockery.registerMock('mongoose', {model: function() {}});
    });

    it('should throw error when calling isMemberOfDomain with null user', function(done) {
      var module = this.helpers.requireBackend('core/user/domain');

      try {
        module.isMemberOfDomain(null, {});
        done(new Error());
      } catch (err) {
        expect(err.message).to.match(/User must not be null/);
        done();
      }
    });

    it('should return error when calling isMemberOfDomain with null domain', function(done) {
      var module = this.helpers.requireBackend('core/user/domain');

      try {
        module.isMemberOfDomain({}, null);
        done(new Error());
      } catch (err) {
        expect(err.message).to.match(/Domain must not be null/);
        done();
      }
    });

    it('should return false when user object hasn\'t domains array', function() {
      var user = {};
      var id = 1;
      var module = this.helpers.requireBackend('core/user/domain');

      expect(module.isMemberOfDomain(user, id)).to.be.false;
    });

    it('should return false when user does not belongs to domain', function() {
      var user = {domains: []};
      var id = 1;
      var module = this.helpers.requireBackend('core/user/domain');

      expect(module.isMemberOfDomain(user, id)).to.be.false;
    });

    it('should true when user belongs to domain', function() {
      var id = 1;
      var domain = {_id: 1, domain_id: {equals: function() {return true;}}};
      var user = {domains: [domain]};
      var module = this.helpers.requireBackend('core/user/domain');

      expect(module.isMemberOfDomain(user, id)).to.be.true;
    });
  });

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
