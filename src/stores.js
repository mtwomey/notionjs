'use strict';

let blockStore, collectionStore, spaceStore, userStore;

const stores = {
    get blockStore() {
        return blockStore;
    },
    set blockStore(store) {
      blockStore = store;
    },
    get collectionStore() {
        return collectionStore;
    },
    set collectionStore(store) {
        collectionStore = store;
    },
    get spaceStore() {
        return spaceStore;
    },
    set spaceStore(store) {
        spaceStore = store;
    },
    get userStore() {
        return userStore;
    },
    set userStore(store) {
        userStore = store;
    }

};

module.exports = stores;
