'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnDatetimeService', function() {
  var esnDatetimeService;

  beforeEach(function() {
    module('esn.datetime');
  });

  beforeEach(inject(function(_esnDatetimeService_) {
    esnDatetimeService = _esnDatetimeService_;
  }));

  describe('The formatDate function', function() {
    it('should return formatted date if input is instance of date', function() {
      var date = new Date('6/5/17');

      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('05/06/2017');
    });

    it('should return formatted date if input is string which is recognised date value', function() {
      var date = '6/5/17';

      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('05/06/2017');
    });

    it('should return original value if input is string which is unrecognised date value', function() {
      var date = 'unrecognised';

      expect(esnDatetimeService.formatDate(date, 'date')).to.equal('unrecognised');
    });
  });
});
