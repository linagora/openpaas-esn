'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Member Angular module', function() {

  beforeEach(angular.mock.module('esn.member'));

  describe('memberDisplay directive', function() {

    //Load the karma built module containing the templates
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    beforeEach(function() {
      this.getExpectedHtmlForUser = function(firstName, lastName, email, id) {
        var templateAsHtmlString =
          '<div class="login-bg container-fluid">' +
            '<div class="row">' +
            '<div class="col-md-4">' +
            '<img width="128" height="128" src="/api/users/%Id/profile/avatar" ng-src="/api/users/%Id/profile/avatar">' +
            '</div>' +
            '<div class="col-md-8">' +
            '<h4 class="ng-binding">%FirstName %LastName</h4>' +
            '<span><a href="mailto:%Email" class="ng-binding">%Email</a></span>' +
            '</div>' +
            '</div>' +
            '</div>';
        templateAsHtmlString = templateAsHtmlString.replace(/%FirstName/g, firstName);
        templateAsHtmlString = templateAsHtmlString.replace(/%LastName/g, lastName);
        templateAsHtmlString = templateAsHtmlString.replace(/%Email/g, email);
        templateAsHtmlString = templateAsHtmlString.replace(/%Id/g, id);
        return templateAsHtmlString;
      };
    });

    it('should display a user from the scope using the template', function() {
      var html = '<member-display member="testuser"></member-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testuser = { _id: 123456789,
        firstname: 'John',
        lastname: 'Doe',
        emails: ['johndoe@linagora.com']
      };

      this.$rootScope.$digest();
      expect(element.html()).to.equal(this.getExpectedHtmlForUser(this.$rootScope.testuser.firstname,
        this.$rootScope.testuser.lastname, this.$rootScope.testuser.emails[0], this.$rootScope.testuser._id));
    });

    it('should display the empty template if the provided user does not exist in the scope', function() {
      var html = '<member-display member="ghostuser"></member-display>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      expect(element.html()).to.equal(this.getExpectedHtmlForUser('', '', '', ''));
    });
  });

  describe('memberscontroller', function() {
    beforeEach(angular.mock.inject(function($controller, $rootScope, $routeParams, Restangular, memberSearchConfiguration) {
      this.searchConf = memberSearchConfiguration;

      this.domainAPI = {};
      //initialize the getMembers method because it is called at controller's instantiation
      this.domainAPI.getMembers = function(id, opts) {};

      this.usSpinnerService = {};
      this.usSpinnerService.spin = function(id) {};
      this.usSpinnerService.stop = function(id) {};

      this.domainId = '123456789';
      this.$controller = $controller;
      this.scope = $rootScope.$new();
      this.$routeParams = {
        domain_id: this.domainId
      };
      $controller('memberscontroller', {
        $scope: this.scope,
        domainAPI: this.domainAPI,
        $routeParams: this.$routeParams,
        usSpinnerService: this.usSpinnerService
      });

      Restangular.setFullResponse(true);
    }));

    describe('loadMoreElements method', function() {

      it('should call the domainAPI.getMembers() method with the right options', function(done) {
        this.callCount = 0;
        this.successfullCallsCount = 5;
        this.maxCount = 10;
        this.scope.members = {
          length: 0
        };
        var self = this;
        this.domainAPI.getMembers = function(domain_id, opts) {
          self.callCount++;

          expect(domain_id).to.equal(self.domainId);
          expect(opts.limit).to.equal(self.searchConf.searchLimit);
          expect(opts.search).to.equal('');

          if (self.callCount <= self.successfullCallsCount) {
            expect(opts.offset).to.equal(self.searchConf.searchLimit * (self.callCount - 1));
          }
          else {
            expect(opts.offset).to.equal(self.searchConf.searchLimit * self.successfullCallsCount);
          }

          //emulate the fact that the call is succesfull
          // -> the member list grows
          if (self.callCount <= self.successfullCallsCount) {
            self.scope.members.length += self.searchConf.searchLimit;
          }

          //do maxCount calls
          if (self.callCount < self.maxCount) {
            self.scope.loadMoreElements();
          }
          else if (self.callCount === self.maxCount) {
            done();
          }
        };
        this.scope.loadMoreElements();
      });

      it('should spin when running and stop when finished', function(done) {
        var isSpinning = false;
        this.usSpinnerService.spin = function(id) {
          expect(id).to.equal('memberSpinner');
          isSpinning = true;
        };
        this.usSpinnerService.stop = function(id) {
          expect(isSpinning).to.be.true;
          expect(id).to.equal('memberSpinner');
          done();
        };
        this.domainAPI.getMembers = function(domain_id, opts) {
          return {
            then: function(callback) {
              var data = {
                headers: function() {}
              };
              callback(data);
            }
          };
        };

        this.scope.loadMoreElements();
      });
    });

    describe('doSearch method', function() {

      it('should call the domainAPI.getMembers() method with the correct query', function(done) {
        this.scope.searchInput = 'testQuery';

        var self = this;
        this.domainAPI.getMembers = function(domain_id, opts) {
          expect(domain_id).to.equal(self.domainId);
          expect(opts.limit).to.equal(self.searchConf.searchLimit);
          expect(opts.offset).to.equal(0);
          expect(opts.search).to.equal(self.scope.searchInput);
          done();
        };
        this.scope.doSearch();
      });

    });

  });

});
