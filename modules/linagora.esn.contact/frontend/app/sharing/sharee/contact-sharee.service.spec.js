'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactSharee service', function() {
  var $q, $rootScope;
  var ContactSharee, contactAddressbookParser, userAPI, userUtils;
  var jsonData;
  var CONTACT_SHARING_INVITE_STATUS;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$q_,
    _$rootScope_,
    _$controller_,
    _userAPI_,
    _userUtils_,
    _contactAddressbookParser_,
    _ContactSharee_,
    _CONTACT_SHARING_INVITE_STATUS_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    userAPI = _userAPI_;
    userUtils = _userUtils_;
    contactAddressbookParser = _contactAddressbookParser_;
    ContactSharee = _ContactSharee_;
    CONTACT_SHARING_INVITE_STATUS = _CONTACT_SHARING_INVITE_STATUS_;

    jsonData = {
      access: 3,
      href: 'mailto:example@example.com',
      inviteStatus: 1,
      userId: '123'
    };
  }));

  describe('ContactSharee constructor', function() {
    it('should throw error if there is no href', function() {
      delete jsonData.href;

      try {
        new ContactSharee(jsonData);
      } catch (error) {
        expect(error.message).to.equal('href cannot be null');
      }
    });

    it('should throw error if access is undefined', function() {
      delete jsonData.access;

      try {
        new ContactSharee(jsonData);
      } catch (error) {
        expect(error.message).to.equal('access cannot be null');
      }
    });

    it('should throw error if inviteStatus is undefined', function() {
      delete jsonData.inviteStatus;

      try {
        new ContactSharee(jsonData);
      } catch (error) {
        expect(error.message).to.equal('inviteStatus cannot be null');
      }
    });

    it('should throw error if userId is undefined', function() {
      delete jsonData.userId;

      try {
        new ContactSharee(jsonData);
      } catch (error) {
        expect(error.message).to.equal('userId cannot be null');
      }
    });
  });

  describe('The getUser function', function() {
    it('should get user data if there is no user data in ContactSharree', function() {
      userAPI.user = sinon.stub().returns($q.when({
        data: {
          preferredEmail: 'toto@example.com'
        }
      }));
      userUtils.displayNameOf = sinon.stub().returns('displayName');

      var sharee = new ContactSharee(jsonData);

      sharee.getUser();
      $rootScope.$digest();

      expect(userAPI.user).to.have.been.calledWith(sharee.userId);
      expect(userUtils.displayNameOf).to.have.been.called;
      expect(sharee.user).to.deep.equal({
        id: sharee.userId,
        displayName: 'displayName',
        email: 'toto@example.com'
      });
    });

    it('should return user data if there is already user data on sharee object', function(done) {
      userAPI.user = sinon.spy();
      jsonData.user = { id: '222' };

      var sharee = new ContactSharee(jsonData);

      sharee.getUser().then(function(user) {
        expect(user).to.deep.equal(jsonData.user);
        expect(userAPI.user).to.not.have.been.called;
        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('The fromSharee function', function() {
    it('should create a ContactSharree object from sharee information', function() {
      contactAddressbookParser.parsePrincipalPath = sinon.stub().returns({ id: '58e66c5bd69a39451f57c819' });
      var shareeInfo = {
        href: 'mailto:user1@example.com',
        access: 3,
        inviteStatus: 1,
        principal: 'principals/users/58e66c5bd69a39451f57c819'
      };
      var sharee = ContactSharee.fromSharee(shareeInfo);

      expect(sharee.href).to.equal(shareeInfo.href);
      expect(sharee.access).to.equal(shareeInfo.access);
      expect(sharee.inviteStatus).to.equal(shareeInfo.inviteStatus);
      expect(sharee.userId).to.equal('58e66c5bd69a39451f57c819');
      expect(contactAddressbookParser.parsePrincipalPath).to.have.been.calledWith(shareeInfo.principal);
    });
  });

  describe('The fromUser function', function() {
    it('should create a ContactSharree object from user and access right code', function() {
      userUtils.displayNameOf = sinon.stub().returns('toto');
      var user = {
        _id: '58e66c5bd69a39451f57c819',
        preferredEmail: 'toto@example.com'
      };
      var sharee = ContactSharee.fromUser(user, 3);

      expect(sharee.href).to.equal('mailto:' + user.preferredEmail);
      expect(sharee.access).to.equal(3);
      expect(sharee.inviteStatus).to.equal(CONTACT_SHARING_INVITE_STATUS.NORESPONSE);
      expect(sharee.userId).to.equal(user._id);
      expect(sharee.user).to.deep.equal({
        id: user._id,
        displayName: 'toto',
        email: user.preferredEmail
      });
      expect(userUtils.displayNameOf).to.have.been.calledWith(user);
    });

    it('should create a ContactSharree object from user which has email but not preferredEmail', function() {
      userUtils.displayNameOf = sinon.stub().returns('toto');
      var user = {
        _id: '58e66c5bd69a39451f57c819',
        email: 'toto@example.com'
      };
      var sharee = ContactSharee.fromUser(user, 3);

      expect(sharee.href).to.equal('mailto:' + user.email);
      expect(sharee.access).to.equal(3);
      expect(sharee.inviteStatus).to.equal(CONTACT_SHARING_INVITE_STATUS.NORESPONSE);
      expect(sharee.userId).to.equal(user._id);
      expect(sharee.user).to.deep.equal({
        id: user._id,
        displayName: 'toto',
        email: user.email
      });
      expect(userUtils.displayNameOf).to.have.been.calledWith(user);
    });
  });
});
