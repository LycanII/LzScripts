const vscode = require('vscode');
const azdata = require('azdata');
const {runForInsert} = require('./generalFuncs');

function activate(context) {
    
    context.subscriptions.push(vscode.commands.registerCommand('LzScripts.InsertFromScript', (context) => {
        const editor = vscode.window.activeTextEditor;
        var selection = editor.selection;
        var text = editor.document.getText(selection);
    azdata.connection.getCurrentConnection().then(con=>{
            runForInsert(con, text)
            .then(res => {
                vscode.commands.executeCommand('newQuery').then(s => {

                    let editor = vscode.window.activeTextEditor;

                    editor.edit(edit => {

                        edit.insert(new vscode.Position(0, 0), res.join('\n'));
                    });
                });
            }).catch(err => {
                vscode.window.showErrorMessage(err);
            }
        );
        });
        // general.runQuery(connectionProfile, text)
        //     .then(res => {
        //         vscode.commands.executeCommand('newQuery').then(s => {

        //             let editor = vscode.window.activeTextEditor;

        //             editor.edit(edit => {
        //                 edit.insert(new vscode.Position(0, 0), res);
        //             });
        //         });
        //     }).catch(err => {
        //         vscode.window.showErrorMessage(err);
        //     }
        // );

    })
    );


}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;