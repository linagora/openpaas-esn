'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxLinkItems filter', function() {

  var filter;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(inboxLinkItemsFilter) {
    filter = inboxLinkItemsFilter;
  }));

  it('should do nothing if undefined given', function() {
    expect(filter()).to.equal(undefined);
  });

  it('should do nothing if null given', function() {
    expect(filter(null)).to.equal(null);
  });

  it('should do nothing if an empty array given', function() {
    expect(filter([])).to.deep.equal([]);
  });

  it('should link a single array element', function() {
    expect(filter([{}])).to.deep.equal([{ previous: null, next: null }]);
  });

  it('should link array elements', function() {
    var item1 = { a: 1 },
        item2 = { a: 2 },
        item3 = { a: 3 };

    filter([item1, item2, item3]);

    expect(item1.previous).to.equal(null);
    expect(item1.next()).to.deep.equal(item2);
    expect(item2.previous()).to.deep.equal(item1);
    expect(item2.next()).to.deep.equal(item3);
    expect(item3.previous()).to.deep.equal(item2);
    expect(item3.next).to.equal(null);
  });

});
