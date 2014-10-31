'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Maps Angular module', function() {

  beforeEach(angular.mock.module('esn.maps'));

  describe('geoAPI service', function() {

    beforeEach(angular.mock.inject(function(osmAPI, geoAPI, $httpBackend, $geolocation) {
      this.$httpBackend = $httpBackend;
      this.osmAPI = osmAPI;
      this.geoAPI = geoAPI;
      this.$geolocation = $geolocation;
    }));

    describe('The getCurrentPosition function', function() {
      it('should call the $geolocation service', function(done) {
        this.$geolocation.getCurrentPosition = done;
        this.geoAPI.getCurrentPosition();
      });
    });

  });

  describe('osmAPI service', function() {
    describe('The reverse function', function() {

      beforeEach(angular.mock.inject(function(osmAPI, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.osmAPI = osmAPI;
      }));

      it('should be a function', function() {
        expect(this.osmAPI.reverse).to.be.a.function;
      });

      it('should HTTP GET http://nominatim.openstreetmap.org/reverse', function() {
        var lat = '123456789';
        var lon = '987654321';

        this.$httpBackend.expectGET('http://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=' + lat + '&lon=' + lon).respond({});
        this.osmAPI.reverse(lat, lon);
        this.$httpBackend.flush();
      });
    })
  });
});