(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAvatarService', contactAvatarService);

  function contactAvatarService() {

    return {
      forceReloadDefaultAvatar: forceReloadDefaultAvatar,
      isTextAvatar: isTextAvatar,
      injectTextAvatar: injectTextAvatar
    };

    function forceReloadDefaultAvatar(contact) {
      if (contact && contact.photo && isTextAvatar(contact.photo)) {
        var timestampParameter = 't=' + Date.now();

        if (/t=[0-9]+/.test(contact.photo)) { // check existing timestampParameter
          contact.photo = contact.photo.replace(/t=[0-9]+/, timestampParameter);
        } else if (/\?(.*?=.*?)+$/.test(contact.photo)) { // check existing parameters
          contact.photo += '&' + timestampParameter;
        } else {
          contact.photo += '?' + timestampParameter;
        }
        if (contact.vcard) {
          contact.vcard.updatePropertyWithValue('photo', contact.photo);
        }

      }
    }

    function isTextAvatar(avatarUrl) {
      return /\/contact\/api\/contacts\/.*?\/avatar/.test(avatarUrl);
    }

    function injectTextAvatar(contact) {
      if (!contact.photo) {
        if (contact.addressbook.isSubscription) {
          contact.photo = buildTextAvatarUrl(contact.addressbook.source.bookId, contact.addressbook.source.bookName, contact.id);
        } else {
          contact.photo = buildTextAvatarUrl(contact.addressbook.bookId, contact.addressbook.bookName, contact.id);
        }

        if (contact.vcard) {
          contact.vcard.updatePropertyWithValue('photo', contact.photo);
        }
      }
    }

    function buildTextAvatarUrl(bookId, bookName, contactId) {
      return [
        '/contact/api/contacts',
        bookId,
        bookName,
        contactId,
        'avatar'
      ].join('/');
    }
  }
})(angular);
