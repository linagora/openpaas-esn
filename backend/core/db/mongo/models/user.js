'use strict';

var emailAddresses = require('email-addresses');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var trim = require('trim');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Mixed = mongoose.Schema.Types.Mixed;

function validateEmail(email) {
  return emailAddresses.parseOneAddress(email) !== null;
}

function validateEmails(emails) {
  if (!emails || !emails.length) {
    return true;
  }
  var valid = true;
  emails.forEach(function(email) {
    if (!validateEmail(email)) {
      valid = false;
    }
  });
  return valid;
}

function hasEmail(accounts) {
  return accounts.some(function(account) {
    return account.emails.some(function(email) {
      return !!email;
    });
  });
}

function validateAccounts(accounts) {
  return accounts && accounts.length;
}

var UserAccountSchema = new mongoose.Schema({
  _id: false,
  type: { type: String, enum: ['email', 'oauth'] },
  hosted: { type: Boolean, default: false },
  emails: { type: [String], unique: true, sparse: true, validate: validateEmails },
  preferredEmailIndex: { type: Number, default: 0 },
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  data: { type: Mixed }
});

UserAccountSchema.pre('validate', function(next) {
  if (this.emails.length && (this.preferredEmailIndex < 0 || this.preferredEmailIndex >= this.emails.length)) {
    return next(new Error('The preferredEmailIndex field must be a valid index of the emails array.'));
  }
  next();
});

var MemberOfDomainSchema = new mongoose.Schema({
  domain_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true},
  joined_at: {type: Date, default: Date.now},
  status: {type: String, lowercase: true, trim: true}
}, { _id: false });

var UserSchema = new mongoose.Schema({
  firstname: {type: String, trim: true},
  lastname: {type: String, trim: true},
  password: {type: String},
  job_title: {type: String, trim: true},
  service: {type: String, trim: true},
  building_location: {type: String, trim: true},
  office_location: {type: String, trim: true},
  main_phone: {type: String, trim: true},
  description: {type: String, trim: true},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  domains: {type: [MemberOfDomainSchema]},
  login: {
    disabled: {type: Boolean, default: false},
    failures: {
      type: [Date]
    },
    success: {type: Date}
  },
  schemaVersion: {type: Number, default: 2},
  avatars: [ObjectId],
  currentAvatar: ObjectId,
  accounts: {type: [UserAccountSchema], required: true, validate: validateAccounts},
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
});

UserSchema.virtual('preferredEmail').get(function() {
  return this.accounts
    .filter(function(account) {
      return account.type === 'email';
    })
    .slice() // Because sort mutates the array
    .sort(function(a, b) {
      return b.hosted - a.hosted;
    })
    .reduce(function(foundPreferredEmail, account) {
      return foundPreferredEmail || account.emails[account.preferredEmailIndex];
    }, null);
});

UserSchema.virtual('preferredDomainId').get(function() {
  return this.domains.length ? this.domains[0].domain_id : '';
});

UserSchema.virtual('emails').get(function() {
  var emails = [];

  this.accounts.forEach(function(account) {
    account.emails.forEach(function(email) {
      emails.push(email);
    });
  });

  return emails;
});

UserSchema.pre('save', function(next) {
  var self = this;
  var SALT_FACTOR = 5;

  self.accounts.forEach(function(account) {
    account.emails = account.emails.map(function(email) {
      return trim(email).toLowerCase();
    });
  });

  if (!hasEmail(self.accounts)) {
    return next(new Error('User must have at least one email'));
  }

  if (!self.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) {
      return next(err);
    }

    bcrypt.hash(self.password, salt, null, function(err, hash) {
      if (err) {
        return next(err);
      }
      self.password = hash;
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
    this.findOne({
      accounts: {
        $elemMatch: {
          emails: trim(email).toLowerCase()
        }
      }
    }, cb);
  }
};
module.exports = mongoose.model('User', UserSchema);
