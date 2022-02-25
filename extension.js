// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// The module 'azdata' contains the Azure Data Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias azdata in your code below

// Note: uncomment when you want to use Azure Data Studio APIs. Commenting now to avoid strict linting issues
const azdata = require('azdata');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "LzScripts" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('LzScripts.helloWorld', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('LzScripts.showCurrentConnection', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        azdata.connection.getCurrentConnection().then(connection => {
            let connectionId = connection ? connection.connectionId : 'No connection found!';
            vscode.window.showInformationMessage(connectionId);
        }, error => {
             console.info(error);
        });
    }));
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;