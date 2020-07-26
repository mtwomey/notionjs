'use strict';
const sqlite3 = require('sqlite3').verbose();
const homedir = require('os').homedir();
const uuid = require('uuid').v4;
const axios = require('axios');
const config = require('../config/default');
const { BlockStore, CollectionStore, SpaceStore, UserStore } = require('./Store');
const stores = require('./stores');
const { CreateBlocks } = require('./Block');
const helpers = require('./helpers');

stores.blockStore = new BlockStore();
stores.collectionStore = new CollectionStore();
stores.spaceStore = new SpaceStore();
stores.userStore = new UserStore();

function setAPIKey(token_v2) {
    process.env.token_v2 = token_v2;
}

// Get the token from Notion local app electron cookie cache
async function setAPIKeyFromElectronLocal() {
    let token_v2;
    const notionAppDb = new sqlite3.Database(`${homedir}/Library/Application Support/Notion/Cookies`);
    await new Promise((resolve, reject) => { // Stupid lib doesn't support promises...
        notionAppDb.all('select name, value from cookies where name=?', ['token_v2'], (err, row) => {
            try {
                token_v2 = row["0"].value;
                setAPIKey(token_v2);
                resolve();
            } catch (e) {
                throw new Error(`Couldn't get token_v2 from local Electron cookie cache`);
            }
        });
    })
}

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
        headers: Object.assign(config.notionHeaders, {cookie: `token_v2=${process.env.token_v2}`}),
        data: data
    };

    await axios(request);
}

async function getSpaces() {
    const request = {
        method: 'post',
        url: 'https://www.notion.so/api/v3/getSpaces',
        headers: Object.assign(config.notionHeaders, {cookie: `token_v2=${process.env.token_v2}`})
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
    sendTransactions,
    setAPIKey,
    setAPIKeyFromElectronLocal,
    helpers
}
