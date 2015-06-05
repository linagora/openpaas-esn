'use strict';

var initialized, injectionModule, loggerModule;
var callback = function(err) {
  if (err) {
    loggerModule.error('Failed injection', err.message);
  } else {
    loggerModule.info('Successful injection');
  }
};

var getInjectionsWithSource = function(appId, injections) {
  return injections.map(function(injection) {
    var newInjection = injection.toJSON();
    newInjection.source = { objectType: 'application', id: appId };
    return newInjection;
  });
};

function hasTargetInjections(application) {
  return application.targetInjections && application.targetInjections.length !== 0;
}

function hasDomainInjections(application) {
  return application.domainInjections && application.domainInjections.length !== 0;
}

function applicationInstalledHandler(event) {
  if (!event.application || !event.target || !event.domain) {
    return;
  }

  if (hasTargetInjections(event.application)) {
    injectionModule.inject(event.target, getInjectionsWithSource(event.application._id, event.application.targetInjections), callback);
  }

  if (hasDomainInjections(event.application)) {
    injectionModule.inject(event.domain, getInjectionsWithSource(event.application._id, event.application.domainInjections), callback);
  }
}

function applicationUninstalledHandler(event) {
  if (!event.application || !event.target || !event.domains) {
    return;
  }

  if (hasTargetInjections(event.application)) {
    injectionModule.removeInjections(event.application, event.target, callback);
  }

  if (hasDomainInjections(event.application)) {
    event.domains.forEach(function(domain) {
      injectionModule.removeInjections(event.application, domain, callback);
    });
  }
}

function init(dependencies) {
  loggerModule = dependencies('logger');
  injectionModule = dependencies('injection');
  var localpubsub = dependencies('pubsub').local;

  if (initialized) {
    loggerModule.warn('Appstore Pubsub is already initialized');
    return;
  }

  localpubsub.topic('appstore:application:installed').subscribe(applicationInstalledHandler);
  localpubsub.topic('appstore:application:uninstalled').subscribe(applicationUninstalledHandler);
  initialized = true;
}
module.exports.init = init;
