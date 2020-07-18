'use strict';
const uuid = require('uuid').v4;
const stores = require('./stores');
const Operation = require('./Operation');
const Transaction = require('./Transaction');
const { Block }= require('./Block');

function getDeleteBlockTransaction(targetBlock) {
    const operations = [];

    operations.push(createBlockOperation(targetBlock.getId(), '', 'update', {alive: false}));
    if (stores.blockStore.get(targetBlock.getParentId()).getContent())
        operations.push(createBlockOperation(targetBlock.getParentId(), 'content', 'listRemove', {id: targetBlock.getId()}));

    return new Transaction({shardId: targetBlock.getShardId(), spaceId: targetBlock.getSpaceId()}).addOperations(operations);
}

function getAppendBlockToTargetBlockTransaction(targetBlock, newBlockType, newBlockArgs, format) {
    let listAfter;
    if (targetBlock.blockData.value.content) {
        listAfter = targetBlock.blockData.value.content.slice(-1)[0];
    } else {
        listAfter = targetBlock.getId();
    }

    const newBlock = new Block({
        value: {
            id: uuid(),
            type: newBlockType,
            shard_id: targetBlock.getShardId(),
            space_id: targetBlock.getSpaceId(),
            parent_id: targetBlock.getId()
        }
    });
    if (format)
        newBlock.blockData.value.format = format;
    stores.blockStore.add(newBlock);

    const operations = [];

    operations.push(createBlockOperation(newBlock.getId(), '', 'set', {type: newBlock.getType(), id: newBlock.getId(), version: 1}));
    operations.push(createBlockOperation(newBlock.getId(), '', 'update', {parent_id: targetBlock.getId(), parent_table: 'block', alive: true}));
    operations.push(createBlockOperation(targetBlock.getId(), 'content', 'listAfter', {after: listAfter, id: newBlock.getId()}));
    operations.push(createBlockOperation(newBlock.getId(), 'properties/title', 'set', newBlockArgs));
    if (format)
        operations.push(createBlockOperation(newBlock.getId(), 'format', 'update', newBlock.getFormat()));

    if (!targetBlock.getContent())
        targetBlock.setContent([]);
    targetBlock.getContent().push(newBlock.getId());
    stores.blockStore.update(targetBlock);

    return [new Transaction({shardId: targetBlock.getShardId(), spaceId: targetBlock.getSpaceId()}).addOperations(operations), newBlock];
}

function createBlockOperation(id, pathString, command, args) {
    const path = pathString ? pathString.split('/') : [];
    return new Operation({
        id,
        table: 'block',
        path,
        command,
        args
    });
}

module.exports = {
    getAppendBlockToTargetBlockTransaction,
    getDeleteBlockTransaction
}
