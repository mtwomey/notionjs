'use strict';
const uuid = require('uuid').v4;

function Operation(config) {
    this.id = config.id || uuid();
    this.table = config.table;
    this.path = config.path;
    this.command = config.command;
    this.args = config.args;
}
Operation.prototype.getDataObject = function() {
    const operationObject = {};
    operationObject.id = this.id;
    operationObject.table = this.table;
    operationObject.path = this.path;
    operationObject.command = this.command;
    operationObject.args = this.args;
    return operationObject;
}

module.exports = Operation;
