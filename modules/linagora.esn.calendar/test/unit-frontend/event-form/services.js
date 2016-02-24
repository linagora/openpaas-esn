'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-form module services', function() {

  beforeEach(function() {
    this.screenSize = {};
    this.eventUtils = {
      setEditedEvent: function() {}
    };
    this.$modal = sinon.spy(function(options) {
      expect(options).to.shallowDeepEqual({
        templateUrl: '/calendar/views/event-quick-form/event-quick-form-view',
        backdrop: 'static',
        placement: 'center'
      });
    });
    this.$state = {};
    this.calendarService = {
      calendarHomeId: '123'
    };

    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar');
    var self = this;
    angular.mock.module(function($provide) {
      $provide.value('screenSize', self.screenSize);
      $provide.value('eventUtils', self.eventUtils);
      $provide.value('$modal', self.$modal);
      $provide.value('$state', self.$state);
      $provide.value('calendarService', self.calendarService);
    });
  });

  beforeEach(angular.mock.inject(function(openEventForm) {
    this.openEventForm = openEventForm;
  }));

  describe('openEventForm', function() {
    it('should call $modal if screensize is md', function() {
      this.screenSize.is = sinon.stub().returns(false);
      this.$state.go = sinon.spy();

      this.openEventForm({});
      expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
      expect(this.$modal).to.have.been.called;
      expect(this.$state.go).to.not.have.been;
    });

    it('should call $state to calendar.event.form if screensize is xs or sm and isOrganizer', function() {
      this.screenSize.is = sinon.stub().returns(true);
      this.$state.go = sinon.spy();
      this.eventUtils.isOrganizer = sinon.stub().returns(true);

      this.openEventForm({id: '456'});
      expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.form', {calendarId: '123', eventId: '456'});
      expect(this.eventUtils.isOrganizer).to.have.been.called;
    });

    it('should call $state to calendar.event.consult if screensize is xs or sm and not isOrganizer', function() {
      this.screenSize.is = sinon.stub().returns(true);
      this.$state.go = sinon.spy();
      this.eventUtils.isOrganizer = sinon.stub().returns(false);

      this.openEventForm({id: '456'});
      expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.consult', {calendarId: '123', eventId: '456'});
      expect(this.eventUtils.isOrganizer).to.have.been.called;
    });
  });
});
