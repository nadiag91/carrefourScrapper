import { PlaywrightCrawler } from 'crawlee';
import { Page } from 'playwright';
import { promises as fs } from 'fs';
import * as readline from 'readline';

interface Product {
    nombre: string;
    precio: string;
}

const products: Set<string> = new Set();

class CarrefourCrawler {
    private crawler: PlaywrightCrawler;
    private searchQuery: string;

    constructor(searchQuery: string) {
        this.searchQuery = searchQuery;
        this.crawler = new PlaywrightCrawler({
            launchContext: {
                launchOptions: {
                    headless: false
                }
            },
            requestHandler: this.requestHandler.bind(this)
            
        });
    }

    private async requestHandler({ page, request }: { page: Page; request: any; }) {
        if (request.userData.label === 'start') {
            await page.goto(request.url, { waitUntil: 'networkidle' });

            await page.waitForSelector('input[placeholder*="buscando"]', { state: 'visible' });
            console.log("Writing in search field");
            const searchInput = await page.$('input[placeholder*="buscando"]');
            if (searchInput) {
                await searchInput.fill(this.searchQuery);
                await page.keyboard.press('Enter');
                console.log("Search submitted, waiting for results...");

                await page.waitForSelector('[class*="search-result"]', { state: 'attached', timeout: 30000 });
                await page.waitForTimeout(20000)

                console.log("Waiting for results to stabilize...");
                await page.waitForFunction(async () => {
                    const currentCount = document.querySelectorAll('[class*="search-result"]').length;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return currentCount === document.querySelectorAll('[class*="search-result"]').length;
                }, { timeout: 60000 });

                while (true) {
                    console.log("Extracting products from results page...");
                    const productSearched = await page.$$eval('[class*="search-result"]', elements =>
                        elements.reduce<string[]>((array, el) => {
                            const nombre = (el.querySelector('[class*="productBrand"]')?.textContent || '').trim();
                            const precio = (el.querySelector('[class*="product-price"]')?.textContent || '').trim();
                            if (nombre && precio) {
                                array.push(JSON.stringify({ nombre, precio }));
                            }
                            return array;
                        }, [])
                    );

                    console.log("Products found:", productSearched);
                    productSearched.forEach(product => products.add(product));

                    // Check if there's a next page
                    const nextPageLink = await page.$('[class*="paginationButtonChangePage"]');
                    if (nextPageLink) {
                        await nextPageLink.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForSelector('[class*="search-result"]', { state: 'attached', timeout: 30000 });
                    } else {
                        break;
                    }
                }
            } else {
                console.error('Search field was not found');
                return;
            }
        }
    }

    public async run() {
        await this.crawler.addRequests([{ url: 'https://www.carrefour.com.ar/', userData: { label: 'start' } }]);
        await this.crawler.run();
        await fs.writeFile('productos.json', JSON.stringify([...products].map(product => JSON.parse(product)), null, 2));
        console.log('List saved in productos.json');
    }
}

// Configurar el readline para leer la entrada del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter the product you want to search for: ', (answer) => {
    const scraper = new CarrefourCrawler(answer.trim());
    scraper.run().catch(console.error);
    rl.close();
});
