'use strict';

/* global ICAL */

angular.module('linagora.esn.contact')
  .constant('ICAL', ICAL)
  .factory('ContactsRestangular', function(Restangular) {
    return Restangular.withConfig(function(config) {
      config.setBaseUrl('/contacts/api');
      config.setFullResponse(true);
    });
  })
  .factory('contactsService', ['ContactsRestangular', 'tokenAPI', 'uuid4', 'ICAL', '$q', '$http', function(ContactsRestangular, tokenAPI, uuid4, ICAL, $q, $http) {
    function ContactsShell(vcard, path, etag) {
      function getMultiValue(propName) {
        var props = vcard.getAllProperties(propName);
        return props.map(function(prop) {
          var propVal = prop.getFirstValue();
          return { type: propVal.getParameter('type'), value: propVal.getFirstValue() };
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
      this.org = vcard.getFirstPropertyValue('org');
      this.orgRole = vcard.getFirstPropertyValue('role');
      this.orgUri = vcard.getAllProperties('url').filter(function(prop) {
        return prop.getParameter('type') === 'Work';
      })[0];

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
      this.tags = cats;

      var bday = vcard.getFirstPropertyValue('bday');
      this.birthday = bday ? bday.toJSDate() : null;

      this.nickname = vcard.getFirstPropertyValue('nickname');
      this.notes = vcard.getFirstPropertyValue('note');

      this.vcard = vcard;
      this.path = path;
      this.etag = etag;
    }

    function getCarddavServerURL() {
      if (serverUrlCache) {
        return serverUrlCache.promise;
      }

      serverUrlCache = $q.defer();
      ContactsRestangular.one('davserver').get().then(
        function(response) {
          serverUrlCache.resolve(response.data.url);
        },
        serverUrlCache.reject
      );

      return serverUrlCache.promise;
    }

    function configureRequest(method, path, headers, body) {
      return $q.all([tokenAPI.getNewToken(), getCarddavServerURL()]).then(function(results) {
        var token = results[0].data.token, url = results[1];

        headers = headers || {};
        headers.ESNToken = token;

        var config = {
          url: url.replace(/\/$/, '') + path,
          method: method,
          headers: headers
        };

        if (body) {
          config.data = body;
        }

        return config;
      });
    }

    function request(method, path, headers, body) {
      return configureRequest(method, path, headers, body).then(function(config) {
        return $http(config);
      });
    }

    function shellToVCARD(shell) {
      var prop;
      var vcard = new ICAL.Component('vcard');
      vcard.addPropertyWithValue('version', '4.0');
      vcard.addPropertyWithValue('uid', shell.id || uuid4.generate());

      if (shell.displayName) {
        vcard.addPropertyWithValue('fn', shell.displayName);
      } else if (shell.lastName && shell.firstName) {
        vcard.addPropertyWithValue('fn', shell.firstName + ' ' + shell.lastName);
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
        var value = ICAL.Time.fromJSDate(shell.birthday);
        value.isDate = true;
        vcard.addPropertyWithValue('bday', value);
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

      return vcard;
    }

    function getCard(path) {
      var headers = { Accept: 'application/vcard+json' };
      return request('get', path, headers).then(function(response) {
        var vcard = new ICAL.Component(response.data);
        return new ContactsShell(vcard, path, response.headers('ETag'));
      });
    }

    function list(contactsPath) {
      var req = {
        scope: {
          addressbooks: [contactsPath]
        }
      };
      return request('post', '/json/queries/contacts', null, req).then(function(response) {
        return response.data.map(function(vcarddata) {
          var vcard = new ICAL.Component(vcarddata);
          return new ContactsShell(vcard);
        });
      });
    }

    function create(contactsPath, vcard) {
      var uid = vcard.getFirstPropertyValue('uid');
      if (!uid) {
        return $q.reject(new Error('Missing UID in VCARD'));
      }
      var cardPath = contactsPath.replace(/\/$/, '') + '/' + uid + '.vcf';
      var headers = { 'Content-Type': 'application/vcard+json' };
      var body = vcard.toJSON();

      return request('put', cardPath, headers, body).then(function(response) {
        if (response.status !== 201) {
          return $q.reject(response);
        }
        return response;
      });
    }

    function modify(cardPath, vcard, etag) {
      var headers = {
        'Content-Type': 'application/vcard+json',
        'Prefer': 'return-representation'
      };
      var body = vcard.toJSON();

      if (etag) {
        headers['If-Match'] = etag;
      }

      return request('put', cardPath, headers, body).then(function(response) {
        if (response.status === 200) {
          var vcard = new ICAL.Component(response.data);
          return new ContactsShell(vcard, cardPath, response.headers('ETag'));
        } else if (response.status === 204) {
            return getCard(cardPath);
        } else {
          return $q.reject(response);
        }
      });
    }

    var serverUrlCache = null;
    return {
      list: list,
      create: create,
      modify: modify,
      getCard: getCard,

      shellToVCARD: shellToVCARD
    };
  }]);
