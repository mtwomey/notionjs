'use strict';
const { Block } = require('./Block');

function Space(blockData) {
    Block.call(this, blockData);
}

Space.prototype = Object.create(Block.prototype);
Space.prototype.constructor = Space;

Space.prototype.getName = function () {
    return this.blockData.value.name || '';
}

module.exports = Space;
