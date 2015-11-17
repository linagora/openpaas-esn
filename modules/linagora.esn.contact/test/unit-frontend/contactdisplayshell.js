'use strict';

/* global chai: false */
var expect = chai.expect;

describe('ContactDisplayShell', function() {
  var notificationFactory;

  beforeEach(function() {

    notificationFactory = {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(ContactDisplayShell) {
      this.ContactDisplayShell = ContactDisplayShell;
    });
  });

  function checkContactDisplayShell(displayShell, originalShell) {
    var displayName = originalShell.displayName;

    expect(displayShell.getDefaultAvatar()).to.equal('/contact/images/default_avatar.png');
    expect(displayShell.getDisplayName()).to.equal(displayName);
    expect(displayShell.isWritable()).to.equal(true);
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

    var displayShell = new this.ContactDisplayShell(shell);

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

    var displayShell = new this.ContactDisplayShell(shell);

    expect(displayShell.getInformationsToDisplay()).to.deep.equal([
      {
        objectType: 'email',
        id: 'perso@linagora.com',
        icon: 'mdi-email-outline',
        action: 'mailto:' + 'perso@linagora.com'
      },
      {
        objectType: 'phone',
        id: '01.02.03.04.05',
        icon: 'mdi-phone',
        action: 'tel:' + '01.02.03.04.05'
      }]);
  });
});
