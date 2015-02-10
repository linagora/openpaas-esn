'use strict';

var request = require('superagent');

module.exports.createInstance = function(req, res) {
  var formaasUrl = 'openpaas-partner.prod1.linagora.com:3000';

  request
    .post('http://' + formaasUrl + '/instances')
    .send({
      name: 'Demande de déplacement',
      description: 'Procédure de demande de déplacement',
      plugin: './activiti-deploy-instance',
      form: '54d31886cb6018772d000002',
      creator: '54c24f2e32ca06de2b37a257',
      target: [{
        objectType: 'community',
        'id': '54c250bd32ca06de2b37a276'
      }],
      'activitiData' : {
        'processDefinitionKey' : 'demandeDeDeplacement',
        'resultsPlugin' : './activiti-process-starter-plugin',
        'mapping' : {
          'field0' : {
            'name' : 'origine',
            'type' : 'string'
          },
          'field1' : {
            'name' : 'destination',
            'type' : 'string'
          },
          'field2' : {
            'name' : 'dateAller',
            'type' : 'string'
          },
          'field3' : {
            'name' : 'dateRetour',
            'type' : 'string'
          },
          'field4' : {
            'name' : 'motif',
            'type' : 'string'
          }
        }
      }
    })
    .end(function(response) {
      if (response.status === 201 && response.body) {
        return res.redirect('http://' + formaasUrl + '/apps/form/' + response.body._id);
      }
      return res.status(500).send('The formaas server return status code : ' + response.status + '. Expected : 201. Or the response body is not ok :', response.body);
    });
};
