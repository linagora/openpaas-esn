'use strict';

/* global chai: false */

var expect = chai.expect;

describe('userUtils service', function() {
  var userUtils;

  beforeEach(function() {
    module('esn.user');

    inject(function(_userUtils_) {
      userUtils = _userUtils_;
    });
  });

  describe('displayNameOf() method', function() {
    it('should return prerferredEmail if both firstname and lastname do not exist', function() {
      var user = { preferredEmail: 'email' };

      expect(userUtils.displayNameOf(user)).to.equal(user.preferredEmail);
    });

    it('should return firstname if lastname does not exist', function() {
      var user = { firstname: 'f', preferredEmail: 'email' };

      expect(userUtils.displayNameOf(user)).to.equal('f');
    });

    it('should return lastname if firstname does not exist', function() {
      var user = { lastname: 'l', preferredEmail: 'email' };

      expect(userUtils.displayNameOf(user)).to.equal('l');
    });

    it('should return firstname lastname if both exist', function() {
      var user = { firstname: 'f', lastname: 'l', preferredEmail: 'email' };

      expect(userUtils.displayNameOf(user)).to.equal('f l');
    });
  });
});
