const q = require('q');
const esnConfig = require('../esn-config');
const coreUser = require('../user');

const CONFIG_KEY = 'platformadmin';
const getUserById = q.denodeify(coreUser.get);
const getUserByEmail = q.denodeify(coreUser.findByEmail);

module.exports = {
  isPlatformAdmin,
  isPlatformAdminDefined,
  setPlatformAdmins,
  getAllPlatformAdmins,
  getAllPlatformAdminUsers,
  addPlatformAdmin,
  addPlatformAdminById,
  addPlatformAdminByEmail,
  removePlatformAdmin,
  removePlatformAdminById,
  removePlatformAdminByEmail
};

function isPlatformAdmin(userId) {
  return getAllPlatformAdmins()
    .then(platformadmins => platformadmins.indexOf(userId) > -1);
}

function setPlatformAdmins(platformadmins) {
  return esnConfig(CONFIG_KEY).set(platformadmins);
}

function getAllPlatformAdmins() {
  return esnConfig(CONFIG_KEY).get()
    .then(platformadmins => (Array.isArray(platformadmins) ? platformadmins : []));
}

function isPlatformAdminDefined() {
  return getAllPlatformAdmins()
    .then(platformadmins => platformadmins && platformadmins.length)
    .catch(() => false);
}

function getAllPlatformAdminUsers() {
  return getAllPlatformAdmins()
    .then(platformadmins =>
      q.all(platformadmins.map(userId => getUserById(userId))).then(users => users.filter(Boolean))
    );
}

function addPlatformAdmin(user) {
  if (!user) {
    return q.reject(new Error('User cannot be null'));
  }

  return getAllPlatformAdmins().then(platformadmins => {
    if (platformadmins.indexOf(user.id) === -1) {
      platformadmins.push(user.id);
    }

    return setPlatformAdmins(platformadmins);
  });
}

function addPlatformAdminById(userId) {
  return getUserById(userId).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with id: ${userId}`));
    }

    return addPlatformAdmin(user);
  });
}

function addPlatformAdminByEmail(email) {
  return getUserByEmail(email).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with email: ${email}`));
    }

    return addPlatformAdmin(user);
  });
}

function removePlatformAdmin(user) {
  if (!user) {
    return q.reject(new Error('User cannot be null'));
  }

  return getAllPlatformAdmins().then(platformadmins => {
    const index = platformadmins.indexOf(user.id);

    if (index > -1) {
      platformadmins.splice(index, 1);
    }

    return setPlatformAdmins(platformadmins);
  });
}

function removePlatformAdminById(userId) {
  return getUserById(userId).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with id: ${userId}`));
    }

    return removePlatformAdmin(user);
  });
}

function removePlatformAdminByEmail(email) {
  return getUserByEmail(email).then(user => {
    if (!user) {
      return q.reject(new Error(`no such user with email: ${email}`));
    }

    return removePlatformAdmin(user);
  });
}
