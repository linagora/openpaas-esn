'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.contact Angular module', function() {

  describe('contactAPI service', function() {

    beforeEach(function() {
      angular.mock.module('esn.contact');
    });
    beforeEach(inject(function(contactAPI, $httpBackend, Restangular) {
      this.api = contactAPI;
      this.$httpBackend = $httpBackend;
      // The full response configuration option has to be set at the application level
      // It is set here to get the same behavior
      Restangular.setFullResponse(true);
    }));

    describe('startGoogleImport method', function() {
      it('should send a request GET /api/contacts/google/oauthurl', function() {
        this.$httpBackend.expectGET('/api/contacts/google/oauthurl').respond(200);
        this.api.startGoogleImport();
        this.$httpBackend.flush();
      });
    });

    describe('getContacts method', function() {
      it('should send a request GET /contacts', function() {
        this.$httpBackend.expectGET('/contacts').respond(200, []);
        this.api.getContacts();
        this.$httpBackend.flush();
      });

      it('should send a request GET /contacts with the right options', function() {
        var options = {
          limit: 100,
          offset: 25,
          address_books_id: ['id1', 'id2']
        };
        this.$httpBackend.expectGET('/contacts?address_books_id=id1&address_books_id=id2&limit=100&offset=25').respond(200, []);
        this.api.getContacts(options);
        this.$httpBackend.flush();
      });
    });

    describe('getAddressBooks method', function() {
      it('should send a request GET /addressbooks', function() {
        this.$httpBackend.expectGET('/addressbooks').respond(200, []);
        this.api.getAddressBooks();
        this.$httpBackend.flush();
      });

      it('should send a request GET /addressbooks with the right options', function() {
        var options = {
          limit: 100,
          offset: 25
        };
        this.$httpBackend.expectGET('/addressbooks?limit=100&offset=25').respond(200, []);
        this.api.getAddressBooks(options);
        this.$httpBackend.flush();
      });
    });

    describe('getContactInvitations method', function() {
      it('should send a request GET /contacts/:id/invitations from id', function() {
        var id = 123;
        this.$httpBackend.expectGET('/contacts/' + id + '/invitations').respond(200, []);
        this.api.getContactInvitations(id);
        this.$httpBackend.flush();
      });

      it('should send a request GET /contacts/:id/invitations from hash', function() {
        var options = {
          _id: 123
        };
        this.$httpBackend.expectGET('/contacts/' + options._id + '/invitations').respond(200, []);
        this.api.getContactInvitations(options);
        this.$httpBackend.flush();
      });
    });

    describe('getInvitations method', function() {
      it('should send a request GET /contacts/invitations', function() {
        this.$httpBackend.expectGET('/contacts/invitations').respond(200, []);
        this.api.getInvitations();
        this.$httpBackend.flush();
      });
    });

    describe('sendInvitation method', function() {
      it('should send a request POST /contacts/:id/invitations from ID', function() {
        var contact = 123;
        var domain = 456;
        this.$httpBackend.expectPOST('/contacts/' + contact + '/invitations').respond(200, []);
        this.api.sendInvitation(contact, domain);
        this.$httpBackend.flush();
      });

      it('should send a request POST /contacts/:id/invitations from hash', function() {
        var contact = {_id: 123};
        var domain = 456;
        this.$httpBackend.expectPOST('/contacts/' + contact._id + '/invitations').respond(200, []);
        this.api.sendInvitation(contact, domain);
        this.$httpBackend.flush();
      });

      it('should send a request POST /contacts/:id/invitations with domain in body', function() {
        var contact = {_id: 123};
        var domain = 456;
        var body = {
          domain: domain
        };
        this.$httpBackend.expectPOST('/contacts/' + contact._id + '/invitations', body).respond(200, []);
        this.api.sendInvitation(contact, domain);
        this.$httpBackend.flush();
      });
    });
  });

  describe('googleContactImporterController', function() {

    beforeEach(function() {
      angular.mock.module('esn.contact');
    });

    describe('googleImport method', function() {

      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller = $controller;
        this.scope = $rootScope.$new();
        this.alert = function(msgObject) {};
        this.contactAPI = {};
        this.contactAPI.startGoogleImport = function() {};
        $controller('googleContactImporterController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI
        });
      }));

      it('should call the contactAPI.startGoogleImport()', function(done) {
        this.contactAPI.startGoogleImport = function() {
          done();
        };
        this.scope.googleImport();
      });

    });

  });

  describe('contactsController', function() {

    beforeEach(function() {
      angular.mock.module('esn.contact');
      angular.mock.inject(function($controller, $rootScope) {
        this.$rootScope = $rootScope;
        this.$controller = $controller;
        this.scope = $rootScope.$new();
        this.user = { _id: '539b0ba6b801603217aa2e24' };
        this.alert = function(msgObject) {};
        this.contactAPI = {
          getAddressBooks: function() {
            return {
              then: function() {
                return {
                  finally: function() {}
                };
              }
            };
          },
          getContacts: function() {
            return {
              then: function() {
                return {
                  finally: function() {}
                };
              }
            };
          }
        };
        this.spinner = {
          spin: function() {},
          stop: function() {}
        };
        this.contactAPI.startGoogleImport = function() {};
      });
    });

    describe('currentFocus() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should return "contact" if $scope.contact is set', function() {
        this.scope.contact = {yolo: true};
        expect(this.scope.currentFocus()).to.equal('contact');
      });
      it('should return "addressbook" if $scope.selected_addressbook is set and contact is not set', function() {
        this.scope.contact = null;
        this.scope.selected_addressbook = {yolo: true};
        expect(this.scope.currentFocus()).to.equal('addressbook');
      });
      it('should return "list" if $scope.selected_addressbook  and $scope.contact are not set', function() {
        this.scope.contact = null;
        this.scope.selected_addressbook = null;
        expect(this.scope.currentFocus()).to.equal('list');
      });
    });

    describe('isChecked() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should return "fa fa-check" if $scope.selected_addressbook equals argument', function() {
        this.scope.selected_addressbook = '12345';
        expect(this.scope.isChecked('12345')).to.equal('fa fa-check');
      });
      it('should return "false" if $scope.selected_addressbook does not equal argument', function() {
        this.scope.selected_addressbook = '55555';
        expect(this.scope.isChecked('12345')).to.be.false;
      });
    });

    describe('isContactSelected() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should return "contact-select" if $scope.contact._id equals argument', function() {
        this.scope.contact = {_id: '12345'};
        expect(this.scope.isContactSelected('12345')).to.equal('contact-select');
      });
      it('should return "false" if $scope.contact._id does not equal argument', function() {
        this.scope.contact = {_id: '55555'};
        expect(this.scope.isContactSelected('12345')).to.be.false;
      });
    });

    describe('loadAddressBook() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should call $scope.selectAddressBook() then $scope.refreshContacts() methods', function(done) {
        this.scope.selectAddressBook = function(id) {
          expect(id).to.equal('12345');
          this.refreshContacts = done;
        };
        this.scope.loadAddressBook('12345');
      });
    });

    describe('selectAddressBook() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should set $scope.selected_addressbook to the addressbook id passed in argument', function() {
        this.scope.selectAddressBook({_id: '12345'});
        expect(this.scope.selected_addressbook).to.equal('12345');
      });
    });

    describe('selectContact() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should set $scope.contact to the contact passed in argument', function() {
        this.scope.selectContact({_id: '12345'});
        expect(this.scope.contact).to.deep.equal({_id: '12345'});
      });
    });

    describe('refreshContacts() method', function() {
     beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should reset $scope.contacts', function() {
        this.scope.contacts = [
          {_id: 'contact1'},
          {_id: 'contact2'}
        ];
        this.scope.refreshContacts();
        expect(this.scope.contacts).to.have.length(0);
      });

      describe('when selected_addressbook is set', function() {

        beforeEach(function() {
          this.scope.selected_addressbook = 'addressbook1';
        });

        it('should set scope.contactsRestActive to true', function() {
          expect(this.scope.contactsRestActive).to.be.false;
          this.scope.refreshContacts();
          expect(this.scope.contactsRestActive).to.be.true;
        });
        it('should call spinnerService.spin with key contactsSpinner', function(done) {
          this.spinner.spin = function(key) {
            expect(key).to.equal('contactsSpinner');
            done();
          };
          this.scope.refreshContacts();
        });
        it('should call contactAPI.getContacts with the right addressbook ID', function(done) {
          this.contactAPI.getContacts = function(options) {
            expect(options.addressbooks).to.be.an.array;
            expect(options.addressbooks).to.have.length(1);
            expect(options.addressbooks[0]).to.equal('addressbook1');
            done();
          };
          this.scope.refreshContacts();
        });

        describe('on contactAPI.getContacts success response', function() {

          beforeEach(function() {
            var self = this;

            this.getContactsFinally = function() {};
            this.contactAPI.getInvitations = function() {
              return {
                then: function() {}
              };
            };
            this.getContactsThen = function() {
              return {finally: self.getContactsFinally};
            };
            this.contactAPI.getContacts = function(options) {
              return {then: self.getContactsThen};
            };
          });

          it('should update scope.contacts with given response', function(done) {
            var response = [
              {_id: 'contact1'},
              {_id: 'contact2'}
            ];
            var self = this;

            this.scope.selected_addressbook = 'addressbook1';

            this.getContactsThen = function(onSuccess) {
              onSuccess({data: response});
              expect(self.scope.contacts).to.deep.equal(response);
              done();
            };

            this.scope.refreshContacts();
          });

        });

        describe('on contactAPI.getContacts error response', function() {
          beforeEach(function() {
            var self = this;

            this.getContactsFinally = function() {};
            this.getContactsThen = function() {
              return {finally: self.getContactsFinally};
            };
            this.contactAPI.getContacts = function(options) {
              return {then: self.getContactsThen};
            };
          });

          it('should call the scope.displayError method', function(done) {
            this.getContactsThen = function(f, onError) {
              onError({err: true});
            };

            this.scope.displayError = function(err) {
              expect(err).to.deep.equal({err: true});
              done();
            };
            this.scope.refreshContacts();
          });
        });
      });
    });

    describe('selectedAddressBookName method', function() {
      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));
      describe('when no addressbook is selected', function() {
        it('should return an empty string', function() {
          expect(this.scope.selectedAddressBookName()).to.equal('');
        });
      });
      describe('when an addressbook is selected', function() {
        it('should return the addressbook name after a lookup in scope.addressbooks', function() {
          this.scope.addressbooks = [
            {_id: 'addr1', name: 'addr1name'},
            {_id: 'addr2', name: 'addr2name'},
            {_id: 'addr3', name: 'addr3name'},
            {_id: 'addr4', name: 'addr4name'}
          ];

          this.scope.selected_addressbook = 'addr3';

          expect(this.scope.selectedAddressBookName()).to.equal('addr3name');
        });
      });
    });

    describe('selectedContactDisplayName method', function() {
      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));
      describe('when no contact is selected', function() {
        it('should return an empty string', function() {
          expect(this.scope.selectedContactDisplayName()).to.equal('');
        });
      });
      describe('when a contact is selected', function() {
        it('should return the given_name if any', function() {
          var contact = {
            given_name: 'contact1',
            emails: ['contact1@linagora.com']
          };
          expect(this.scope.selectedContactDisplayName(contact)).to.equal('contact1');
        });
        it('should return the first email if there is no given name', function() {
          var contact = {
            emails: ['contact1@linagora.com']
          };
          expect(this.scope.selectedContactDisplayName(contact)).to.equal('contact1@linagora.com');
        });
      });

    });

    describe('init() method', function() {
      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should set scope.restActive to true', function() {
        this.scope.init();
        expect(this.scope.restActive).to.be.true;
      });
      it('should call spinnerService.spin with key addressbooksSpinner', function(done) {
        this.spinner.spin = function(key) {
          expect(key).to.equal('addressbooksSpinner');
          done();
        };
        this.scope.init();
      });
      it('should call contactAPI.getAddressBooks', function(done) {
        this.contactAPI.getAddressBooks = function(options) {
          done();
        };
        this.scope.init();
      });
    });

    describe('isInvited() fn', function() {
      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should return false if contact is null', function() {
        expect(this.scope.isInvited()).to.be.false;
      });

      it('should return false if contact._id is null', function() {
        expect(this.scope.isInvited({})).to.be.false;
      });

      it('should return true if contact is already invited', function() {
        var id = 123;
        this.scope.invited = [{data: {contact_id: id}}];
        expect(this.scope.isInvited({_id: id})).to.be.true;
      });

      it('should return false if contact is not already invited', function() {
        this.scope.invited = [{data: {contact_id: 123}}];
        expect(this.scope.isInvited({_id: 456})).to.be.false;
      });
    });

    describe('sendInvitation() fn', function() {
      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.$controller('contactsController', {
          $scope: this.scope,
          $alert: this.alert,
          contactAPI: this.contactAPI,
          usSpinnerService: this.spinner,
          user: this.user
        });
      }));

      it('should not call contactAPI if contact is null', function(done) {
        this.contactAPI.sendInvitation = function() {
          return done(new Error());
        };

        this.scope.sendInvitation();
        done();
      });

      it('should not call contactAPI if contact emails is null', function(done) {
        this.contactAPI.sendInvitation = function() {
          return done(new Error());
        };

        this.scope.sendInvitation({});
        done();
      });

      it('should not call contactAPI if contact emails is empty', function(done) {
        this.contactAPI.sendInvitation = function() {
          return done(new Error());
        };

        this.scope.sendInvitation({emails: []});
        done();
      });

      it('should call contactAPI if contact emails is set', function(done) {
        this.contactAPI.sendInvitation = function() {
          return done();
        };

        this.scope.sendInvitation({emails: ['foo@bar.com']});
        done();
      });

      it('should push the contact ID in the invited array on success', function() {
        this.contactAPI.sendInvitation = function() {
          return $q.when({});
        };
        this.scope.sendInvitation({emails: ['foo@bar.com']});
        this.$rootScope.$digest();
        expect(this.scope.invited.length).to.equal(1);
      });

      it('should not push the contact ID in the invited array on error', function() {
        this.contactAPI.sendInvitation = function() {
          return $q.reject({});
        };
        this.scope.sendInvitation({emails: ['foo@bar.com']});
        this.$rootScope.$digest();
        expect(this.scope.invited.length).to.equal(0);
      });
    });
  });
});
