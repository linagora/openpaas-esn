'use strict';

var chai = require('chai'),
  expect = chai.expect;

describe('The ldap-based authentication module', function() {
  it('should translate profile into user with mailAlias array', function(done) {
    var profile = {
      mailAlias: ['foo@foo.com', 'bar@bar.com']
    };
    var utils = require('../../../../backend/core/auth/ldap');
    var user = utils.translate(profile);
    expect(user).to.be.not.null;
    expect(user.emails).to.be.not.null;
    expect(user.emails.length).to.equal(2);
    done();
  });

  it('should translate profile into user with mailAlias attribute', function(done) {
    var profile = {
      mailAlias: 'foo@foo.com'
    };
    var utils = require('../../../../backend/core/auth/ldap');
    var user = utils.translate(profile);
    expect(user).to.be.not.null;
    expect(user.emails).to.be.not.null;
    expect(user.emails.length).to.equal(1);
    done();
  });
});

