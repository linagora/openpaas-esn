'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxMakeSelectable factory', function() {

  var $rootScope, inboxMakeSelectable, INBOX_EVENTS;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(_$rootScope_, _inboxMakeSelectable_, _INBOX_EVENTS_) {
    $rootScope = _$rootScope_;
    inboxMakeSelectable = _inboxMakeSelectable_;
    INBOX_EVENTS = _INBOX_EVENTS_;
  }));

  function MyObject() {}

  it('should set selectable=true on the source item', function() {
    expect(inboxMakeSelectable(new MyObject()).selectable).to.equal(true);
  });

  it('should provide a default value for the "selected" property', function() {
    expect(inboxMakeSelectable(new MyObject()).selected).to.equal(false);
  });

  it('should prevent changing the selectable property', function() {
    expect(function() {
      inboxMakeSelectable(new MyObject()).selectable = false;
    }).to.throw(Error);
  });

  it('should broadcast a ITEM_SELECTION_CHANGED event when selected flag changes on the item', function(done) {
    var selectable = inboxMakeSelectable(new MyObject());

    $rootScope.$on(INBOX_EVENTS.ITEM_SELECTION_CHANGED, function(event, item) {
      expect(item.selected).to.equal(true);

      done();
    });

    selectable.selected = true;
  });

  it('should not broadcast a ITEM_SELECTION_CHANGED event when selected flag does not change on the item', function(done) {
    var selectable = inboxMakeSelectable(new MyObject());

    $rootScope.$on(INBOX_EVENTS.ITEM_SELECTION_CHANGED, done);

    selectable.selected = false;
    done();
  });

});
