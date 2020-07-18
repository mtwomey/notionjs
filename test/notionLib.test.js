const notion = require('../src/index.js');
const testData = require('./testData');
const axios = require('axios');
const fs = require('fs');
const {TextBlock, ImageBlock, PageBlock, CollectionViewBlock, Block, CreateBlocks} = require('../src/Block');
const Operation = require('../src/Operation');
const Transaction = require('../src/Transaction');

jest.mock('axios');

describe('Testing block creation', () => {
    test('creating a new text block', () => {
        let block = new TextBlock(testData.TEXT_BLOCK_01);
        expect(block.getType()).toBe('text');
        expect(block.getText()).toBe('This is the text in the block.');
        expect(block.getId()).toBe(testData.TEXT_BLOCK_01.value.id);
    })
    test('creating a block with the wrong data type', () => {
        let createBadBlock = () => {
            new ImageBlock(testData.TEXT_BLOCK_01);
        }
        expect(createBadBlock).toThrow('Can\'t create ImageBlock from type \'text\'');
    })
});

describe('Adding blocks to the blockStore', () => {
    test('add a single block to the blockStore', () => {
        notion.blockStore.add(new TextBlock(testData.TEXT_BLOCK_01));
        expect(notion.blockStore.get('9a9767cb-0d2a-4366-94cf-4096b3188a16').getType()).toBe('text');
    })
    test('add multiple blocks to the blockStore', () => {
        notion.blockStore.add([new TextBlock(testData.TEXT_BLOCK_01), new PageBlock(testData.PAGE_BLOCK_01)]);
        expect(notion.blockStore.get(testData.TEXT_BLOCK_01.value.id).getType()).toBe('text');
        expect(notion.blockStore.get(testData.PAGE_BLOCK_01.value.id).getType()).toBe('page');
    })
    test('returned block from adding a single block', () => {
        let returnedBlock = notion.blockStore.add(new TextBlock(testData.TEXT_BLOCK_01));
        expect(returnedBlock.getText()).toBe('This is the text in the block.');
    })
    test('returned store from adding a multiple store', () => {
        let returnedBlocks = notion.blockStore.add([new TextBlock(testData.TEXT_BLOCK_01), new TextBlock(testData.TEXT_BLOCK_02)]);
        expect(returnedBlocks[0].getText()).toBe('This is the text in the block.');
        expect(returnedBlocks[1].getText()).toBe('First up');
    })
    test('empty array from calling blockStore.add() without passing anything', () => {
        let returnedBlock = notion.blockStore.add();
        expect(Array.isArray(returnedBlock)).toBe(true);
        expect(returnedBlock.length).toBe(0);
    })
    test('empty array from calling blockStore.add() while passing an empty array', () => {
        let returnedBlock = notion.blockStore.add([]);
        expect(Array.isArray(returnedBlock)).toBe(true);
        expect(returnedBlock.length).toBe(0);
    })
});

describe('Getting store from the blockStore', () => {
    test('getting multiple store from the blockStore', () => {
        notion.blockStore.add([new TextBlock(testData.TEXT_BLOCK_01), new TextBlock(testData.TEXT_BLOCK_02)]);
        let retrievedBlocks = notion.blockStore.get([testData.TEXT_BLOCK_01.value.id, testData.TEXT_BLOCK_02.value.id]);
        expect(retrievedBlocks[0].getText()).toBe('This is the text in the block.');
        expect(retrievedBlocks[1].getText()).toBe('First up');
    })
    test('getting all blocks from the blockStore', () => {
        notion.blockStore.clear();
        notion.blockStore.add(CreateBlocks([testData.TEXT_BLOCK_01, testData.PAGE_BLOCK_01]));
        let retrievedBlocks = notion.blockStore.get();
        expect(retrievedBlocks.length).toBe(2);
    })
    test('getting all blocks from the blockStore when it\s empty', () => {
        notion.blockStore.clear();
        let retrievedBlocks = notion.blockStore.get();
        expect(retrievedBlocks.length).toBe(0);
    })
    test('getting blocks from the blockStore with a filter', () => {
        notion.blockStore.clear();
        notion.blockStore.add(CreateBlocks([testData.TEXT_BLOCK_01, testData.PAGE_BLOCK_01, testData.TEXT_BLOCK_02, testData.IMAGE_BLOCK_01]));
        let retrievedBlocks = notion.blockStore.get().filter(block => {
            return block.getType() === 'text';
        });
        expect(retrievedBlocks.length).toBe(2);
        retrievedBlocks = notion.blockStore.get().filter(block => {
            return block.getType() === 'image';
        });
        expect(retrievedBlocks.length).toBe(1);
    })
});

test('Clearing the block store', () => {
    notion.blockStore.clear();
    notion.blockStore.add(CreateBlocks([testData.TEXT_BLOCK_01, testData.PAGE_BLOCK_01, testData.TEXT_BLOCK_02, testData.IMAGE_BLOCK_01]));
    expect(notion.blockStore.get().length).toBe(4);
    notion.blockStore.clear();
    expect(notion.blockStore.get().length).toBe(0);
});

describe('Getting text from store', () => {
    test('getting text from a block', () => {
        let block1 = new TextBlock(testData.TEXT_BLOCK_01);
        expect(block1.getText()).toBe('This is the text in the block.');
    })
    test('getting text from a page block that hasn\'t done loadData', () => {
        let block1 = new PageBlock(testData.PAGE_BLOCK_01);
        const getPageText = () => {
            block1.getText();
        }
        expect(getPageText).toThrow(`Can't get text for page (681623fe-57d3-49d1-99ab-ed2d1cfdc284) without requestData() first`);
    })
});

describe('Getting titles from store', () => {
    test('getting title from a page block', () => {
        let block1 = new PageBlock(testData.PAGE_BLOCK_01);
        expect(block1.getTitle()).toBe('Vicki');
    })
});

describe('Creating operations', () => {
    test('creating a basic update text operation', () => {
        let operation = new Operation({
            table: 'block',
            path: ['properties', 'wy|F'],
            command: 'set',
            args: [['k']]
        })
        expect(operation.getDataObject().command).toBe('set');
    })
});

describe('Creating transactions', () => {
    test('creating a basic update text operation and then transaction', () => {
        const operation = new Operation({
            table: 'block',
            path: ['properties', 'wy|F'],
            command: 'set',
            args: [['k']]
        })
        const transaction = new Transaction({
            shardId: '???',
            spaceId: '???',
            operations: [operation]
        });
        expect(transaction.getDataObject().id).not.toBe(null);
        expect(Array.isArray(transaction.getDataObject().operations)).toBe(true);
        expect(transaction.getDataObject().operations.length).toBe(1);
    })
});

describe('Working with spaces', () => {
    test('Initial get of spaces', async () => {
        notion.blockStore.clear();
        const getSpacesData = JSON.parse(fs.readFileSync('test/getSpacesData.json', 'utf-8'));
        axios.mockResolvedValue(getSpacesData);
        const result = await notion.getSpaces();
        expect(result["817cf6bf-2be3-4eb1-879f-1770c6855068"].notion_user["817cf6bf-2be3-4eb1-879f-1770c6855068"].value.email).toBe('email@test.com');
        expect(result["817cf6bf-2be3-4eb1-879f-1770c6855068"].block["ef3eec66-fc10-48a9-95d6-1b0e1bf08fe1"].value.properties.title["0"]["0"]).toBe('Life Tracker DBs');
        expect(notion.blockStore.get('467bb67c-fc67-43ea-9b97-5ae96dfe89d7').getType()).toBe('page');
    })
    test('Retrieving block added from getSpaces() from the blockStore', () => {
        expect(notion.blockStore.get('ef3eec66-fc10-48a9-95d6-1b0e1bf08fe1').getTitle()).toBe('Life Tracker DBs');
    })
});

describe('Working with pages', () => {
    test('Load space data', async () => {
        notion.blockStore.clear();
        const getSpacesData = JSON.parse(fs.readFileSync('test/getSpacesData.json', 'utf-8'));
        axios.mockResolvedValue(getSpacesData);
        const result = await notion.getSpaces();
        expect(result["817cf6bf-2be3-4eb1-879f-1770c6855068"].notion_user["817cf6bf-2be3-4eb1-879f-1770c6855068"].value.email).toBe('email@test.com');
        expect(result["817cf6bf-2be3-4eb1-879f-1770c6855068"].block["ef3eec66-fc10-48a9-95d6-1b0e1bf08fe1"].value.properties.title["0"]["0"]).toBe('Life Tracker DBs');
        expect(notion.blockStore.get('467bb67c-fc67-43ea-9b97-5ae96dfe89d7').getType()).toBe('page');
    })
    test('Load page data', async () => {
        const page = notion.blockStore.get('746dec8c-23c2-4766-9c89-1600bb8eadee');
        const getPageData = JSON.parse(fs.readFileSync('test/getPageData.json', 'utf-8'));
        axios.mockResolvedValue(getPageData);
        const result = await page.requestData();
        expect(page.pageBlocksLoaded).toBe(true);
    })
    test('Retrieving block added from requestData() from the blockStore', () => {
        expect(notion.blockStore.get('b173bdf1-ba49-4712-97a9-bb4438b0e83a').getType()).toBe('text');
    })
    test('getting page text', () => {
        const text = notion.blockStore.get('746dec8c-23c2-4766-9c89-1600bb8eadee').getText();
        expect(text).toContain('on line 1\nLine 2\nMore thing (line');
    })
});

describe('Working with collections', () => {
    test('adding collections to the collectionStore', async () => {
        notion.blockStore.clear();
        notion.collectionStore.clear();
        const getSpacesData = JSON.parse(fs.readFileSync('test/getSpacesData.json', 'utf-8'));
        axios.mockResolvedValue(getSpacesData);
        const result = await notion.getSpaces();
        expect(notion.blockStore.get('ef3eec66-fc10-48a9-95d6-1b0e1bf08fe1').getTitle()).toBe('Life Tracker DBs');
    })
});
