'use strict';

var emailAddresses = require('email-addresses');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var trim = require('trim');

function validateEmail(email) {
  return emailAddresses.parseOneAddress(email) !== null;
}

function validateEmails(emails) {
  if (!emails || !emails.length) {
    return false;
  }
  var valid = true;
  emails.forEach(function(email) {
    if (!validateEmail(email)) {
      valid = false;
    }
  });
  return valid;
}

var MemberOfDomainSchema = new mongoose.Schema({
  domain_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true},
  joined_at: {type: Date, default: Date.now},
  status: {type: String, lowercase: true, trim: true}
}, { _id: false });

var UserSchema = new mongoose.Schema({
  emails: {type: [String], required: true, unique: true, validate: validateEmails},
  firstname: {type: String, lowercase: true, trim: true},
  lastname: {type: String, lowercase: true, trim: true},
  password: {type: String},
  job_title: {type: String, trim: true},
  service: {type: String, trim: true},
  building_location: {type: String, trim: true},
  office_location: {type: String, trim: true},
  main_phone: {type: String, trim: true},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  domains: {type: [MemberOfDomainSchema]},
  login: {
    failures: {
      type: [Date]
    },
    success: {type: Date}
  },
  schemaVersion: {type: Number, default: 1}
});

UserSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  user.emails = user.emails.map(function(email) {
    return trim(email).toLowerCase();
  });

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods = {
  comparePassword: function(candidatePassword, cb) {
    if (!candidatePassword) {
      return cb(new Error('Can not compare with null password'));
    }
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  },

  loginFailure: function(cb) {
    this.login.failures.push(new Date());
    this.save(cb);
  },

  loginSuccess: function(cb) {
    this.login.success = new Date();
    this.login.failures = [];
    this.save(cb);
  },

  resetLoginFailure: function(cb) {
    this.login.failures = [];
    this.save(cb);
  },

  joinDomain: function(domain, cb) {
    if (!domain) {
      return cb(new Error('Domain must not be null'));
    }
    var domainId = domain._id || domain;

    var self = this;
    function validateDomains(domain) {
      var valid = true;
      self.domains.forEach(function(d) {
        if (d.domain_id === domain) {
          valid = false;
        }
      });
      return valid;
    }

    if (!validateDomains(domainId)) {
      return cb(new Error('User is already in domain ' + domainId));
    } else {
      return this.update({ $push: { domains: {domain_id: domain}}}, cb);
    }
  },

  isMemberOfDomain: function(domain) {
    if (!domain) {
      throw new Error('Domain must not be null');
    }
    var domainId = domain._id || domain;
    return this.domains.some(function(d) {
      return d.domain_id.equals(domainId);
    });
  }
};

UserSchema.statics = {

  /**
   * Load a user from one of its email
   *
   * @param {String} email
   * @param {Function} cb - as fn(err, user) where user is not null if found
   */
  loadFromEmail: function(email, cb) {
    var qemail = trim(email).toLowerCase();
    this.findOne({emails: qemail}, cb);
  },

  /**
   * Get domains for an user
   *
   * @param {String} email
   * @param {Function} cb
   */
  loadDomains: function(email, cb) {
    cb(new Error('Not implemented'));
  }
};
module.exports = mongoose.model('User', UserSchema);
