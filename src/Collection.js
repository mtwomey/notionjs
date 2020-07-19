'use strict';
const {DateTime} = require("luxon");
const config = require('config');
const axios = require('axios');
const stores = require('./stores');
const { CreateBlocks } = require('./Block');

function Collection(collectionData) {
    this.collectionData = collectionData;
    this.viewIds = stores.blockStore.get(this.collectionData.value.parent_id).blockData.value.view_ids;
}

Collection.prototype.getId = function () {
    return this.collectionData.value.id
};
Collection.prototype.getParentId = function () {
    return this.collectionData.value.parent_id;
}
Collection.prototype.getName = function () {
    return this.collectionData.value.name.flat(Infinity).join('') || '';
}
Collection.prototype.requestData = async function () {
    const data = {
        collectionId: this.getId(),
        collectionViewId: this.viewIds[0],
        query: {"aggregations": [{"aggregator": "count"}]},
        loader: {
            type: "table",
            limit: 10000,
            searchQuery: "",
            userTimeZone: DateTime.local().zoneName,
            userLocale: "en",
            loadContentCover: true
        }
    }
    const request = {
        method: 'post',
        url: 'https://www.notion.so/api/v3/queryCollection',
        headers: Object.assign(config.notionHeaders, {cookie: `token_v2=${process.env.token_v2}`}),
        data
    };
    const results = await axios(request);
    stores.blockStore.add(CreateBlocks(Object.values(results.data.recordMap.block)));
    this.blocks = stores.blockStore.get(Object.values(results.data.recordMap.block).map(block => block.value.id));
    return results.data;
}

module.exports = Collection;
