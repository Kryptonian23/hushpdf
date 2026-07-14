// HushPDF Chrome Extension - Background Service Worker

// Set this to the public HushPDF URL before publishing the extension.
const HUSHPDF_URL = 'http://localhost:3000/en';

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // Create main context menu item
    chrome.contextMenus.create({
        id: 'hushpdf-open',
        title: 'Open with HushPDF',
        contexts: ['link', 'page']
    });

    // Create submenu for specific tools
    chrome.contextMenus.create({
        id: 'hushpdf-merge',
        parentId: 'hushpdf-open',
        title: 'Merge PDFs',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'hushpdf-compress',
        parentId: 'hushpdf-open',
        title: 'Compress PDF',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'hushpdf-convert',
        parentId: 'hushpdf-open',
        title: 'Convert to PDF',
        contexts: ['link', 'page']
    });

    chrome.contextMenus.create({
        id: 'hushpdf-all-tools',
        parentId: 'hushpdf-open',
        title: 'All Tools →',
        contexts: ['link', 'page']
    });

    console.log('HushPDF context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    let url = HUSHPDF_URL;

    switch (info.menuItemId) {
        case 'hushpdf-merge':
            url = `${HUSHPDF_URL}/tools/merge-pdf`;
            break;
        case 'hushpdf-compress':
            url = `${HUSHPDF_URL}/tools/compress-pdf`;
            break;
        case 'hushpdf-convert':
            url = `${HUSHPDF_URL}/tools/jpg-to-pdf`;
            break;
        case 'hushpdf-all-tools':
        case 'hushpdf-open':
            url = HUSHPDF_URL;
            break;
        default:
            url = HUSHPDF_URL;
    }

    // Open HushPDF in a new tab
    chrome.tabs.create({ url: url });
});

// Log when service worker starts
console.log('HushPDF background service worker started');
