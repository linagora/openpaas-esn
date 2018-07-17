'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactAvatarService service', function() {
  var contactAvatarService;
  var ICAL;

  beforeEach(function() {
    module('linagora.esn.contact');
    inject(function(
      _contactAvatarService_,
      _ICAL_
    ) {
      contactAvatarService = _contactAvatarService_;
      ICAL = _ICAL_;
    });
  });

  describe('The forceReloadDefaultAvatar fn', function() {

    it('should append timestamp to default avatar url', function() {
      var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar' };

      contactAvatarService.forceReloadDefaultAvatar(contact);
      expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
    });

    it('should append timestamp parameter correctly', function() {
      var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar?x=1&y=2' };

      contactAvatarService.forceReloadDefaultAvatar(contact);
      expect(contact.photo).to.match(/123\/456\/avatar\?x=1&y=2&t=[0-10]+/);
    });

    it('should update timestamp parameter if exist', function() {
      var photoUrl = 'http://abc.com/contact/api/contacts/123/456/avatar?t=1';
      var contact = { photo: photoUrl };

      contactAvatarService.forceReloadDefaultAvatar(contact);
      expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
      expect(contact.photo).to.not.equal(photoUrl);
    });

    it('should not append timestamp to custom avatar url', function() {
      var avatarUrl = 'http://abc.com/this/is/my/cuties/avatar';
      var contact = { photo: avatarUrl };

      contactAvatarService.forceReloadDefaultAvatar(contact);
      expect(contact.photo).to.equal(avatarUrl);
    });

    it('should update the photo value in vcard', function() {
      var vcard = new ICAL.Component(['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'myuid'],
          ['photo', {}, 'uri', 'http://abc.com/contact/api/contacts/123/456/avatar']
      ]]);
      var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar', vcard: vcard };

      contactAvatarService.forceReloadDefaultAvatar(contact);
      expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
      expect(contact.vcard.getFirstPropertyValue('photo')).to.match(/123\/456\/avatar\?t=[0-10]+/);
    });

  });

  describe('The isTextAvatar fn', function() {

    it('should return true if URL is in form of text avatar', function() {
      var url = 'http://abc.com/contact/api/contacts/123/456/avatar';

      expect(contactAvatarService.isTextAvatar(url)).to.be.true;
    });

    it('should return false if URL is not in form of text avatar', function() {
      var url = 'http://abc.com/contact/api/contacts/123/456/not_text_avatar';

      expect(contactAvatarService.isTextAvatar(url)).to.be.false;
    });

  });

  describe('The injectTextAvatar fn', function() {
    var contact;

    beforeEach(function() {
      var vcard = new ICAL.Component(['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'myuid']
      ]]);

      contact = {
        id: 'contactId',
        vcard: vcard,
        addressbook: {
          bookId: 'bookId',
          bookName: 'bookName'
        }
      };
    });

    it('should update photo value with text avatar url', function() {
      contactAvatarService.injectTextAvatar(contact);
      expect(contact.photo).to.equal('/contact/api/contacts/bookId/bookName/contactId/avatar');
    });

    it('should update photo value in vcard with text avatar url', function() {
      contactAvatarService.injectTextAvatar(contact);
      expect(contact.vcard.getFirstPropertyValue('photo')).to.equal('/contact/api/contacts/bookId/bookName/contactId/avatar');
    });

    it('should do nothing if photo is already present', function() {
      var photo = '/path/to/photo';

      contact.photo = photo;

      contactAvatarService.injectTextAvatar(contact);
      expect(contact.photo).to.equal(photo);
    });

    it('should update photo with avatar url of the source addressbook if addressbook is a subscription', function() {
      contact.addressbook.isSubscription = true;
      contact.addressbook.source = {
        bookId: 'sourceABId',
        bookName: 'sourceABName'
      };

      contactAvatarService.injectTextAvatar(contact);
      expect(contact.photo).to.equal('/contact/api/contacts/sourceABId/sourceABName/contactId/avatar');
    });
  });
});
