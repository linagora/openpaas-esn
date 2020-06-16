'use strict';

/* global chai: false */
var expect = chai.expect;

describe('ContactDisplayShell', function() {
  var notificationFactory;
  var ContactDisplayShell;

  beforeEach(function() {

    notificationFactory = {};
    ContactDisplayShell = null;

    module('linagora.esn.contact', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  function injectServices() {
    angular.mock.inject(function(_ContactDisplayShell_) {
      ContactDisplayShell = _ContactDisplayShell_;
    });
  }

  function checkContactDisplayShell(displayShell, originalShell) {
    var displayName = originalShell.displayName;

    expect(displayShell.getDefaultAvatar()).to.equal('/contact/images/default_avatar.png');
    expect(displayShell.getDisplayName()).to.equal(displayName);
    expect(displayShell.isWritable()).to.equal(false);
    expect(displayShell.getOverlayIcon()).to.deep.equal('ng-hide');
    expect(displayShell.getInformationsToDisplay()).to.deep.equal([
      {
        objectType: 'email',
        id: originalShell.emails[0].value,
        icon: 'mdi-email-outline',
        action: 'mailto:' + originalShell.emails[0].value
      },
      {
        objectType: 'phone',
        id: originalShell.tel[0].value,
        icon: 'mdi-phone',
        action: 'tel:' + originalShell.tel[0].value
      }]);
    expect(displayShell.getDropDownMenu()).to.equal('default-menu-items');
  }

  describe('The constructor', function() {
    beforeEach(injectServices);

    it('should set the addressbook when defined', function() {
      var ab = {foo: 'bar'};
      expect(new ContactDisplayShell({addressbook: ab}).addressbook).to.deep.equal(ab);
    });

    it('should provide contact default contact informations for the template to display', function() {
      var shell = {
        displayName: 'Contact OpenPaas',
        emails: [
          {
            type: 'work',
            value: 'perso@linagora.com'
          }
        ],
        tel: [
          {
            type: 'work',
            value: '01.02.03.04.05'
          }
        ]
      };

      var displayShell = new ContactDisplayShell(shell);

      checkContactDisplayShell(displayShell, shell);
    });

    it('should provide email and telephone number from work', function() {
      var shell = {
        displayName: 'Contact OpenPaas',
        emails: [
          {
            type: 'home',
            value: 'perso@home.com'
          },
          {
            type: 'work',
            value: 'perso@linagora.com'
          }
        ],
        tel: [
          {
            type: 'home',
            value: '06.07.08.09.10'
          },
          {
            type: 'work',
            value: '01.02.03.04.05'
          }
        ]
      };

      var displayShell = new ContactDisplayShell(shell);

      expect(displayShell.getInformationsToDisplay()).to.deep.equal([
        {
          objectType: 'email',
          id: 'perso@linagora.com',
          icon: 'mdi-email-outline',
          action: 'mailto:perso@linagora.com'
        },
        {
          objectType: 'phone',
          id: '01.02.03.04.05',
          icon: 'mdi-phone',
          action: 'tel:01.02.03.04.05'
        }]);
    });

    it('should add default type of tel is \'other\' when there is no type', function() {
      var shell = {
        displayName: 'Contact OpenPaas',
        tel: [
          {
            value: '01.02.03.04.05'
          }
        ]
      };

      var displayShell = new ContactDisplayShell(shell);

      expect(displayShell.shell.tel).to.deep.equal([
        {
          type: 'other',
          value: '01.02.03.04.05'
        }]);
    });

    it('should add default type of email is \'other\' when there is no type', function() {
      var shell = {
        displayName: 'Contact OpenPaas',
        emails: [
          {
            value: 'foo@lng.org'
          }
        ]
      };

      var displayShell = new ContactDisplayShell(shell);

      expect(displayShell.shell.emails).to.deep.equal([{
        type: 'Other',
        value: 'foo@lng.org'
      }]);
    });
  });

  describe('The getAvatar fn', function() {
    var contactAvatarService = {};
    var urlUtils = {};

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('contactAvatarService', contactAvatarService);
        $provide.value('urlUtils', urlUtils);
      });
    });

    it('should return approximate text avatar based on input size', function(done) {
      contactAvatarService.isTextAvatar = function() {
        return true;
      };

      var shell = {
        displayName: 'Contact OpenPaas',
        photo: 'http://linagora.com/user/text_avatar.png'
      };

      urlUtils.updateUrlParameter = function(url, key, value) {
        expect(url).to.equal(shell.photo);
        expect(key).to.equal('size');
        expect(value).to.equal(256);
        done();
      };

      injectServices();

      var displayShell = new ContactDisplayShell(shell);
      displayShell.getAvatar(256);
    });

    it('should return original avatar if it is not text avatar', function(done) {
      contactAvatarService.isTextAvatar = function() {
        return false;
      };

      var shell = {
        displayName: 'Contact OpenPaas',
        photo: 'http://linagora.com/user/avatar.png'
      };

      urlUtils.updateUrlParameter = function() {
        done(new Error('should not call this function'));
      };

      injectServices();

      var displayShell = new ContactDisplayShell(shell);
      expect(displayShell.getAvatar(256)).to.equal(shell.photo);
      done();
    });

    it('should return default avatar if contact has no avatar', function() {
      var CONTACT_DEFAULT_AVATAR = 'http://linagora.com/user/default_avatar.png';
      contactAvatarService.isTextAvatar = function() {
        return false;
      };
      angular.mock.module(function($provide) {
        $provide.constant('CONTACT_DEFAULT_AVATAR', CONTACT_DEFAULT_AVATAR);
      });

      var shell = {
        displayName: 'Contact OpenPaas'
      };

      injectServices();

      var displayShell = new ContactDisplayShell(shell);
      expect(displayShell.getAvatar(256)).to.equal(CONTACT_DEFAULT_AVATAR);
    });

  });

  describe('The isWritable fn', function() {
    var urlUtils = {};

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('urlUtils', urlUtils);
      });
    });

    beforeEach(injectServices);

    it('should return false when addressbook is not defined', function() {
      var displayShell = new ContactDisplayShell({});
      expect(displayShell.isWritable()).to.be.false;
    });

    it('should return false when addressbook is not editable', function() {
      var displayShell = new ContactDisplayShell({addressbook: {editable: false}});
      expect(displayShell.isWritable()).to.be.false;
    });

    it('should return false when addressbook is editable', function() {
      var displayShell = new ContactDisplayShell({addressbook: {editable: true}});
      expect(displayShell.isWritable()).to.be.true;
    });
  });
});
