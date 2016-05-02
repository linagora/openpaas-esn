'use strict';

module.exports = function(grunt) {
  var path = require('path');
  var fs = require('fs');
  var swaggerJSDoc = require('swagger-jsdoc');
  var swaggerDefinitionFiles = path.normalize(__dirname + '/../doc/REST_API/swagger/definitions/*.js');
  var swaggerRoutesFiles = path.normalize(__dirname + '/../backend/webserver/api/*.js');
  var swaggerOutputFile = path.normalize(__dirname + '/../doc/REST_API/swagger/swagger.json');

  var options = {
    swaggerDefinition: {
      swagger: '2.0',
      info: {
        title: 'OpenPaaS',
        description: 'OpenPaaS API',
        version: '0.1'
      },
      host: 'localhost:8080',
      basePath: '/',
      consumes: ['application/json'],
      produces: ['application/json']
    },
    apis: [swaggerDefinitionFiles, swaggerRoutesFiles]
  };

  grunt.registerTask('swagger-generate', function(args) {

    var swaggerSpec = swaggerJSDoc(options);

    swaggerSpec.securityDefinitions = {
      openpaas_auth: {
        type: 'oauth2',
        description: 'OAuth2 security scheme for the OpenPaaS API',
        flow: 'password',
        tokenUrl: 'localhost:8080/oauth/token'
      }
    };

    try {
      fs.writeFileSync(swaggerOutputFile, JSON.stringify(swaggerSpec));
      grunt.log.ok('API Specification file ' + swaggerOutputFile + ' generated.');
    } catch (error) {
      grunt.log.error('Could not generate API Specification file (' + error + ').');
    }
  });

};
