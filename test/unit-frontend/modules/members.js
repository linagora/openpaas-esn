'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Members Angular module', function() {

  beforeEach(angular.mock.module('esn.members'));

  describe('memberDisplay directive', function() {

    //Load the karma built module containing the templates
    beforeEach(module('templates'));

    beforeEach(inject(['$compile', '$rootScope', '$httpBackend', function($c, $r, $h) {
      this.$compile = $c;
      this.$rootScope = $r;
//      this.$httpBackend = $h;
//      this.response = [];
    }]));

    it('should display a user from the scope using the template', function() {
//      this.$httpBackend.expectGET('/views/members/partials/member').respond(this.response);

      var html = '<member-display user="testuser"></member-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testuser = { _id: 123456789,
        firstname: 'John',
        lastname: 'Doe',
        emails: ['johndoe@linagora.com']
      };

      console.log(element);
      console.log(element.html());
      console.log('SCOPE  '+JSON.stringify(this.$rootScope.testuser));

      this.$rootScope.$digest();

      console.log(element);
      console.log(element.html());

      expect(element).to.equal('');
    });

    it('should be empty if the provided user does not exist in the scope', function() {
      var html = '<member-display user="ghostuser"></member-display>';
      var element = this.$compile(html)(this.$rootScope);
      expect(element.html()).to.equal('');
    });
  });

});
