(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')

    .controller('newContactController', function(
      $scope,
      $stateParams,
      $state,
      $q,
      notificationFactory,
      sendContactToBackend,
      gracePeriodService,
      openContactForm,
      sharedContactDataService,
      contactService,
      esnI18nService,
      ContactsHelper,
      DEFAULT_ADDRESSBOOK_NAME
    ) {
      $scope.bookId = $stateParams.bookId;
      $scope.bookName = $stateParams.bookName || DEFAULT_ADDRESSBOOK_NAME;
      $scope.contact = sharedContactDataService.contact;

      $scope.accept = function() {
        $scope.contact.displayName = ContactsHelper.getFormattedName($scope.contact);

        if (!$scope.contact.displayName) {
          notificationFactory.weakError('Contact creation', 'Please fill at least a field');

          return;
        }

        return sendContactToBackend($scope, function() {
          return contactService.createContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.contact)
            .then(null, function(err) {
              notificationFactory.weakError(
                'Contact creation',
                err && err.message || 'The contact cannot be created, please retry later'
              );

              return $q.reject(err);
            });
        }).then(function() {
          $state.go('/contact/show/:bookId/:bookName/:cardId', {
            bookId: $scope.bookId,
            bookName: $scope.bookName,
            cardId: $scope.contact.id
          }, { location: 'replace' });
        }).then(function() {
          return gracePeriodService.askUserForCancel(
            esnI18nService.translate('You have just created a new contact (%s).', $scope.contact.displayName),
            'Cancel it'
          ).promise.then(function(data) {
              if (data.cancelled) {
                contactService.removeContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.contact, { etag: $scope.contact.etag })
                  .then(function() {
                    data.success();
                    openContactForm({
                      bookId: $scope.bookId,
                      bookName: $scope.bookName,
                      contact: $scope.contact,
                      shouldReplaceState: true
                    });
                  }, function(err) {
                    data.error('Cannot cancel contact creation, the contact is created');

                    return $q.reject(err);
                  });
              }
            });
        });
      };

      sharedContactDataService.contact = {};
    })
    .controller('showContactController', function(
      $log,
      $scope,
      $state,
      $timeout,
      $stateParams,
      $window,
      ContactsHelper,
      contactUpdateDataService,
      ContactShellDisplayBuilder,
      deleteContact,
      sharedContactDataService,
      contactDisplayError,
      gracePeriodService,
      contactService,
      CONTACT_AVATAR_SIZE,
      CONTACT_EVENTS
    ) {
      $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
      $scope.bookId = $stateParams.bookId;
      $scope.bookName = $stateParams.bookName;
      $scope.cardId = $stateParams.cardId;
      $scope.contact = {};
      $scope.loaded = false;

      $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
        if (data.id === $scope.cardId && data.addressbook && data.addressbook.bookName !== $scope.bookName) {
          $state.go('/contact/show/:bookId/:bookName/:cardId', {
            bookId: $scope.bookId,
            bookName: data.addressbook.bookName,
            cardId: data.id
          }, { location: 'replace' });
        }
      });

      function isAddressFilled(type) {
        if (!$scope.contact.addresses || !$scope.contact.addresses.length) {
          return false;
        }

        return $scope.contact.addresses.filter(function(address) {
          return address.type.toLowerCase() === type.toLowerCase();
        }).length;
      }

      $scope.fillContactData = function(contact) {
        ContactsHelper.fillScopeContactData($scope, contact);
        $scope.displayShell = ContactShellDisplayBuilder.build(contact);
      };

      $scope.getAddress = function(type) {
        return $scope.contact.addresses.filter(function(address) {
          return address.type.toLowerCase() === type.toLowerCase();
        })[0];
      };

      $scope.edit = function() {
        $state.go('/contact/edit/:bookId/:bookName/:cardId', {
          bookId: $scope.bookId,
          bookName: $scope.bookName,
          cardId: $scope.cardId
        }, { location: 'replace' });
      };

      $scope.deleteContact = function() {
        $timeout(function() {
          deleteContact($scope.bookId, $scope.bookName, $scope.contact);
        }, 200);
      };

      $scope.shouldDisplayWork = function() {
        return !!($scope.contact.orgName || $scope.contact.orgRole || isAddressFilled('work'));
      };

      $scope.shouldDisplayHome = function() {
        return !!(isAddressFilled('home') || $scope.formattedBirthday || $scope.contact.nickname);
      };

      $scope.shouldDisplayOthers = function() {
        return !!(isAddressFilled('other') || ($scope.contact.tags && $scope.contact.tags.length) || $scope.contact.notes || ($scope.contact.urls && $scope.contact.urls.length));
      };

      $scope.openAddressbook = function() {
        $state.go('contact.addressbooks', { bookName: $scope.contact.addressbook.bookName });
      };

      if (contactUpdateDataService.contact) {

        $scope.fillContactData(contactUpdateDataService.contact);

        $scope.$on('$stateChangeStart', function(evt, next, nextParams) {
          gracePeriodService.flush(contactUpdateDataService.taskId);
          // check if the user edit the contact again
          if (next && next.name && nextParams &&
              next.name === '/contact/edit/:bookId/:bookName/:cardId' &&
              nextParams.bookId === $scope.bookId &&
              nextParams.bookName === $scope.bookName &&
              nextParams.cardId === $scope.cardId) {
            // cache the contact to show in editContactController
            contactUpdateDataService.contact = $scope.contact;
          } else {
            contactUpdateDataService.contact = null;
          }
        });

        $scope.$on(CONTACT_EVENTS.CANCEL_UPDATE, function(evt, data) {
          if (data.id === $scope.cardId) {
            $scope.contact = data;
          }
        });

        $window.addEventListener('beforeunload', function() {
          gracePeriodService.flush(contactUpdateDataService.taskId);
        });

        $scope.loaded = true;
      } else {
        contactService.getContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.cardId)
          .then($scope.fillContactData, function(err) {
            $log.debug('Error while loading contact', err);
            $scope.error = true;
            contactDisplayError('Cannot get contact details');
          })
          .finally(function() {
            $scope.loaded = true;
          });
      }

      sharedContactDataService.contact = {};
    })
    .controller('editContactController', function(
      $scope,
      $q,
      contactDisplayError,
      $rootScope,
      $timeout,
      $state,
      sendContactToBackend,
      $stateParams,
      gracePeriodService,
      notificationFactory,
      contactService,
      deleteContact,
      ContactShell,
      ContactsHelper,
      CONTACT_EVENTS,
      contactUpdateDataService,
      VcardBuilder,
      REDIRECT_PAGE_TIMEOUT
    ) {
      $scope.loaded = false;
      $scope.bookId = $stateParams.bookId;
      $scope.bookName = $stateParams.bookName;
      $scope.cardId = $stateParams.cardId;

      $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
        if ($scope.contact.id === data.id && data.etag) {
          $scope.contact.etag = data.etag;
        }
      });

      var oldContact = '';

      if (contactUpdateDataService.contact) {
        $scope.contact = contactUpdateDataService.contact;
        $scope.contact.vcard = VcardBuilder.toVcard($scope.contact);
        contactUpdateDataService.contact = null;
        oldContact = JSON.stringify($scope.contact);
        $scope.loaded = true;
      } else {
        contactService.getContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.cardId)
          .then(function(contact) {
            if (!contact.addressbook.canEditContact) {
              $scope.close();
            }
            $scope.contact = contact;
            oldContact = JSON.stringify(contact);
          }, function() {
            $scope.error = true;
            contactDisplayError('Cannot get contact details. Redirecting to contact list display');
            $timeout(function() {
              $state.go('contact.addressbooks', {
                bookName: $scope.bookName
              }, { location: 'replace' });
            }, REDIRECT_PAGE_TIMEOUT);
          })
          .finally(function() {
            $scope.loaded = true;
          });
      }

      function isContactModified() {
        return oldContact !== JSON.stringify($scope.contact);
      }

      $scope.close = function() {
        $state.go('/contact/show/:bookId/:bookName/:cardId', {
          bookId: $scope.bookId,
          bookName: $scope.bookName,
          cardId: $scope.cardId
        }, { location: 'replace' });
      };

      $scope.save = function() {
        if (!isContactModified()) {
          return $scope.close();
        }

        $scope.contact.displayName = ContactsHelper.getFormattedName($scope.contact);

        if (!$scope.contact.displayName) {
          notificationFactory.weakError('Contact update', 'Please fill at least a field');

          return;
        }

        return sendContactToBackend($scope, function() {
          return contactService.updateContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.contact)
            .then(function(taskId) {
              contactUpdateDataService.contact = $scope.contact;
              contactUpdateDataService.contactUpdatedIds.push($scope.contact.id);
              contactUpdateDataService.taskId = taskId;
              $scope.close();

              return gracePeriodService.grace({
                id: taskId,
                performedAction: 'Contact updated',
                cancelFailed: 'Cannot cancel contact update',
                cancelTooLate: 'Too late to cancel the contact update',
                gracePeriodFail: 'Failed to update contact'
              }).catch(function(err) {
                $rootScope.$broadcast(
                  CONTACT_EVENTS.CANCEL_UPDATE,
                  new ContactShell($scope.contact.vcard, $scope.contact.etag, $scope.contact.href)
                );

                return $q.reject(err);
              });
            }, function(err) {
              contactDisplayError('The contact cannot be edited, please retry later');

              return $q.reject(err);
            });
        });
      };

      $scope.deleteContact = function() {
        $timeout(function() {
          deleteContact($scope.bookId, $scope.bookName, $scope.contact);
        }, 200);
      };
    })
    .controller('contactAvatarModalController', function($scope, selectionService) {
      $scope.imageSelected = function() {
        return !!selectionService.getImage();
      };

      $scope.saveContactAvatar = function() {
        if (selectionService.getImage()) {
          $scope.loading = true;
          selectionService.getBlob('image/png', function(blob) {
            var reader = new FileReader();

            reader.onloadend = function() {
              $scope.contact.photo = reader.result;
              selectionService.clear();
              $scope.loading = false;
              $scope.modal.hide();
              $scope.$apply();
            };
            reader.readAsDataURL(blob);
          });
        }
      };
    })

    .controller('contactCategoryLetterController', function($scope, CONTACT_SCROLL_EVENTS, CONTACT_LIST_DISPLAY) {
      $scope.headerDisplay = {
        categoryLetter: ''
      };
      $scope.$on(CONTACT_SCROLL_EVENTS, function(event, data) {
        $scope.headerDisplay.letterExists = data !== '';
        $scope.$applyAsync(function() {
          $scope.headerDisplay.categoryLetter = data;
        });
      });

      $scope.getContactTitleDisplayCondition = function() {
        return (!$scope.headerDisplay.letterExists || $scope.displayAs === CONTACT_LIST_DISPLAY.cards) && !$scope.contactSearch.searchInput;
      };
    })

    .controller('contactItemController', function(
      $scope,
      $window,
      $timeout,
      deleteContact,
      dynamicDirectiveService,
      ContactsHelper,
      ContactLocationHelper,
      ContactHighLightHelper
    ) {
      ContactsHelper.fillScopeContactData($scope, $scope.contact);
      ContactsHelper.getOrderType($scope);
      $scope.datas = [];

      $timeout(function() {
        $scope.hasInjectedActions = dynamicDirectiveService.getInjections('contact-list-menu-items', $scope).length > 0;
      }, 0);

      $scope.hasContactInformationMatchQuery = function() {
        if ($scope.keySearch === null || angular.isUndefined($scope.keySearch)) {
          return false;
        }

        function escapeHTML(str) {
          return angular.isUndefined(str) || str === null ? '' : str.toString().toLowerCase().trim()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
        var contactHighLightHelper = new ContactHighLightHelper();
        var keySearch = escapeHTML($scope.keySearch);

        var isMatchAddress = (contactHighLightHelper.checkArrAddressMatching($scope.contact.addresses, keySearch, 'mdi-map-marker') > -1),
            isMatchSocial = (contactHighLightHelper.checkArrMatching($scope.contact.social, keySearch, 'mdi-earth') > -1),
            isMatchUrl = (contactHighLightHelper.checkArrMatching($scope.contact.urls, keySearch, 'mdi-web') > -1),
            isMatchOrganization = (contactHighLightHelper.checkStringMatch($scope.contact.orgName, keySearch, 'mdi-factory') > -1),
            isMatchJobTitle = (contactHighLightHelper.checkStringMatch($scope.contact.orgRole, keySearch, 'mdi-email') > -1),
            isMatchNick = (contactHighLightHelper.checkStringMatch($scope.contact.nickname, keySearch, 'mdi-comment-account-outline') > -1),
            isMatchNote = (contactHighLightHelper.checkStringMatch($scope.contact.notes, keySearch, 'mdi-comment-account') > -1),
            isMatchTags = (contactHighLightHelper.checkArrMatching($scope.contact.tags, keySearch, 'mdi-tag-multiple') > -1),
            isMatchBirthDay = (contactHighLightHelper.checkStringMatch($scope.formattedBirthday, keySearch, 'mdi-cake-variant') > -1);

        $scope.datas = contactHighLightHelper.dataHighlight;

        return isMatchAddress ||
              isMatchSocial ||
              isMatchUrl ||
              isMatchOrganization ||
              isMatchJobTitle ||
              isMatchNick ||
              isMatchBirthDay ||
              isMatchTags ||
              isMatchNote;
      };
      $scope.hasMatch = $scope.hasContactInformationMatchQuery();

      $scope.displayContact = function() {
        $scope.displayShell.displayContact();
      };

      $scope.editContact = function() {
        ContactLocationHelper.contact.edit($scope.contact.addressbook.bookId, $scope.contact.addressbook.bookName, $scope.contact.id);
      };

      $scope.actionClick = function(event, action) {
        if (/^(http|https):/.test(action)) {
          event.preventDefault();
          $window.open(action);
        }
        event.stopPropagation();
      };

      $scope.deleteContact = function() {
        deleteContact($scope.contact.addressbook.bookId, $scope.contact.addressbook.bookName, $scope.contact);
      };
    });
})(angular);
