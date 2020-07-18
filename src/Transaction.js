'use strict';
const uuid = require('uuid').v4;

function Transaction(config) {
    this.id = config.id || uuid();
    this.shardId = config.shardId;
    this.spaceId = config.spaceId;
    this.operations = config.operations || [];

    this.addOperations = (operations => {
        const operationsToAdd = Array.isArray(operations) ? operations : [operations];
        this.operations.push(...operationsToAdd);
        return this;
    });

    this.getDataObject = () => {
        const transactionObject = {};
        transactionObject.id = this.id;
        transactionObject.shardId = this.shardId;
        transactionObject.spaceId = this.spaceId;
        transactionObject.operations = [];
        for (const operation of this.operations) {
            transactionObject.operations.push(operation.getDataObject());
        }
        return transactionObject;
    }
}

module.exports = Transaction;
