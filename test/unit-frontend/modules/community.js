'use strict';

/* global chai: false */

var expect = chai.expect;

describe.skip('The Community Angular module', function() {
  beforeEach(angular.mock.module('esn.community'));

  describe('The communityMembersController controller', function() {

    beforeEach(angular.mock.inject(function($controller, $q, $rootScope) {
      var self = this;
      this.$q = $q;
      this.collaborationAPI = {};
      this.defer = this.$q.defer();
      this.collaborationAPI.getMembers = function(id, opts) {
        return self.defer.promise;
      };
      this.usSpinnerService = {};
      this.usSpinnerService.spin = function(id) {};
      this.usSpinnerService.stop = function(id) {};
      this.$controller = $controller;
      this.scope = $rootScope.$new();
      this.scope.community = {_id: 123};
      this.scope.restActive = true;

      $controller('communityMembersController', {
        $scope: this.scope,
        collaborationAPI: this.collaborationAPI,
        $routeParams: this.$routeParams,
        usSpinnerService: this.usSpinnerService
      });

    }));

    describe('init function', function() {

      beforeEach(function() {
        this.scope.restActive = false;
      });

      it('should call the api and update the members array', function(done) {
        var u1 = { user: { _id: 1, emails: ['a@example.com'] } };
        var u2 = { user: { _id: 2, emails: ['b@example.com'] } };
        var u3 = { user: { _id: 3, emails: ['c@example.com'] } };
        this.defer.resolve({data: [u1, u2, u3], headers: function() { return 10;}});
        this.scope.$digest();
        expect(Object.keys(this.scope.internalMembers).length).to.equal(3);
        expect(this.scope.total).to.equal(10);
        done();
      });

      it('should set error when the api call fails', function(done) {
        this.defer.reject({data: [1, 2, 3], headers: function() { return 10;}});
        this.scope.$digest();
        expect(this.scope.error).to.be.true;
        done();
      });

      describe('when request running', function() {
        beforeEach(function() {
          this.scope.restActive = true;
        });

        it('should not call the community API', function(done) {
          this.collaborationAPI.getMembers = function() {
            return done(new Error());
          };
          this.scope.init();
          done();
        });
      });
    });

    describe('loadMoreElements function', function() {
      beforeEach(function() {
        this.scope.restActive = true;
      });

      it('should call the API when scope.offset is 0', function(done) {
        this.scope.restActive = false;
        this.scope.offset = 0;
        this.collaborationAPI.getMembers = function() {
          return done();
        };
        this.scope.$digest();
        this.scope.loadMoreElements();
      });

      it('should call the API when not all members are loaded', function(done) {
        this.scope.total = 10;
        this.scope.offset = 2;
        this.scope.restActive = false;
        this.collaborationAPI.getMembers = function() {
          return done();
        };
        this.scope.$digest();
        this.scope.loadMoreElements();
      });

      it('should call the API with valid offset', function(done) {
        this.scope.total = 10;
        this.scope.offset = 2;
        this.scope.restActive = false;
        this.collaborationAPI.getMembers = function(id, options) {
          expect(options.offset).to.equal(2);
          return done();
        };
        this.scope.$digest();
        this.scope.loadMoreElements();
      });
    });
  });

  describe('communityAPI service', function() {

    describe('list() function', function() {
      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.userId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET to /communities?domain_id=:id', function() {
        this.$httpBackend.expectGET('/communities?domain_id=' + this.domainId).respond(200, []);
        this.communityAPI.list(this.domainId);
        this.$httpBackend.flush();
      });

      it('should send a GET to /communities?creator=:user_id&domain_id=:id', function() {
        var options = {creator: this.userId};
        this.$httpBackend.expectGET('/communities?creator=' + this.userId + '&domain_id=' + this.domainId).respond(200, []);
        this.communityAPI.list(this.domainId, options);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.list();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('get() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        this.response = {_id: 123, title: 'Node.js'};
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /communities/:uuid', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId).respond(200, this.response, this.headers);
        this.communityAPI.get(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.get(this.communityId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('del() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a DEL request to /communities/:uuid', function() {
        this.$httpBackend.expectDELETE('/communities/' + this.communityId).respond(204);
        this.communityAPI.del(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.del(this.communityId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('create() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a POST request to /communities', function() {
        var community = {};
        this.$httpBackend.expectPOST('/communities', community).respond(202);
        this.communityAPI.create(community);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.create({});
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getMembers() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /communities/:id/members', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/members').respond(200, []);
        this.communityAPI.getMembers(this.communityId);
        this.$httpBackend.flush();
      });

      it('should send a GET request to /communities/:id/members?limit=X&offset=Y', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/members?limit=10&offset=2').respond(200, []);
        this.communityAPI.getMembers(this.communityId, {limit: 10, offset: 2});
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.getMembers(123);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getMember() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        this.userId = '456';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /communities/:id/members/:user', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/members/' + this.userId).respond(200, {});
        this.communityAPI.getMember(this.communityId, this.userId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.getMember(123, 456);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('join() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        this.userId = '456';
        Restangular.setFullResponse(true);
      }));

      it('should send a PUT request to /communities/:id/members/:user', function() {
        this.$httpBackend.expectPUT('/communities/' + this.communityId + '/members/' + this.userId).respond(204);
        this.communityAPI.join(this.communityId, this.userId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.join(123, 456);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('leave() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        this.userId = '456';
        Restangular.setFullResponse(true);
      }));

      it('should send a DELETE request to /communities/:id/members/:user', function() {
        this.$httpBackend.expectDELETE('/communities/' + this.communityId + '/members/' + this.userId).respond(204);
        this.communityAPI.leave(this.communityId, this.userId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.leave(123, 456);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getRequestMemberships() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /communities/:id/membership', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/membership').respond(200, []);
        this.communityAPI.getRequestMemberships(this.communityId);
        this.$httpBackend.flush();
      });

      it('should send a GET request to /communities/:id/membership?limit=X&offset=Y', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/membership?limit=10&offset=2').respond(200, []);
        this.communityAPI.getRequestMemberships(this.communityId, {limit: 10, offset: 2});
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.getRequestMemberships(123);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getInvitablePeople() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /communities/:id/invitablepeople', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/invitablepeople').respond(200, []);
        this.communityAPI.getInvitablePeople(this.communityId);
        this.$httpBackend.flush();
      });

      it('should send a GET request to /communities/:id/membership?limit=X&offset=Y', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId + '/invitablepeople?limit=5&search=query').respond(200, []);
        this.communityAPI.getInvitablePeople(this.communityId, {limit: 5, search: 'query'});
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.getInvitablePeople(123);
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('communityCreateController controller', function() {

    var create;

    beforeEach(inject(['$document', '$rootScope', '$controller', '$q', '$compile', 'selectionService', function($document, $rootScope, $controller, $q, $compile, selectionService) {
      this.communityAPI = {};
      this.location = {};
      this.log = {
        error: function() {
        }
      };
      this.modal = function() {};
      this.alert = function() {};
      this.session = {domain: {_id: 123}};
      this.scope = $rootScope.$new();
      this.scope.createStatus = {};
      this.$q = $q;
      this.$upload = {};
      this.selectionService = selectionService;
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$timeout = function(cb) {return cb();};

      create = document.createElement;

      $controller('communityCreateController', {
        $rootScope: this.$rootScope,
        $scope: this.scope,
        $location: this.location,
        $timeout: this.$timeout,
        $log: this.log,
        $modal: this.modal,
        $alert: this.alert,
        session: this.session,
        communityAPI: this.communityAPI,
        $upload: this.$upload,
        selectionService: this.selectionService
      });
    }]));

    afterEach(function() {
      document.createElement = create;
    });

    it('should call the communityAPI#create function when $scope.create is called', function(done) {
      this.communityAPI.create = function() {
        done();
      };
      this.scope.create({title: 'Node.js', domain_ids: ['1234']});
    });

    it('should not call the communityAPI#create function when $scope.create is called without community title', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.communityAPI.create = function() {
        done(new Error());
      };
      this.scope.create({domain_ids: ['1234']});
    });

    it('should not call the communityAPI#create function when $scope.create is called without domain_ids', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.communityAPI.create = function() {
        done(new Error());
      };
      this.scope.create({title: 'Node.js'});
    });

    it('should not call the communityAPI#create function when $scope.create is called with empty domain_ids', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.communityAPI.create = function() {
        done(new Error());
      };
      this.scope.create({title: 'Node.js', domain_ids: []});
    });

    it('should change $location.path when call to the communityAPI#create is successful', function(done) {
      this.location.path = function(path) {
        expect(path).to.equal('/communities/123');
        return done();
      };
      var communityDefer = this.$q.defer();
      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: {_id: 123, title: 'Node.js'}});
      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });

    it('should display error when call to the communityAPI#create is not successful', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.location.path = function(path) {
        return done(new Error());
      };
      var communityDefer = this.$q.defer();
      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.reject({error: 500});
      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });

    describe('isTitleEmpty method', function() {
      it('should return true for undefined title', function(done) {
        this.scope.community = {};
        expect(this.scope.isTitleEmpty()).to.be.true;
        done();
      });

      it('should return true for empty title', function(done) {
        this.scope.community = {title: ''};
        expect(this.scope.isTitleEmpty()).to.be.true;
        done();
      });

      it('should return false for a non empty title', function(done) {
        this.scope.community = {title: 'node.js'};
        expect(this.scope.isTitleEmpty()).to.be.false;
        done();
      });
    });

    describe('isTitleInvalid method', function() {
      it('should return false if there is no error', function(done) {
        this.scope.validationError = {
          unique: false
        };
        this.scope.communityForm = {
          title: {
            $error: {
              unique: false
            }
          }
        };
        expect(this.scope.isTitleInvalid()).to.be.false;
        done();
      });

      it('should return true is there is an error from sync check', function(done) {
        this.scope.validationError = {
          unique: true
        };
        this.scope.communityForm = {
          title: {
            $error: {
              unique: false
            }
          }
        };
        expect(this.scope.isTitleInvalid()).to.be.true;
        done();
      });

      it('should return true if there is an error from live check', function(done) {
        this.scope.validationError = {
          unique: false
        };
        this.scope.communityForm = {
          title: {
            $error: {
              unique: true
            }
          }
        };
        expect(this.scope.isTitleInvalid()).to.be.true;
        done();
      });
    });

    describe('validateStep0 method', function() {
      it('should not call communityAPI if $scope.titleValidationRunning is true', function() {
        this.communityAPI.list = function() {
          expect(false).to.be.true;
        };
        this.scope.titleValidationRunning = true;
        this.scope.validateStep0();
      });

      it('should call communityAPI if $scope.titleValidationRunning is false', function(done) {
        this.scope.community = {title: 'node.js'};
        var self = this;
        this.communityAPI.list = function(domainId, options) {
          expect(domainId).to.equal(self.session.domain._id);
          expect(options).to.exist;
          expect(options.title).to.exist;
          expect(options.title).to.equal(self.scope.community.title);
          done();
        };
        this.scope.titleValidationRunning = false;
        this.scope.validateStep0();
      });

      it('should set an error if communityAPI.list call fails', function() {
        this.scope.community = {title: 'node.js'};
        this.scope.validationError = {};
        this.communityAPI.list = function() {
          return {
            then: function(responseCallback, errorCallback) {
              errorCallback('error');
            }
          };
        };
        this.scope.titleValidationRunning = false;
        this.scope.validateStep0();
        expect(this.scope.validationError.ajax).to.exist;
        expect(this.scope.validationError.unique).to.not.exist;
      });

      it('should display an error if communityAPI.list return non empty result', function() {
        this.scope.community = {title: 'node.js'};
        this.scope.validationError = {};
        this.communityAPI.list = function() {
          return {
            then: function(responseCallback) {
              var response = {
                data: [{_id: 'community1'}, {_id: 'community2'}]
              };
              responseCallback(response);
            }
          };
        };
        this.scope.titleValidationRunning = false;
        this.scope.validateStep0();
        expect(this.scope.validationError.ajax).to.not.exist;
        expect(this.scope.validationError.unique).to.exist;
      });

      it('should move to wizard step 1 if communityAPI.list return an empty result', function() {
        this.scope.community = {title: 'node.js'};
        this.communityAPI.list = function() {
          return {
            then: function(responseCallback) {
              var response = {
                data: []
              };
              responseCallback(response);
            }
          };
        };
        this.scope.titleValidationRunning = false;
        this.scope.validateStep0();
        expect(this.scope.step).to.equal(1);
      });

    });


    it('should transform the image to blob', function(done) {
      var img = {img: 'test'};
      this.selectionService.setImage(img);
      this.selectionService.broadcastSelection({cords: {x: 2, y: 2, w: 3, h: 3}});

      var element = this.$compile('<canvas>')(this.scope);
      var document = element[0].ownerDocument;

      document.createElement = function() {
        return {
          getContext: function() {
            return {
              drawImage: function() {return;}
            };
          },
          toBlob: function() {
            return done();
          }
        };
      };

      var communityDefer = this.$q.defer();
      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: {_id: 123, title: 'Node.js'}});
      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });

    it('should upload the blob when community is created', function(done) {
      var img = {img: 'test'};
      this.selectionService.setImage(img);
      this.selectionService.broadcastSelection({cords: {x: 2, y: 2, w: 3, h: 3}});

      var element = this.$compile('<canvas>')(this.scope);
      var document = element[0].ownerDocument;

      document.createElement = function() {
        return {
          getContext: function() {
            return {
              drawImage: function() {return;}
            };
          },
          toBlob: function(callback) {
            var blob = 'ImageBlob';
            return callback(blob);
          }
        };
      };

      var communityDefer = this.$q.defer();
      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: {_id: 123, title: 'Node.js'}});
      this.communityAPI.uploadAvatar = function() {
        return done();
      };
      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });

    it('should redirect to community when the avatar is uploaded', function(done) {
      var img = {img: 'test'};
      this.selectionService.setImage(img);
      this.selectionService.broadcastSelection({cords: {x: 2, y: 2, w: 3, h: 3}});

      var element = this.$compile('<canvas>')(this.scope);
      var document = element[0].ownerDocument;

      document.createElement = function() {
        return {
          getContext: function() {
            return {
              drawImage: function() {return;}
            };
          },
          toBlob: function(callback) {
            var blob = 'ImageBlob';
            return callback(blob);
          }
        };
      };

      var communityDefer = this.$q.defer();
      var uploadDefer = this.$q.defer();
      var promise = uploadDefer.promise;
      var config = {};
      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      promise.progress = function(fn) {
        promise.then(null, null, function(update) {
          fn(update);
        });
        return promise;
      };

      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: {_id: 123, title: 'Node.js'}});

      this.communityAPI.uploadAvatar = function() {
        return promise;
      };

      uploadDefer.resolve({data: {_id: 456}});

      this.location.path = function() {
        return done();
      };

      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });

    it('should redirect to community when the avatar upload fails', function(done) {
      var img = {img: 'test'};
      this.selectionService.setImage(img);
      this.selectionService.broadcastSelection({cords: {x: 2, y: 2, w: 3, h: 3}});

      var element = this.$compile('<canvas>')(this.scope);
      var document = element[0].ownerDocument;

      document.createElement = function() {
        return {
          getContext: function() {
            return {
              drawImage: function() {return;}
            };
          },
          toBlob: function(callback) {
            var blob = 'ImageBlob';
            return callback(blob);
          }
        };
      };

      var communityDefer = this.$q.defer();
      var uploadDefer = this.$q.defer();
      var promise = uploadDefer.promise;
      var config = {};
      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      promise.progress = function(fn) {
        promise.then(null, null, function(update) {
          fn(update);
        });
        return promise;
      };

      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: {_id: 123, title: 'Node.js'}});

      this.communityAPI.uploadAvatar = function() {
        return promise;
      };

      uploadDefer.reject({data: {_id: 456}});

      this.location.path = function() {
        return done();
      };

      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });
  });

  describe('communitiesController controller', function() {
    beforeEach(inject(function($rootScope, $controller, $q) {
      this.communityAPI = {
        list: function() {
          return {
            then: function() {
              return {
                finally: function() {}
              };
            }
          };
        }
      };
      this.userAPI = {
        getCommunities: function() {
          return {
            then: function() {
              return {
                finally: function() {
                }
              };
            }
          };
        }
      };
      this.domain = {_id: 123};
      this.user = {_id: 456};
      this.scope = $rootScope.$new();
      this.$q = $q;
      this.log = {
        error: function() {
        }
      };
      this.location = {};

      $controller('communitiesController', {
        $scope: this.scope,
        $log: this.log,
        $location: this.location,
        domain: this.domain,
        user: this.user,
        communityAPI: this.communityAPI,
        userAPI: this.userAPI
      });
    }));

    describe('getAll() method', function() {
      it('should call communityAPI#list', function(done) {
        this.communityAPI.list = function() {
          return done();
        };
        this.scope.getAll();
      });

      it('should set the $scope.communities with communityAPI#list result', function(done) {
        var result = [{_id: 123}, {_id: 234}];
        var communityDefer = this.$q.defer();
        this.communityAPI.list = function() {
          return communityDefer.promise;
        };
        communityDefer.resolve({data: result});
        this.scope.getAll();
        this.scope.$digest();
        expect(this.scope.communities).to.deep.equal(result);
        done();
      });

      it('should set $scope.error to true when communityAPI#list fails', function(done) {
        var communityDefer = this.$q.defer();
        this.communityAPI.list = function() {
          return communityDefer.promise;
        };
        communityDefer.reject({err: 'failed'});
        this.scope.getAll();
        this.scope.$digest();
        expect(this.scope.error).to.be.true;
        done();
      });

      it('should set $scope.selected to all', function(done) {
        var communityDefer = this.$q.defer();
        this.communityAPI.list = function() {
          return communityDefer.promise;
        };
        communityDefer.reject({err: 'failed'});
        this.scope.getAll();
        this.scope.$digest();
        expect(this.scope.selected).to.equal('all');
        done();
      });
    });

    describe('getModerator() method', function() {
      it('should call communityAPI#list fn', function(done) {
        this.communityAPI.list = function() {
          return done();
        };
        this.scope.getModerator();
      });

      it('should set the $scope.communities with communityAPI#list result', function(done) {
        var result = [{_id: 123}, {_id: 234}];
        var communityDefer = this.$q.defer();
        this.communityAPI.list = function() {
          return communityDefer.promise;
        };
        communityDefer.resolve({data: result});
        this.scope.getModerator();
        this.scope.$digest();
        expect(this.scope.communities).to.deep.equal(result);
        done();
      });

      it('should set $scope.error to true when communityAPI#list fails', function(done) {
        var communityDefer = this.$q.defer();
        this.communityAPI.list = function() {
          return communityDefer.promise;
        };
        communityDefer.reject({err: 'failed'});
        this.scope.getModerator();
        this.scope.$digest();
        expect(this.scope.error).to.be.true;
        done();
      });

      it('should set $scope.selected to moderator', function(done) {
        var communityDefer = this.$q.defer();
        this.communityAPI.list = function() {
          return communityDefer.promise;
        };
        communityDefer.reject({err: 'failed'});
        this.scope.getModerator();
        this.scope.$digest();
        expect(this.scope.selected).to.equal('moderator');
        done();
      });
    });

    describe('getMembership() method', function() {
      it('should call userAPI#getCommunities fn', function(done) {
        this.userAPI.getCommunities = function() {
          return done();
        };
        this.scope.getMembership();
      });

      it('should set the $scope.communities with userAPI#getCommunities result', function(done) {
        var result = [{_id: 123}, {_id: 234}];
        var communityDefer = this.$q.defer();
        this.userAPI.getCommunities = function() {
          return communityDefer.promise;
        };
        communityDefer.resolve({data: result});
        this.scope.getMembership();
        this.scope.$digest();
        expect(this.scope.communities).to.deep.equal(result);
        done();
      });

      it('should set $scope.error to true when userAPI#getCommunities fails', function(done) {
        var communityDefer = this.$q.defer();
        this.userAPI.getCommunities = function() {
          return communityDefer.promise;
        };
        communityDefer.reject({err: 'failed'});
        this.scope.getMembership();
        this.scope.$digest();
        expect(this.scope.error).to.be.true;
        done();
      });

      it('should set $scope.selected to membership', function(done) {
        var communityDefer = this.$q.defer();
        this.userAPI.getCommunities = function() {
          return communityDefer.promise;
        };
        communityDefer.reject({err: 'failed'});
        this.scope.getMembership();
        this.scope.$digest();
        expect(this.scope.selected).to.equal('membership');
        done();
      });
    });

    describe('joinSuccess() method', function() {
      it('should redirect to the /communities/:id URI', function(done) {
        this.location.path = function(uri) {
          expect(uri).to.equal('/communities/community1');
          done();
        };
        this.scope.joinSuccess({_id: 'community1'});
      });
    });

    describe('leaveSuccess() method', function() {
      it('should call communityAPI.get(:id)', function(done) {
        var communityDefer = this.$q.defer();
        this.communityAPI.get = function(id) {
          expect(id).to.equal('community1');
          done();
          return communityDefer.promise;
        };
        this.scope.leaveSuccess({_id: 'community1'});
      });

      describe('communityAPI.get(:id) handler', function() {
        it('should update scope.communities with the new version of community', function() {
          this.scope.communities.push({_id: 'community5'});
          this.scope.communities.push({_id: 'community4'});
          this.scope.communities.push({_id: 'community3'});
          this.scope.communities.push({_id: 'community2'});
          this.scope.communities.push({_id: 'community1'});
          var communityDefer = this.$q.defer();

          this.communityAPI.get = function(id) {
            communityDefer.resolve({data: {_id: 'community3', updated: true}});
            return communityDefer.promise;
          };

          this.scope.leaveSuccess({_id: 'community3'});
          this.scope.$digest();
          expect(this.scope.communities).to.have.length(5);
          expect(this.scope.communities[0]).to.deep.equal({_id: 'community5'});
          expect(this.scope.communities[1]).to.deep.equal({_id: 'community4'});
          expect(this.scope.communities[2]).to.deep.equal({_id: 'community3', updated: true });
          expect(this.scope.communities[3]).to.deep.equal({_id: 'community2'});
          expect(this.scope.communities[4]).to.deep.equal({_id: 'community1'});
        });
      });

    });

  });

  describe('communityController controller', function() {

    beforeEach(inject(['$rootScope', '$controller', '$q', function($rootScope, $controller, $q) {
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.location = {};
      this.log = {error: function() {}, debug: function() {}};
      this.community = {_id: 'community1', memberOf: []};
      this.communityAPI = {};
      this.communityService = {};
      this.session = {domain: {_id: 'domain1'}, user: {_id: 'user1'}};
      this.$q = $q;
      this.memberOf = [];

      $controller('communityController', {
        $rootScope: this.$rootScope,
        $scope: this.scope,
        $location: this.location,
        $log: this.log,
        session: this.session,
        communityAPI: this.communityAPI,
        communityService: this.communityService,
        community: this.community,
        memberOf: this.memberOf
      });
    }]));

    describe('reload() method', function() {
      it('should call communityAPI.get(:id)', function(done) {
        var communityDefer = this.$q.defer();
        this.communityAPI.get = function(id) {
          expect(id).to.equal('community1');
          done();
          return communityDefer.promise;
        };
        this.scope.reload();
      });

      describe('communityAPI.get(:id) handler', function() {
        it('should update scope.community', function() {
          var communityDefer = this.$q.defer();
          this.communityAPI.get = function(id) {
            expect(id).to.equal('community1');
            communityDefer.resolve({data: {_id: 'community1', updated: true}});
            return communityDefer.promise;
          };
          this.scope.reload();
          this.scope.$digest();
          expect(this.scope.community).to.deep.equal({_id: 'community1', updated: true});
        });
      });

    });

    describe('onLeave() method', function() {
      it('should redirect to /communities', function() {
        this.location.path = function(where) {
          expect(where).to.equal('/communities');
        };
        this.scope.onLeave();
      });
    });

    describe('canRead() method', function() {
      it('should call communityService.canRead() method with the current scope community', function(done) {
        var comm = this.community;
        this.communityService.canRead = function(community) {
          expect(community).to.deep.equal(comm);
          done();
        };

        this.scope.canRead();
      });
    });

    describe('isCommunityMember() method', function() {
      it('should call communityService.isMember() method with the current scope community', function(done) {
        var comm = this.community;
        this.communityService.isMember = function(community) {
          expect(community).to.deep.equal(comm);
          done();
        };

        this.scope.isCommunityMember();
      });
    });

    describe('$rootScope collaboration:join event', function() {
      it('should not call the communityAPI if event msg is null', function(done) {
        this.communityAPI.get = function() {
          return done(new Error());
        };
        this.$rootScope.$emit('collaboration:join');
        this.$rootScope.$digest();
        done();
      });

      it('should not call the communityAPI if event msg.collaboration.id is not community._id', function(done) {
        this.communityAPI.get = function() {
          return done(new Error());
        };
        this.$rootScope.$emit('collaboration:join', {collaboration: {objectType: 'community', id: 456}});
        this.$rootScope.$digest();
        done();
      });

      it('should call the communityAPI if event msg.collaboration.id is equal to community._id', function(done) {
        var self = this;
        this.communityAPI.get = function(id) {
          expect(id).to.equal(self.community._id);
          return done();
        };
        this.$rootScope.$emit('collaboration:join', {collaboration: {objectType: 'community', id: 'community1'}});
        this.$rootScope.$digest();
      });

      it('should update $scope if event target is the current community', function(done) {
        var result = {_id: this.community._id, added: true, writable: true};
        var communityDefer = this.$q.defer();
        this.communityAPI.get = function(id) {
          return communityDefer.promise;
        };
        communityDefer.resolve({data: result});
        this.$rootScope.$emit('collaboration:join', {collaboration: {objectType: 'community', id: 'community1'}});
        this.scope.$digest();

        expect(this.scope.community).to.deep.equal(result);
        expect(this.scope.writable).to.equal(true);
        done();
      });
    });

    describe('$rootScope community:leave event', function() {
      it('should not call the communityAPI if event msg is null', function(done) {
        this.communityAPI.get = function() {
          return done(new Error());
        };
        this.$rootScope.$emit('collaboration:leave');
        this.$rootScope.$digest();
        done();
      });

      it('should not call the communityAPI if event msg.id is not community._id', function(done) {
        this.communityAPI.get = function() {
          return done(new Error());
        };
        this.$rootScope.$emit('collaboration:leave', {collaboration: {objectType: 'community', id: 456}});
        this.$rootScope.$digest();
        done();
      });

      it('should call the communityAPI if event msg.id is equal to community._id', function(done) {
        var self = this;
        this.communityAPI.get = function(id) {
          expect(id).to.equal(self.community._id);
          return done();
        };
        this.$rootScope.$emit('collaboration:leave', {collaboration: {objectType: 'community', id: 'community1'}});
        this.$rootScope.$digest();
      });

      it('should update $scope if event target is the current community', function(done) {
        var result = {_id: this.community._id, added: true, writable: true};
        var communityDefer = this.$q.defer();
        this.communityAPI.get = function(id) {
          return communityDefer.promise;
        };
        communityDefer.resolve({data: result});
        this.$rootScope.$emit('collaboration:leave', {collaboration: {objectType: 'community', id: 'community1'}});
        this.scope.$digest();

        expect(this.scope.community).to.deep.equal(result);
        expect(this.scope.writable).to.equal(true);
        done();
      });
    });
  });

  describe('ensureUniqueCommunityTitle directive', function() {
    var html = '<form name="form"><input type="text" name="communityTitle" ng-model="title" ensure-unique-community-title></form>';

    beforeEach(function() {
      var timeoutMock = function(callback, delay) {
        expect(delay).to.exist;
        expect(delay).to.equal(1000);
        callback();
      };

      timeoutMock.cancel = function(promise) {
      };

      angular.mock.module(function($provide) {
        $provide.value('$timeout', timeoutMock);
      });
    });

    beforeEach(inject(['$compile', '$rootScope', '$httpBackend', 'Restangular', function($c, $r, $h, Restangular) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$httpBackend = $h;
      this.title = 'fakeTitle';
      this.emptyResponse = [];
      this.response = [{_id: '1234'}];
      Restangular.setFullResponse(true);
    }]));

    afterEach(function() {
      this.$httpBackend.verifyNoOutstandingExpectation();
    });

    it('should have $pending.unique set when REST request is going on', function() {
      this.$httpBackend.expectGET('/communities?title=' + this.title).respond(this.emptyResponse);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.title);
      input.trigger('change');
      expect(scope.form.$pending).to.have.property('unique');
    });

    it('should call the companyAPI get() method after a one second delay', function() {
      this.$httpBackend.expectGET('/communities?title=' + this.title).respond(this.emptyResponse);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      input.val(this.title);
      input.trigger('change');
      this.$httpBackend.flush();
    });

    it('should remove the ajax error and set a unique=true error when the community already exists', function() {
      this.$httpBackend.expectGET('/communities?title=' + this.title).respond(this.response);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.title);
      input.trigger('change');
      this.$httpBackend.flush();
      scope.$digest();
      expect(scope.form.communityTitle.$error.ajax).to.be.undefined;
      expect(scope.form.communityTitle.$error.unique).to.be.true;
    });

    it('should remove the ajax error and set a unique=undefined error when the community does not exist', function() {
      this.$httpBackend.expectGET('/communities?title=' + this.title).respond(this.emptyResponse);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.title);
      input.trigger('change');
      this.$httpBackend.flush();
      scope.$digest();
      expect(scope.form.communityTitle.$error.ajax).to.be.undefined;
      expect(scope.form.communityTitle.$error.unique).to.be.undefined;
    });
  });

  describe('communityService service', function() {
    beforeEach(angular.mock.inject(function(communityService, communityAPI, $q, $rootScope) {
      this.communityAPI = communityAPI;
      this.communityService = communityService;
      this.$q = $q;
      this.$rootScope = $rootScope;
    }));

    describe('isMember() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          members_count: 4,
          member_status: 'none'
        };
      });

      it('should return false if the community is undefined', function() {
        expect(this.communityService.isMember(undefined, {_id: 'user1'})).to.be.false;
      });
      it('should return false if the community.member_status is not "member"', function() {
        expect(this.communityService.isMember({_id: 'community1'})).to.be.false;
      });
      it('should return true if the community.member_status is "member"', function() {
        this.community.member_status = 'member';
        expect(this.communityService.isMember(this.community)).to.be.true;
      });
    });

    describe('join() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          member_status: 'none'
        };
      });

      it('should return a rejected promise if the user is already a member', function() {
        var rejected = false;
        this.community.member_status = 'member';
        this.communityService.join(this.community, {_id: 'user1'}).then(null, function() {
          rejected = true;
        });
        this.$rootScope.$digest();
        expect(rejected).to.be.true;
      });

      it('should call communityAPI.join(:communityid, :userid) if the user is not a member', function(done) {
        this.community.member_status = '???';
        this.communityAPI.join = function(cid, uid) {
          expect(cid).to.equal('community1');
          expect(uid).to.equal('user8');
          done();
        };
        this.communityService.join(this.community, {_id: 'user8'});
      });
    });

    describe('leave() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          member_status: 'none'
        };
      });

      it('should return a rejected promise if the user is not a member', function() {
        var rejected = false;
        this.community.member_status = 'notmember';
        this.communityService.leave(this.community, {_id: 'user8'}).then(null, function() {
          rejected = true;
        });
        this.$rootScope.$digest();
        expect(rejected).to.be.true;
      });

      it('should call communityAPI.leave(:communityid, :userid) if the user is a member', function(done) {
        this.community.member_status = 'member';
        this.communityAPI.leave = function(cid, uid) {
          expect(cid).to.equal('community1');
          expect(uid).to.equal('user2');
          done();
        };
        this.communityService.leave(this.community, {_id: 'user2'});
      });
    });

    describe('canJoin() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          members_count: 4,
          member_status: 'none',
          creator: 'user4'
        };
        this.user = {
          _id: 'user1'
        };
      });

      describe('when the user is not a member', function() {
        it('should correctly respond in each community type', function() {
          this.community.member_status = 'none';
          this.community.type = 'open';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.true;
          this.community.type = 'restricted';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.type = 'private';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.type = 'confidential';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
        });
        it('should correctly respond if the user is creator or not', function() {
          this.community.member_status = 'none';
          this.community.type = 'open';
          this.community.creator = 'user1';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.creator = 'user4';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.true;
        });
      });
      describe('when the user is a member', function() {
        it('should return false for each community type', function() {
          this.community.member_status = 'member';
          this.community.type = 'open';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.type = 'restricted';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.type = 'private';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.type = 'confidential';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
        });
        it('should return false the user is creator or not', function() {
          this.community.member_status = 'member';
          this.community.type = 'open';
          this.community.creator = 'user1';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
          this.community.creator = 'user4';
          expect(this.communityService.canJoin(this.community, this.user)).to.be.false;
        });
      });
    });

    describe('canLeave() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          members_count: 4,
          member_status: 'none',
          creator: 'user4'
        };
        this.user = {
          _id: 'user1'
        };
      });

      describe('when the user is not a member', function() {
        it('should return false for each community type', function() {
          this.community.member_status = 'none';
          this.community.type = 'open';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
          this.community.type = 'restricted';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
          this.community.type = 'private';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
          this.community.type = 'confidential';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
        });
        it('should return false for any creator status', function() {
          this.community.member_status = 'none';
          this.community.type = 'open';
          this.community.creator = 'user1';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
          this.community.creator = 'user4';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
        });
      });
      describe('when the user is a member', function() {
        it('should return true for each community type', function() {
          this.community.member_status = 'member';
          this.community.type = 'open';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.true;
          this.community.type = 'restricted';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.true;
          this.community.type = 'private';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.true;
          this.community.type = 'confidential';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.true;
        });
        it('should return the correct value when the user is creator or not', function() {
          this.community.member_status = 'member';
          this.community.type = 'open';
          this.community.creator = 'user1';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.false;
          this.community.creator = 'user4';
          expect(this.communityService.canLeave(this.community, this.user)).to.be.true;
        });
      });
    });

    describe('canRead() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          members_count: 4,
          type: 'open',
          member_status: 'none'
        };
      });
      describe('when the community is open or restricted', function() {
        it('should return true for members', function() {
          this.community.member_status = 'member';
          this.community.type = 'open';
          expect(this.communityService.canRead(this.community)).to.be.true;
          this.community.type = 'restricted';
          expect(this.communityService.canRead(this.community)).to.be.true;
        });
        it('should return true for non-members', function() {
          this.community.member_status = 'none';
          this.community.type = 'open';
          expect(this.communityService.canRead(this.community)).to.be.true;
          this.community.type = 'restricted';
          expect(this.communityService.canRead(this.community)).to.be.true;
        });
      });
      describe('when the community is private or confidential', function() {
        it('should return true', function() {
          this.community.member_status = 'member';
          this.community.type = 'private';
          expect(this.communityService.canRead(this.community)).to.be.true;
          this.community.type = 'confidential';
          expect(this.communityService.canRead(this.community)).to.be.true;
        });
        it('should return false for non-members', function() {
          this.community.member_status = 'none';
          this.community.type = 'private';
          expect(this.communityService.canRead(this.community)).to.be.false;
          this.community.type = 'confidential';
          expect(this.communityService.canRead(this.community)).to.be.false;
        });
      });
    });

    describe('requestMembership() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          member_status: 'none'
        };
      });

      it('should return a rejected promise if the user is already a member', function() {
        var rejected = false;
        this.community.member_status = 'member';
        this.communityService.requestMembership(this.community, {_id: 'user1'}).then(null, function() {
          rejected = true;
        });
        this.$rootScope.$digest();
        expect(rejected).to.be.true;
      });

      it('should call communityAPI.requestMembership(:communityid, :userid) if the user is not a member', function(done) {
        this.community.member_status = '???';
        this.communityAPI.requestMembership = function(cid, uid) {
          expect(cid).to.equal('community1');
          expect(uid).to.equal('user8');
          done();
        };
        this.communityService.requestMembership(this.community, {_id: 'user8'});
      });
    });

    describe('cancelRequestMembership() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1'
        };
      });

      it('should call communityAPI.cancelRequestMembership(:communityid, :userid)', function(done) {
        this.communityAPI.cancelRequestMembership = function(cid, uid) {
          expect(cid).to.equal('community1');
          expect(uid).to.equal('user8');
          done();
        };
        this.communityService.cancelRequestMembership(this.community, {_id: 'user8'});
      });
    });
  });

  describe('communityButtonJoin directive', function() {
    beforeEach(function() {
      var self = this;
      this.communityService = {};
      angular.mock.module(function($provide) {
          $provide.value('communityService', self.communityService);
      });
      module('jadeTemplates');
    });
    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };
      this.html = '<community-button-join community="community" user="user"></community-button-join>';
    }));

    describe('when the user cannot join the community', function() {
      it('should hide the button', function() {
        this.communityService.canJoin = function() { return false; };
        this.scope.user = {_id: 'user1'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });
    describe('when user can join the community', function() {
      it('should show the button', function() {
        this.communityService.canJoin = function() { return true; };
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.false;
      });
    });

    describe('button click', function() {
      beforeEach(function() {
        this.communityService.canJoin = function() { return true; };
        this.scope.user = {_id: 'user4'};
        this.html = '<community-button-join community="community" user="user"></community-button-join>';
      });

      it('should call the communityService.join() method', function(done) {
        this.communityService.join = function(cid, uid) {
          expect(cid._id).to.equal('community1');
          expect(uid._id).to.equal('user4');
          done();
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        element.click();
      });

      it('should disable the button', function() {
        var deferred = this.$q.defer();
        this.communityService.join = function(cid, uid) {
          return deferred.promise;
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element.attr('disabled')).to.be.undefined;
        element.click();
        this.scope.$digest();
        expect(element.attr('disabled')).to.equal('disabled');
      });

      describe('on communityService.join() response', function() {
        it('should enable back the button on success', function() {
          var deferred = this.$q.defer();
          this.communityService.join = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });
        it('should enable back the button on failure', function() {
          var deferred = this.$q.defer();
          this.communityService.join = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });

        it('should call the success callback on success', function(done) {
          this.html = '<community-button-join community="community" user="user" on-join="joinSuccess(community)"></community-button-join>';
          this.scope.joinSuccess = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.join = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
        });

        it('should call the failure callback on failure', function(done) {
          this.html = '<community-button-join community="community" user="user" on-fail="joinFailure(community)"></community-button-join>';
          this.scope.joinFailure = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.join = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
        });
      });
    });
  });

  describe('communityButtonLeave directive', function() {
    beforeEach(function() {
      var self = this;
      this.communityService = {};
      angular.mock.module(function($provide) {
          $provide.value('communityService', self.communityService);
      });
      module('jadeTemplates');
    });
    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };
      this.html = '<community-button-leave community="community" user="user"></community-button-leave>';
    }));

    describe('when the user cannot leave', function() {
      it('should hide the button', function() {
        this.communityService.canLeave = function() { return false; };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });

    describe('when user can leave the community', function() {
      it('should show the button', function() {
        this.communityService.canLeave = function() { return true; };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.false;
      });
    });

    describe('button click', function() {
      beforeEach(function() {
        this.scope.community.type = 'open';
        this.communityService.isMember = function() {return true;};
        this.communityService.canLeave = function() {return true;};
        this.scope.user = {_id: 'user2'};
        this.html = '<community-button-leave community="community" user="user"></community-button-leave>';
      });

      it('should call the communityService.leave() method', function(done) {
        this.communityService.leave = function(cid, uid) {
          expect(cid._id).to.equal('community1');
          expect(uid._id).to.equal('user2');
          done();
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        element.click();
      });

      it('should disable the button', function() {
        var deferred = this.$q.defer();
        this.communityService.leave = function(cid, uid) {
          return deferred.promise;
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element.attr('disabled')).to.be.undefined;
        element.click();
        this.scope.$digest();
        expect(element.attr('disabled')).to.equal('disabled');
      });

      describe('on communityService.leave() response', function() {
        it('should enable back the button on success', function() {
          var deferred = this.$q.defer();
          this.communityService.leave = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });

        it('should enable back the button on failure', function() {
          var deferred = this.$q.defer();
          this.communityService.leave = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });

        it('should call the success callback on success', function(done) {
          this.html = '<community-button-leave community="community" user="user" on-leave="leaveSuccess(community)"></community-button-leave>';
          this.scope.leaveSuccess = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.leave = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
        });

        it('should call the failure callback on failure', function(done) {
          this.html = '<community-button-leave community="community" user="user" on-fail="leaveFailure(community)"></community-button-leave>';
          this.scope.leaveFailure = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.leave = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
        });
      });
    });
  });

  describe('communityButtonRequestMembership directive', function() {
    beforeEach(function() {
      var self = this;
      this.communityService = {};
      angular.mock.module(function($provide) {
        $provide.value('communityService', self.communityService);
      });
      module('jadeTemplates');
    });
    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };
      this.html = '<community-button-request-membership community="community" user="user"></community-button-request-membership>';
    }));

    describe('when the user cannot request membership to the community', function() {
      it('should hide the button', function() {
        this.communityService.canRequestMembership = function() { return false; };
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });
    describe('when user can request membership to the community', function() {
      it('should show the button', function() {
        this.communityService.canRequestMembership = function() { return true; };
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.false;
      });
    });

    describe('button click', function() {
      beforeEach(function() {
        this.communityService.canRequestMembership = function() { return true; };
        this.scope.user = {_id: 'user4'};
        this.html = '<community-button-request-membership community="community" user="user"></community-button-request-membership>';
      });

      it('should call the communityService.requestMembership() method', function(done) {
        this.communityService.requestMembership = function(cid, uid) {
          expect(cid._id).to.equal('community1');
          expect(uid._id).to.equal('user4');
          done();
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        element.click();
      });

      it('should disable the button', function() {
        var deferred = this.$q.defer();
        this.communityService.requestMembership = function(cid, uid) {
          return deferred.promise;
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element.attr('disabled')).to.be.undefined;
        element.click();
        this.scope.$digest();
        expect(element.attr('disabled')).to.equal('disabled');
      });

      describe('on communityService.requestMembership() response', function() {
        it('should enable back the button on success', function() {
          var deferred = this.$q.defer();
          this.communityService.requestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });
        it('should enable back the button on failure', function() {
          var deferred = this.$q.defer();
          this.communityService.requestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });

        it('should call the success callback on success', function(done) {
          this.html = '<community-button-request-membership community="community" user="user" on-request="requestMembershipSuccess(community)"></community-button-request-membership>';
          this.scope.requestMembershipSuccess = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.requestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
        });

        it('should call the failure callback on failure', function(done) {
          this.html = '<community-button-request-membership community="community" user="user" on-fail="requestMembershipFailure(community)"></community-button-request-membership>';
          this.scope.requestMembershipFailure = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.requestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
        });
      });
    });
  });

  describe('communityButtonCancelRequestMembership directive', function() {
    beforeEach(function() {
      var self = this;
      this.communityService = {};
      angular.mock.module(function($provide) {
        $provide.value('communityService', self.communityService);
      });
      module('jadeTemplates');
    });
    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };
      this.html = '<community-button-cancel-request-membership community="community" user="user"></community-button-cancel-request-membership>';
    }));

    describe('when the user cannot cancel request membership to the community', function() {
      it('should hide the button', function() {
        this.communityService.canCancelRequestMembership = function() { return false; };
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });
    describe('when the user can cancel request membership to the community', function() {
      it('should show the button', function() {
        this.communityService.canCancelRequestMembership = function() { return true; };
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.false;
      });
    });

    describe('button click', function() {
      beforeEach(function() {
        this.communityService.canCancelRequestMembership = function() { return true; };
        this.scope.user = {_id: 'user4'};
        this.html = '<community-button-cancel-request-membership community="community" user="user"></community-button-cancel-request-membership>';
      });

      it('should call the communityService.cancelRequestMembership() method', function(done) {
        this.communityService.cancelRequestMembership = function(cid, uid) {
          expect(cid._id).to.equal('community1');
          expect(uid._id).to.equal('user4');
          done();
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        element.find('.btn').click();
      });

      it('should disable the button', function() {
        var deferred = this.$q.defer();
        this.communityService.cancelRequestMembership = function(cid, uid) {
          return deferred.promise;
        };
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element.find('.btn').attr('disabled')).to.be.undefined;
        element.find('.btn').click();
        this.scope.$digest();
        expect(element.find('.btn').attr('disabled')).to.equal('disabled');
      });

      describe('on communityService.cancelRequestMembership() response', function() {
        it('should enable back the button on success', function() {
          var deferred = this.$q.defer();
          this.communityService.cancelRequestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.find('.btn').click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });
        it('should enable back the button on failure', function() {
          var deferred = this.$q.defer();
          this.communityService.cancelRequestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.find('.btn').click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
          expect(element.attr('disabled')).to.be.undefined;
        });

        it('should call the success callback on success', function(done) {
          this.html = '<community-button-cancel-request-membership community="community" user="user" on-cancel-request="cancelRequestMembershipSuccess(community)"></community-button-cancel-request-membership>';
          this.scope.cancelRequestMembershipSuccess = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.cancelRequestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.find('.btn').click();
          this.scope.$digest();
          deferred.resolve();
          this.scope.$digest();
        });

        it('should call the failure callback on failure', function(done) {
          this.html = '<community-button-cancel-request-membership community="community" user="user" on-fail="cancelRequestMembershipFailure(community)"></community-button-cancel-request-membership>';
          this.scope.cancelRequestMembershipFailure = function() {done();};
          var deferred = this.$q.defer();
          this.communityService.cancelRequestMembership = function(cid, uid) {
            return deferred.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.find('.btn').click();
          this.scope.$digest();
          deferred.reject();
          this.scope.$digest();
        });
      });
    });
  });

  describe('The communityMembershipRequestsWidget directive', function() {
    beforeEach(function() {
      var self = this;
      this.communityAPI = {
        get: function() {},
        getRequestMemberships: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', self.communityAPI);
      });
      module('jadeTemplates');
      module('esn.core');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1',
        membershipRequests: [
          {
            user: '123'
          },
          {
            user: '456'
          }
        ]
      };
      this.html = '<community-membership-requests-widget community="community"/>';
    }));

    it('should call communityAPI#getRequestMemberships', function(done) {
      this.communityAPI.getRequestMemberships = function() {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
    });

    it('should set error when call the API fails', function(done) {
      var defer = this.$q.defer();
      this.communityAPI.getRequestMemberships = function() {
        return defer.promise;
      };
      defer.reject();

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();

      var iscope = element.isolateScope();
      expect(iscope.error).to.exist;
      expect(iscope.error).to.be.true;
      done();
    });

    it('should set requests in the scope when API call succeeds', function(done) {
      var result = [{user: {_id: 1, emails: ['foo@bar.com']}}, {user: {_id: 2, emails: ['baz@bar.com']}}];
      var defer = this.$q.defer();
      this.communityAPI.getRequestMemberships = function() {
        return defer.promise;
      };
      defer.resolve({data: result});

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();

      var iscope = element.isolateScope();
      expect(iscope.requests).to.exist;
      expect(iscope.requests).to.deep.equal(result);
      done();
    });
  });

  describe('The communityMemberAvatar directive', function() {
    beforeEach(function() {
      module('jadeTemplates');
      module('esn.core');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };
      this.scope.member = {
        user: {
          _id: 1
        }
      };
      this.html = '<community-member-avatar member="member" community="community"/>';
    }));

    it('should set the title with firstname and lastname if they are set', function(done) {
      this.scope.member.user.firstname = 'john';
      this.scope.member.user.lastname = 'doe';
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      var iscope = element.isolateScope();
      expect(iscope.tooltip).to.be.defined;
      expect(iscope.tooltip.title).to.equal('john doe');
      done();
    });

    it('should set the title with email when firstname and lastname are not set', function(done) {
      this.scope.member.user.emails = ['john@doe.name'];
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      var iscope = element.isolateScope();
      expect(iscope.tooltip).to.be.defined;
      expect(iscope.tooltip.title).to.equal('john@doe.name');
      done();
    });

    it('should set the creator when user is community creator', function(done) {
      this.scope.member.user.emails = ['john@doe.name'];
      this.scope.member.user._id = 1;
      this.scope.community.creator = 1;

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      var iscope = element.isolateScope();
      expect(iscope.creator).to.be.defined;
      expect(iscope.creator).to.be.true;
      done();
    });

    it('should not set the creator when user is not community creator', function(done) {
      this.scope.member.user.emails = ['john@doe.name'];
      this.scope.member.user._id = 1;
      this.scope.community.creator = 2;

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      var iscope = element.isolateScope();
      expect(iscope.creator).to.not.be.defined;
      done();
    });
  });

  describe('The communityMembershipRequestsActions directive', function() {
    beforeEach(function() {
      var communityAPI = {
        get: function() {},
        join: function() {}
      };

      var userAPI = {
        user: function() {}
      };

      angular.mock.module('esn.community');
      angular.mock.module('esn.user');
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', communityAPI);
        $provide.value('userAPI', userAPI);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q, communityAPI) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.communityAPI = communityAPI;
      this.scope.community = {
        _id: '123'
      };
      this.scope.user = {
        _id: 234
      };
      this.html = '<community-membership-requests-actions community="community" user="user"/>';
    }));

    describe('The directive controller', function() {
      describe('The accept function', function() {
        it('should call communityAPI#join', function(done) {
          var self = this;
          this.communityAPI.join = function(community, user) {
            expect(community).to.equal(self.scope.community._id);
            expect(user).to.equal(self.scope.user._id);
            return done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.accept();
        });

        it('should set $scope.done on communityAPI#join success', function() {
          var defer = this.$q.defer();
          this.communityAPI.join = function() {
            defer.resolve();
            return defer.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.accept();
          this.scope.$digest();
          expect(iscope.done).to.be.true;
        });

        it('should set $scope.error on communityAPI#join failure', function() {
          var defer = this.$q.defer();
          this.communityAPI.join = function() {
            defer.reject();
            return defer.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.accept();
          this.scope.$digest();
          expect(iscope.error).to.be.true;
        });
      });

      describe('The decline function', function() {
        it('should call communityAPI#cancelRequestMembership', function(done) {
          var self = this;
          this.communityAPI.cancelRequestMembership = function(community, user) {
            expect(community).to.equal(self.scope.community._id);
            expect(user).to.equal(self.scope.user._id);
            return done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.decline();
        });

        it('should set $scope.error on communityAPI#cancelRequestMembership failure', function() {
          var defer = this.$q.defer();
          this.communityAPI.cancelRequestMembership = function() {
            defer.reject();
            return defer.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.decline();
          this.scope.$digest();
          expect(iscope.error).to.be.true;
        });

        it('should set $scope.done on communityAPI#cancelRequestMembership success', function() {
          var defer = this.$q.defer();
          this.communityAPI.cancelRequestMembership = function() {
            defer.resolve();
            return defer.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.decline();
          this.scope.$digest();
          expect(iscope.done).to.be.true;
        });
      });
    });
  });

  describe('The communityPendingInvitationList directive', function() {

    beforeEach(function() {
      var self = this;
      this.communityAPI = {
        cancelRequestMembership: function() {},
        get: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', self.communityAPI);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };

      this.html = '<community-pending-invitation-list community="community"></community-pending-invitation-list>';
    }));

    it('should call communityAPI.getRequestMemberships', function(done) {

      this.communityAPI.getRequestMemberships = function() {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
    });

    it('should set the communityAPI.getRequestMemberships result in the scope', function(done) {
      this.$compile(this.html)(this.scope);

      var result = [1, 2, 3];
      var defer = this.$q.defer();
      this.communityAPI.getRequestMemberships = function() {
        return defer.promise;
      };
      defer.resolve({
        data: result
      });
      this.scope.$digest();
      expect(this.scope.requests).to.deep.equal(result);
      done();
    });

    it('should display error when communityAPI.getRequestMemberships fails', function(done) {
      var element = this.$compile(this.html)(this.scope);
      var defer = this.$q.defer();
      this.communityAPI.getRequestMemberships = function() {
        return defer.promise;
      };
      defer.reject();
      this.scope.$digest();
      var error = $(element.find('[error-container]')[0]);
      expect(error).to.not.have.class('hidden');
      done();
    });
  });

  describe('communityPendingInvitationDisplay directive', function() {

    beforeEach(function() {
      var self = this;
      this.communityAPI = {
        cancelRequestMembership: function() {
        },
        get: function() {
        }
      };
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', self.communityAPI);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };
      this.scope.request = {
        user: {
          _id: 'user1',
          emails: ['a@b.com']
        }
      };

      this.html = '<community-pending-invitation-display community="community" request="request"></community-pending-invitation-display>';
    }));

    describe('The cancel button', function() {
      describe('on click', function() {
        it('should call the cancelRequestMembership', function(done) {
          this.communityAPI.cancelRequestMembership = function() {
            done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.find('.btn').click();
        });

        it('should hide the button on success', function() {
          var defer = this.$q.defer();
          this.communityAPI.cancelRequestMembership = function() {
            return defer.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          defer.resolve();
          var button = element.find('.btn');
          button.click();
          this.scope.$digest();
          expect(button).to.be.hidden;
        });

        it('should enable the button on failure', function() {
          var defer = this.$q.defer();
          this.communityAPI.cancelRequestMembership = function() {
            return defer.promise;
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          defer.reject();
          var button = element.find('.btn');
          button.click();
          this.scope.$digest();
          expect(button).to.be.enabled;
        });
      });
    });
  });

  describe('The communityInviteUsers directive', function() {
    beforeEach(function() {
      var communityAPI = {
        get: function() {
        },
        join: function() {
        }
      };

      var communityService = {
        isManager: function() {
          return false;
        }
      };

      angular.mock.module('esn.community');
      angular.mock.module(function($provide) {
        $provide.value('communityAPI', communityAPI);
        $provide.value('communityService', communityService);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q, communityAPI, communityService) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.communityAPI = communityAPI;
      this.communityService = communityService;
      this.scope.community = {
        _id: '123'
      };
      this.html = '<community-invite-users community="community"/>';
    }));

    it('should be hidden if current user is not a community manager', function() {
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(element.hasClass('hidden')).to.be.true;
    });

    it('should not be hidden if current user is a community manager', function() {
      this.communityService = {
        isManager: function() {
          return true;
        }
      };
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(element.hasClass('hidden')).to.be.true;
    });

    describe('The directive controller', function() {
      describe('The getInvitablePeople function', function() {
        it('should call communityAPI#getInvitablePeople', function(done) {
          var query = 'testquery';
          var self = this;
          this.communityAPI.getInvitablePeople = function(communityId, options) {
            expect(communityId).to.equal(self.scope.community._id);
            expect(options.search).to.equal(query);
            expect(options.limit).to.equal(5);
            return done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.getInvitablePeople(query);
        });

        it('should set displaynames on users if communityAPI#getInvitablePeople works', function() {
          var query = 'testquery';
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com']};
          var res = {
            data: [user1, user2]
          };
          this.communityAPI.getInvitablePeople = function() {
            return {
              then: function(successfunction) {
                successfunction(res);
              }
            };
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.getInvitablePeople(query);

          expect(res.data).to.have.length(2);
          expect(res.data[0].displayName).to.equal('pipo1 pipo1');
          expect(res.data[1].displayName).to.equal(user2.emails[0]);
        });
      });

      describe('The inviteUsers function', function() {
        it('should call communityAPI#requestMembership for each user in the scope', function() {
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com']};
          var users = [user1, user2];
          var self = this;
          var call = 0;
          this.communityAPI.requestMembership = function(communityId, userId) {
            expect(communityId).to.equal(self.scope.community._id);
            expect(userId).to.exist;
            expect(userId).to.equal(users[call]._id);
            call++;
            return {};
          };

          this.$q.all = function(promises) {
            expect(promises).to.have.length(2);
            return {
              then: function() {}
            };
          };

          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.users = users;
          iscope.inviteUsers();
        });

        it('should not call communityAPI#requestMembership if there are no user in the scope', function(done) {
          this.communityAPI.requestMembership = function(communityId, userId) {
            done(new Error('unexpected call'));
          };

          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.users = [];
          iscope.inviteUsers();
          done();
        });

        it('should not call communityAPI#requestMembership if there already is a running call', function(done) {
          this.communityAPI.requestMembership = function(communityId, userId) {
            done(new Error('unexpected call'));
          };

          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.users = [{_id: '123'}];
          iscope.running = true;
          iscope.inviteUsers();
          done();
        });

        it('should show success message if rest calls are OK', function() {
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com']};
          var users = [user1, user2];
          var self = this;
          var call = 0;
          this.communityAPI.requestMembership = function(communityId, userId) {
            expect(communityId).to.equal(self.scope.community._id);
            expect(userId).to.exist;
            expect(userId).to.equal(users[call]._id);
            call++;
            return {};
          };

          this.$q.all = function(promises) {
            expect(promises).to.have.length(2);
            return {
              then: function(successCB) {
                successCB();
              }
            };
          };

          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.users = users;
          iscope.inviteUsers();

          expect(iscope.users).to.have.length(0);
          expect(iscope.running).to.be.false;
          expect(iscope.getRunningDiv().hasClass('hidden')).to.be.true;
          expect(iscope.getButtonContent().hasClass('hidden')).to.be.false;
          expect(iscope.getErrorDiv().hasClass('hidden')).to.be.true;
          expect(iscope.getSuccessDiv().hasClass('hidden')).to.be.false;
        });

        it('should show success message if rest calls are OK', function() {
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com']};
          var users = [user1, user2];
          var self = this;
          var call = 0;
          this.communityAPI.requestMembership = function(communityId, userId) {
            expect(communityId).to.equal(self.scope.community._id);
            expect(userId).to.exist;
            expect(userId).to.equal(users[call]._id);
            call++;
            return {};
          };

          var restError = new Error({details: 'oups'});
          this.$q.all = function(promises) {
            expect(promises).to.have.length(2);
            return {
              then: function(successCB, errorCB) {
                errorCB({data: restError});
              }
            };
          };

          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.users = users;
          iscope.inviteUsers();

          expect(iscope.users).to.have.length(0);
          expect(iscope.running).to.be.false;
          expect(iscope.getRunningDiv().hasClass('hidden')).to.be.true;
          expect(iscope.getButtonContent().hasClass('hidden')).to.be.false;
          expect(iscope.getErrorDiv().hasClass('hidden')).to.be.false;
          expect(iscope.getSuccessDiv().hasClass('hidden')).to.be.true;
          expect(iscope.error).to.equal(restError);
        });
      });
    });
  });

  describe('communityAStrackerController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
      this.activityStreamUuid1 = '12345678';
      this.activityStreamUuid2 = '123456789';
      this.rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.controller = $controller;
    }));

    it('should initialize $scope.error', function() {
      var AStrackerHelpers = {
        getActivityStreamsWithUnreadCount: function(objectType, callback) {
          return callback(new Error('mock'));
        }
      };

      this.controller('communityAStrackerController', {
        $scope: this.scope,
        AStrackerHelpers: AStrackerHelpers
      });

      expect(this.scope.error).to.exist;
      expect(this.scope.activityStreams).to.be.empty;
    });

    it('should initialize $scope.activityStreams', function() {
      var self = this;
      var AStrackerHelpers = {
        getActivityStreamsWithUnreadCount: function(objectType, callback) {
          return callback(null, [
            {
              uuid: self.activityStreamUuid1,
              display_name: 'Community1',
              href: '#',
              img: '',
              unread_count: 2,
              target: {
                _id: 123
              }
            },
            {
              uuid: self.activityStreamUuid2,
              display_name: 'Community2',
              href: '#',
              img: '',
              unread_count: 4,
              target: {
                _id: 456
              }
            }
          ]);
        }
      };

      this.controller('communityAStrackerController', {
        $rootScope: this.rootScope,
        $scope: this.scope,
        AStrackerHelpers: AStrackerHelpers
      });

      expect(this.scope.activityStreams).to.exist;
      expect(this.scope.activityStreams.length).to.deep.equal(2);
      expect(this.scope.activityStreams[0].uuid).to.deep.equal(this.activityStreamUuid1);
      expect(this.scope.activityStreams[1].uuid).to.deep.equal(this.activityStreamUuid2);
    });
  });
});
