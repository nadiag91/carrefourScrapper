import { PlaywrightCrawler } from 'crawlee';
import { Page, Browser, chromium } from 'playwright';
import { promises as fs } from 'fs';
import { Login } from './login';



interface Product {
    nombre: string;
    precio: string;
}

const products: Set<string> = new Set();

export class CarrefourCrawler {
    private crawler: PlaywrightCrawler;
    private searchQuery: string;
    private login: Login;

    constructor(searchQuery: string, login: Login) {
        this.searchQuery = searchQuery;
        this.login = login;
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
            await this.login.execute(page);
            await this.findProducts(page);
        }
    }

    
    private async findProducts(page: Page): Promise<void> {
        await this.navigateToPage(page);
        await this.searchProduct(page);
        await this.scrapeProducts(page);
    }

    private async navigateToPage(page: Page): Promise<void> {
        await page.goto('https://www.carrefour.com.ar/', { waitUntil: 'networkidle' });
    }

    private async searchProduct(page: Page): Promise<void> {
        await page.waitForSelector('input[placeholder*="buscando"]', { state: 'visible' });
        console.log("Writing in search field");
        const searchInput = await page.$('input[placeholder*="buscando"]');
        if (searchInput) {
            await searchInput.fill(this.searchQuery);
            await page.keyboard.press('Enter');
            console.log("Search submitted, waiting for results...");
        }
    }

    private async scrapeProducts(page: Page): Promise<void> {
        let pageIndex = 1;
        while (true) {
            console.log(`Extracting products from page ${pageIndex}...`);
            await page.waitForSelector('[class*="galleyProducts"]', { state: 'visible'} );
            await page.waitForTimeout(5000)
            const htmlContent = await page.content();
            const fileName = `page-${pageIndex}.html`;
            await fs.writeFile(fileName, htmlContent)
            const productSearched = await page.$$eval('[class*="search-result"]', elements => {
                const array: string[] = [];
                elements.forEach(el => {
                    const name = (el.querySelector('[class*="productBrand"]')?.textContent || '').trim();
                    const price = (el.querySelector('[class*="product-price"]')?.textContent || '').trim();
                    if (name && price) {
                        console.log(`Found product: ${name} - ${price}`);
                        array.push(JSON.stringify({ name, price }));
                    }
                });
                return array;
            });

            //console.log("Products found:", productSearched);
            for (let i = 0; i < productSearched.length; i++) {
                const product = productSearched[i];
                products.add(product);
            }            

            const nextPageAvailable = await this.checkNextPage(page, pageIndex);
            if (!nextPageAvailable) break;
            pageIndex++;
        }
    }


    private async checkNextPage(page: Page, pageIndex: number): Promise<boolean> {
        const nextPageButton = await page.$(`button[value="${pageIndex + 1}"]`);
        if (nextPageButton) {
            console.log(`Navigating to page ${pageIndex + 1}...`);
            await nextPageButton.click();
            await page.waitForLoadState('networkidle', { timeout: 60000 });

            const productsOnNewPage = await page.$('[class*="search-result"]');
            if (productsOnNewPage) {
                console.log(`Successfully loaded page ${pageIndex + 1}`);
                return true;
            } else {
                console.warn(`Failed to load products on page ${pageIndex + 1}. Retrying...`);
                return false;
            }
        } else {
            console.log("No more pages to navigate.");
            return false;
        }
    }

    public async run() {
        const browser: Browser = await chromium.launch({ headless: false });
        const page: Page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });

        // Ajustar el nivel de zoom de la página
        await page.evaluate(() => {
            document.body.style.zoom = '80%';
        });
        await this.crawler.addRequests([{ url: 'https://www.carrefour.com.ar/', userData: { label: 'start' } }]);
        await this.crawler.run();
        await fs.writeFile('productos.json', JSON.stringify([...products].map(product => JSON.parse(product)), null, 2));
        console.log('List saved in productos.json');
        browser.close()
    }
}


//guardar el html de cada pagina para saber si hay un cambio de selector en los prodcutos y esto hace
//que no se guarden algunos productos de la pagina 1, lo mismo ademas ver por que se guarda mas de una vez el 1er prod

/*/seguir mirando por que no imprime por consola los mensajes de las lineas 74,77 y 82 para entender por que repite la impresion en consola del 1er prod
 ya valide y el tiempo de espera no afecta la lectura de los productos, siempre faltan aunque sume tiempo, puede ser un problema de selectores iguales que se vuelven
leer /*/