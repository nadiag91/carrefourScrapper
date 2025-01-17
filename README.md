# carrefourScrapper

This project is a Node.js application that uses TypeScript for development. The `dist/` folder contains the compiled JavaScript files and is necessary to run the application.

## Prerequisites
Before running the application, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## How to Run
1. **Install dependencies**  
   Run the following command to install the required dependencies:
   ```bash
   npm install

2. **Compile TypeScript (if needed)**
If you modify the TypeScript files or need to regenerate the dist/ folder, run:
npm run build

3. **Run the application**
Start the application using Node.js:
node dist/main.js

**Development Workflow**
Compiling TypeScript
To compile TypeScript files during development, use:
npm run build

Alternatively, you can use the watch mode to recompile on changes:
npm run watch

**Notes**
The dist/ folder is included in the repository to ensure the application runs without requiring users to compile the code.
If you encounter any issues, ensure the dist/ folder is up-to-date by running npm run build.
