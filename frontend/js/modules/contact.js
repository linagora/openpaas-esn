'use strict';

angular.module('esn.contact', ['restangular', 'openpaas-logo', 'mgcrea.ngStrap.alert', 'esn.domain', 'esn.session'])
  .controller('contactsController', function($scope, contactAPI, session, $alert, usSpinnerService, user) {
    var spinnerKey = 'addressbooksSpinner';
    var contactsSpinnerKey = 'contactsSpinner';
    $scope.addressbooks = [];
    $scope.selected_addressbook = null;

    $scope.contacts = [];
    $scope.invited = [];
    $scope.contact = null;
    $scope.restActive = false;
    $scope.contactsRestActive = false;

    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#contactserror',
        duration: '3',
        animation: 'am-fade'
      });
    };

    var restOptions = {
      offset: 0,
      addressbooks: []
    };

    $scope.currentFocus = function() {
      if ($scope.contact) {
        return 'contact';
      } else if ($scope.selected_addressbook) {
        return 'addressbook';
      } else {
        return 'list';
      }
    };

    $scope.isChecked = function(id) {
      if ($scope.selected_addressbook === id) {
        return 'fa fa-check';
      }
      return false;
    };

    $scope.isContactSelected = function(id) {
      if ($scope.contact && $scope.contact._id === id) {
        return 'contact-select';
      }
      return false;
    };

    $scope.loadAddressBook = function(addressbook) {
      $scope.selectAddressBook(addressbook);
      $scope.refreshContacts();
    };

    $scope.selectAddressBook = function(addressbook) {
      $scope.selected_addressbook = addressbook._id;
      $scope.contact = null;
    };

    $scope.selectContact = function(contact) {
      $scope.contact = contact;
    };

    $scope.refreshContacts = function() {
      $scope.contacts = [];
      $scope.invited = [];
      if (!$scope.selected_addressbook) {
        return;
      }

      var options = angular.copy(restOptions);
      options.owner = user._id;
      options.addressbooks.push($scope.selected_addressbook);
      $scope.contactsRestActive = true;
      usSpinnerService.spin(contactsSpinnerKey);
      contactAPI.getContacts(options).then(
        function(response) {
          $scope.contacts = response.data;
          var ids = $scope.contacts.map(function(contact) {
            return contact._id;
          });
          contactAPI.getInvitations({'ids[]': ids}).then(function(response) {
            $scope.invited = response.data;
          });
        },
        function(err) {
          $scope.displayError(err);
        }
      ).finally (function() {
        $scope.contactsRestActive = false;
        usSpinnerService.stop(contactsSpinnerKey);
      });
    };

    $scope.selectedAddressBookName = function() {
      if (!$scope.selected_addressbook) {
        return '';
      }
      return $scope.addressbooks.filter(function(ab) {
        return ab._id === $scope.selected_addressbook;
      })[0].name;
    };

    $scope.selectedContactDisplayName = function(contact) {
      if (!contact) {
        return '';
      }
      if (contact.given_name) {
        return contact.given_name;
      }
      return contact.emails[0];
    };

    $scope.init = function() {
      $scope.restActive = true;
      usSpinnerService.spin(spinnerKey);
      contactAPI.getAddressBooks({ limit: 20, creator: user._id }).then(
        function(data) {
          $scope.addressbooks = data.data;
        },
        function(err) {
          $scope.displayError(err);
        }
      ).finally (function() {
        $scope.restActive = false;
        usSpinnerService.stop(spinnerKey);
      });
    };

    $scope.running = 0;
    $scope.sendInvitation = function(contact) {
      if (!contact || !contact.emails || contact.emails.length === 0) {
        return;
      }

      $scope.running = 1;
      contactAPI.sendInvitation(contact, session.domain._id).then(
        function() {
          $scope.running = 0;
          $scope.invited.push({data: {contact_id: contact._id}});
        }
      );
    };

    $scope.isInvited = function(contact) {
      if (!contact || !contact._id) {
        return false;
      }

      return $scope.invited.some(function(element) {
        return element.data && element.data.contact_id && element.data.contact_id === contact._id;
      });
    };

    $scope.init();
  })
  .controller('googleContactImporterController', function($scope, contactAPI, $window, $alert) {
    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#contactserror',
        duration: '3',
        animation: 'am-fade'
      });
    };
    $scope.googleImport = function() {
      contactAPI.startGoogleImport().then(function(data) {
        $window.location.href = data.data.url;
      }, function(error) {
        $scope.displayError(error);
      });
    };
  })
  .factory('contactAPI', function(Restangular) {
    return {
      startGoogleImport: function() {
        return Restangular.oneUrl('googlers', '/api/contacts/google/oauthurl').get();
      },
      getContacts: function(options) {
        return Restangular.all('contacts').getList(options);
      },
      getAddressBooks: function(options) {
        return Restangular.all('addressbooks').getList(options);
      },
      getContactInvitations: function(contact) {
        var id = contact._id || contact;
        return Restangular.one('contacts/' + id + '/invitations').getList();
      },
      getInvitations: function(options) {
        return Restangular.all('contacts/invitations').getList(options);
      } ,
      sendInvitation: function(contact, domain) {
        var id = contact._id || contact;
        var body = {
          domain: domain._id || domain
        };
        return Restangular.one('contacts/' + id + '/invitations').customPOST(body);
      }
    };
  });
