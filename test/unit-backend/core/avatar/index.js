'use strict';

var expect = require('chai').expect;

describe('The core avatar module', function() {

  beforeEach(function() {
    this.avatarModule = this.helpers.requireBackend('core/avatar');
  });

  describe('getAvatarFromEmail() method', function() {
    var email = 'user@domain';

    it('should return an error if a provider throws one', function(done) {
      this.avatarModule.registerProvider('1', {
        findByEmail: function(email, callback) {
          callback(null, null);
        }
      });
      this.avatarModule.registerProvider('2', {
        findByEmail: function(email, callback) {
          callback(new Error());
        }
      });

      this.avatarModule.getAvatarFromEmail(email, function(err, o, f) {
        expect(err).to.exist;
        expect(o).to.not.exist;
        expect(f).to.not.exist;
        done();
      });
    });

    it('should return nothing if no provider finds anything', function(done) {
      this.avatarModule.registerProvider('1', {
        findByEmail: function(email, callback) {
          callback(null, null);
        }
      });
      this.avatarModule.registerProvider('2', {
        findByEmail: function(email, callback) {
          callback(null, null);
        }
      });

      this.avatarModule.getAvatarFromEmail(email, function(err, o, f) {
        expect(err).to.not.exist;
        expect(o).to.not.exist;
        expect(f).to.not.exist;
        done();
      });
    });

    it('should call callback with the first provider finding for the given email', function(done) {
      var object = {_id: 'object1'};
      var getAvatar = 'testObject';

      this.avatarModule.registerProvider('1', {
        findByEmail: function(email, callback) {
          callback(null, null);
        }
      });
      this.avatarModule.registerProvider('2', {
        findByEmail: function(email, callback) {
          callback(null, object);
        },
        getAvatar: getAvatar
      });
      this.avatarModule.registerProvider('3', {
        findByEmail: function(email, callback) {
          callback(null, {_id: 'object2'});
        }
      });

      this.avatarModule.getAvatarFromEmail(email, function(err, o, f) {
        expect(err).to.not.exist;
        expect(o).to.deep.equal(object);
        expect(f).to.deep.equal(f);
        done();
      });
    });

  });

});
