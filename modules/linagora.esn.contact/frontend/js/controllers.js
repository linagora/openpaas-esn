'use strict';

angular.module('linagora.esn.contact')
  .controller('newContactController', ['$scope', '$route', '$location', 'contactsService', 'notificationFactory', function($scope, $route, $location, contactsService, notificationFactory) {
    $scope.bookId = $route.current.params.bookId;
    $scope.contact = {};

    $scope.close = function() {
      $location.path('/contacts');
    };
    $scope.accept = function() {
      var vcard = contactsService.shellToVCARD($scope.contact);
      var path = '/addressbooks/' + $scope.bookId + '/contacts';
      contactsService.create(path, vcard).then(function() {
        $scope.close();
        notificationFactory.weakInfo('Contact creation success', 'Successfully created the new contact');
      }).catch (function(err) {
        notificationFactory.weakError('Contact creation failure', err.message);
      });
    };
  }])
  .controller('showContactController', ['$scope', '$route', '$location', 'contactsService', 'notificationFactory', function($scope, $route, $location, contactsService, notificationFactory) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};

    $scope.close = function() {
      $location.path('/contacts');
    };

    $scope.accept = function() {
      var vcard = contactsService.shellToVCARD($scope.contact);
      contactsService.modify($scope.contact.path, vcard, $scope.contact.etag).then(function() {
        $scope.close();
        notificationFactory.weakInfo('Contact modification success', 'Successfully modified the new contact');
      }).catch (function(err) {
        notificationFactory.weakError('Contact modification failure', err.message);
      });
    };

    $scope.init = function() {
      var cardUrl = '/addressbooks/' + $scope.bookId + '/contacts/' + $scope.cardId + '.vcf';
      contactsService.getCard(cardUrl).then(function(card) {
        $scope.contact = card;
      });
    };

    $scope.init();
  }])
  .controller('contactsListController', ['$scope', '$document', 'contactsService', 'dataTableFactory', 'user', function($scope, $document, contactsService, dataTableFactory, user) {
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.contacts = [];

    $scope.keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $scope.categories = (function(str) {
      var result = [];
      for (var i = 0; i < str.length; i++) {
        var nextChar = str.charAt(i);
        result.push(nextChar);
      }
      return result;
    })($scope.keys);

    $scope.categorize = function(contacts) {
      var categories = dataTableFactory.categorize(contacts, dataTableFactory.initCategories($scope.keys), 'firstName');
      categories = dataTableFactory.sortCategoriesBy(categories, 'firstName');
      return categories;
    };

    $scope.loadContacts2 = function(bookId) {
      var path = '/addressbooks/' + bookId + '/contacts';
      contactsService.list(path).then(function(cards) {
        $scope.buildCategories(cards || []);
      });
    };

    $scope.loadContacts = function() {

      var contacts = 
      [
        {
          '_id': '53fceb7ef214c5316e93e7c8',
          'firstName': 'Francis',
          'lastName': 'Hill'
        },
        {
          '_id': '53fceb7e4a46965ec9f1d08f',
          'firstName': 'Lessie',
          'lastName': 'Caldwell'
        },
        {
          '_id': '53fceb7e502379253e2e7b0d',
          'firstName': 'Alyson',
          'lastName': 'Woodward'
        },
        {
          '_id': '53fceb7ee548c39f3d6d651e',
          'firstName': 'Malone',
          'lastName': 'Becker'
        },
        {
          '_id': '53fceb7e216dabb188bf3cec',
          'firstName': 'Terrell',
          'lastName': 'Stein'
        },
        {
          '_id': '53fceb7ed393a16f29b2dc78',
          'firstName': 'Laurie',
          'lastName': 'Ayers'
        },
        {
          '_id': '53fceb7e956d8f3aaf33634e',
          'firstName': 'Rowland',
          'lastName': 'Rosario'
        },
        {
          '_id': '53fceb7ec92ee5342dc5c5df',
          'firstName': 'Laurel',
          'lastName': 'Hobbs'
        },
        {
          '_id': '53fceb7ed624f8dd26ebb171',
          'firstName': 'Kristie',
          'lastName': 'Barker'
        },
        {
          '_id': '53fceb7e14cb861f7e72c202',
          'firstName': 'Riley',
          'lastName': 'Ortiz'
        },
        {
          '_id': '53fceb7ecfe77b71b7a5d4fe',
          'firstName': 'Morin',
          'lastName': 'Terry'
        },
        {
          '_id': '53fceb7e671c72b0dacb44f5',
          'firstName': 'Ida',
          'lastName': 'Haney'
        },
        {
          '_id': '53fceb7e91f884a9dea10cb7',
          'firstName': 'Boyd',
          'lastName': 'Davis'
        },
        {
          '_id': '53fceb7e91a18e0fd67cc7e6',
          'firstName': 'Milagros',
          'lastName': 'Blair'
        },
        {
          '_id': '53fceb7e25edb893c03c320f',
          'firstName': 'Marissa',
          'lastName': 'Howell'
        },
        {
          '_id': '53fceb7e67e3275edd8b577d',
          'firstName': 'Whitehead',
          'lastName': 'Sosa'
        },
        {
          '_id': '53fceb7ed368d55809a0d1c8',
          'firstName': 'Potts',
          'lastName': 'Byers'
        },
        {
          '_id': '53fceb7e433a701299f9c02b',
          'firstName': 'Tara',
          'lastName': 'Adams'
        },
        {
          '_id': '53fceb7e8e7502eedfe0b0bc',
          'firstName': 'Velasquez',
          'lastName': 'Carver'
        },
        {
          '_id': '53fceb7ef69a7352f0c2cd55',
          'firstName': 'Dale',
          'lastName': 'Flowers'
        },
        {
          '_id': '53fceb7ed2212f228b769a86',
          'firstName': 'Baldwin',
          'lastName': 'Donovan'
        },
        {
          '_id': '53fceb7e0bf90a7ab5801e32',
          'firstName': 'Lynch',
          'lastName': 'Gibson'
        },
        {
          '_id': '53fceb7ee7053b2a611f0809',
          'firstName': 'Deana',
          'lastName': 'Norris'
        },
        {
          '_id': '53fceb7e3c0e0d3e9350cbce',
          'firstName': 'Harrison',
          'lastName': 'Decker'
        },
        {
          '_id': '53fceb7e1c3626c8d09db3f6',
          'firstName': 'Anne',
          'lastName': 'Harris'
        },
        {
          '_id': '53fceb7e981cb971bf0b40eb',
          'firstName': 'Nanette',
          'lastName': 'Harmon'
        },
        {
          '_id': '53fceb7ee8f2b6ecf8fd0338',
          'firstName': 'Byers',
          'lastName': 'Maldonado'
        }
      ];

      contacts = contacts.map(function(contact) {
        contact.emails = [contact.firstName + '.' + contact.lastName + '@yolo.io'];
        contact.phone = '+33467646464';
        return contact;
      });

      $scope.sorted_contacts = $scope.categorize(contacts);

    };

    $scope.goToSection = function(id) {
      var e = angular.element(document.getElementById('section_' + id));
      console.log(e);
      $document.scrollToElementAnimated(e);
    }

    $scope.loadContacts($scope.bookId);
  }]);
