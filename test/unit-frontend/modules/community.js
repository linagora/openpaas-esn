'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Community Angular module', function() {
  beforeEach(angular.mock.module('esn.community'));

  describe('communityAPI service', function() {

    describe('list() function', function() {
      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.userId = '123';
      }));

      it('should send a GET to /api/communities?domain_id=:id', function() {
        this.$httpBackend.expectGET('/api/communities?domain_id=' + this.domainId).respond(200, []);
        this.communityAPI.list(this.domainId);
        this.$httpBackend.flush();
      });

      it('should send a GET to /api/communities?creator=:user_id&domain_id=:id', function() {
        var options = {creator: this.userId};
        this.$httpBackend.expectGET('/api/communities?creator=' + this.userId + '&domain_id=' + this.domainId).respond(200, []);
        this.communityAPI.list(this.domainId, options);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.list();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('get() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        this.response = {_id: 123, title: 'Node.js'};
      }));

      it('should send a GET request to /api/communities/:uuid', function() {
        this.$httpBackend.expectGET('/api/communities/' + this.communityId).respond(200, this.response, this.headers);
        this.communityAPI.get(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.get(this.communityId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('del() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
      }));

      it('should send a DEL request to /api/communities/:uuid', function() {
        this.$httpBackend.expectDELETE('/api/communities/' + this.communityId).respond(204);
        this.communityAPI.del(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.del(this.communityId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('create() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
      }));

      it('should send a POST request to /api/communities', function() {
        var community = {};
        this.$httpBackend.expectPOST('/api/communities', community).respond(202);
        this.communityAPI.create(community);
        this.$httpBackend.flush();
      });

      it('should send a POST to /api/communities with given query parameters ', function() {
        var community = {};
        this.$httpBackend.expectPOST('/api/communities?pipo1=pipo2&pipo3=pipo4', community).respond(202);
        this.communityAPI.create(community, {pipo1: 'pipo2', pipo3: 'pipo4'});
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.create({});
        expect(promise.then).to.be.a.function;
      });
    });

    describe('update() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        this.body = {
          title: 'toto',
          avatar: 'cc',
          newUsers: ['aa'],
          deleteUsers: ['bb']
        };
      }));

      it('should send a PUT request to /api/communities/:id/title', function() {
        this.$httpBackend.expectPUT('/api/communities/' + this.communityId).respond(200);
        this.communityAPI.update(this.communityId, this.body);
        this.$httpBackend.flush();
      });

      it('should send a PUT to /api/communities/:id/title with given query parameters ', function() {
        this.$httpBackend.expectPUT('/api/communities/' + this.communityId).respond(200);
        this.communityAPI.update(this.communityId, this.body);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.update('', {});
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getMembers() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
      }));

      it('should send a GET request to /api/collaborations/community/:id/members', function() {
        this.$httpBackend.expectGET('/api/collaborations/community/' + this.communityId + '/members').respond(200, {});
        this.communityAPI.getMembers(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.getMembers(123);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('getMember() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.communityId = '123';
        this.userId = '456';
      }));

      it('should send a GET request to /api/communities/:id/members/:user', function() {
        this.$httpBackend.expectGET('/api/communities/' + this.communityId + '/members/' + this.userId).respond(200, {});
        this.communityAPI.getMember(this.communityId, this.userId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.getMember(123, 456);
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('communityViewController controller', function() {

    beforeEach(inject(['$rootScope', '$controller', '$q', function($rootScope, $controller) {
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.location = {};
      this.log = {error: function() {}, debug: function() {}};
      this.community = {_id: 'community1', memberOf: []};
      this.communityAPI = {};
      this.communityService = {};
      this.session = {domain: {_id: 'domain1'}, user: {_id: 'user1'}};
      this.memberOf = [];

      $controller('communityViewController', {
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
        this.communityAPI.get = function(id) {
          expect(id).to.equal('community1');
          done();
          return $q.defer().promise;
        };
        this.scope.reload();
      });

      describe('communityAPI.get(:id) handler', function() {
        it('should update scope.community', function() {
          this.communityAPI.get = function(id) {
            expect(id).to.equal('community1');
            return $q.when({data: {_id: 'community1', updated: true}});
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
        this.communityAPI.get = function() {
          return $q.when({data: result});
        };
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
        this.communityAPI.get = function() {
          return $q.when({ data: result });
        };
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

      timeoutMock.cancel = function() {
      };

      angular.mock.module(function($provide) {
        $provide.value('$timeout', timeoutMock);
      });
    });

    beforeEach(inject(['$compile', '$rootScope', '$httpBackend', function($c, $r, $h) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$httpBackend = $h;
      this.title = 'fakeTitle';
      this.emptyResponse = [];
      this.response = [{_id: '1234'}];
    }]));

    afterEach(function() {
      this.$httpBackend.verifyNoOutstandingExpectation();
    });

    it('should have $pending.unique set when REST request is going on', function() {
      this.$httpBackend.expectGET('/api/communities?title=' + this.title).respond(this.emptyResponse);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.title);
      input.trigger('change');
      expect(scope.form.$pending).to.have.property('unique');
    });

    it('should remove the ajax error and set a unique=true error when the community already exists', function() {
      this.$httpBackend.expectGET('/api/communities?title=' + this.title).respond(this.response);
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
      this.$httpBackend.expectGET('/api/communities?title=' + this.title).respond(this.emptyResponse);
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
    beforeEach(angular.mock.inject(function(communityService, esnCollaborationClientService, $rootScope) {
      this.esnCollaborationClientService = esnCollaborationClientService;
      this.communityService = communityService;
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

      it('should call esnCollaborationClientService.join(\'community\', :communityid, :userid) if the user is not a member', function(done) {
        this.community.member_status = '???';
        this.esnCollaborationClientService.join = function(collaborationType, cid, uid) {
          expect(collaborationType).to.equal('community');
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

      it('should call communityAPI.leave(\'community\', :communityid, :userid) if the user is a member', function(done) {
        this.community.member_status = 'member';
        this.esnCollaborationClientService.leave = function(collaborationType, cid, uid) {
          expect(collaborationType).to.equal('community');
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

      it('should call esnCollaborationClientService.requestMembership(\'community\', :communityid, :userid) if the user is not a member', function(done) {
        this.community.member_status = '???';
        this.esnCollaborationClientService.requestMembership = function(collaborationType, cid, uid) {
          expect(collaborationType).to.equal('community');
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

      it('should call esnCollaborationClientService.cancelRequestMembership(\'community\', :communityid, :userid)', function(done) {
        this.esnCollaborationClientService.cancelRequestMembership = function(collaborationType, cid, uid) {
          expect(collaborationType).to.equal('community');
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
    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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
        this.communityService.join = function() {
          return $q.defer().promise;
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
          var deferred = $q.defer();
          this.communityService.join = function() {
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
          var deferred = $q.defer();
          this.communityService.join = function() {
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
          var deferred = $q.defer();
          this.communityService.join = function() {
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
          var deferred = $q.defer();
          this.communityService.join = function() {
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
    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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
        this.communityService.leave = function() {
          return $q.defer().promise;
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
          var deferred = $q.defer();
          this.communityService.leave = function() {
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
          var deferred = $q.defer();
          this.communityService.leave = function() {
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
          var deferred = $q.defer();
          this.communityService.leave = function() {
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
          var deferred = $q.defer();
          this.communityService.leave = function() {
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
    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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
        this.communityService.requestMembership = function() {
          return $q.defer().promise;
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
          var deferred = $q.defer();
          this.communityService.requestMembership = function() {
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
          var deferred = $q.defer();
          this.communityService.requestMembership = function() {
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
          var deferred = $q.defer();
          this.communityService.requestMembership = function() {
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
          var deferred = $q.defer();
          this.communityService.requestMembership = function() {
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
    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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
        this.communityService.cancelRequestMembership = function() {
          return $q.defer().promise;
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
          var deferred = $q.defer();
          this.communityService.cancelRequestMembership = function() {
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
          var deferred = $q.defer();
          this.communityService.cancelRequestMembership = function() {
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
          var deferred = $q.defer();
          this.communityService.cancelRequestMembership = function() {
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
          var deferred = $q.defer();
          this.communityService.cancelRequestMembership = function() {
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
      this.esnCollaborationClientService = {
        get: function() {},
        getRequestMemberships: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('esnCollaborationClientService', self.esnCollaborationClientService);
      });
      module('jadeTemplates');
      module('esn.core');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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

    it('should call esnCollaborationClientService#getRequestMemberships', function(done) {
      this.esnCollaborationClientService.getRequestMemberships = function() {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
    });

    it('should set error when call the API fails', function(done) {
      this.esnCollaborationClientService.getRequestMemberships = function() {
        return $q.reject();
      };

      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();

      var iscope = element.isolateScope();
      expect(iscope.error).to.exist;
      expect(iscope.error).to.be.true;
      done();
    });

    it('should set requests in the scope when API call succeeds', function(done) {
      var result = [{user: {_id: 1, emails: ['foo@bar.com']}}, {user: {_id: 2, emails: ['baz@bar.com']}}];
      this.esnCollaborationClientService.getRequestMemberships = function() {
        return $q.when({ data: result });
      };

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

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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
      var esnCollaborationClientService = {
        get: function() {},
        join: function() {}
      };

      var userAPI = {
        user: function() {}
      };

      angular.mock.module('esn.community');
      angular.mock.module('esn.user');
      angular.mock.module(function($provide) {
        $provide.value('esnCollaborationClientService', esnCollaborationClientService);
        $provide.value('userAPI', userAPI);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, esnCollaborationClientService) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.scope = $rootScope.$new();
      this.esnCollaborationClientService = esnCollaborationClientService;
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
        it('should call esnCollaborationClientService#join', function(done) {
          var self = this;
          this.esnCollaborationClientService.join = function(collaborationType, community, user) {
            expect(collaborationType).to.equal('community');
            expect(community).to.equal(self.scope.community._id);
            expect(user).to.equal(self.scope.user._id);
            return done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.accept();
        });

        it('should set $scope.done on esnCollaborationClientService#join success', function() {
          this.esnCollaborationClientService.join = function() {
            return $q.when();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.accept();
          this.scope.$digest();
          expect(iscope.done).to.be.true;
        });

        it('should set $scope.error on esnCollaborationClientService#join failure', function() {
          this.esnCollaborationClientService.join = function() {
            return $q.reject();
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
        it('should call esnCollaborationClientService#cancelRequestMembership', function(done) {
          var self = this;
          this.esnCollaborationClientService.cancelRequestMembership = function(collaborationType, community, user) {
            expect(collaborationType).to.equal('community');
            expect(community).to.equal(self.scope.community._id);
            expect(user).to.equal(self.scope.user._id);
            return done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.decline();
        });

        it('should set $scope.error on esnCollaborationClientService#cancelRequestMembership failure', function() {
          this.esnCollaborationClientService.cancelRequestMembership = function() {
            return $q.reject();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.decline();
          this.scope.$digest();
          expect(iscope.error).to.be.true;
        });

        it('should set $scope.done on esnCollaborationClientService#cancelRequestMembership success', function() {
          this.esnCollaborationClientService.cancelRequestMembership = function() {
            return $q.when();
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
      this.esnCollaborationClientService = {
        cancelRequestMembership: function() {},
        get: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('esnCollaborationClientService', self.esnCollaborationClientService);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.scope = $rootScope.$new();
      this.scope.community = {
        _id: 'community1',
        creator: 'user1'
      };

      this.html = '<community-pending-invitation-list community="community"></community-pending-invitation-list>';
    }));

    it('should call esnCollaborationClientService.getRequestMemberships', function(done) {

      this.esnCollaborationClientService.getRequestMemberships = function() {
        return done();
      };
      this.$compile(this.html)(this.scope);
      this.scope.$digest();
    });

    it('should set the esnCollaborationClientService.getRequestMemberships result in the scope', function(done) {
      this.$compile(this.html)(this.scope);

      var result = [1, 2, 3];
      this.esnCollaborationClientService.getRequestMemberships = function() {
        return $q.when({ data: result });
      };
      this.scope.$digest();
      expect(this.scope.requests).to.deep.equal(result);
      done();
    });

    it('should display error when esnCollaborationClientService.getRequestMemberships fails', function(done) {
      var element = this.$compile(this.html)(this.scope);
      this.esnCollaborationClientService.getRequestMemberships = function() {
        return $q.reject();
      };
      this.scope.$digest();
      var error = $(element.find('[error-container]')[0]);
      expect(error).to.not.have.class('hidden');
      done();
    });
  });

  describe('communityPendingInvitationDisplay directive', function() {

    beforeEach(function() {
      var self = this;
      this.esnCollaborationClientService = {
        cancelRequestMembership: function() {
        },
        get: function() {
        }
      };
      angular.mock.module(function($provide) {
        $provide.value('esnCollaborationClientService', self.esnCollaborationClientService);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
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
          this.esnCollaborationClientService.cancelRequestMembership = function() {
            done();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          element.find('.btn').click();
        });

        it('should hide the button on success', function() {
          this.esnCollaborationClientService.cancelRequestMembership = function() {
            return $q.when();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var button = element.find('.btn');
          button.click();
          this.scope.$digest();
          expect(button).to.be.hidden;
        });

        it('should enable the button on failure', function() {
          this.esnCollaborationClientService.cancelRequestMembership = function() {
            return $q.reject();
          };
          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
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
      var esnCollaborationClientService = {
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
        $provide.value('esnCollaborationClientService', esnCollaborationClientService);
        $provide.value('communityService', communityService);
      });
      module('jadeTemplates');
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, esnCollaborationClientService, communityService) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.scope = $rootScope.$new();
      this.esnCollaborationClientService = esnCollaborationClientService;
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
        it('should call esnCollaborationClientService#getInvitablePeople', function(done) {
          var query = 'testquery';
          var self = this;
          this.esnCollaborationClientService.getInvitablePeople = function(collaborationType, communityId, options) {
            expect(collaborationType).to.equal('community');
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

        it('should set displaynames on users if esnCollaborationClientService#getInvitablePeople works', function() {
          var query = 'testquery';
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1', preferredEmail: 'pipo1@pipo.com'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com'], preferredEmail: 'pipo2@pipo.com'};
          var res = {
            data: [user1, user2]
          };
          this.esnCollaborationClientService.getInvitablePeople = function() {
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
          expect(res.data[1].displayName).to.equal(user2.preferredEmail);
        });
      });

      describe('The inviteUsers function', function() {
        it('should call esnCollaborationClientService#requestMembership for each user in the scope', function() {
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com']};
          var users = [user1, user2];
          var self = this;
          var call = 0;
          this.esnCollaborationClientService.requestMembership = function(collaborationType, communityId, userId) {
            expect(collaborationType).to.equal('community');
            expect(communityId).to.equal(self.scope.community._id);
            expect(userId).to.exist;
            expect(userId).to.equal(users[call]._id);
            call++;
            return {};
          };

          var oldQAll = $q.all;
          $q.all = function(promises) {
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
          $q.all = oldQAll;
        });

        it('should not call esnCollaborationClientService#requestMembership if there are no user in the scope', function(done) {
          this.esnCollaborationClientService.requestMembership = function() {
            done(new Error('unexpected call'));
          };

          var element = this.$compile(this.html)(this.scope);
          this.scope.$digest();
          var iscope = element.isolateScope();
          iscope.users = [];
          iscope.inviteUsers();
          done();
        });

        it('should not call esnCollaborationClientService#requestMembership if there already is a running call', function(done) {
          this.esnCollaborationClientService.requestMembership = function() {
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
          this.esnCollaborationClientService.requestMembership = function(collaborationType, communityId, userId) {
            expect(collaborationType).to.equal('community');
            expect(communityId).to.equal(self.scope.community._id);
            expect(userId).to.exist;
            expect(userId).to.equal(users[call]._id);
            call++;
            return {};
          };

          var oldQAll = $q.all;
          $q.all = function(promises) {
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

          $q.all = oldQAll;
        });

        it('should show success message if rest calls are OK', function() {
          var user1 = {_id: '123456', emails: ['pipo1@pipo.com'], firstname: 'pipo1', lastname: 'pipo1'};
          var user2 = {_id: '456789', emails: ['pipo2@pipo.com']};
          var users = [user1, user2];
          var self = this;
          var call = 0;
          this.esnCollaborationClientService.requestMembership = function(collaborationType, communityId, userId) {
            expect(collaborationType).to.equal('community');
            expect(communityId).to.equal(self.scope.community._id);
            expect(userId).to.exist;
            expect(userId).to.equal(users[call]._id);
            call++;
            return {};
          };

          var restError = new Error({details: 'oups'});
          var oldQAll = $q.all;
          $q.all = function(promises) {
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

          $q.all = oldQAll;
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
