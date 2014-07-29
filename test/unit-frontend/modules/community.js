'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Community Angular module', function() {
  beforeEach(angular.mock.module('esn.community'));

  describe('communityAPI service', function() {

    describe('list() function', function() {
      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET to /communities?domain_id=:id', function() {
        this.$httpBackend.expectGET('/communities?domain_id=' + this.domainId).respond(200, []);
        this.communityAPI.list(this.domainId);
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

    it('should not validate undefined title', function(done) {
      this.scope.community = {};
      expect(this.scope.validateTitle()).to.be.false;
      done();
    });

    it('should not validate empty title', function(done) {
      this.scope.community = {title: ''};
      expect(this.scope.validateTitle()).to.be.false;
      done();
    });

    it('should validate non empty title', function(done) {
      this.scope.community = {title: 'node.js'};
      expect(this.scope.validateTitle()).to.be.true;
      done();
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
      this.session = {domain: {_id: 123}};
      this.scope = $rootScope.$new();
      this.$q = $q;
      this.log = {
        error: function() {
        }
      };

      $controller('communitiesController', {
        $scope: this.scope,
        $log: this.log,
        session: this.session,
        communityAPI: this.communityAPI
      });
    }));

    it('getAll fn should call communityAPI#list', function(done) {
      this.communityAPI.list = function() {
        return done();
      };
      this.scope.getAll();
    });

    it('getAll fn should set the $scope.communities with communityAPI#list result', function(done) {
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

    it('getAll fn should set $scope.error to true when communityAPI#list fails', function(done) {
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

    it('getAll fn should set $scope.selected to all', function(done) {
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

  describe('communityController controller', function() {

    beforeEach(inject(['$rootScope', '$controller', function($rootScope, $controller) {
      this.scope = $rootScope.$new();
      this.community = {_id: 123};
      this.session = {domain: {_id: 123}, user: {_id: 123}};

      $controller('communityController', {
        $scope: this.scope,
        session: this.session,
        community: this.community
      });
    }]));

    it('canJoin fn should return true when current user is not already a member', function(done) {
      this.scope.community = {
        members: [
          {
            user: 456
          },
          {
            user: 833
          }
        ]
      };

      expect(this.scope.canJoin()).to.be.true;
      done();
    });

    it('canJoin fn should return false when current user is already a member', function(done) {
      this.scope.community = {
        members: [
          {
            user: 456
          },
          {
            user: 123
          }
        ]
      };

      expect(this.scope.canJoin()).to.be.false;
      done();
    });

    it('canLeave fn should return true when current user is not creator and is in members', function(done) {
      this.scope.community = {
        creator: 93939,
        members: [
          {
            user: 123
          },
          {
            user: 833
          }
        ]
      };

      expect(this.scope.canLeave()).to.be.true;
      done();
    });

    it('canLeave fn should return false when current user is creator', function(done) {
      this.scope.community = {
        creator: 123,
        members: [
          {
            user: 456
          },
          {
            user: 123
          }
        ]
      };

      expect(this.scope.canLeave()).to.be.false;
      done();
    });

    it('isCreator fn should return true when current user is creator', function(done) {
      this.scope.community = {
        creator: 123,
        members: [
          {
            user: 456
          },
          {
            user: 123
          }
        ]
      };

      expect(this.scope.isCreator()).to.be.true;
      done();
    });

    it('isCreator fn should return false when current user is not creator', function(done) {
      this.scope.community = {
        creator: 234,
        members: [
          {
            user: 456
          },
          {
            user: 123
          }
        ]
      };

      expect(this.scope.isCreator()).to.be.false;
      done();
    });
  });
});
