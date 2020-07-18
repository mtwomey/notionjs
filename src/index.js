'use strict';
const uuid = require('uuid').v4;
const axios = require('axios');
process.env["NODE_CONFIG_DIR"] = __dirname + "/../config/";
const config = require('config');
const { BlockStore, CollectionStore, SpaceStore, UserStore } = require('./Store');
const stores = require('./stores');
const { CreateBlocks } = require('./Block');

stores.blockStore = new BlockStore();
stores.collectionStore = new CollectionStore();
stores.spaceStore = new SpaceStore();
stores.userStore = new UserStore();

async function sendTransactions(transactions) {
    if (transactions.length === 0)
        return;
    const data = {};
    data.requestId = uuid();
    data.transactions = [];
    data.transactions.push(...transactions);

    const request = {
        method: 'post',
        url: 'https://www.notion.so/api/v3/saveTransactions',
        headers: config.notionHeaders,
        data: data
    };

    await axios(request);
}

async function getSpaces() {
    const request = {
        method: 'post',
        url: 'https://www.notion.so/api/v3/getSpaces',
        headers: config.notionHeaders
    };
    const results = await axios(request);
    stores.blockStore.add(CreateBlocks(Object.values(Object.values(results.data)[0].block)));
    stores.collectionStore.add(Object.values(Object.values(results.data)[0].collection));
    stores.spaceStore.add(Object.values(Object.values(results.data)[0].space));
    stores.userStore.add(Object.values(Object.values(results.data)[0].notion_user));
    return results.data;
}

module.exports = {
    blockStore: stores.blockStore,
    spaceStore: stores.spaceStore,
    collectionStore: stores.collectionStore,
    userStore: stores.userStore,
    getSpaces,
    sendTransactions
}
