'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.profile Angular module controllers', function() {

  var $rootScope;
  var $controller;

  beforeEach(function() {
    module('linagora.esn.profile');

    inject(function(_$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });
  });

  describe('The profileController', function() {

    var userMock;
    var profileAPIMock;
    var sessionMock;
    var $scope;

    beforeEach(function() {
      userMock = {
        name: 'Foo',
        address: 'foo@bar.com',
        _id: '123'
      };
      profileAPIMock = {};
      sessionMock = { user: userMock };
      $scope = $rootScope.$new();
    });

    function initProfileController(scope) {
      $scope = scope || $scope;

      return $controller('profileController', {
        $scope: $scope,
        profileAPI: profileAPIMock,
        user: userMock,
        session: sessionMock
      });
    }

    it('should set a me flag when the user is the same as the logged-in user', function() {
      initProfileController();

      expect($scope.me).to.be.true;
    });

    it('should not set a me flag when the user is not the logged-in user', function() {
      sessionMock.user = {
        _id: '456'
      };

      initProfileController();

      expect($scope.me).to.be.false;
    });

    describe('updateName() method', function() {

      var getMoreThan100CharString = function() {
        return new Array(1000).join('a');
      };

      beforeEach(function() {
        initProfileController();
      });

      it('should return a message error if the provided name is not "firstname /space/ lastname"', function() {
        var res = $scope.updateName('incorrectName');

        expect(res).to.be.not.null;
        expect(typeof res === 'string').to.be.true;
      });

      it('should return an error message if the firstname is too long', function() {
        var res = $scope.updateName(getMoreThan100CharString() + ' Doe');

        expect(res).to.be.not.null;
        expect(typeof res === 'string').to.be.true;
      });

      it('should return an error message if the lastname is too long', function() {
        var res = $scope.updateName('John ' + getMoreThan100CharString());

        expect(res).to.be.not.null;
        expect(typeof res === 'string').to.be.true;
      });

      it('should call the profileAPI.updateProfileField() twice method with the correct parameters', function(done) {
        //this method should consecutively update the first name and the last name
        var newFirstName = 'newFirstName';
        var newLastName = 'newLastName';
        var newName = newFirstName + ' ' + newLastName;

        var count = 0;

        profileAPIMock.updateProfileField = function(fieldName, fieldValue) {
          if (count === 0) {
            count++;

            expect(fieldName).to.equal('firstname');
            expect(fieldValue).to.equal(newFirstName);

            var promise = {then: function(callback, errorCallBack) {
              callback(null); //emulates that the first call executed right
            }};

            return promise;
          } else {
            expect(fieldName).to.equal('lastname');
            expect(fieldValue).to.equal(newLastName);
            done();
          }
        };

        $scope.updateName(newName);
      });
    });

    describe('updateJob() method', function() {

      beforeEach(function() {
        initProfileController();
      });

      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newJob = 'newJob';

        profileAPIMock.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('job_title');
          expect(fieldValue).to.equal(newJob);
          done();
        };
        $scope.updateJob(newJob);
      });
    });

    describe('updateService() method', function() {

      beforeEach(function() {
        initProfileController();
      });

      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newService = 'newService';

        profileAPIMock.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('service');
          expect(fieldValue).to.equal(newService);
          done();
        };
        $scope.updateService(newService);
      });
    });

    describe('updateBuildingLocation() method', function() {

      beforeEach(function() {
        initProfileController();
      });

      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newBuilding = 'newBuilding';

        profileAPIMock.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('building_location');
          expect(fieldValue).to.equal(newBuilding);
          done();
        };
        $scope.updateBuildingLocation(newBuilding);
      });
    });

    describe('updateOfficeLocation() method', function() {

      beforeEach(function() {
        initProfileController();
      });

      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newOffice = 'newOffice';

        profileAPIMock.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('office_location');
          expect(fieldValue).to.equal(newOffice);
          done();
        };
        $scope.updateOfficeLocation(newOffice);
      });
    });

    describe('updatePhone() method', function() {

      beforeEach(function() {
        initProfileController();
      });

      it('should call the profileAPI.updateProfileField() method with the correct parameters', function(done) {
        var newPhone = 'newPhone';

        profileAPIMock.updateProfileField = function(fieldName, fieldValue) {
          expect(fieldName).to.equal('main_phone');
          expect(fieldValue).to.equal(newPhone);
          done();
        };
        $scope.updatePhone(newPhone);
      });
    });
  });

});
