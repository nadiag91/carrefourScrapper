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
exports.Login = void 0;
class Login {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }
    execute(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loginwebPage(page);
            yield this.completeFields(page);
        });
    }
    loginwebPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.waitForSelector('[class*="myAccountWrapperWord"]', { state: 'visible' });
            const logingLogo = yield page.$('[class*="myAccountWrapperWord"]');
            if (logingLogo) {
                yield logingLogo.click();
                yield page.waitForSelector('[class*="emailPasswordOptionBtn"]', { state: 'visible' });
                const mailAndPasswordOption = yield page.$('[class*="emailPasswordOptionBtn"]');
                if (mailAndPasswordOption)
                    yield mailAndPasswordOption.click();
                //const htmlContent = await page.content();
                //await fs.writeFile('pagina.html', htmlContent);
            }
        });
    }
    ;
    completeFields(page) {
        return __awaiter(this, void 0, void 0, function* () {
            let loginSuccess = false;
            while (!loginSuccess) {
                yield page.waitForSelector('input[placeholder="Ej.: ejemplo@mail.com"]', { state: 'visible' });
                const emailInput = yield page.$('input[placeholder="Ej.: ejemplo@mail.com"]');
                const passwordInput = yield page.$('input[placeholder="Ingrese su contraseña "]');
                if (emailInput && passwordInput) {
                    yield emailInput.fill(this.email);
                    yield passwordInput.fill(this.password);
                    yield page.keyboard.press('Enter');
                    yield page.waitForTimeout(2000); // Espera para el procesamiento del login
                    // Verifica si aparece un mensaje de error con la clase 'danger'
                    const errorMessage = yield page.$('div[class*="danger"]');
                    if (errorMessage) {
                        console.log("Login failed, retrying...");
                    }
                    else {
                        loginSuccess = true;
                        console.log("Login successful.");
                    }
                }
                else {
                    console.log("Fields not found, retrying...");
                }
            }
        });
    }
}
exports.Login = Login;
