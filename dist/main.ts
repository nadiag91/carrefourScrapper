import * as readline from 'readline';
import { Login } from '../src/login';
import { CarrefourCrawler } from '../src/carrefourCrawler';


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

 


rl.question('Please enter the product you want to search for: ', (searchQuery) => {
    rl.question('Email: ', (email) => {
        rl.question('Password: ', (password) => {
            const login = new Login(email, password);
            const scraper = new CarrefourCrawler(searchQuery.trim(), login);
            
            scraper.run()
                .then(() => {
                    rl.close();
                })
                .catch(console.error);
        });
    });
});
