'use strict';

var fs = require('fs');

function readDockerCert(name) {
  try {
    return fs.readFileSync(process.env.DOCKER_CERT_PATH + '/' + name, { encoding: 'utf-8' });
  } catch (e) {
    return '';
  }
}

module.exports = function(type) {
  if (type === 'remote') {
    return {
      host: process.env.DOCKER_HOST || '192.168.99.100',
      port: process.env.DOCKER_PORT || 2376,
      ca: readDockerCert('ca.pem'),
      cert: readDockerCert('cert.pem'),
      key: readDockerCert('key.pem'),
      pass: process.env.DOCKER_CERT_PASS || 'mypass'
    };
  } else {
    return {
      socketPath: '/var/run/docker.sock'
    };
  }
};
