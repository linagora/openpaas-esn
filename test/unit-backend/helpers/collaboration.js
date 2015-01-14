'use strict';

var expect = require('chai').expect;

describe('Member object', function() {
  var collaboration;

  before(function() {
    collaboration = require(this.testEnv.basePath + '/backend/helpers/collaboration');
  });

  it('should filter a user from password, avatars and login', function(done) {
    var user = {
      _id: 1,
      firstname: 'Me',
      password: '1234',
      avatars: [1, 2, 3],
      login: [4, 5, 6]
    };

    var member = new collaboration.Member(user);
    expect(member).to.exist;
    expect(member._id).to.exist;
    expect(member.firstname).to.exist;
    expect(member.password).to.not.exist;
    expect(member.avatars).to.not.exist;
    expect(member.login).to.not.exist;
    done();
  });

});
