'use strict';

var mongoose = require('mongoose');
var trim = require('trim');
var Schema = mongoose.Schema;
var injection = require('../schemas/injection');
var Injection = injection.Injection;

var AdminOfDomainSchema = new mongoose.Schema({
  user_id: {type: Schema.ObjectId, ref: 'User', required: true},
  timestamps: {
    creation: {type: Date, default: Date.now}
  }
}, { _id: false });

var DomainSchema = new Schema({
  name: {type: String, required: true, unique: true, lowercase: true, trim: true},
  label: {type: String, lowercase: true, trim: true}, // multiple domains can have same label and keep the domain name is unique
  company_name: {type: String, required: true, lowercase: true, trim: true},
  hostnames: [{ type: String, lowercase: true, trim: true }],
  administrator: {type: Schema.ObjectId, ref: 'User'}, // deprecated
  administrators: [AdminOfDomainSchema],
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  injections: {type: [Injection], validate: [injection.validateInjections, 'Bad injections']},
  schemaVersion: {type: Number, default: 1}
});

DomainSchema.statics = {

  /**
   * check the existence of a Domain where company_name: name
   *
   * @param {String} name
   * @param {Function} cb
   */
  testCompany: function(name, cb) {
    var qname = trim(name).toLowerCase();
    var query = {company_name: qname};
    this.findOne(query, cb);
  },

  /**
   * check the existence of a Domain where company_name: company_name
   * and Domain name : domain_name
   *
   * @param {String} name
   * @param {Function} cb
   */
  testDomainCompany: function(company_name, domain_name, cb) {
    var qcompany_name = trim(company_name).toLowerCase();
    var qdomain_name = trim(domain_name).toLowerCase();
    var query = {company_name: qcompany_name, name: qdomain_name};
    this.findOne(query, cb);
  },

  /**
   * Load a domain from its ID
   *
   * @param {String} id
   * @param {Function} cb
   */
  loadFromID: function(id, cb) {
    if (!id) {
      return cb(new Error('ID can not be null'));
    }
    this.findOne({_id: id}, cb);
  }

};

module.exports = mongoose.model('Domain', DomainSchema);
