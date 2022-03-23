const vscode = require('vscode');
const azdata = require('azdata');
const { runForInsert } = require('./generalFuncs');

function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('LzScripts.InsertToClip', (context) => {
        const editor = vscode.window.activeTextEditor;
        var selection = editor.selection;
        var text = editor.document.getText(selection);
        azdata.connection.getCurrentConnection().then(con => {
            vscode.window.withProgress({ location: vscode.ProgressLocation.Notification },
                async (progress) => {
                    progress.report({
                        message: 'Running Script!',
                    });
                    await runForInsert(con, text)
                        .then(res => {

                            vscode.env.clipboard.writeText(res.join('\n')).then((text) => {
                               vscode.window.showInformationMessage('Script copied to Clipboard!');
                            });

                        }).catch(err => { vscode.window.showErrorMessage(err.message); });
                
                        
                }
            );

        });

    }));

    context.subscriptions.push(vscode.commands.registerCommand('LzScripts.InsertToNewTab', (context) => {
        const editor = vscode.window.activeTextEditor;
        var selection = editor.selection;
        var text = editor.document.getText(selection);
        azdata.connection.getCurrentConnection().then(con => {
                vscode.window.withProgress({ location: vscode.ProgressLocation.Notification },
                    async (progress) => {
                        progress.report({
                            message: 'Running Script!',
                        });
                        await runForInsert(con, text)
                            .then(res => {
                                
                                vscode.commands.executeCommand('newQuery').then(s => {
                                    let editor = vscode.window.activeTextEditor;
                                    editor.edit(edit => { edit.insert(new vscode.Position(0, 0), res.join('\n')); });
                                    vscode.window.showInformationMessage('Script copied to New Tab!');
                                });
                            }).catch(err => { vscode.window.showErrorMessage(err.message); });
    
                    }
                );    
                
        });

    }));


}


// this method is called when your extension is deactivated
function deactivate() {
}
exports.activate = activate;
exports.deactivate = deactivate;