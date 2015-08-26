'use strict';

/* global ICAL */

angular.module('linagora.esn.contact')
  .constant('ICAL', ICAL)
  .constant('DAV_PATH', '/dav/api')
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
  .factory('ContactsHelper', function(DATE_FORMAT, $dateFormatter) {

    function getFormattedBirthday(birthday) {
      if (birthday instanceof Date) {
        return moment(birthday).format('L'); // jshint ignore:line
      }
        return birthday;
    }

    function getFormattedName(contact) {

      function notNullNorEmpty(value) {
        return value && value.length > 0;
      }

      function getValueFromArray(array, priorities) {

        function getElementFromType(type) {
          var result = array.filter(function(element) {
            return notNullNorEmpty(element.type) && element.type.toLowerCase() === type.toLowerCase();
          });

          if (notNullNorEmpty(result)) {
            return result[0];
          }
        }

        function getValue(element) {
          return (element && element.value) ? element.value : null;
        }

        if (!notNullNorEmpty(priorities)) {
          return getValue(array[0]);
        }

        var result = [];
        priorities.forEach(function(priority) {
          var v = getValue(getElementFromType(priority));
          if (v) {
            result.push(v);
          }
        });

        if (notNullNorEmpty(result)) {
          return result[0];
        }

        // return first non null value;
        var filter = array.filter(function(element) {
          return getValue(element) !== null;
        });
        if (notNullNorEmpty(filter)) {
          return getValue(filter[0]);
        }

      }

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
        var email = getValueFromArray(contact.emails, ['work', 'home']);
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

      if (notNullNorEmpty(contact.tags) && contact.tags[0] && contact.tags[0].text) {
        return contact.tags[0].text;
      }

      if (contact.birthday) {
        return $dateFormatter.formatDate(contact.birthday, DATE_FORMAT);
      }
    }

    return {
      getFormattedName: getFormattedName,
      getFormattedBirthday: getFormattedBirthday
    };
  })
  .factory('liveRefreshContactService', function($rootScope, $log, livenotification, contactsService, ICAL) {
    var sio = null;
    var listening = false;

    var CONTACT_LIVE_CREATED = 'contact:live:created';
    var CONTACT_LIVE_DELETED = 'contact:live:deleted';

    function liveNotificationHandlerOnCreate(data) {
      var contact = new contactsService.ContactsShell(new ICAL.Component(data.vcard));
      $rootScope.$broadcast(CONTACT_LIVE_CREATED, contact);
    }

    function liveNotificationHandlerOnDelete(data) {
      $rootScope.$broadcast(CONTACT_LIVE_DELETED, { id: data.contactId });
    }

    function startListen(bookId) {
      if (listening) { return; }

      if (sio === null) {
        sio = livenotification('/contacts', bookId);
      }
      sio.on('contact:created', liveNotificationHandlerOnCreate);
      sio.on('contact:deleted', liveNotificationHandlerOnDelete);

      listening = true;
      $log.debug('Start listening contact live update');
    }

    function stopListen() {
      if (!listening) { return; }

      if (sio) {
        sio.removeListener('contact:created', liveNotificationHandlerOnCreate);
        sio.removeListener('contact:deleted', liveNotificationHandlerOnDelete);
      }

      listening = false;
      $log.debug('Stop listening contact live update');
    }

    return {
      startListen: startListen,
      stopListen: stopListen
    };

  })
  .factory('contactsCacheService', function($rootScope, $log, $cacheFactory) {
    var CACHE_KEY = 'contactsList';
    var CONTACTS_CACHE_KEY = 'contacts';
    var contactsCache = $cacheFactory.get(CACHE_KEY);
    if (!contactsCache) {
      contactsCache = $cacheFactory(CACHE_KEY);
    }

    $rootScope.$on('$routeChangeStart', function(evt, next, current) {
      // clear cache to avoid memory leak when user swith to outside
      // contact module
      if (next && next.originalPath && next.originalPath !== '/contact' &&
          next.originalPath.substring(0, 9) !== '/contact/') {
        clear();
      }
    });

    $rootScope.$on('contact:created', function(e, data) {
      // workaround to avoid adding duplicated contacts
      deleteContact(data);
      addContact(data);
    });

    $rootScope.$on('contact:updated', function(e, data) {
      updateContact(data);
    });

    $rootScope.$on('contact:deleted', function(e, data) {
      deleteContact(data);
    });

    $rootScope.$on('contact:cancel:delete', function(e, data) {
      addContact(data);
    });

    $rootScope.$on('contact:live:created', function(e, data) {
      // workaround to avoid adding duplicated contacts
      deleteContact(data);
      addContact(data);
    });

    $rootScope.$on('contact:live:deleted', function(e, data) {
      deleteContact(data);
    });

    function clear() {
      $log.debug('Clear contacts cache');
      contactsCache.removeAll();
    }

    function put(contacts) {
      $log.debug('Cached', contacts.length, 'contacts');
      contactsCache.put(CONTACTS_CACHE_KEY, contacts);
    }

    function get() {
      return contactsCache.get(CONTACTS_CACHE_KEY);
    }

    function addContact(contact) {
      var contacts = get();
      if (contacts) {
        contacts.push(contact);
      }
    }

    function updateContact(contact) {
      var contacts = get();
      if (contacts) {
        angular.forEach(contacts, function(item, index, array) {
          if (item.id === contact.id) {
            array[index] = contact;
          }
        });
      }
    }

    function deleteContact(contact) {
      var contacts = get();
      if (contacts) {
        // remove all items have the same ID with contact
        contacts = contacts.filter(function(item) {
          return item.id !== contact.id;
        });
        // put contacts to cache again because the reference has been changed
        put(contacts);
      }
    }

    return {
      put: put,
      get: get
    };

  })
  .factory('contactsService', function(ContactsHelper, notificationFactory, gracePeriodService, GRACE_DELAY, tokenAPI, uuid4, ICAL, DAV_PATH, $q, $http, $rootScope, contactsCacheService, $log) {

    function deleteContact(bookId, contact) {
      remove(bookId, contact, GRACE_DELAY).then(function(taskId) {
        return gracePeriodService.grace(taskId, 'You have just deleted a contact (' + contact.displayName + ').', 'Cancel').then(null, function() {
          return gracePeriodService.cancel(taskId).then(function() {
            $rootScope.$broadcast('contact:cancel:delete', contact);
          });
        });
      } , function(err) {
        notificationFactory.weakError('Contact Delete', 'Can not delete contact');
        return $q.reject(err);
      });
    }

    function ContactsShell(vcard, etag) {
      function getMultiValue(propName) {
        var props = vcard.getAllProperties(propName);
        return props.map(function(prop) {
          var propVal = prop.getFirstValue();
          return { type: prop.getParameter('type'), value: propVal };
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


      var orgUriProp = vcard.getAllProperties('url').filter(function(prop) {
        return prop.getParameter('type') === 'Work';
      })[0];

      if (orgUriProp) {
        this.orgUri = orgUriProp.getFirstValue();
      }

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
      return tokenAPI.getNewToken().then(function(result) {
        var token = result.data.token;
        var url = DAV_PATH;

        headers = headers || {};
        headers.ESNToken = token;

        var config = {
          url: url.replace(/\/$/, '') + path,
          method: method,
          headers: headers,
          params: params
        };

        if (body) {
          config.data = body;
        }

        return config;
      });
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

      if (shell.orgUri) {
        if (shell.orgUri.match(/^https?:/)) {
          prop = vcard.addPropertyWithValue('url', shell.orgUri);
        } else {
          prop = vcard.addPropertyWithValue('url', 'http://' + shell.orgUri);
        }
        prop.setParameter('type', 'Work');
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
        return new ContactsShell(new ICAL.Component(response.data), response.headers('ETag'));
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

    function list(bookId) {
      var contacts = contactsCacheService.get();
      if (contacts) {
        $log.debug('Get contacts from cache');
        return $q.when(contacts);
      }

      return request('get', bookUrl(bookId)).then(function(response) {
        contacts = responseAsContactsShell(response);
        contactsCacheService.put(contacts);
        return contacts;
      });

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
            $rootScope.$emit('contact:created', contact);
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

      return request('put', contactUrl(bookId, contact.id), addIfMatchHeader(contact.etag, headers), shellToVCARD(contact).toJSON()).then(function(response) {
        if (response.status === 200) {
          var updatedContact = new ContactsShell(new ICAL.Component(response.data), response.headers('ETag'));
          $rootScope.$emit('contact:updated', updatedContact);
          return updatedContact;
        } else if (response.status === 204) {
          return getCard(bookId, contact.id).then(function(updatedContact) {
            $rootScope.$emit('contact:updated', updatedContact);
            return updatedContact;
          });
        } else {
          return $q.reject(response);
        }
      });
    }

    function remove(bookId, contact, gracePeriod) {
      if (!contact.id) {
        return $q.reject(new Error('Missing contact.id'));
      }

      return request('delete', contactUrl(bookId, contact.id), addIfMatchHeader(contact.etag, {}), null, addGracePeriodParam(gracePeriod, {})).then(function(response) {
        if (response.status !== 204 && response.status !== 202) {
          return $q.reject(response);
        }

        $rootScope.$broadcast('contact:deleted', contact);

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

    return {
      remove: remove,
      list: list,
      create: create,
      modify: modify,
      getCard: getCard,
      search: search,
      deleteContact: deleteContact,
      shellToVCARD: shellToVCARD,
      ContactsShell: ContactsShell
    };
  });
