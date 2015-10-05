'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Profile Angular module', function() {

  beforeEach(angular.mock.module('esn.profile'));

  describe('profileAPI service', function() {

    describe('updateProfileField() method', function() {

      beforeEach(angular.mock.inject(function(profileAPI, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.profileAPI = profileAPI;

        this.fieldName = 'name';
        this.fieldValue = 'fieldValue';
      }));

      it('should send a request to /user/profile/fieldName', function() {
        this.$httpBackend.expectPUT('/user/profile/' + this.fieldName).respond();
        this.profileAPI.updateProfileField(this.fieldName, this.fieldValue);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.profileAPI.updateProfileField(this.request);
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('profileEditionController', function() {
    beforeEach(inject(function($rootScope, $controller) {
      this.profileAPI = {};
      this.scope = $rootScope.$new();

      $controller('profileEditionController', {
        $scope: this.scope,
        profileAPI: this.profileAPI
      });
    }));

    describe('updateName() method', function() {
      var getMoreThan100CharString = function() {
        return new Array(1000).join('a');
      };

      it('should return a message error if the provided name is not "firstname /space/ lastname"', function() {
        var res = this.scope.updateName('incorrectName');
        expect(res).to.be.not.null;
        expect(typeof res === 'string').to.be.true;
      });

      it('should return an error message if the firstname is too long', function() {
        var res = this.scope.updateName(getMoreThan100CharString() + ' Doe');
        expect(res).to.be.not.null;
        expect(typeof res === 'string').to.be.true;
      });

      it('should return an error message if the lastname is too long', function() {
        var res = this.scope.updateName('John ' + getMoreThan100CharString());
        expect(res).to.be.not.null;
        expect(typeof res === 'string').to.be.true;
      });

      it('should call the profileAPI.updateProfileField() twice method with the correct parameters', function(done) {
        //this method should consecutively update the first name and the last name
        var newFirstName = 'newFirstName';
        var newLastName = 'newLastName';
        var newName = newFirstName + ' ' + newLastName;

        var count = 0;
        this.profileAPI.updateProfileField = function(fieldName, fieldValue) {
          if (count === 0) {
            count++;

            expect(fieldName).to.equal('firstname');
            expect(fieldValue).to.equal(newFirstName);

            var promise = {then: function(callback, errorCallBack) {
              callback(null); //emulates that the first call executed right
            }};
            return promise;
          }
          else {
            expect(fieldName).to.equal('lastname');
            expect(fieldValue).to.equal(newLastName);
            done();
          }
        };

        this.scope.updateName(newName);
      });
    });

    describe('updateJob() method', function() {
      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newJob = 'newJob';
        this.profileAPI.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('job_title');
          expect(fieldValue).to.equal(newJob);
          done();
        };
        this.scope.updateJob(newJob);
      });
    });

    describe('updateService() method', function() {
      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newService = 'newService';
        this.profileAPI.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('service');
          expect(fieldValue).to.equal(newService);
          done();
        };
        this.scope.updateService(newService);
      });
    });

    describe('updateBuildingLocation() method', function() {
      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newBuilding = 'newBuilding';
        this.profileAPI.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('building_location');
          expect(fieldValue).to.equal(newBuilding);
          done();
        };
        this.scope.updateBuildingLocation(newBuilding);
      });
    });

    describe('updateOfficeLocation() method', function() {
      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newOffice = 'newOffice';
        this.profileAPI.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('office_location');
          expect(fieldValue).to.equal(newOffice);
          done();
        };
        this.scope.updateOfficeLocation(newOffice);
      });
    });

    describe('updatePhone() method', function() {
      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newPhone = 'newPhone';
        this.profileAPI.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('main_phone');
          expect(fieldValue).to.equal(newPhone);
          done();
        };
        this.scope.updatePhone(newPhone);
      });
    });
  });

  describe('avatarController', function() {
    beforeEach(inject(['$rootScope', '$controller', function($rootScope, $controller) {
      this.$scope = $rootScope.$new();
      this.$rootScope = $rootScope;
      this.$timeout = function(cb) {return cb();};

      $controller('avatarController', {
        $rootScope: this.$rootScope,
        $scope: this.$scope,
        $timeout: this.$timeout
      });
    }]));

    it('should update the avatarURL on avatar:updated event', function(done) {
      this.$scope.getURL = function() {
        return done();
      };
      this.$rootScope.$broadcast('avatar:updated');
    });
  });

  describe('profileMinicard directive', function() {

    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display the user information', function() {

      var html = '<profile-minicard user="user"></profile-minicard>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.user = {
        name: 'Me',
        address: 'foo@bar.com'
      };

      this.$rootScope.$digest();
      expect(element.html()).to.have.string(this.$rootScope.user.name);
      expect(element.html()).to.have.string(this.$rootScope.user.address);
    });
  });

  describe('profileDisplay directive', function() {

    var userId = 'userA';
    beforeEach(module('jadeTemplates'));
    beforeEach(module('esn.avatar'));

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('session', {
          user: {
            _id: userId
          }
        });
      });
    });

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should set the me flag to true when user is the current one', function() {
      this.$rootScope.user = {
        name: 'Me',
        address: 'foo@bar.com',
        _id: userId
      };
      var html = '<profile-display user="user"></profile-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.$digest();
      var iscope = element.isolateScope();
      expect(iscope.me).to.be.true;
    });

    it('should set the me flag to false when user is not the current one', function() {
      this.$rootScope.user = {
        name: 'Me',
        address: 'foo@bar.com',
        _id: '123'
      };
      var html = '<profile-display user="user"></profile-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.$digest();
      var iscope = element.isolateScope();
      expect(iscope.me).to.be.false;
    });
  });
});
