(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(
    $rootScope,
    $q,
    session,
    ContactAPIClient,
    contactAddressbookDisplayService,
    CONTACT_ADDRESSBOOK_EVENTS,
    CONTACT_ADDRESSBOOK_TYPES,
    CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
    CONTACT_SHARING_INVITE_STATUS,
    CONTACT_SHARING_SUBSCRIPTION_TYPE
  ) {
    return {
      createAddressbook: createAddressbook,
      getAddressbookByBookName: getAddressbookByBookName,
      listAddressbooks: listAddressbooks,
      listAddressbooksUserCanCreateContact: listAddressbooksUserCanCreateContact,
      removeAddressbook: removeAddressbook,
      updateAddressbook: updateAddressbook,
      listSubscribableAddressbooks: listSubscribableAddressbooks,
      listSubscribedAddressbooks: listSubscribedAddressbooks,
      subscribeAddressbooks: subscribeAddressbooks,
      shareAddressbook: shareAddressbook,
      updateAddressbookPublicRight: updateAddressbookPublicRight
    };

    function getAddressbookByBookName(bookName) {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook(bookName).get();
    }

    function listAddressbooks() {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook().list({
        personal: true,
        subscribed: true,
        shared: true,
        inviteStatus: CONTACT_SHARING_INVITE_STATUS.ACCEPTED
      });
    }

    function listAddressbooksUserCanCreateContact() {
      return listAddressbooks().then(function(addressbooks) {
        return addressbooks.filter(function(addressbook) {
          return addressbook.canCreateContact;
        });
      });
    }

    function createAddressbook(addressbook) {
      if (!addressbook) {
        return $q.reject(new Error('Address book is required'));
      }

      if (!addressbook.name) {
        return $q.reject(new Error('Address book\'s name is required'));
      }

      addressbook.type = CONTACT_ADDRESSBOOK_TYPES.user;

      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook()
        .create(addressbook)
        .then(function(createdAddressbook) {
          $rootScope.$broadcast(
            CONTACT_ADDRESSBOOK_EVENTS.CREATED,
            createdAddressbook
          );
        });
    }

    function removeAddressbook(addressbook) {
      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .remove()
        .then(function() {
          $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, addressbook);
        });
    }

    function updateAddressbook(addressbook) {
      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .update(addressbook)
        .then(function() {
          $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, addressbook);
        });
    }

    function listSubscribableAddressbooks(userId) {
      return $q.all([
        ContactAPIClient.addressbookHome(userId).addressbook().list({ public: true }),
        ContactAPIClient.addressbookHome(session.user._id).addressbook().list({
          inviteStatus: CONTACT_SHARING_INVITE_STATUS.NORESPONSE,
          shared: true, shareOwner: userId
        })
      ])
      .then(function(data) {
        return data[0].concat(data[1]);
      });
    }

    function listSubscribedAddressbooks() {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook().list({ subscribed: true });
    }

    function subscribeAddressbooks(addressbookShells) {
      return $q.all(addressbookShells.map(function(addressbookShell) {
        if (addressbookShell.subscriptionType === CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation) {
          return ContactAPIClient
            .addressbookHome(addressbookShell.bookId)
            .addressbook(addressbookShell.bookName)
            .acceptShare()
            .then(function() {
              $rootScope.$broadcast(
                CONTACT_ADDRESSBOOK_EVENTS.CREATED,
                addressbookShell
              );
            });
        }

        var formattedSubscriptions = {
          description: addressbookShell.description,
          name: contactAddressbookDisplayService.buildDisplayName(addressbookShell),
          type: CONTACT_ADDRESSBOOK_TYPES.subscription,
          'openpaas:source': {
            _links: {
              self: {
                href: addressbookShell.href
              }
            }
          }
        };

        return ContactAPIClient
          .addressbookHome(session.user._id)
          .addressbook()
          .create(formattedSubscriptions)
          .then(function(createdAddressbook) {
            $rootScope.$broadcast(
              CONTACT_ADDRESSBOOK_EVENTS.CREATED,
              createdAddressbook
            );
          });
      }));
    }

    function shareAddressbook(addressbookShell, sharees) {
      if (addressbookShell.isSubscription) {
        addressbookShell = addressbookShell.source;
      }

      return ContactAPIClient
        .addressbookHome(addressbookShell.bookId)
        .addressbook(addressbookShell.bookName)
        .share(sharees);
    }

    function updateAddressbookPublicRight(addressbook, publicRight) {
      var formatedPublicRight = publicRight ? [
        {
          principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
          privilege: publicRight
        }
      ] : [];

      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .updatePublicRight(formatedPublicRight);
    }
  }
})(angular);
