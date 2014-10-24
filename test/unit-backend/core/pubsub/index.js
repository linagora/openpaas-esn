'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The pubsub index.js', function() {
  var called, mock, stub;

  before(function() {
    mock = {
      init: function() {
        called = true;
      }
    };
    stub = {
      init: function() {}
    };
  });

  beforeEach(function() {
    called = false;
  });

  it('should initialize activitystreams pubsub', function() {
    mockery.registerMock('../activitystreams/pubsub', mock);
    mockery.registerMock('../notification/pubsub', stub);

    var module = require(this.testEnv.basePath + '/backend/core/pubsub');
    module.init();
    expect(called).to.be.true;
  });

  it('should initialize notification pubsub', function() {
    mockery.registerMock('../activitystreams/pubsub', stub);
    mockery.registerMock('../notification/pubsub', mock);

    var module = require(this.testEnv.basePath + '/backend/core/pubsub');
    module.init();
    expect(called).to.be.true;
  });
});
