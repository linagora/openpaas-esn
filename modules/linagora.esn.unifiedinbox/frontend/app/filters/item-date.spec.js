'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxItemDate filter', function() {

  var inboxItemDateFilter;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('inboxDateGroups', {
        getGroup: function() {
          return {
            dateFormat: 'yyyy MM dd'
          };
        }
      });
    });
  });

  beforeEach(inject(function(_inboxItemDateFilter_) {
    inboxItemDateFilter = _inboxItemDateFilter_;
  }));

  it('should delegate to the "date" filter, requesting date format from inboxDateGroups', function() {
    expect(inboxItemDateFilter(new Date(Date.UTC(1970, 0, 1, 12, 0, 0)))).to.equal('1970 01 01');
  });

});
