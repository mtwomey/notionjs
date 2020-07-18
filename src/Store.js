'use strict';
const User = require('./User');
const Space = require('./Space');
const { Block } = require('./Block');
const Collection = require('./Collection');

function Store() {
    this.store = {};
}

Store.prototype.add = function (items) {
    if (!items || items.lenght === 0)
        return [];
    const single = !Array.isArray(items);
    const itemsToAdd = single ? [items] : items;
    for (const item of itemsToAdd) {
        if (!this.store[item.getId()]) { // Don't overwrite them if they're already in there (this is silent right now)
            this.store[item.getId()] = item;
        }
    }
    return items;
}
Store.prototype.update = function (items) {
    if (!items || items.lenght === 0)
        return [];
    const single = !Array.isArray(items);
    const itemsToAdd = single ? [items] : items;
    for (const item of itemsToAdd) {
        if (!this.store[item.getId()]) {
            throw new Error(`Trying to update ${item.prototype.constructor.name}, which isn't in the store.`);
        }
        this.store[item.getId()] = item;
    }
    return single ? items[0] : items;
}
Store.prototype.get = function (itemIds) {
    if (!itemIds || itemIds.length === 0)
        return Object.values(this.store);
    const single = !Array.isArray(itemIds);
    if (single) {
        return this.store[itemIds];
    } else {
        const itemsRetrieved = [];
        for (const itemId of itemIds) {
            const itemRetrieved = this.store[itemId];
            if (itemsRetrieved) {
                itemsRetrieved.push(itemRetrieved);
            }
        }
        return itemsRetrieved;
    }
}
Store.prototype.clear = function () {
    this.store = {};
}

function BlockStore() {
    Store.call(this);
}

BlockStore.prototype = Object.create(Store.prototype);
BlockStore.prototype.constructor = Store.prototype.constructor;

function CollectionStore() {
    Store.call(this);
}

CollectionStore.prototype = Object.create(Store.prototype);
CollectionStore.prototype.constructor = Store.prototype.constructor;
CollectionStore.prototype.add = function (items) {
    if (!items || items.lenght === 0)
        return [];
    const single = !Array.isArray(items);
    const itemsToAdd = single ? [items] : items;
    const itemsAdded = itemsToAdd.map(item => {
        return new Collection(item);
    });
    Store.prototype.add.call(this, itemsAdded);
    return single ? itemsAdded[0] : itemsAdded;
}

function SpaceStore() {
    Store.call(this);
}

SpaceStore.prototype = Object.create(Store.prototype);
SpaceStore.prototype.constructor = Store.prototype.constructor;
SpaceStore.prototype.add = function (items) {
    if (!items || items.lenght === 0)
        return [];
    const single = !Array.isArray(items);
    const itemsToAdd = single ? [items] : items;
    const itemsAdded = itemsToAdd.map(item => {
        return new Space(item);
    });
    Store.prototype.add.call(this, itemsAdded);
    return single ? itemsAdded[0] : itemsAdded;
}

function UserStore() {
    Store.call(this);
}

UserStore.prototype = Object.create(Store.prototype);
UserStore.prototype.constructor = Store.prototype.constructor;
UserStore.prototype.add = function (items) {
    if (!items || items.lenght === 0)
        return [];
    const single = !Array.isArray(items);
    const itemsToAdd = single ? [items] : items;
    const itemsAdded = itemsToAdd.map(item => {
        return new User(item);
    });
    Store.prototype.add.call(this, itemsAdded);
    return single ? itemsAdded[0] : itemsAdded;
}

module.exports = {
    Store,
    BlockStore,
    SpaceStore,
    CollectionStore,
    UserStore
};
