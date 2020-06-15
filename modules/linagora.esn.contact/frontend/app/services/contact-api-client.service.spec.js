'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contact Angular module contactapis', function() {
  beforeEach(angular.mock.module('linagora.esn.contact'));

  describe('The ContactAPIClient service', function() {
    var ICAL, contact;
    var ADDRESSBOOK_PATH = 'addressbooks';

    beforeEach(function() {
      var self = this;
      this.uuid4 = {
        // This is a valid uuid4. Change this if you need other uuids generated.
        _uuid: '00000000-0000-4000-a000-000000000000',
        generate: function() {
          return this._uuid;
        }
      };
      this.notificationFactory = {};
      this.contactUpdateDataService = {
        contactUpdatedIds: []
      };
      this.ContactShellBuilder = {
        populateAddressbook: function(contact) {
          return $q.when(contact);
        },
        fromCardListResponse: function() {
          return $q.when([]);
        },
        setAddressbookCache: function() {},
        fromCardSearchResponse: function() {
          return $q.when([]);
        }
      };

      contact = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last'};

      angular.mock.module(function($provide) {
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('uuid4', self.uuid4);
        $provide.value('contactUpdateDataService', self.contactUpdateDataService);
        $provide.value('ContactShellBuilder', self.ContactShellBuilder);
      });
    });

    beforeEach(angular.mock.inject(function($rootScope, $httpBackend, ContactAPIClient, ContactShell, ContactsHelper, AddressbookShell, DAV_PATH, GRACE_DELAY, _ICAL_) {
      this.$rootScope = $rootScope;
      this.$httpBackend = $httpBackend;
      this.ContactAPIClient = ContactAPIClient;
      this.ContactShell = ContactShell;
      this.AddressbookShell = AddressbookShell;
      this.DAV_PATH = DAV_PATH;
      this.GRACE_DELAY = GRACE_DELAY;
      this.ContactsHelper = ContactsHelper;

      ICAL = _ICAL_;

      this.getBookHomeUrl = function(bookId) {
        return [this.DAV_PATH, ADDRESSBOOK_PATH, bookId + '.json'].join('/');
      };

      this.getBookUrl = function(bookId, bookName) {
        return [this.DAV_PATH, ADDRESSBOOK_PATH, bookId, bookName + '.json'].join('/');
      };

      this.getVCardUrl = function(bookId, bookName, cardId) {
        return [this.DAV_PATH, ADDRESSBOOK_PATH, bookId, bookName, cardId + '.vcf'].join('/');
      };
    }));

    describe('The addressbookHome fn', function() {

      describe('The addressbook fn', function() {

        describe('The list fn', function() {

          it('should return list of addressbooks', function(done) {
            var bookId = '123';
            this.$httpBackend.expectGET(this.getBookHomeUrl(bookId)).respond({
              _links: {
                self: {
                  href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f.json'
                }
              },
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: {
                      href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/contacts.json'
                    }
                  },
                  'dav:name': 'Default Addressbook',
                  'carddav:description': 'Default Addressbook',
                  'dav:acl': ['dav:read', 'dav:write']
                }, {
                  _links: {
                    self: {
                      href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/1614422648.json'
                    }
                  },
                  'dav:name': 'Twitter addressbook',
                  'carddav:description': 'AddressBook for Twitter contacts',
                  'dav:acl': ['dav:read'],
                  acl: []
                }]
              }
            });

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook()
              .list()
              .then(function(addressbooks) {
                expect(addressbooks.length).to.equal(2);
                expect(addressbooks[0].name).to.equal('Default Addressbook');
                expect(addressbooks[1].name).to.equal('Twitter addressbook');
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });

        });

        describe('The get addressbook fn', function() {

          it('should return an AddressbookShell instance if success', function(done) {
            var bookId = '123';
            var bookName = '1614422648';
            this.$httpBackend.when('PROPFIND', this.getBookUrl(bookId, bookName)).respond({
              _links: {
                self: {
                  href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/1614422648.json'
                }
              },
              'dav:name': 'Twitter addressbook',
              'carddav:description': 'AddressBook for Twitter contacts',
              'dav:acl': ['dav:read']
            });

            var AddressbookShell = this.AddressbookShell;
            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .get()
              .then(function(addressbook) {
                expect(addressbook).to.be.instanceof(AddressbookShell);
                expect(addressbook).to.shallowDeepEqual({
                  bookName: bookName,
                  name: 'Twitter addressbook',
                  description: 'AddressBook for Twitter contacts'
                });
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });

        });

        describe('The vcard fn', function() {

          describe('The get fn', function() {

            var defaultResponse = ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', 'myuid'],
              ['fn', {}, 'text', 'first last'],
              ['n', {}, 'text', ['last', 'first']],
              ['email', {type: 'Work'}, 'text', 'mailto:foo@example.com'],
              ['tel', {type: 'Work'}, 'uri', 'tel:123123'],
              ['adr', {type: 'Home'}, 'text', ['', '', 's', 'c', '', 'z', 'co']],
              ['org', {}, 'text', 'org'],
              ['url', {}, 'uri', 'http://linagora.com'],
              ['role', {}, 'text', 'role'],
              ['socialprofile', {type: 'Twitter'}, 'text', '@AwesomePaaS'],
              ['categories', {}, 'text', 'starred', 'asdf'],
              ['bday', {}, 'date', '2015-01-01'],
              ['nickname', {}, 'text', 'nick'],
              ['note', {}, 'text', 'notes'],
              ['photo', {}, 'text', 'data:image/png;base64,iVBOR=']
            ], []];

            it('should return a contact', function(done) {
              var bookId = '123';
              var bookName = 'bookName';
              var cardId = '456';
              var expectPath = this.getVCardUrl(bookId, bookName, cardId);
              this.$httpBackend.expectGET(expectPath).respond(
                defaultResponse,
                {ETag: 'testing-tag'}
              );

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(cardId)
                .get()
                .then(function(contact) {
                  expect(contact).to.be.an('object');
                  expect(contact.id).to.equal('myuid');

                  expect(contact.vcard).to.be.an('object');
                  expect(contact.etag).to.equal('testing-tag');

                  expect(contact.firstName).to.equal('first');
                  expect(contact.lastName).to.equal('last');
                  expect(contact.displayName).to.equal('first last');
                  expect(contact.emails).to.deep.equal([{type: 'Work', value: 'foo@example.com'}]);
                  expect(contact.addresses).to.deep.equal([{
                    type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co'
                  }]);
                  expect(contact.org).to.equal('org');
                  expect(contact.urls).to.eql([{value: 'http://linagora.com'}]);
                  expect(contact.orgRole).to.equal('role');
                  expect(contact.social).to.deep.equal([{type: 'Twitter', value: '@AwesomePaaS'}]);
                  expect(contact.tags).to.deep.equal([{text: 'asdf'}]);
                  expect(contact.starred).to.be.true;
                  expect(contact.birthday).to.equalDate(new Date(2015, 0, 1));
                  expect(contact.nickname).to.equal('nick');
                  expect(contact.notes).to.equal('notes');
                  expect(contact.photo).to.equal('data:image/png;base64,iVBOR=');
                }).finally(done);

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should return a contact with no photo if not defined in vCard', function(done) {
              var bookId = '123';
              var bookName = 'bookName';
              var cardId = '456';
              var expectPath = this.getVCardUrl(bookId, bookName, cardId);
              this.$httpBackend.expectGET(expectPath).respond(
                ['vcard', [
                  ['version', {}, 'text', '4.0'],
                  ['uid', {}, 'text', 'myuid']
                ], []]
              );

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(cardId)
                .get()
                .then(function(contact) {
                  expect(contact.photo).to.not.exist;
                }).finally(done);

              this.$httpBackend.flush();
            });

            it('should have contact with default avatar forced reload', function(done) {
              var bookId = '123';
              var bookName = 'bookName';
              var cardId = '456';
              var expectPath = this.getVCardUrl(bookId, bookName, cardId);
              this.$httpBackend.expectGET(expectPath).respond(
                ['vcard', [
                  ['version', {}, 'text', '4.0'],
                  ['uid', {}, 'text', 'myuid'],
                  ['photo', {}, 'uri', 'http://abc.com/contact/api/contacts/123/456/avatar']
                ]
                ]
              );

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(cardId)
                .get()
                .then(function(contact) {
                  expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
                  done();
                });

              this.$httpBackend.flush();
            });

            it('should return a contact with a string birthday if birthday is not a date', function(done) {
              var bookId = '123';
              var bookName = 'bookName';
              var cardId = '456';
              var expectPath = this.getVCardUrl(bookId, bookName, cardId);
              this.$httpBackend.expectGET(expectPath).respond(
                ['vcard', [
                  ['bday', {}, 'text', 'a text birthday']
                ], []],
                {ETag: 'testing-tag'}
              );

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(cardId)
                .get()
                .then(function(contact) {
                  expect(contact.birthday).to.equal('a text birthday');
                }).finally(done);

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

          });

          describe('The list fn', function() {
            var bookId = '5375de4bd684db7f6fbd4f97';
            var bookName = 'bookName';
            var userId = '123456789';
            var uid = 'myuid';
            var contactsURL;
            var result, options;

            beforeEach(function() {
              options = {};
              contactsURL = this.getBookUrl(bookId, bookName);
              result = {
                _links: {
                  self: {
                    href: ''
                  }
                },
                'dav:syncToken': 6,
                _embedded: {
                  'dav:item': [
                    {
                      _links: {
                        self: '/addressbooks/5375de4bd684db7f6fbd4f97/bookName/myuid.vcf'
                      },
                      etag: '\'6464fc058586fff85e3522de255c3e9f\'',
                      data: [
                        'vcard',
                        [
                          ['version', {}, 'text', '4.0'],
                          ['uid', {}, 'text', uid],
                          ['n', {}, 'text', ['Burce', 'Willis', '', '', '']]
                        ]
                      ]
                    }
                  ]
                }
              };
            });

            it('should list cards', function(done) {
              var shells = [{shell: 1}, {shell: 2}];

              this.$httpBackend.expectGET(contactsURL + '?sort=fn').respond(result);

              this.ContactShellBuilder.fromCardListResponse = function() {
                return $q.when(shells);
              };

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .list()
                .then(function(data) {
                  expect(data.data).deep.equal(shells);
                }).finally(done);

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should call the backend with right parameters', function(done) {
              options.paginate = true;
              options.page = 1;
              options.limit = 10;
              options.userId = userId;
              var url = contactsURL + '?limit=10&offset=0&sort=fn&userId=' + userId;
              this.$httpBackend.expectGET(url).respond(result);
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .list(options)
                .then(function() {
                  done();
                }, done);

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should return next_page when not reached last_page', function(done) {
              result._links.next = true;
              options.paginate = true;
              options.limit = 10;
              options.userId = userId;
              var url = contactsURL + '?limit=10&offset=0&sort=fn&userId=' + userId;
              this.$httpBackend.expectGET(url).respond(result);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .list(options)
                .then(function(data) {
                  expect(data.next_page).to.equal(2);
                  done();
                });
              this.$httpBackend.flush();
              this.$rootScope.$apply();
            });

            it('should not return next_page when reached last_page', function(done) {
              result._links.next = false;
              options.paginate = true;
              options.limit = 10;
              options.userId = userId;
              var url = contactsURL + '?limit=10&offset=0&sort=fn&userId=' + userId;
              this.$httpBackend.expectGET(url).respond(result);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .list(options)
                .then(function(data) {
                  expect(data.next_page).to.not.be.defined;
                  done();
                });
              this.$httpBackend.flush();
              this.$rootScope.$apply();
            });

          });

          describe('The search fn', function() {

            var bookId = '123';
            var bookName = 'bookName';

            it('should call sent HTTP request to backend with the right parameters', function() {
              var expectPath = this.getBookHomeUrl(bookId) + '/contacts?limit=20&page=5&search=linagora';
              this.$httpBackend.expectGET(expectPath).respond(200, { _links: { self: { href: '' }}});

              var searchOptions = {
                data: 'linagora',
                page: 5
              };
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .search(searchOptions);

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should return search result', function(done) {
              var shells = [1, 2, 3];
              var expectPath = this.getBookHomeUrl(bookId) + '/contacts?limit=20&page=5&search=linagora';
              var response = {
                _links: {
                  self: {
                    href: ''
                  }
                },
                _current_page: 1,
                _total_hits: 200,
                _embedded: {
                  'dav:item': [
                    {
                      _links: {
                        self: '/addressbooks/5375de4bd684db7f6fbd4f97/bookName/myuid.vcf'
                      },
                      etag: '\'6464fc058586fff85e3522de255c3e9f\'',
                      data: [
                        'vcard',
                        [
                          ['version', {}, 'text', '4.0'],
                          ['uid', {}, 'text', 'myuid'],
                          ['n', {}, 'text', ['Bruce', 'Willis', '', '', '']]
                        ]
                      ]
                    }
                  ]
                }
              };
              this.$httpBackend.expectGET(expectPath).respond(response);
              this.ContactShellBuilder.fromCardSearchResponse = function() {
                return $q.when(shells);
              };

              var searchOptions = {
                data: 'linagora',
                page: 5
              };
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .search(searchOptions)
                .then(function(result) {
                  expect(result.current_page).to.equal(response._current_page);
                  expect(result.total_hits).to.equal(response._total_hits);
                  expect(result.data.length).to.equal(shells.length);
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should return next_page when not reached last_page', function(done) {
              var shells = [1, 2, 3];
              var expectPath = this.getBookHomeUrl(bookId) + '/contacts?limit=20&page=1&search=linagora';
              var response = {
                _links: {
                  self: {
                    href: ''
                  },
                  next: {
                    href: 'foo/bar'
                  }
                },
                _current_page: 1,
                _total_hits: 200,
                _embedded: {
                  'dav:item': [
                    {
                      _links: {
                        self: '/addressbooks/5375de4bd684db7f6fbd4f97/bookName/myuid.vcf'
                      },
                      etag: '\'6464fc058586fff85e3522de255c3e9f\'',
                      data: [
                        'vcard',
                        [
                          ['version', {}, 'text', '4.0'],
                          ['uid', {}, 'text', 'myuid'],
                          ['n', {}, 'text', ['Bruce', 'Willis', '', '', '']]
                        ]
                      ]
                    }
                  ]
                }
              };
              this.$httpBackend.expectGET(expectPath).respond(response);
              this.ContactShellBuilder.fromCardSearchResponse = function() {
                return $q.when(shells);
              };

              var searchOptions = {
                data: 'linagora',
                page: 1
              };
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .search(searchOptions)
                .then(function(result) {
                  expect(result.next_page).to.equal(2);
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should not return next_page when reached last_page', function(done) {
              var shells = [1, 2, 3];
              var expectPath = this.getBookHomeUrl(bookId) + '/contacts?limit=20&page=1&search=linagora';
              var response = {
                _links: {
                  self: {
                    href: ''
                  }
                },
                _current_page: 1,
                _total_hits: 10,
                _embedded: {
                  'dav:item': [
                    {
                      _links: {
                        self: '/addressbooks/5375de4bd684db7f6fbd4f97/bookName/myuid.vcf'
                      },
                      etag: '\'6464fc058586fff85e3522de255c3e9f\'',
                      data: [
                        'vcard',
                        [
                          ['version', {}, 'text', '4.0'],
                          ['uid', {}, 'text', 'myuid'],
                          ['n', {}, 'text', ['Bruce', 'Willis', '', '', '']]
                        ]
                      ]
                    }
                  ]
                }
              };
              this.$httpBackend.expectGET(expectPath).respond(response);
              this.ContactShellBuilder.fromCardSearchResponse = function() {
                return $q.when(shells);
              };

              var searchOptions = {
                data: 'linagora',
                page: 1
              };
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .search(searchOptions)
                .then(function(result) {
                  expect(result.next_page).to.not.be.defined;
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

          });

          describe('The create fn', function() {

            var bookId = '123';
            var bookName = 'bookName';

            it('should generate ID by uuid4 if contact.id is not exist', function(done) {
              var cardId = '123';
              this.uuid4.generate = function() {
                return cardId;
              };
              var contact = {firstName: 'Alice'};
              this.$httpBackend.expectPUT(this.getVCardUrl(bookId, bookName, cardId)).respond(201);
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .create(contact)
                .then(function() {
                  expect(contact.id).to.equal(cardId);
                  done();
                }, done);
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should fail on 500 response status', function(done) {
              this.$httpBackend.expectPUT(this.getVCardUrl(bookId, bookName, contact.id)).respond(500, '');

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .create(contact)
                .then(null, function(response) {
                  expect(response.status).to.equal(500);
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should fail on a 2xx status that is not 201', function(done) {
              this.$httpBackend.expectPUT(this.getVCardUrl(bookId, bookName, contact.id)).respond(200, '');

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .create(contact).then(null, function(response) {
                expect(response.status).to.equal(200);
                done();
              });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should succeed when everything is correct', function(done) {
              this.$httpBackend.expectPUT(this.getVCardUrl(bookId, bookName, contact.id)).respond(201);
              this.$httpBackend.expectGET(this.getVCardUrl(bookId, bookName, contact.id)).respond(201,
                ['vcard', [
                  ['version', {}, 'text', '4.0'],
                  ['uid', {}, 'text', 'myuid']
                ], []]
              );

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard()
                .create(contact)
                .then(function(response) {
                  expect(response.status).to.equal(201);
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

          });

          describe('The update fn', function() {

            var bookId = '123';
            var bookName = 'bookName';
            var vcardUrl;

            beforeEach(function() {
              vcardUrl = this.getVCardUrl(bookId, bookName, contact.id);
            });

            beforeEach(function() {
              var vcard = new ICAL.Component('vcard');
              vcard.addPropertyWithValue('version', '4.0');
              vcard.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
              vcard.addPropertyWithValue('fn', 'test card');
              this.vcard = vcard;
            });

            it('should fail if status is 201', function(done) {
              this.$httpBackend.expectPUT(vcardUrl + '?graceperiod=8000').respond(201);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .update(contact)
                .then(null, function(response) {
                  expect(response.status).to.equal(201);
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should succeed on 202', function(done) {
              this.$httpBackend.expectPUT(vcardUrl + '?graceperiod=8000').respond(202, '', {'X-ESN-TASK-ID': 'taskId'});

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .update(contact)
                .then(function(taskId) {
                  expect(taskId).to.equal('taskId');
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should succeed on 204', function(done) {
              this.$httpBackend.expectPUT(vcardUrl + '?graceperiod=8000').respond(204, '', {'X-ESN-TASK-ID': 'taskId'});

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .update(contact)
                .then(function(taskId) {
                  expect(taskId).to.equal('taskId');
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should send etag as If-Match header', function(done) {
              var requestHeaders = {
                'Content-Type': 'application/vcard+json',
                Prefer: 'return=representation',
                'If-Match': 'etag',
                Accept: 'application/json, text/plain, */*'
              };

              this.$httpBackend.expectPUT(vcardUrl + '?graceperiod=8000', function() {
                return true;
              }, requestHeaders).respond(202);

              contact.etag = 'etag';
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .update(contact)
                .then(function() {
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

          });

          describe('The remove fn', function() {

            var bookId = '123';
            var bookName = 'bookName';
            var vcardUrl;

            beforeEach(function() {
              vcardUrl = this.getVCardUrl(bookId, bookName, contact.id);
            });

            it('should pass the graceperiod as a query parameter if defined', function(done) {
              this.$httpBackend.expectDELETE(vcardUrl + '?graceperiod=1234').respond(204);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove({graceperiod: 1234})
                .then(function() {
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should fail on a status that is not 204 and not 202', function(done) {

              this.$httpBackend.expectDELETE(vcardUrl).respond(201);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove()
                .then(null, function(response) {
                  expect(response.status).to.equal(201);
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should succeed when response.status is 204', function(done) {

              this.$httpBackend.expectDELETE(vcardUrl).respond(204);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove()
                .then(function() {
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should succeed when response.status is 202', function(done) {

              this.$httpBackend.expectDELETE(vcardUrl).respond(202);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove()
                .then(function() {
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should send etag as If-Match header', function(done) {
              var requestHeaders = {
                'If-Match': 'etag',
                Accept: 'application/json, text/plain, */*'
              };

              this.$httpBackend.expectDELETE(vcardUrl, requestHeaders).respond(204);

              contact.etag = 'etag';
              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove({etag: 'etag'})
                .then(function() {
                  done();
                });

              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should resolve to the pending task identifier', function(done) {
              this.$httpBackend.expectDELETE(vcardUrl).respond(202, null, {'X-ESN-Task-Id': '1234'});

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove()
                .then(function(id) {
                  expect(id).to.equal('1234');
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

            it('should resolve to nothing on direct deletion', function(done) {
              this.$httpBackend.expectDELETE(vcardUrl).respond(204);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .remove()
                .then(function(response) {
                  expect(response).to.not.exist;
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });

          });

          describe('The move function', function() {
            it('should resolve if success', function(done) {
              var bookId = '123';
              var bookName = 'source';
              var destAddressbook = {
                bookId: '456',
                bookName: 'dest'
              };
              var options = { toBookId: destAddressbook.bookId, toBookName: destAddressbook.bookName };
              var vcardUrl = this.getVCardUrl(bookId, bookName, contact.id);
              var headers = {
                Accept: 'application/json, text/plain, */*',
                Destination: '/addressbooks/' + destAddressbook.bookId + '/' + destAddressbook.bookName + '/' + contact.id + '.vcf'
              };

              this.$httpBackend.expect('MOVE', vcardUrl, null, headers).respond(201);

              this.ContactAPIClient
                .addressbookHome(bookId)
                .addressbook(bookName)
                .vcard(contact.id)
                .move(options)
                .then(function() {
                  done();
                });
              this.$rootScope.$apply();
              this.$httpBackend.flush();
            });
          });
        });

        describe('The create addressbook function', function() {
          it('should return an AddressbookShell instance if success', function(done) {
            var AddressbookShell = this.AddressbookShell;
            var bookId = '123';
            var bookName = '456';
            var addressbook = {
              id: bookName,
              name: 'Custom addressbook',
              description: 'Addressbook for test',
              type: 'user'
            };

            this.$httpBackend.when('POST', this.getBookHomeUrl(bookId)).respond();
            this.$httpBackend.when('PROPFIND', this.getBookUrl(bookId, bookName)).respond({
              _links: {
                self: {
                  href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f.json'
                }
              },
              'dav:name': addressbook.name,
              'carddav:description': addressbook.description,
              'dav:acl': ['dav:read', 'dav:write'],
              type: 'user'
            });

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook()
              .create(addressbook)
              .then(function(createdAddressbook) {
                expect(createdAddressbook).to.be.instanceof(AddressbookShell);
                expect(createdAddressbook).to.shallowDeepEqual({
                  name: addressbook.name,
                  description: addressbook.description
                });
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });

        describe('The remove addressbook function', function() {
          it('should resolve if success', function(done) {
            var bookId = '123';
            var bookName = 'test';

            this.$httpBackend.when('DELETE', this.getBookUrl(bookId, bookName)).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .remove()
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });

        describe('The update addressbook function', function() {
          it('should resolve if success', function(done) {
            var bookId = '123';
            var bookName = 'test';
            var addressbook = {
              name: 'Modified name'
            };

            this.$httpBackend.when('PUT', this.getBookUrl(bookId, bookName)).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .update(addressbook)
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });

        describe('The acceptShare addressbook function', function() {
          it('should call to right endpoint to accept share invite', function(done) {
            var bookId = '123';
            var bookName = 'test';
            var options = {};

            this.$httpBackend.when('POST', this.getBookUrl(bookId, bookName), {
              'dav:invite-reply': {
                'dav:invite-accepted': true
              }
            }).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .acceptShare(options)
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });

          it('should support options.displayname to set new resource name', function(done) {
            var bookId = '123';
            var bookName = 'test';
            var options = {
              displayname: 'new resource name'
            };

            this.$httpBackend.when('POST', this.getBookUrl(bookId, bookName), {
              'dav:invite-reply': {
                'dav:invite-accepted': true,
                'dav:slug': options.displayname
              }
            }).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .acceptShare(options)
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });

        describe('The declineShare addressbook function', function() {
          it('should call to right endpoint to decline share invite', function(done) {
            var bookId = '123';
            var bookName = 'test';
            var options = {};

            this.$httpBackend.when('POST', this.getBookUrl(bookId, bookName), {
              'dav:invite-reply': {
                'dav:invite-accepted': false
              }
            }).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .declineShare(options)
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });

        describe('The updatePublicRight addressbook function', function() {
          it('should call to right endpoint to publish addressbook when public right is provided', function(done) {
            var bookId = '123';
            var bookName = 'test';

            this.$httpBackend.when('POST', this.getBookUrl(bookId, bookName), {
              'dav:publish-addressbook': {
                privilege: '{DAV:}read'
              }
            }).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .updatePublicRight('{DAV:}read')
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });

          it('should call to right endpoint to unpublish addressbook when public right is not provided', function(done) {
            var bookId = '123';
            var bookName = 'test';

            this.$httpBackend.when('POST', this.getBookUrl(bookId, bookName), {
              'dav:unpublish-addressbook': true
            }).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .updatePublicRight()
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });

        describe('The updateMembersRight function', function() {
          it('should call to right endpoint to update members right', function(done) {
            var bookId = '123';
            var bookName = 'test';

            this.$httpBackend.when('POST', this.getBookUrl(bookId, bookName), {
              'dav:group-addressbook': {
                privileges: ['{DAV:}read']
              }
            }).respond({});

            this.ContactAPIClient
              .addressbookHome(bookId)
              .addressbook(bookName)
              .updateMembersRight(['{DAV:}read'])
              .then(function() {
                done();
              }, done);

            this.$rootScope.$apply();
            this.$httpBackend.flush();
          });
        });
      });

      describe('The search function', function() {
        var bookId = '123';

        it('should call sent HTTP request to backend with the right parameters', function() {
          var expectPath = this.getBookHomeUrl(bookId) + '/contacts?limit=20&page=5&search=linagora';
          this.$httpBackend.expectGET(expectPath).respond(200, { _links: { self: { href: '' }}});

          var searchOptions = {
            data: 'linagora',
            page: 5
          };
          this.ContactAPIClient
            .addressbookHome(bookId)
            .search(searchOptions);

          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });

        it('should return search result', function(done) {
          var shells = [1, 2, 3];
          var expectPath = this.getBookHomeUrl(bookId) + '/contacts?limit=20&page=5&search=linagora';
          var response = {
            _links: { self: { href: '' }},
            _current_page: 1,
            _total_hits: 200,
            _embedded: {
              'dav:item': [
                {
                  _links: {
                    self: '/addressbooks/5375de4bd684db7f6fbd4f97/bookName/myuid.vcf'
                  },
                  etag: '\'6464fc058586fff85e3522de255c3e9f\'',
                  data: [
                    'vcard',
                    [
                      ['version', {}, 'text', '4.0'],
                      ['uid', {}, 'text', 'myuid'],
                      ['n', {}, 'text', ['Bruce', 'Willis', '', '', '']]
                    ]
                  ]
                }
              ]
            }
          };
          this.$httpBackend.expectGET(expectPath).respond(response);
          this.ContactShellBuilder.fromCardSearchResponse = function() {
            return $q.when(shells);
          };

          var searchOptions = {
            data: 'linagora',
            page: 5
          };
          this.ContactAPIClient
            .addressbookHome(bookId)
            .search(searchOptions)
            .then(function(result) {
              expect(result.current_page).to.equal(response._current_page);
              expect(result.total_hits).to.equal(response._total_hits);
              expect(result.data.length).to.equal(shells.length);
              done();
            });

          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });
      });
    });

  });
});
