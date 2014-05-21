'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LDAPSchema = new Schema({
  name: {type: String, required: true},
  domain: {type: Schema.ObjectId, ref: 'Domain', required: true},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  autoProvisioning: {type: Boolean, default: false},
  configuration: {
    //url: 'ldap://localhost:1389',
    url: {type: String, required: true},
    //adminDn: 'uid=admin,ou=passport-ldapauth',
    adminDn: {type: String, required: true},
    //adminPassword: 'secret',
    adminPassword: {type: String, required: true},
    //searchBase: 'ou=passport-ldapauth',
    searchBase: {type: String, required: true},
    //searchFilter: '(mail={{username}})'
    searchFilter: {type: String, required: true}
  },
  schemaVersion: {type: Number, default: 1}
}, {collection: 'ldap'});

module.exports = mongoose.model('LDAP', LDAPSchema);
