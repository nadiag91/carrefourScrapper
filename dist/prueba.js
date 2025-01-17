"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const crawlee_1 = require("crawlee");
const fs_1 = require("fs");
const readline = __importStar(require("readline"));
const products = new Set();
class CarrefourCrawler {
    constructor(searchQuery) {
        this.searchQuery = searchQuery;
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
                yield page.goto(request.url, { waitUntil: 'networkidle' });
                yield page.waitForSelector('input[placeholder*="buscando"]', { state: 'visible' });
                console.log("Writing in search field");
                const searchInput = yield page.$('input[placeholder*="buscando"]');
                if (searchInput) {
                    yield searchInput.fill(this.searchQuery);
                    yield page.keyboard.press('Enter');
                    console.log("Search submitted, waiting for results...");
                    yield page.waitForSelector('[class*="search-result"]', { state: 'attached', timeout: 30000 });
                    yield page.waitForTimeout(20000);
                    console.log("Waiting for results to stabilize...");
                    yield page.waitForFunction(() => __awaiter(this, void 0, void 0, function* () {
                        const currentCount = document.querySelectorAll('[class*="search-result"]').length;
                        yield new Promise(resolve => setTimeout(resolve, 3000));
                        return currentCount === document.querySelectorAll('[class*="search-result"]').length;
                    }), { timeout: 60000 });
                    while (true) {
                        console.log("Extracting products from results page...");
                        const productSearched = yield page.$$eval('[class*="search-result"]', elements => elements.reduce((array, el) => {
                            var _a, _b;
                            const nombre = (((_a = el.querySelector('[class*="productBrand"]')) === null || _a === void 0 ? void 0 : _a.textContent) || '').trim();
                            const precio = (((_b = el.querySelector('[class*="product-price"]')) === null || _b === void 0 ? void 0 : _b.textContent) || '').trim();
                            if (nombre && precio) {
                                array.push(JSON.stringify({ nombre, precio }));
                            }
                            return array;
                        }, []));
                        console.log("Products found:", productSearched);
                        productSearched.forEach(product => products.add(product));
                        // Check if there's a next page
                        const nextPageLink = yield page.$('[class*="paginationButtonChangePage"]');
                        if (nextPageLink) {
                            yield nextPageLink.click();
                            yield page.waitForLoadState('networkidle');
                            yield page.waitForSelector('[class*="search-result"]', { state: 'attached', timeout: 30000 });
                        }
                        else {
                            break;
                        }
                    }
                }
                else {
                    console.error('Search field was not found');
                    return;
                }
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.crawler.addRequests([{ url: 'https://www.carrefour.com.ar/', userData: { label: 'start' } }]);
            yield this.crawler.run();
            yield fs_1.promises.writeFile('productos.json', JSON.stringify([...products].map(product => JSON.parse(product)), null, 2));
            console.log('List saved in productos.json');
        });
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
