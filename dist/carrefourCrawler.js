"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarrefourCrawler = void 0;
const crawlee_1 = require("crawlee");
const playwright_1 = require("playwright");
const fs_1 = require("fs");
const products = new Set();
class CarrefourCrawler {
    constructor(searchQuery, login) {
        this.searchQuery = searchQuery;
        this.login = login;
        this.crawler = new crawlee_1.PlaywrightCrawler({
            launchContext: {
                launchOptions: {
                    headless: false
                }
            },
            requestHandler: this.requestHandler.bind(this)
        });
    }
    requestHandler(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page, request }) {
            if (request.userData.label === 'start') {
                yield this.login.execute(page);
                yield page.waitForTimeout(10000);
                yield this.findProducts(page);

            }
    
        });
    }
    findProducts(page) {
        return __awaiter(this, void 0, void 0, function* () {
            //yield this.navigateToPage(page);
            yield this.searchProduct(page);
            yield this.scrapeProducts(page);
        });
    }
    navigateToPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.goto('https://www.carrefour.com.ar/', { waitUntil: 'networkidle' });
            
        });
    }
    searchProduct(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.waitForSelector('input[placeholder*="buscando"]', { state: 'visible' });
            console.log("Writing in search field");
            const searchInput = yield page.$('input[placeholder*="buscando"]');
            if (searchInput) {
                yield searchInput.fill(this.searchQuery);
                yield page.keyboard.press('Enter');
                console.log("Search submitted, waiting for results...");
            
            }
        });
    }
    scrapeProducts(page) {
        return __awaiter(this, void 0, void 0, function* () {
            let pageIndex = 1;
            while (true) {
                console.log(`Extracting products from page ${pageIndex}...`);
                yield page.waitForSelector('[class*="galleyProducts"]', { state: 'visible' });
                yield page.waitForTimeout(5000);
                const htmlContent = yield page.content();
                const fileName = `page-${pageIndex}.html`;
                yield fs_1.promises.writeFile(fileName, htmlContent);
                const productSearched = yield page.$$eval('[class*="search-result"]', elements => {
                    const array = [];
                    elements.forEach(el => {
                        var _a, _b;
                        const name = (((_a = el.querySelector('[class*="productBrand"]')) === null || _a === void 0 ? void 0 : _a.textContent) || '').trim();
                        const price = (((_b = el.querySelector('[class*="product-price"]')) === null || _b === void 0 ? void 0 : _b.textContent) || '').trim();
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
                const nextPageAvailable = yield this.checkNextPage(page, pageIndex);
                if (!nextPageAvailable)
                    break;
                pageIndex++;
            }
        });
    }
    checkNextPage(page, pageIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const nextPageButton = yield page.$(`button[value="${pageIndex + 1}"]`);
            if (nextPageButton) {
                console.log(`Navigating to page ${pageIndex + 1}...`);
                yield nextPageButton.click();
                yield page.waitForLoadState('networkidle', { timeout: 60000 });
                const productsOnNewPage = yield page.$('[class*="search-result"]');
                if (productsOnNewPage) {
                    console.log(`Successfully loaded page ${pageIndex + 1}`);
                    return true;
                }
                else {
                    console.warn(`Failed to load products on page ${pageIndex + 1}. Retrying...`);
                    return false;
                }
            }
            else {
                console.log("No more pages to navigate.");
                return false;
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield playwright_1.chromium.launch({ headless: false });
            const page = yield browser.newPage();
            yield page.setViewportSize({ width: 1280, height: 800 });
            // Ajustar el nivel de zoom de la página
            yield page.evaluate(() => {
                document.body.style.zoom = '80%';
            });
            yield this.crawler.addRequests([{ url: 'https://www.carrefour.com.ar/', userData: { label: 'start' } }]);
            yield this.crawler.run();
            yield fs_1.promises.writeFile('productos.json', JSON.stringify([...products].map(product => JSON.parse(product)), null, 2));
            console.log('List saved in productos.json');
            browser.close();
        });
    }
}
exports.CarrefourCrawler = CarrefourCrawler;
//guardar el html de cada pagina para saber si hay un cambio de selector en los prodcutos y esto hace
//que no se guarden algunos productos de la pagina 1, lo mismo ademas ver por que se guarda mas de una vez el 1er prod
/*/seguir mirando por que no imprime por consola los mensajes de las lineas 74,77 y 82 para entender por que repite la impresion en consola del 1er prod
 ya valide y el tiempo de espera no afecta la lectura de los productos, siempre faltan aunque sume tiempo, puede ser un problema de selectores iguales que se vuelven
leer /*/ 
