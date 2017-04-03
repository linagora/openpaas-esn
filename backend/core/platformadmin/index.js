const q = require('q');
const esnConfig = require('../esn-config');
const coreUser = require('../user');

const CONFIG_KEY = 'platformadmin';
const getUserById = q.denodeify(coreUser.get);
const getUserByEmail = q.denodeify(coreUser.findByEmail);

module.exports = {
  isPlatformAdmin,
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
  return getAllPlatformAdmins().then(platformadmins => {
    return platformadmins.indexOf(userId) > -1;
  });
}

function getAllPlatformAdmins() {
  return esnConfig(CONFIG_KEY).get().then(platformadmins => {
    return Array.isArray(platformadmins) ? platformadmins : [];
  });
}

function getAllPlatformAdminUsers() {
  return getAllPlatformAdmins().then(platformadmins => {
    return q.all(platformadmins.map(userId => getUserById(userId)))
      .then(users => users.filter(Boolean));
  });
}

function addPlatformAdmin(user) {
  if (!user) {
    return q.reject(new Error('User cannot be null'));
  }

  return getAllPlatformAdmins().then(platformadmins => {
    if (platformadmins.indexOf(user.id) === -1) {
      platformadmins.push(user.id);
    }

    return platformadmins;
  })
  .then(platformadmins => esnConfig(CONFIG_KEY).set(platformadmins));
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

    return platformadmins;
  })
  .then(platformadmins => esnConfig(CONFIG_KEY).set(platformadmins));
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
