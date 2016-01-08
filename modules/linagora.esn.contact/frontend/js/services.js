'use strict';

angular.module('linagora.esn.contact')
  .run(function($rootScope, liveRefreshContactService, session) {
    $rootScope.$on('$stateChangeSuccess', function(evt, current, currentParams, previous) {
      if (current && current.name &&
         (current.name === '/contact' || current.name.substring(0, 9) === '/contact/')) {
        var bookId = session.user._id;
        liveRefreshContactService.startListen(bookId);
      } else {
        liveRefreshContactService.stopListen();
      }
    });
  })
  .factory('ContactsHelper', function(CONTACT_DATE_FORMAT, CONTACT_ATTRIBUTES_ORDER, $dateFormatter) {

    function getFormattedBirthday(birthday) {
      if (birthday instanceof Date) {
        return moment(birthday).format('L'); // jshint ignore:line
      }
      return birthday;
    }

    function notNullNorEmpty(value) {
      return value && value.length > 0;
    }

    function getValue(element) {
      return (element && element.value) ? element.value : null;
    }

    function getOrderedValues(array, priorities) {
      if (!array || !array.length) {
        return [];
      }

      function getElementsFromType(type) {
        return array.filter(function(element) {
          return notNullNorEmpty(element.type) && element.type.toLowerCase() === type.toLowerCase();
        }) || [];
      }

      if (!notNullNorEmpty(priorities)) {
        return array;
      }

      var result = [];
      priorities.forEach(function(priority) {
        getElementsFromType(priority).forEach(function(element) {
          var v = getValue(element);
          if (v) {
            result.push({type: priority, value: v});
          }
        });
      });
      return result;
    }

    function getValueFromArray(array, priorities) {

      var result = getOrderedValues(array, priorities);

      if (notNullNorEmpty(result)) {
        return result[0].value;
      }

      // return first non null value;
      var filter = array.filter(function(element) {
        return getValue(element) !== null;
      });
      if (notNullNorEmpty(filter)) {
        return getValue(filter[0]);
      }
    }

    function getFormattedAddress(address) {
      var result = '';
      if (!address) {
        return result;
      }
      if (address.street) {
        result += address.street;
        result += ' ';
      }
      if (address.city) {
        result += address.city;
        result += ' ';
      }
      if (address.zip) {
        result += address.zip;
        result += ' ';
      }
      if (address.country) {
        result += address.country;
      }
      return result.trim();
    }

    function getFormattedName(contact) {

      if (notNullNorEmpty(contact.firstName) && notNullNorEmpty(contact.lastName)) {
        return contact.firstName + ' ' + contact.lastName;
      }

      if (notNullNorEmpty(contact.firstName)) {
        return contact.firstName;
      }

      if (notNullNorEmpty(contact.lastName)) {
        return contact.lastName;
      }

      if (notNullNorEmpty(contact.orgName)) {
        return contact.orgName;
      }

      if (notNullNorEmpty(contact.orgRole)) {
        return contact.orgRole;
      }

      if (notNullNorEmpty(contact.nickname)) {
        return contact.nickname;
      }

      if (notNullNorEmpty(contact.emails)) {
        var email = getValueFromArray(contact.emails, ['work', 'home', 'other']);
        if (email) {
          return email;
        }
      }

      if (notNullNorEmpty(contact.social)) {
        var social = getValueFromArray(contact.social, ['twitter', 'skype', 'google', 'linkedin', 'facebook']);
        if (social) {
          return social;
        }
      }

      if (notNullNorEmpty(contact.urls)) {
        return contact.urls[0].value;
      }

      if (notNullNorEmpty(contact.tel)) {
        var tel = getValueFromArray(contact.tel, ['work', 'mobile', 'home']);
        if (tel) {
          return tel;
        }
      }

      if (notNullNorEmpty(contact.notes)) {
        return contact.notes;
      }

      if (notNullNorEmpty(contact.tags) && contact.tags[0] && contact.tags[0].text) {
        return contact.tags[0].text;
      }

      if (contact.birthday) {
        return $dateFormatter.formatDate(contact.birthday, CONTACT_DATE_FORMAT);
      }

      if (notNullNorEmpty(contact.addresses)) {
        return getFormattedAddress(contact.addresses[0]);
      }

    }

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

    function fillScopeContactData($scope, contact) {
      if (!contact) {
        return;
      }
      $scope.contact = contact;
      $scope.emails = getOrderedValues($scope.contact.emails, CONTACT_ATTRIBUTES_ORDER.email);
      $scope.phones = getOrderedValues($scope.contact.tel, CONTACT_ATTRIBUTES_ORDER.phone);
      $scope.formattedBirthday = getFormattedBirthday(contact.birthday);
    }

    return {
      getFormattedName: getFormattedName,
      getFormattedBirthday: getFormattedBirthday,
      getFormattedAddress: getFormattedAddress,
      forceReloadDefaultAvatar: forceReloadDefaultAvatar,
      getOrderedValues: getOrderedValues,
      fillScopeContactData: fillScopeContactData,
      isTextAvatar: isTextAvatar
    };
  })
  .factory('liveRefreshContactService', function($rootScope, $log, livenotification, ContactAPIClient, ContactShell, ICAL, CONTACT_EVENTS, CONTACT_SIO_EVENTS) {
    var sio = null;
    var listening = false;

    function liveNotificationHandlerOnCreate(data) {
      var contact = new ContactShell(new ICAL.Component(data.vcard));
      $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    }

    function liveNotificationHandlerOnDelete(data) {
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, { id: data.contactId });
    }

    function liveNotificationHandlerOnUpdate(data) {
      ContactAPIClient
        .addressbookHome(data.bookId)
        .addressbook(data.bookName)
        .vcard(data.contactId)
        .get()
        .then(function(updatedContact) {
          $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, updatedContact);
        });
    }

    function startListen(bookId) {
      if (listening) { return; }

      if (sio === null) {
        sio = livenotification('/contacts', bookId);
      }
      sio.on(CONTACT_SIO_EVENTS.CREATED, liveNotificationHandlerOnCreate);
      sio.on(CONTACT_SIO_EVENTS.DELETED, liveNotificationHandlerOnDelete);
      sio.on(CONTACT_SIO_EVENTS.UPDATED, liveNotificationHandlerOnUpdate);

      listening = true;
      $log.debug('Start listening contact live update');
    }

    function stopListen() {
      if (!listening) { return; }

      if (sio) {
        sio.removeListener(CONTACT_SIO_EVENTS.CREATED, liveNotificationHandlerOnCreate);
        sio.removeListener(CONTACT_SIO_EVENTS.DELETED, liveNotificationHandlerOnDelete);
        sio.removeListener(CONTACT_SIO_EVENTS.UPDATED, liveNotificationHandlerOnUpdate);
      }

      listening = false;
      $log.debug('Stop listening contact live update');
    }

    return {
      startListen: startListen,
      stopListen: stopListen
    };

  })
  .factory('shellToVCARD', function(ICAL, ContactsHelper) {
    function shellToVCARD(shell) {
      var prop;
      var vcard = new ICAL.Component('vcard');

      vcard.addPropertyWithValue('version', '4.0');
      vcard.addPropertyWithValue('uid', shell.id);

      if (shell.displayName) {
        vcard.addPropertyWithValue('fn', shell.displayName);
      } else {
        vcard.addPropertyWithValue('fn', ContactsHelper.getFormattedName(shell));
      }

      if (shell.lastName || shell.firstName) {
        vcard.addPropertyWithValue('n', [shell.lastName || '', shell.firstName || '']);
      }

      var categories = [];
      if (shell.tags) {
        categories = categories.concat(shell.tags.map(function(tag) { return tag.text; }));
      }

      if (shell.starred) {
        categories.push('starred');
      }

      if (categories.length) {
        prop = new ICAL.Property('categories');
        prop.setValues(categories);
        vcard.addProperty(prop);
      }

      if (shell.orgName) {
        vcard.addPropertyWithValue('org', [shell.orgName]);
      }

      if (shell.orgRole) {
        vcard.addPropertyWithValue('role', shell.orgRole);
      }

      if (shell.emails) {
        shell.emails.forEach(function(data) {
          var prop = vcard.addPropertyWithValue('email', 'mailto:' + data.value);
          prop.setParameter('type', data.type);
        });
      }

      if (shell.tel) {
        shell.tel.forEach(function(data) {
          var prop = vcard.addPropertyWithValue('tel', 'tel:' + data.value);
          prop.setParameter('type', data.type);
        });
      }

      if (shell.addresses) {
        shell.addresses.forEach(function(data) {
          var val = ['', '', data.street, data.city, '', data.zip, data.country];
          var prop = vcard.addPropertyWithValue('adr', val);
          prop.setParameter('type', data.type);
        });
      }

      if (shell.social) {
        shell.social.forEach(function(data) {
          var prop = vcard.addPropertyWithValue('socialprofile', data.value);
          prop.setParameter('type', data.type);
        });
      }

      if (shell.urls) {
        shell.urls.forEach(function(data) {

          vcard.addPropertyWithValue('url', data.value);
        });
      }

      if (shell.birthday) {
        if (shell.birthday instanceof Date) {
          var value = ICAL.Time.fromJSDate(shell.birthday);

          value.isDate = true;
          vcard.addPropertyWithValue('bday', value);
        } else {
          vcard.addPropertyWithValue('bday', shell.birthday).setParameter('VALUE', 'TEXT');
        }
      }

      if (shell.nickname) {
        vcard.addPropertyWithValue('nickname', shell.nickname);
      }

      if (shell.notes) {
        prop = vcard.addPropertyWithValue('note', shell.notes);
      }

      if (shell.photo) {
        vcard.addPropertyWithValue('photo', shell.photo);
      }

      return vcard;
    }
    return shellToVCARD;
  })
  .factory('deleteContact', function(
                              $rootScope,
                              $q,
                              ContactAPIClient,
                              gracePeriodService,
                              gracePeriodLiveNotification,
                              notificationFactory,
                              GRACE_DELAY,
                              CONTACT_EVENTS) {
    return function(bookId, bookName, contact) {
      var options = { graceperiod: GRACE_DELAY };
      if (contact.etag) {
        options.etag = contact.etag;
      }

      return ContactAPIClient
        .addressbookHome(bookId)
        .addressbook(bookName)
        .vcard(contact.id)
        .remove(options)
        .then(function(taskId) {
          $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
          gracePeriodLiveNotification.registerListeners(
            taskId,
            function() {
              notificationFactory.strongError('', 'Failed to delete contact (' + contact.displayName + '), please try again later');
              // add the contact to the list again
              $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
            }
          );

          return gracePeriodService.grace(taskId, 'You have just deleted a contact (' + contact.displayName + ').', 'Cancel')
            .then(function(data) {
              if (data.cancelled) {
                return gracePeriodService.cancel(taskId).then(function() {
                  data.success();
                  $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
                }, function(err) {
                  data.error('Cannot cancel contact deletion, the contact might be deleted permanently');
                  return $q.reject(err);
                });
              } else {
                gracePeriodService.remove(taskId);
              }
            });
        }, function(err) {
          notificationFactory.weakError('Contact Delete', 'The contact cannot be deleted, please retry later');
          return $q.reject(err);
        });
    };
  })
  .factory('displayContactError', function($alert) {
    return function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.contact-error-container',
        duration: '3',
        animation: 'am-flip-x'
      });
    };
  })
  .factory('closeContactForm', function($location) {
    return function() {
      $location.path('/contact');
    };
  })
  .factory('openContactForm', function($location, sharedContactDataService) {
    return function(bookId, contact) {
      if (contact) {
        sharedContactDataService.contact = contact;
      }
      $location.url('/contact/new/' + bookId);
    };
  })
  .factory('sharedContactDataService', function() {
    return {
      contact: {},
      searchQuery: null,
      categoryLetter: ''
    };
  })
  .factory('contactUpdateDataService', function() {
    return {
      taskId: null,
      contact: null
    };
  })

  .factory('addScrollingBehavior', function(CONTACT_SCROLL_EVENTS, $rootScope, $window, sharedContactDataService) {
    return function(element) {

      function updateCategoryLetter(offset) {
        var categories = element.find('.block-header') || [];
        var letter = '';

        categories.each(function(index, element) {
          var letterPosition = element.getElementsByTagName('h2')[0].getBoundingClientRect().bottom;
          letter = (letterPosition < offset) ? element.textContent : letter;
        });

        if (sharedContactDataService.categoryLetter !== letter) {
          sharedContactDataService.categoryLetter = letter;
          $rootScope.$broadcast(CONTACT_SCROLL_EVENTS, letter);
        }
      }

      function onScroll() {
        var contactControlOffset = angular.element.find('.contact-controls')[0].getBoundingClientRect().bottom;
        var contactHeaderOffset = angular.element.find('.contacts-list-header')[0].getBoundingClientRect().bottom;
        var offset = Math.max(contactControlOffset, contactHeaderOffset);
        updateCategoryLetter(offset);
      }

      angular.element($window).scroll(onScroll);

      return {
        unregister: function() {
          angular.element($window).off('scroll', onScroll);
        },
        onScroll: onScroll
      };
    };
  })

  .factory('sendContactToBackend', function($location, ContactsHelper, $q) {
    return function($scope, sendRequest) {
      if ($scope.calling) {
        return $q.reject('The form is already being submitted');
      }

      $scope.contact.displayName = ContactsHelper.getFormattedName($scope.contact);
      if (!$scope.contact.displayName) {
        return $q.reject('Please fill at least a field');
      }

      $scope.calling = true;

      return sendRequest().finally(function() {
        $scope.calling = false;
      });
    };
  })
  .factory('toggleEventService', function($rootScope, CONTACT_LIST_DISPLAY_EVENTS) {
    function broadcast(value) {
      $rootScope.$broadcast(CONTACT_LIST_DISPLAY_EVENTS.toggle, value);
    }

    function listen($scope, callback) {
      return $scope.$on(CONTACT_LIST_DISPLAY_EVENTS.toggle, callback);
    }

    return {
      broadcast: broadcast,
      listen: listen
    };
  })
  .factory('toggleContactDisplayService', function($rootScope, $cacheFactory, toggleEventService, CONTACT_LIST_DISPLAY) {
    var CACHE_KEY = 'contact';
    var TOGGLE_KEY = 'listDisplay';

    var current;

    function _getCache() {
      var listDisplayCache = $cacheFactory.get(CACHE_KEY);
      if (!listDisplayCache) {
        listDisplayCache = $cacheFactory(CACHE_KEY);
      }
      return listDisplayCache;
    }

    function _getCacheValue() {
      return _getCache().get(TOGGLE_KEY);
    }

    function _cacheValue(value) {
      _getCache().put(TOGGLE_KEY, value);
    }

    function getInitialDisplay() {
      var listDisplayCache = _getCache();
      return listDisplayCache.get(TOGGLE_KEY) || CONTACT_LIST_DISPLAY.list;
    }

    function getCurrentDisplay() {
      if (!current) {
        current = getInitialDisplay();
      }
      return current;
    }

    function setCurrentDisplay(display) {
      _cacheValue(display);
      current = display;
      toggleEventService.broadcast(display);
    }

    return {
      _cacheValue: _cacheValue,
      _getCache: _getCache,
      _getCacheValue: _getCacheValue,
      getInitialDisplay: getInitialDisplay,
      getCurrentDisplay: getCurrentDisplay,
      setCurrentDisplay: setCurrentDisplay
    };

  });
