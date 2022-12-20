"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path_1 = require("path");
const node_fetch_1 = require("node-fetch");
const util_1 = require("util");
const fs = require("fs");
async function activate(context) {
    showJoke(context);
    let currentPanel = undefined;
    context.subscriptions.push(vscode.commands.registerCommand('anecdotextension.requestJoke', () => showJoke(context)));
    context.subscriptions.push(vscode.commands.registerCommand('anecdotextension.showStats', () => {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
        }
        else {
            currentPanel = vscode.window.createWebviewPanel('anecdotextension', // Identifies the type of the webview; used internally
            'Anecdote Stats', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in
            {} // Webview options
            );
            const jokeArray = getJsonContent((0, path_1.join)(context.extensionPath, 'jokes.json'));
            let spanArray = new Array();
            for (let index = 0; index < jokeArray.length; index++) {
                spanArray.push(`<p>${jokeArray[index]}</p>`);
            }
            currentPanel.webview.html = getWebviewContent(spanArray.join(""));
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
        }
    }));
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.text = 'Favourite Jokes';
    statusBarItem.command = 'anecdotextension.showStats';
    statusBarItem.show();
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
async function getJoke() {
    try {
        const response = await (0, node_fetch_1.default)('http://rzhunemogu.ru/RandJSON.aspx?CType=1', {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Error! status: ${response.status}');
        }
        const win1251decoder = new util_1.TextDecoder('windows-1251');
        var buf = await response.arrayBuffer();
        const textResponse = win1251decoder.decode(buf).replace('\"', '').replace('\"', '');
        return textResponse.substring(textResponse.indexOf('\"') + 1, textResponse.lastIndexOf('\"') - 1);
    }
    catch (error) {
        if (error instanceof Error) {
            console.log('error message: ', error.message);
        }
        else {
            console.log('unexpected error: ', error);
        }
        throw error;
    }
}
async function showJoke(context) {
    const joke = await getJoke();
    vscode.window.showInformationMessage(joke, 'Like', 'Next').then(arg => {
        if (arg === 'Next') {
            setTimeout(() => showJoke(context), 300);
        }
        else if (arg === 'Like') {
            addJsonContent((0, path_1.join)(context.extensionPath, 'jokes.json'), joke);
        }
        else {
            throw new Error(`Unreachale: expected callback value were Like or Next, got ${arg}`);
        }
    });
}
function getJsonContent(path) {
    checkJsonExists(path);
    const file = fs.readFileSync(path, 'utf8');
    return JSON.parse(file);
}
function addJsonContent(path, content) {
    checkJsonExists(path);
    const file = getJsonContent(path);
    file.push(content);
    fs.writeFileSync(path, JSON.stringify(file));
}
function checkJsonExists(path) {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, '[]');
    }
}
function getWebviewContent(content) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Favourite Jokes</title>
  </head>
  <body>
	  	${content}
  </body>
  </html>`;
}
//# sourceMappingURL=extension.js.map