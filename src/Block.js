'use strict';
const config = require('config');
const axios = require('axios');
const stores = require('./stores');

const blockTypes = {
    COLLECTION_VIEW: 'collection_view',
    COLLECTION_VIEW_PAGE: 'collection_view_page',
    PAGE: 'page',
    TEXT: 'text',
    DIVIDER: 'divider',
    CODE: 'code',
    COLUMN_LIST: 'column_list',
    COLUMN: 'column',
    IMAGE: 'image',
    NUMBERED_LIST: 'numbered_list',
    BULLETED_LIST: 'bulleted_list',
    TOGGLE: 'toggle'
}

function Block(blockData) {
    this.blockData = blockData;
}

Block.prototype.getId = function () {
    return this.blockData.value.id;
};
Block.prototype.getParentId = function () {
    return this.blockData.value.parent_id;
}
Block.prototype.getType = function () {
    return this.blockData.value.type;
};
Block.prototype.getShardId = function () {
    return this.blockData.value.shard_id;
};
Block.prototype.getSpaceId = function () {
    return this.blockData.value.space_id;
};
Block.prototype.getFormat = function () {
    return this.blockData.value.format;
}
Block.prototype.getContent = function () {
    return this.blockData.value.content;
}
Block.prototype.setContent = function (content) {
    this.blockData.value.content = content;
}

function TextBlock(blockData) {
    Block.call(this, blockData);
    if (blockData.value.type !== 'text') {
        throw new Error(`Can't create ${this.constructor.name} from type '${this.blockData.value.type}'`);
    }
}

TextBlock.prototype = Object.create(Block.prototype);
TextBlock.prototype.constructor = TextBlock;
TextBlock.prototype.getText = function () {
    if (this.blockData.value.properties && this.blockData.value.properties.title) {
        return this.blockData.value.properties.title.flat(Infinity).join('') || '';
    } else {
        return '';
    }
}

function ToggleBlock(blockData) {
    Block.call(this, blockData);
    if (blockData.value.type !== 'toggle') {
        throw new Error(`Can't create ${this.constructor.name} from type '${this.blockData.value.type}'`);
    }
}

ToggleBlock.prototype = Object.create(Block.prototype);
ToggleBlock.prototype.constructor = ToggleBlock;
ToggleBlock.prototype.getText = function () {
    if (this.blockData.value.properties && this.blockData.value.properties.title) {
        return this.blockData.value.properties.title.flat(Infinity).join('') || '';
    } else {
        return '';
    }
}

function BulletedListBlock(blockData) {
    Block.call(this, blockData);
    if (blockData.value.type !== 'bulleted_list') {
        throw new Error(`Can't create ${this.constructor.name} from type '${this.blockData.value.type}'`);
    }
}

BulletedListBlock.prototype = Object.create(Block.prototype);
BulletedListBlock.prototype.constructor = BulletedListBlock;
BulletedListBlock.prototype.getText = function () {
    if (this.blockData.value.properties && this.blockData.value.properties.title) {
        return this.blockData.value.properties.title.flat(Infinity).join('') || '';
    } else {
        return '';
    }
}

function PageBlock(blockData) {
    Block.call(this, blockData);
    if (blockData.value.type !== 'page')
        throw new Error(`Can't create ${this.constructor.name} from type '${this.blockData.value.type}'`);
    this.pageBlocksLoaded = false;
}

PageBlock.prototype = Object.create(Block.prototype);
PageBlock.prototype.constructor = PageBlock;
PageBlock.prototype.getTitle = function () {
    if (this.blockData.value.properties && this.blockData.value.properties.title) {
        return this.blockData.value.properties.title.flat(Infinity).join('') || '';
    } else {
        return '';
    }
}
PageBlock.prototype.getText = function () {
    if (!this.pageBlocksLoaded)
        throw new Error(`Can't get text for page (${this.getId()}) without requestData() first`);

    const result = [];
    for (const block of this.blocks) {
        if (block.getType() === 'text') {
            const text = block.getText();
            if (text)
                result.push(block.getText());
        }
    }
    return result.length > 0 ? result.join('\n') : '';
}
PageBlock.prototype.requestData = async function () {
    const data = {
        pageId: this.getId(),
        limit: 10000,
        cursor: {
            stack: []
        },
        chunkNumber: 0,
        verticalColumns: false
    }
    const request = {
        method: 'post',
        url: 'https://www.notion.so/api/v3/loadPageChunk',
        headers: Object.assign(config.notionHeaders, {cookie: `token_v2=${process.env.token_v2}`}),
        data
    };
    const results = await axios(request);
    const blocks = Object.values(results.data.recordMap.block);
    stores.blockStore.add(CreateBlocks(blocks));
    const blockIds = blocks.map(block => block.value.id).filter(block => block !== this.getId());
    this.blocks = stores.blockStore.get(blockIds);
    this.pageBlocksLoaded = true;
    return results.data;
}

function ImageBlock(blockData) {
    Block.call(this, blockData);
    if (blockData.value.type !== 'image')
        throw new Error(`Can't create ${this.constructor.name} from type '${this.blockData.value.type}'`);
}

ImageBlock.prototype = Object.create(Block.prototype);
ImageBlock.prototype.constructor = ImageBlock;

function CollectionViewBlock(blockData) {
    Block.call(this, blockData);
    if (blockData.value.type !== 'collection_view')
        throw new Error(`Can't create ${this.constructor.name} from type '${this.blockData.value.type}'`);
}

CollectionViewBlock.prototype = Object.create(Block.prototype);
CollectionViewBlock.prototype.constructor = CollectionViewBlock;

CollectionViewBlock.prototype.getViewIds = function() {
    return this.blockData.value.view_ids;
}

function CreateBlocks (blockData) {
    if (!blockData || blockData.lenght === 0)
        return [];
    const single = !Array.isArray(blockData);
    const blocksToCreate = single ? [blockData] : blockData;
    const blocksCreated = blocksToCreate.map(blockToCreate => {
        let newBlock;
        switch (blockToCreate.value.type) {
            case 'collection_view':
                newBlock = new CollectionViewBlock(blockToCreate);
                break;
            case 'collection_view_page':
                newBlock = new Block(blockToCreate);
                break;
            case 'page':
                newBlock = new PageBlock(blockToCreate);
                break;
            case 'text':
                newBlock = new TextBlock(blockToCreate);
                break;
            case 'divider':
                newBlock = new Block(blockToCreate);
                break;
            case 'code':
                newBlock = new Block(blockToCreate);
                break;
            case 'column_list':
                newBlock = new Block(blockToCreate);
                break;
            case 'column':
                newBlock = new Block(blockToCreate);
                break;
            case 'image':
                newBlock = new Block(blockToCreate);
                break;
            case 'numbered_list':
                newBlock = new Block(blockToCreate);
                break;
            case 'bulleted_list':
                newBlock = new BulletedListBlock(blockToCreate);
                break;
            case 'toggle':
                newBlock = new ToggleBlock(blockToCreate);
                break;
            case 'bookmark':
                newBlock = new Block(blockToCreate);
                break;
            default:
                throw new Error(`Cannot create new Block, block type '${blockToCreate.value.type}' not recognized`);
        }
        return newBlock;
    });
    return single ? blocksCreated[0] : blocksCreated;
}

module.exports = {
    Block,
    TextBlock,
    PageBlock,
    ImageBlock,
    CollectionViewBlock,
    CreateBlocks: CreateBlocks
};
