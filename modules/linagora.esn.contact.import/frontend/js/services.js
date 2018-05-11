'use strict';

angular.module('linagora.esn.contact.import')

  .factory('contactImportAPI', function(Restangular, httpConfigurer, CONTACT_IMPORT_URL) {
    var restangularInstance = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setFullResponse(true);
    });

    httpConfigurer.manageRestangular(restangularInstance, CONTACT_IMPORT_URL);

    return restangularInstance;
  })

  .factory('ContactImporterService', function(contactImportAPI) {

    function importContacts(type, account) {
      return contactImportAPI.all(type).post({account_id: account.data.id});
    }

    return {
      import: importContacts
    };
  })

  .factory('ContactImportRegistry', function() {

    var cache = {};

    function register(type, provider) {
      cache[type] = provider;
    }

    function get(type) {
      return cache[type];
    }

    return {
      register: register,
      get: get
    };
  })

  .factory('ContactImporter', function($log, $q, ContactImportRegistry, notificationFactory) {

    function importContacts(type, account) {

      var importer = ContactImportRegistry.get(type);
      if (!importer) {
        $log.error('Can not find importer ' + type);
        return;
      }

      return importer.import(account)
        .then(function(response) {
          if (response.status === 202) {
            notificationFactory.notify(
              'info',
              '',
              'Importing ' + account.provider + ' contacts for @' + account.data.username,
              3000,
              {from: 'bottom', align: 'center'}
              );
          } else {
            $log.debug('Unknown status code (%s) while importing contacts', response.status);
          }
        }, function(err) {
          notificationFactory.notify(
            'danger',
            '',
            'Error while importing' + account.provider + ' contacts for @ ' + account.data.username + ':' + err,
            3000,
            {from: 'bottom', align: 'center'}
            );
        });
    }

    return {
      import: importContacts
    };
  })

  .factory('ContactImportMessageRegistry', function(CONTACT_IMPORT_DEFAULT_MESSAGES, CONTACT_IMPORT_UNKNOWN_MESSAGE) {
    var cache = {};

    function register(provider, messages) {
      cache[provider] = messages;
    }

    function get(provider, type) {
      if (cache.hasOwnProperty(provider)) {
        var messages = cache[provider];
        return messages[type] ? messages[type] : CONTACT_IMPORT_DEFAULT_MESSAGES[type] || CONTACT_IMPORT_UNKNOWN_MESSAGE;
      }

      return CONTACT_IMPORT_DEFAULT_MESSAGES[type] || CONTACT_IMPORT_UNKNOWN_MESSAGE;
    }

    return {
      get: get,
      register: register
    };
  })

  .factory('ContactImportNotificationService', function($log, $interpolate, notificationFactory, livenotification, CONTACT_IMPORT_SIO_EVENTS, CONTACT_IMPORT_SIO_NAMESPACE, ContactImportMessageRegistry) {
    var sio = null;
    var listening = false;

    function notify(type, data) {
      var msg = $interpolate(ContactImportMessageRegistry.get(data.provider, type))(
        { account: data.account }
      );
      notificationFactory.notify(
        'danger',
        '',
        msg,
        3000,
        { from: 'bottom', align: 'center' }
        );
    }

    function accountErrorHandler(data) {
      notify('ACCOUNT_ERROR', data);
    }

    function apiClientErrorHandler(data) {
      notify('API_CLIENT_ERROR', data);
    }

    function contactClientErrorHandler(data) {
      notify('CONTACT_CLIENT_ERROR', data);
    }

    function startListen(roomId) {
      if (listening) { return; }

      if (sio === null) {
        sio = livenotification(CONTACT_IMPORT_SIO_NAMESPACE, roomId);
      }

      sio.on(CONTACT_IMPORT_SIO_EVENTS.ACCOUNT_ERROR, accountErrorHandler);
      sio.on(CONTACT_IMPORT_SIO_EVENTS.API_CLIENT_ERROR, apiClientErrorHandler);
      sio.on(CONTACT_IMPORT_SIO_EVENTS.CONTACT_CLIENT_ERROR, contactClientErrorHandler);

      listening = true;
      $log.debug('Start listening contact import notification service', roomId);
    }

    function stopListen() {
      if (!listening) { return; }

      if (sio) {
        sio.removeListener(CONTACT_IMPORT_SIO_EVENTS.ACCOUNT_ERROR, accountErrorHandler);
        sio.removeListener(CONTACT_IMPORT_SIO_EVENTS.API_CLIENT_ERROR, apiClientErrorHandler);
        sio.removeListener(CONTACT_IMPORT_SIO_EVENTS.CONTACT_CLIENT_ERROR, contactClientErrorHandler);
      }

      listening = false;
      $log.debug('Stop listening contact import notification service');
    }

    return {
      startListen: startListen,
      stopListen: stopListen
    };
  });
