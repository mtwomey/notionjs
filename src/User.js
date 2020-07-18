'use strict';

function User(userData) {
    this.userData = userData;
}

User.prototype.getId = function () {
    return this.userData.value.id
};
User.prototype.getName = function () {
    return this.userData.value.name || '';
}

module.exports = User;
