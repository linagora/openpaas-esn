'use strict';

/* global chai: false */
var expect = chai.expect;

describe('GoogleDisplayShell service', function() {
  var notificationFactory;

  beforeEach(function() {

    module('linagora.esn.contact.google', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(GoogleDisplayShell) {
      this.GoogleDisplayShell = GoogleDisplayShell;
    });
  });

  function checkGoogleDisplayShell(displayShell, originalShell) {
    var displayName = originalShell.displayName;

    expect(displayShell.getDefaultAvatar()).to.equal('/contact/images/default_avatar.png');
    expect(displayShell.getDisplayName()).to.equal(displayName);
    expect(displayShell.isWritable()).to.equal(false);
    expect(displayShell.getOverlayIcon()).to.equal('i-contact-google');

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
    expect(displayShell.getDropDownMenu()).to.equal('google-menu-items');
  }

  it('should provide google contact informations for the template to display', function() {
    var shell = {
      displayName: 'Contact Google',
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

    var displayShell = new this.GoogleDisplayShell(shell);

    checkGoogleDisplayShell(displayShell, shell);
  });

});
