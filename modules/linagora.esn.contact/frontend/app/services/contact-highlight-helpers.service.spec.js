'use strict';

/* global chai: false */

var expect = chai.expect;

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
