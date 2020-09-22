const browser = await puppeteer.launch();
const [page] = await browser.pages();

let paused = false;
let pausedRequests = [];

const nextRequest = () => { // continue the next request or "unpause"
    if (pausedRequests.length === 0) {
        paused = false;
    } else {
        // continue first request in "queue"
        (pausedRequests.shift())(); // calls the request.continue function
    }
};

await page.setRequestInterception(true);

page.on('request', request => {
    if (paused) {
        pausedRequests.push(() => request.continue());
    } else {
        paused = true; // pause, as we are processing a request now
        request.continue();
    }
});

page.on('requestfinished', async (request) => {
    const response = await request.response();
    if (response.url() === 'RESOURCE YOU WANT TO DOWNLOAD') {
        const buffer = await response.buffer();
        // handle buffer
    }
    nextRequest(); // continue with next request
});

page.on('requestfailed', nextRequest);

await page.goto('...');
