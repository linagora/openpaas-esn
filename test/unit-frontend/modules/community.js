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
      this.session = {domain: {_id: 123}, user: {_id: 456}};
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
        session: this.session,
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
      this.scope = $rootScope.$new();
      this.location = {};
      this.log = {error: function() {}};
      this.community = {_id: 'community1'};
      this.communityAPI = {};
      this.session = {domain: {_id: 'domain1'}, user: {_id: 'user1'}};
      this.$q = $q;

      $controller('communityController', {
        $scope: this.scope,
        $location: this.location,
        $log: this.log,
        session: this.session,
        communityAPI: this.communityAPI,
        community: this.community
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
  });

  describe('ensureUniqueCommunityTitle directive', function() {
    var html = '<form name="form"><input type="text" name="communityTitle" ng-model="title" ensure-unique-community-title></form>';

    beforeEach(function() {
      var timeoutMock = function(callback, delay) {
        expect(delay).to.exist;
        expect(delay).to.equal(1000);
        callback();
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

    it('should set an ajax error when REST request is going on', function() {
      this.$httpBackend.expectGET('/communities?title=' + this.title).respond(this.emptyResponse);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.title);
      input.trigger('change');
      expect(scope.form.communityTitle.$error.ajax).to.be.true;
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
      expect(scope.form.communityTitle.$error.ajax).to.be.false;
      expect(scope.form.communityTitle.$error.unique).to.be.true;
    });

    it('should remove the ajax error and set a unique=false error when the community does not exist', function() {
      this.$httpBackend.expectGET('/communities?title=' + this.title).respond(this.emptyResponse);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.title);
      input.trigger('change');
      this.$httpBackend.flush();
      scope.$digest();
      expect(scope.form.communityTitle.$error.ajax).to.be.false;
      expect(scope.form.communityTitle.$error.unique).to.be.false;
    });
  });

  describe('communityService service', function() {
    beforeEach(angular.mock.inject(function(communityService, communityAPI, $q, $rootScope) {
      this.communityAPI = communityAPI;
      this.communityService = communityService;
      this.$q = $q;
      this.$rootScope = $rootScope;
    }));

    describe('openMembership() method', function() {
      it('should return true if the community is open', function() {
        expect(this.communityService.openMembership({type: 'open'})).to.be.true;
      });
      it('should return false if the community is restricted', function() {
        expect(this.communityService.openMembership({type: 'restricted'})).to.be.false;
      });
      it('should return false if the community is private', function() {
        expect(this.communityService.openMembership({type: 'private'})).to.be.false;
      });
      it('should return false if the community is invisible', function() {
        expect(this.communityService.openMembership({type: 'invisible'})).to.be.false;
      });
      it('should return false if the community type is undefined', function() {
        expect(this.communityService.openMembership({_id: 'community1'})).to.be.false;
      });
    });

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

      it('should call communityAPI.join(:userid, :communityid) if the user is not a member', function(done) {
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

      it('should call communityAPI.leave(:userid, :communityid) if the user is a member', function(done) {
        this.community.member_status = 'member';
        this.communityAPI.leave = function(cid, uid) {
          expect(cid).to.equal('community1');
          expect(uid).to.equal('user2');
          done();
        };
        this.communityService.leave(this.community, {_id: 'user2'});
      });
    });
    describe.only('canRead() method', function() {
      beforeEach(function() {
        this.community = {
          _id: 'community1',
          members_count: 4,
          type: 'open',
          member_status: 'none'
        };
      });
      describe('when the community is open', function() {
        it('should return true', function() {
          expect(this.communityService.canRead(this.community)).to.be.true;
          this.community.member_status = 'member';
          expect(this.communityService.canRead(this.community)).to.be.true;
        });
      });
      describe('when the community is not open', function() {
        describe('and user is not a community member', function() {
          it('should return false', function() {
            this.community.member_status = 'none';
            this.community.type = 'protected';
            expect(this.communityService.canRead(this.community)).to.be.false;
            this.community.type = 'private';
            expect(this.communityService.canRead(this.community)).to.be.false;
            this.community.type = 'invisible';
            expect(this.communityService.canRead(this.community)).to.be.false;
          });
        });
        describe('and user is a community member', function() {
          it('should return true', function() {
            this.community.member_status = 'member';
            this.community.type = 'protected';
            expect(this.communityService.canRead(this.community)).to.be.true;
            this.community.type = 'private';
            expect(this.communityService.canRead(this.community)).to.be.true;
            this.community.type = 'invisible';
            expect(this.communityService.canRead(this.community)).to.be.true;
          });
        });
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

    describe('when user is community creator', function() {
      it('should hide the button', function() {
        this.scope.user = {_id: 'user1'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });
    describe('when community is not open', function() {
      it('should hide the button', function() {
        this.communityService.openMembership = function() {return false;};
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });
    describe('when user is already a member of the community', function() {
      it('should hide the button', function() {
        this.communityService.openMembership = function() {return true;};
        this.communityService.isMember = function() {return true;};
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });
    describe('when user can join the community', function() {
      it('should show the button', function() {
        this.communityService.openMembership = function() {return true;};
        this.communityService.isMember = function() {return false;};
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.false;
      });
    });

    describe('button click', function() {
      beforeEach(function() {
        this.communityService.openMembership = function() {return true;};
        this.communityService.isMember = function() {return false;};
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

    describe('when user is community creator', function() {
      it('should hide the button', function() {
        this.scope.user = {_id: 'user1'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });

    describe('when user is not a member of the community', function() {
      it('should hide the button', function() {
        this.communityService.isMember = function() {return false;};
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.true;
      });
    });

    describe('when user can leave the community', function() {
      it('should show the button', function() {
        this.communityService.isMember = function() {return true;};
        this.scope.user = {_id: 'user4'};
        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        expect(element).to.have.length(1);
        expect(element.hasClass('ng-hide')).to.be.false;
      });
    });

    describe('button click', function() {
      beforeEach(function() {
        this.communityService.openMembership = function() {return true;};
        this.communityService.isMember = function() {return true;};
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

});
