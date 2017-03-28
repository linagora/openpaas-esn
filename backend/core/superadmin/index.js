const q = require('q');
const esnConfig = require('../esn-config');
const coreUser = require('../user');

const CONFIG_KEY = 'superadmin';
const getUserById = q.denodeify(coreUser.get);
const getUserByEmail = q.denodeify(coreUser.findByEmail);

module.exports = {
  isSuperAdmin,
  getAllSuperAdmins,
  getAllSuperAdminUsers,
  addSuperAdmin,
  addSuperAdminById,
  addSuperAdminByEmail,
  removeSuperAdmin,
  removeSuperAdminById,
  removeSuperAdminByEmail
};

function isSuperAdmin(userId) {
  return getAllSuperAdmins().then(superadmins => {
    return superadmins.indexOf(userId) > -1;
  });
}

function getAllSuperAdmins() {
  return esnConfig(CONFIG_KEY).get().then(superadmins => {
    return Array.isArray(superadmins) ? superadmins : [];
  });
}

function getAllSuperAdminUsers() {
  return getAllSuperAdmins().then(superadmins => {
    return q.all(superadmins.map(userId => getUserById(userId)))
      .then(users => users.filter(Boolean));
  });
}

function addSuperAdmin(user) {
  if (!user) {
    return q.reject(new Error('User cannot be null'));
  }

  return getAllSuperAdmins().then(superadmins => {
    if (superadmins.indexOf(user.id) === -1) {
      superadmins.push(user.id);
    }

    return superadmins;
  })
  .then(superadmins => esnConfig(CONFIG_KEY).set(superadmins));
}

function addSuperAdminById(userId) {
  return getUserById(userId).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with id: ${userId}`));
    }

    return addSuperAdmin(user);
  });
}

function addSuperAdminByEmail(email) {
  return getUserByEmail(email).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with email: ${email}`));
    }

    return addSuperAdmin(user);
  });
}

function removeSuperAdmin(user) {
  if (!user) {
    return q.reject(new Error('User cannot be null'));
  }

  return getAllSuperAdmins().then(superadmins => {
    const index = superadmins.indexOf(user.id);

    if (index > -1) {
      superadmins.splice(index, 1);
    }

    return superadmins;
  })
  .then(superadmins => esnConfig(CONFIG_KEY).set(superadmins));
}

function removeSuperAdminById(userId) {
  return getUserById(userId).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with id: ${userId}`));
    }

    return removeSuperAdmin(user);
  });
}

function removeSuperAdminByEmail(email) {
  return getUserByEmail(email).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with email: ${email}`));
    }

    return removeSuperAdmin(user);
  });
}
