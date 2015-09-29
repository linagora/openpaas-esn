'use strict';

angular.module('linagora.esn.contact')
  .run(function($rootScope, liveRefreshContactService) {
    $rootScope.$on('$routeChangeSuccess', function(evt, current, previous) {
      if (current && current.originalPath &&
         (current.originalPath === '/contact' || current.originalPath.substring(0, 9) === '/contact/')) {
        var bookId = current.locals.user._id;
        liveRefreshContactService.startListen(bookId);
      } else {
        liveRefreshContactService.stopListen();
      }
    });
  })
  .factory('ContactsHelper', function(CONTACT_DATE_FORMAT, $dateFormatter) {

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

      function getElementFromType(type) {
        var result = array.filter(function(element) {
          return notNullNorEmpty(element.type) && element.type.toLowerCase() === type.toLowerCase();
        });

        if (notNullNorEmpty(result)) {
          return result[0];
        }
      }

      if (!notNullNorEmpty(priorities)) {
        return array;
      }

      var result = [];
      priorities.forEach(function(priority) {
        var v = getValue(getElementFromType(priority));
        if (v) {
          result.push({type: priority, value: v});
        }
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

      if (notNullNorEmpty(contact.emails)) {
        var email = getValueFromArray(contact.emails, ['work', 'home', 'other']);
        if (email) {
          return email;
        }
      }

      if (notNullNorEmpty(contact.org)) {
        return contact.org;
      }

      if (notNullNorEmpty(contact.nickname)) {
        return contact.nickname;
      }

      if (notNullNorEmpty(contact.social)) {
        var social = getValueFromArray(contact.social, ['twitter', 'skype', 'google', 'linkedin', 'facebook']);
        if (social) {
          return social;
        }
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

      if (notNullNorEmpty(contact.addresses)) {
        return getFormattedAddress(contact.addresses[0]);
      }

      if (notNullNorEmpty(contact.tags) && contact.tags[0] && contact.tags[0].text) {
        return contact.tags[0].text;
      }

      if (contact.birthday) {
        return $dateFormatter.formatDate(contact.birthday, CONTACT_DATE_FORMAT);
      }
    }

    function forceReloadDefaultAvatar(contact) {
      if (contact && contact.photo &&
          /\/contact\/api\/contacts\/.*?\/avatar/.test(contact.photo)) {
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

    return {
      getFormattedName: getFormattedName,
      getFormattedBirthday: getFormattedBirthday,
      getFormattedAddress: getFormattedAddress,
      forceReloadDefaultAvatar: forceReloadDefaultAvatar,
      getOrderedValues: getOrderedValues
    };
  })
  .factory('liveRefreshContactService', function($rootScope, $log, livenotification, contactsService, ICAL, CONTACT_EVENTS, CONTACT_SIO_EVENTS) {
    var sio = null;
    var listening = false;

    function liveNotificationHandlerOnCreate(data) {
      var contact = new contactsService.ContactsShell(new ICAL.Component(data.vcard));
      $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    }

    function liveNotificationHandlerOnDelete(data) {
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, { id: data.contactId });
    }

    function liveNotificationHandlerOnUpdate(data) {
      contactsService.getCard(data.bookId, data.contactId).then(function(updatedContact) {
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
  .factory('contactsCacheService', function($rootScope, $log, ContactsHelper, CONTACT_EVENTS) {

    var metadata;
    var contactsCache;

    function initCache() {
      $log.debug('Initializing contacts cache');
      contactsCache = [];
      metadata = {};
    }

    $rootScope.$on('$routeChangeStart', function(evt, next, current) {
      // clear cache to avoid memory leak when user switch to outside
      // contact module
      if (current && current.originalPath && current.originalPath.substring(0, 8) === '/contact' &&
        next && ((next.originalPath && next.originalPath.substring(0, 8) !== '/contact') || !next.originalPath)) {
        clear();
      }
    });

    $rootScope.$on(CONTACT_EVENTS.CREATED, function(e, data) {
      // workaround to avoid adding duplicated contacts
      deleteContact(data);
      addContact(data);
    });

    $rootScope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      ContactsHelper.forceReloadDefaultAvatar(data);
      updateContact(data);
    });

    $rootScope.$on(CONTACT_EVENTS.CANCEL_UPDATE, function(e, data) {
      updateContact(data);
    });

    $rootScope.$on(CONTACT_EVENTS.DELETED, function(e, data) {
      deleteContact(data);
    });

    $rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(e, data) {
      addContact(data);
    });

    function clear() {
      $log.debug('Clear contacts cache');
      initCache();
    }

    function put(contacts) {
      if (contacts) {
        $log.debug('Cached', contacts.length, 'contacts');
        contactsCache = contacts;
      }
    }

    function get() {
      return contactsCache;
    }

    function addContact(contact) {
      if (!contact) {
        return;
      }
      contactsCache.push(contact);
    }

    function push(contacts) {
      if (!contacts) {
        return;
      }
      angular.forEach(contacts, addContact);
    }

    function updateContact(contact) {
      if (!contact) {
        return;
      }

      if (contactsCache) {
        angular.forEach(contactsCache, function(item, index, array) {
          if (item.id === contact.id) {
            array[index] = contact;
          }
        });
      }
    }

    function deleteContact(contact) {
      if (contactsCache) {
        // remove all items have the same ID with contact
        contactsCache = contactsCache.filter(function(item) {
          return item.id !== contact.id;
        });
        put(contactsCache);
      }
    }

    function setMetadata(key, value) {
      if (!key) {
        return;
      }
      metadata[key] = value;
    }

    function getMetadata() {
      return metadata;
    }

    initCache();

    return {
      setMetadata: setMetadata,
      getMetadata: getMetadata,
      put: put,
      push: push,
      get: get
    };

  })
  .factory('contactsService', function(ContactsHelper, notificationFactory, gracePeriodService, GRACE_DELAY, uuid4, ICAL, DAV_PATH, $q, $http, $rootScope, contactsCacheService, $log, CONTACT_EVENTS, gracePeriodLiveNotification, CONTACT_LIST_DEFAULT_SORT, CONTACT_LIST_PAGE_SIZE) {

    function deleteContact(bookId, contact) {
      remove(bookId, contact, GRACE_DELAY)
        .then(function(taskId) {

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
    }

    function ContactsShell(vcard, etag) {
      function getMultiValue(propName) {
        var props = vcard.getAllProperties(propName);
        return props.map(function(prop) {
          var data = {
            value: prop.getFirstValue()
          };
          var type = prop.getParameter('type');
          if (type) {
            data.type = type;
          }
          return data;
        });
      }
      function getMultiAddress(propName) {
        var props = vcard.getAllProperties(propName);
        return props.map(function(prop) {
          var propVal = prop.getFirstValue();
          return {
            type: prop.getParameter('type'),
            street: propVal[2],
            city: propVal[3],
            zip: propVal[5],
            country: propVal[6]
          };
        });
      }

      this.id = vcard.getFirstPropertyValue('uid');
      this.displayName = vcard.getFirstPropertyValue('fn');

      var name = vcard.getFirstPropertyValue('n');
      this.firstName = name ? name[1] : '';
      this.lastName = name ? name[0] : '';

      this.org = vcard.getFirstPropertyValue('org');
      this.orgRole = vcard.getFirstPropertyValue('role');

      this.emails = getMultiValue('email').map(function(mail) {
        mail.value = mail.value.replace(/^mailto:/i, '');
        return mail;
      });

      this.tel = getMultiValue('tel').map(function(tel) {
        tel.value = tel.value.replace(/^tel:/i, '');
        return tel;
      });

      this.addresses = getMultiAddress('adr');
      this.social = getMultiValue('socialprofile');
      this.urls = getMultiValue('url');

      var catprop = vcard.getFirstProperty('categories');
      var cats = catprop && catprop.getValues().concat([]);
      var starredIndex = cats ? cats.indexOf('starred') : -1;
      this.starred = starredIndex > -1;
      if (this.starred) {
        cats.splice(starredIndex, 1);
      }
      this.tags = cats ? cats.map(function(cat) { return { text: cat }; }) : [];

      var bday = vcard.getFirstProperty('bday');

      if (bday) {
        var type = bday.type,
            value = bday.getFirstValue();

        this.birthday = type !== 'text' ? value.toJSDate() : value;
      }

      this.nickname = vcard.getFirstPropertyValue('nickname');
      this.notes = vcard.getFirstPropertyValue('note');

      this.vcard = vcard;
      this.etag = etag;
      this.photo = vcard.getFirstPropertyValue('photo');
    }

    function configureRequest(method, path, headers, body, params) {
      var url = DAV_PATH;

      headers = headers || {};

      var config = {
        url: url.replace(/\/$/, '') + path,
        method: method,
        headers: headers,
        params: params
      };

      if (body) {
        config.data = body;
      }

      return $q.when(config);
    }

    function request(method, path, headers, body, params) {
      return configureRequest(method, path, headers, body, params).then(function(config) {
        return $http(config);
      });
    }

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

      if (shell.org) {
        vcard.addPropertyWithValue('org', shell.org);
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

    function bookUrl(bookId) {
      return '/addressbooks/' + bookId + '/contacts.json';
    }

    function contactUrl(bookId, cardId) {
      return '/addressbooks/' + bookId + '/contacts/' + cardId + '.vcf';
    }

    function addIfMatchHeader(etag, headers) {
      if (etag) {
        headers['If-Match'] = etag;
      }

      return headers;
    }

    function addGracePeriodParam(gracePeriod, params) {
      if (gracePeriod) {
        params.graceperiod = gracePeriod;
      }

      return params;
    }

    function getCard(bookId, cardId) {
      var path = contactUrl(bookId, cardId),
          headers = {
            'Accept': 'application/vcard+json'
          };

      return request('get', path, headers).then(function(response) {
        var contact = new ContactsShell(new ICAL.Component(response.data), response.headers('ETag'));
        ContactsHelper.forceReloadDefaultAvatar(contact);
        return contact;
      });
    }

    function responseAsContactsShell(response) {
      if (response.data && response.data._embedded && response.data._embedded['dav:item']) {
        return response.data._embedded['dav:item'].map(function(vcarddata) {
          return new ContactsShell(new ICAL.Component(vcarddata.data));
        });
      }
      return [];
    }

    function _getContacts(bookId, userId, query) {
      return request('get', bookUrl(bookId), null, null, query).then(function(response) {
        return {
          contacts: responseAsContactsShell(response),
          last_page: !response.data._links.next
        };
      });
    }

    function _getContactsFromCache(bookId, userId, options) {

      $log.debug('List contacts', bookId, options);
      var cache = contactsCacheService.get();
      var meta = contactsCacheService.getMetadata();
      var currentPage = options.page || 1;
      var limit = options.limit || CONTACT_LIST_PAGE_SIZE;
      var offset = (currentPage - 1) * limit;

      if (options.paginate && currentPage <= meta.page && cache && cache.length) {

        var result = {
          contacts: cache,
          current_page: currentPage,
          cache: true,
          last_page: meta.last_page
        };

        // send back the next page which has not been cached
        if (!meta.last_page) {
          result.next_page = meta.page + 1;
        }
        $log.debug('Send back contacts from cache', result);
        return $q.when(result);
      }

      var query = {
        sort: options.sort || CONTACT_LIST_DEFAULT_SORT,
        userId: userId
      };

      if (options.paginate) {
        query.limit = limit;
        query.offset = offset;
      }

      return _getContacts(bookId, userId, query).then(function(response) {
        contactsCacheService.push(response.contacts);
        contactsCacheService.setMetadata('page', currentPage);
        contactsCacheService.setMetadata('last_page', response.last_page);

        var result = {
          contacts: response.contacts,
          current_page: currentPage,
          last_page: response.last_page,
          cache: false
        };
        if (!response.last_page) {
          result.next_page = currentPage + 1;
        }
        $log.debug('Send back contacts from service ', result);
        return result;
      });
    }

    function list(bookId, userId, options) {
      if (options && options.cache) {
        return _getContactsFromCache(bookId, userId, options);
      }
      return _getContacts(bookId, userId, options);
    }

    function create(bookId, contact) {
      var cardId = uuid4.generate(),
          headers = {
            'Content-Type': 'application/vcard+json'
          };

      contact.id = cardId;

      return request('put', contactUrl(bookId, cardId), headers, shellToVCARD(contact).toJSON()).then(function(response) {
        if (response.status !== 201) {
          return $q.reject(response);
        }
        return getCard(bookId, cardId)
          .then(function(contact) {
            $rootScope.$emit(CONTACT_EVENTS.CREATED, contact);
            return response;
          })
          .finally (function() {
            return response;
          });

      });
    }

    function modify(bookId, contact) {
      if (!contact.id) {
        return $q.reject(new Error('Missing contact.id'));
      }

      var headers = {
        'Content-Type': 'application/vcard+json',
        'Prefer': 'return-representation'
      };

      return request('put',
        contactUrl(bookId, contact.id),
        addIfMatchHeader(contact.etag, headers),
        shellToVCARD(contact).toJSON(),
        addGracePeriodParam(GRACE_DELAY, {})).then(function(response) {
        if (response.status === 202 || response.status === 204) {
          $rootScope.$emit(CONTACT_EVENTS.UPDATED, contact);
          return response.headers('X-ESN-TASK-ID');
        } else {
          return $q.reject(response);
        }
      });
    }

    function remove(bookId, contact, gracePeriod) {
      if (!contact.id) {
        return $q.reject(new Error('Missing contact.id'));
      }

      return request('delete',
        contactUrl(bookId, contact.id),
        addIfMatchHeader(contact.etag, {}),
        null,
        addGracePeriodParam(gracePeriod, {})).then(function(response) {
        if (response.status !== 204 && response.status !== 202) {
          return $q.reject(response);
        }

        $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);

        return response.headers('X-ESN-TASK-ID');
      });
    }

    function search(bookId, userId, data, page) {
      return request('get', bookUrl(bookId), null, null, {search: data, userId: userId, page: page}).then(function(response) {
        return {
          current_page: response.data._current_page,
          total_hits: response.data._total_hits,
          hits_list: responseAsContactsShell(response)
        };
      });
    }

    function searchAllAddressBooks(userId, data, page) {
      return search(userId, userId, data, page);
    }

    return {
      remove: remove,
      list: list,
      create: create,
      modify: modify,
      getCard: getCard,
      search: search,
      searchAllAddressBooks: searchAllAddressBooks,
      deleteContact: deleteContact,
      shellToVCARD: shellToVCARD,
      ContactsShell: ContactsShell
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
      contact: {}
    };
  })
  .factory('contactUpdateDataService', function() {
    return {
      taskId: null,
      contact: null
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

      return sendRequest().finally (function() {
        $scope.calling = false;
      });
    };
  });
