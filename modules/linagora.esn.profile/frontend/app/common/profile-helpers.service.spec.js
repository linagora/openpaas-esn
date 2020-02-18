'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The profileController', function() {
  var profileHelpersService, session;
  var user, sessionUserMock;

  beforeEach(function() {
    module('linagora.esn.profile');

    user = {
      _id: '123'
    };
    sessionUserMock = {
      _id: '324'
    };

    inject(function(_session_, _profileHelpersService_) {
      session = _session_;
      profileHelpersService = _profileHelpersService_;

      session.user = sessionUserMock;
    });
  });

  describe('The #isMe method', function() {
    it('should return false if the target user is not the current user', function() {
      expect(profileHelpersService.isMe(user)).to.be.false;
    });

    it('should return true if the target user is the current user', function() {
      sessionUserMock._id = user._id;

      expect(profileHelpersService.isMe(user)).to.be.true;
    });
  });

  describe('The #canEdit method', function() {
    it('should return false if the target user is not the current user', function() {
      session.userIsDomainAdministrator = sinon.stub().returns(false);

      expect(profileHelpersService.canEdit(user)).to.be.false;
      expect(session.userIsDomainAdministrator).to.have.been.calledOnce;
    });

    it('should return true if the target user is the current user', function() {
      sessionUserMock._id = user._id;
      session.userIsDomainAdministrator = sinon.stub().returns(false);

      expect(profileHelpersService.canEdit(user)).to.be.true;
      expect(session.userIsDomainAdministrator).to.not.have.been.calledOnce;
    });

    it('should return true if the current user is domain administrator', function() {
      session.userIsDomainAdministrator = sinon.stub().returns(true);

      expect(profileHelpersService.canEdit(user)).to.be.true;
      expect(session.userIsDomainAdministrator).to.have.been.calledOnce;
    });
  });
});
