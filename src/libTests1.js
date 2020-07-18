'use strict';
const notion = require('./notionLib');
const helpers = require('./helpers');

main();

async function main() {
    await notion.getSpaces();

    const collection = notion.collectionStore.get().filter(c => c.getName() === 'Zettelkasten')[0];
    await collection.requestData();
    const pages = notion.blockStore.get().filter(b => b.getType() === 'page' && b.getParentId() === collection.getId());
    await Promise.all(pages.map(p => p.requestData()));

    // Remove Backlinks from all pages
    const transactions = [];
    for (const page of pages) {
        for (const block of page.blocks.filter(p => p.getType() === 'toggle')) {
            if (block.getText().startsWith('🔗   Backlinks')) {
                console.log(`Page: ${page.getTitle()} has Backlinks in block ${block.getId()}`);
                transactions.push(helpers.getDeleteBlockTransaction(block));
            }
        }
    }
    await notion.sendTransactions(transactions);

    // Create backlinks reference object
    const backLinks = {};
    for (const page of pages) {
        for (const block of page.blocks.filter(b => b.getType() === 'text' || b.getType() === 'toggle' || b.getType() === 'bulleted_list')) {
            const blockUUIDs = findUUIDs(block.getText());
            if (blockUUIDs) {
                for (const blockUUID of blockUUIDs) {
                    if (!backLinks[blockUUID])
                        backLinks[blockUUID] = [];
                    backLinks[blockUUID].push(page.getId());
                }
            }
        }
    }

    // Add backlinks
    transactions.length = 0; // Clear these old transactions
    for (const pageId of Object.keys(backLinks)) {
        const targetBlock = notion.blockStore.get(pageId);
        const [backLinksMainToggleTransaction, backLinksMainToggle] = helpers.getAppendBlockToTargetBlockTransaction(targetBlock, 'toggle', [['🔗   Backlinks']], {block_color: 'blue_background'});
        transactions.push(backLinksMainToggleTransaction);
        for (const linkId of backLinks[pageId]) {
            const [linkTransaction] = helpers.getAppendBlockToTargetBlockTransaction(backLinksMainToggle, 'text', [['‣',[['p', linkId]]]]);
            transactions.push(linkTransaction);
        }
    }
    await notion.sendTransactions(transactions);

    let x = 10;
// -----

    const targetPage = pages.filter(p => p.getTitle() === 'Energetic Songs')[0];

    const [t1, newBlock1] = helpers.getAppendBlockToTargetBlockTransaction(targetPage, 'toggle', [['>> BACKLINKS <<']], {block_color: 'yellow_background'});
    const [t2, newBlock2] = helpers.getAppendBlockToTargetBlockTransaction(newBlock1, 'text', [['I live!!! - B']], {block_color: 'blue_background'});
    const [t3] = helpers.getAppendBlockToTargetBlockTransaction(newBlock1, 'text', [['I live!!! - C']]);

    // const t4 = helpers.getDeleteBlockTransaction(notion.blockStore.get('ffce96af-19f6-4ee2-80f6-c4be2eb3820a'));
    // await notion.sendTransactions([t1]);
}

function findUUIDs(s) {
    let regex = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/g;
    return s.match(regex);
}
