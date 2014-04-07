'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ESN Angular module', function() {
  beforeEach(angular.mock.module('esnApp'));

  describe('memberscontroller', function() {
    beforeEach(angular.mock.inject(function ($httpBackend, $controller, $rootScope, $route, Restangular) {
      var self = this;
      this.createGETUrl = function(limit, offset, search) {
        return '/api/domains/' + this.domainId + '/members?limit='+limit+'&offset='+offset+'&search='+search;
      };

      this.response = [
        {
          emails: ['toto@linagora.com']
        }
      ];
      this.headers = {'x-esn-items-count': this.response.length};

      this.domainAPI = {};

      this.$httpBackend = $httpBackend;
      this.domainId = '123456789';
      this.$controller = $controller;
      this.$scope = $rootScope.$new();
      this.$route = $route;
      this.$route.current = {
        params: {
          id: this.domainId
        }
      };
      $controller('memberscontroller', {
        $scope: this.$scope,
        $domainAPI: this.domainAPI,
        $route: $route
      });

      Restangular.setFullResponse(true);
    }));

    describe('loadMoreElements method', function() {

      it('should call the domainAPI.getMembers() method', function (done) {
        this.$httpBackend.expectGET(this.createGETUrl(20, 0, '')).respond(200, this.response, this.headers);
        //this.$httpBackend.expectGET(this.createGETUrl(20, 20, '')).respond(200, this.response, this.headers);

        console.log(this.domainAPI);

        //this.domainAPI.getMembers = function (domain_id, opts) {
        this.domainAPI.getMembers = function () {
          console.log('totototototototo');
          done();
        };
        this.$scope.loadMoreElements();
      });
    });

    /*it('should send a request to /domains/:uuid/members', function (done) {
      this.$httpBackend.expectGET(this.createGETUrl(20, 0, '')).respond(200, this.response, this.headers);
      this.$httpBackend.expectGET(this.createGETUrl(20, 20, '')).respond(200, this.response, this.headers);
      var self = this;
      this.domainAPI = {
        getMembers: function(domain_id, opts){
          console.log('coucou', self.$scope.members);
          self.$scope.members = self.$scope.members.concat(self.response);
          //expect(this.$scope.members.length).to.equal(2);
          done();
        }
      };

      this.$httpBackend.expectGET('/views/esn/partials/home').respond(200);

      this.$scope.loadMoreElements();

      //check the list
      this.$httpBackend.flush();
    });*/

  });
});