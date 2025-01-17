import { Page } from 'playwright';


export class Login {private email: string;
    private password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }

    public async execute(page: Page): Promise<void> {
        await this.loginwebPage(page);
        await this.completeFields(page);
        
    }

    private async loginwebPage(page: Page): Promise<void> {
        await page.waitForSelector('[class*="myAccountWrapperWord"]', { state: 'visible' });
        const logingLogo = await page.$('[class*="myAccountWrapperWord"]');
        if (logingLogo) {
            await logingLogo.click();
            await page.waitForSelector('[class*="emailPasswordOptionBtn"]', { state: 'visible' });
            const mailAndPasswordOption = await page.$('[class*="emailPasswordOptionBtn"]');
            if (mailAndPasswordOption)
                await mailAndPasswordOption.click();
                //const htmlContent = await page.content();
                //await fs.writeFile('pagina.html', htmlContent);
        }};
        

    private async completeFields(page: Page): Promise<void> {
        let loginSuccess = false;
    
        while (!loginSuccess) {
            await page.waitForSelector('input[placeholder="Ej.: ejemplo@mail.com"]', { state: 'visible' });
            const emailInput = await page.$('input[placeholder="Ej.: ejemplo@mail.com"]');
            const passwordInput = await page.$('input[placeholder="Ingrese su contraseña "]');
    
            if (emailInput && passwordInput) {
                await emailInput.fill(this.email); 
                await passwordInput.fill(this.password); 
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000); // Espera para el procesamiento del login
                
                // Verifica si aparece un mensaje de error con la clase 'danger'
                const errorMessage = await page.$('div[class*="danger"]');
    
                if (errorMessage) {
                    console.log("Login failed, retrying...");
                } else {
                    loginSuccess = true;
                    console.log("Login successful.");
                }
            } else {
                console.log("Fields not found, retrying...");
            }
        }
    }
    
}