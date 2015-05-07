'use strict';

angular.module('linagora.esn.contact')
  .factory('ContactsRestangular', function(Restangular) {
    return Restangular.withConfig(function(config) {
      config.setBaseUrl('/contacts/api');
      config.setFullResponse(true);
    });
  })
  .factory('contactsService', ['ContactsRestangular', 'tokenAPI', 'uuid4', 'ICAL', '$q', '$http', function(ContactsRestangular, tokenAPI, uuid4, ICAL, $q, $http) {
    function ContactsShell(vcard, path, etag) {
      this.id = vcard.getFirstPropertyValue('uid');
      this.fn = vcard.getFirstPropertyValue('fn');
      this.email = vcard.getFirstPropertyValue('email');
      this.org = vcard.getFirstPropertyValue('org');

      var catprop = vcard.getFirstProperty('categories');
      var cats = catprop.getValues();
      this.starred = (cats.indexOf('starred') > -1);

      var tel = vcard.getFirstPropertyValue('tel');
      this.tel = tel ? tel.replace(/^tel:/i, '') : null;

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
      var uid = uuid4.generate();
      var vcard = new ICAL.Component('vcard');
      vcard.addPropertyWithValue('version', '4.0');
      vcard.addPropertyWithValue('uid', uid);
      if (shell.displayName) {
        vcard.addPropertyWithValue('fn', shell.displayName);
      } else if (shell.lastName && shell.firstName) {
        vcard.addPropertyWithValue('fn', shell.firstName + ' ' + shell.lastName);
      }

      if (shell.starred) {
        vcard.addPropertyWithValue('categories', 'starred');
      }

      if (shell.email) {
        vcard.addPropertyWithValue('email', shell.email);
      }
      if (shell.lastName && shell.firstName) {
        vcard.addPropertyWithValue('n', [shell.lastName, shell.firstName]);
      }
      if (shell.org) {
        vcard.addPropertyWithValue('org', [shell.org]);
      }
      if (shell.tel) {
        vcard.addProperty(new ICAL.Property(['tel', {}, 'uri', 'tel:' + shell.tel]));
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
          return new ICAL.Component(vcarddata);
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
        'Content-Type': 'application/json+calendar',
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
