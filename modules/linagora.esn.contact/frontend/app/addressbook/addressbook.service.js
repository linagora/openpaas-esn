(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(
    $rootScope,
    $q,
    $window,
    $log,
    _,
    session,
    esnUserConfigurationService,
    contactAddressbookParser,
    ContactAPIClient,
    contactAddressbookDisplayService,
    CONTACT_ADDRESSBOOK_EVENTS,
    CONTACT_ADDRESSBOOK_TYPES,
    CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
    CONTACT_SHARING_INVITE_STATUS,
    CONTACT_SHARING_SUBSCRIPTION_TYPE
  ) {
    var DAVSERVER_CONFIGURATION = 'davserver';

    return {
      createAddressbook: createAddressbook,
      getAddressbookByBookName: getAddressbookByBookName,
      getAddressbookUrl: getAddressbookUrl,
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
        .remove();
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
          var displayname = contactAddressbookDisplayService.buildDisplayName(addressbookShell.source);

          return ContactAPIClient
            .addressbookHome(addressbookShell.bookId)
            .addressbook(addressbookShell.bookName)
            .acceptShare({ displayname: displayname })
            .then(function() {
              addressbookShell.name = displayname;
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
      return ContactAPIClient
        .addressbookHome(addressbookShell.bookId)
        .addressbook(addressbookShell.bookName)
        .share(sharees);
    }

    function updateAddressbookPublicRight(addressbook, publicRight) {
      return ContactAPIClient
        .addressbookHome(addressbook.bookId)
        .addressbook(addressbook.bookName)
        .updatePublicRight(publicRight);
    }

    function getAddressbookUrl(addressbook) {
      return _getFrontendURL().then(function(url) {
        return [url, _sanitizeAddressbookHref(addressbook)]
          .map(function(fragment) {
            return fragment.replace(/^\/|\/$/g, '');
          })
          .join('/');
      });
    }

    function _sanitizeAddressbookHref(addressbook) {
      var parsedPath = contactAddressbookParser.parseAddressbookPath(addressbook.href);

      return ['addressbooks', parsedPath.bookId, parsedPath.bookName].join('/');
    }

    function _getFrontendURL() {
      return esnUserConfigurationService.get([DAVSERVER_CONFIGURATION], 'core')
        .then(function(configurations) {
          if (!configurations || !configurations.length) {
            $log.debug('No valid configurations found for davserver');

            return _getDefaultURL();
          }

          var davserver = _.find(configurations, { name: DAVSERVER_CONFIGURATION });

          if (!davserver) {
            $log.debug('davserver configuration is not set');

            return _getDefaultURL();
          }

          return davserver.value && davserver.value.frontend && davserver.value.frontend.url ? davserver.value.frontend.url : _getDefaultURL();
        }, function(err) {
          $log.debug('Can not get davserver from configuration', err);

          return _getDefaultURL();
        });
    }

    function _getDefaultURL() {
      return $window.location.origin;
    }
  }
})(angular);
