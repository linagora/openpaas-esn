'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('ContactShell Helpers', function() {

  var BOOK_ID = '123456789';
  var BOOK_NAME = 'contacts';
  var CARD_ID = 'mycardid';

  function getHref() {
    return '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '/' + CARD_ID + '.vcf';
  }

  describe('The ContactShellHelper service', function() {

    beforeEach(function() {
      module('linagora.esn.contact');
    });

    beforeEach(function() {
      angular.mock.inject(function(ContactShellHelper) {
        this.ContactShellHelper = ContactShellHelper;
      });
    });

    describe('The getMetadata function', function() {
      it('should return undefined in shell is undefined', function() {
        expect(this.ContactShellHelper.getMetadata()).to.not.be.defined;
      });

      it('should return valid informations when href is set', function() {
        expect(this.ContactShellHelper.getMetadata(getHref())).to.deep.equals({
          cardId: CARD_ID,
          bookId: BOOK_ID,
          bookName: BOOK_NAME
        });
      });
    });
  });

  describe('The ContactShellDisplayBuilder service', function() {

    var DisplayShellProvider = {};

    beforeEach(function() {
      module('linagora.esn.contact', function($provide) {
        $provide.value('DisplayShellProvider', DisplayShellProvider);
      });
    });

    beforeEach(function() {
      angular.mock.inject(function(ContactShellDisplayBuilder) {
        this.ContactShellDisplayBuilder = ContactShellDisplayBuilder;
      });
    });

    describe('The build function', function() {
      it('should call the DisplayShell.toDisplayShell function', function() {
        var spy = sinon.spy();
        DisplayShellProvider.toDisplayShell = spy;
        this.ContactShellDisplayBuilder.build({});
        expect(spy).to.have.been.called.once;
      });
    });
  });
});

describe('The ContactHighLightHelper service', function() {
  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    angular.mock.inject(function(ContactHighLightHelper) {
      this.ContactHighLightHelper = ContactHighLightHelper;
    });
  });

  it('should return index = -1 when not matching with query', function() {
    var contact = {nickname: '', notes: '', orgName: '', orgRole: '', addresses: [], social: [], birthday: '', tags: [], urls: []};
    var query = 'q';

    contact.notes = 'comments';
    expect(contact.notes.toLowerCase().indexOf(query) > -1).to.be.not.ok;

    contact.addresses = [{type: 'Home', street: 's', city: 'c', zip: '02', country: 'co'}];
    for (var i = 0; i < contact.addresses.length; i++) {
      expect((contact.addresses[i].street + contact.addresses[i].city + contact.addresses[i].country + contact.addresses[i].zip).toLowerCase().indexOf(query)).to.equals(-1);
    }

    contact.social = [{type: 'twitter', value: '@some social'}];
    for (var j = 0; j < contact.social.length; j++) {
      expect(contact.social[j].value.toLowerCase().indexOf(query)).to.equals(-1);
    }

    contact.tags = [{text: 'tags'}];
    for (var k = 0; k < contact.tags.length; k++) {
      expect(contact.tags[k].text.toLowerCase().indexOf(query)).to.equals(-1);
    }
  });

  it('should return index > -1 when matching with query', function() {
    var contact = {nickname: '', notes: '', orgName: '', orgRole: '', addresses: [], social: [], birthday: '', tags: [], urls: []};
    var query = 's';

    contact.notes = 'comments';
    expect(contact.notes.toLowerCase().indexOf(query) > -1).to.be.ok;

    contact.addresses = [{type: 'Home', street: 's', city: 'c', zip: '02', country: 'co'}];

    for (var i = 0; i < contact.addresses.length; i++) {
      var str = contact.addresses[i].street + ' ' + contact.addresses[i].city + ' ' + contact.addresses[i].country + ' ' + contact.addresses[i].zip + i;
      expect(str.toLowerCase().indexOf(query)).to.equals(0);
    }

    contact.social = [{type: 'twitter', value: '@some social'}];
    for (var j = 0; j < contact.social.length; j++) {
      expect(contact.social[j].value.toLowerCase().indexOf(query)).to.equals(1);
    }

    contact.tags = [{text: 'tags'}];
    for (var k = 0; k < contact.tags.length; k++) {
      expect(contact.tags[k].text.toLowerCase().indexOf(query)).to.equals(3);
    }
  });
});
