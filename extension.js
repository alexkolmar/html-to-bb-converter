const vscode = require('vscode');
const HtmlToBbConverter = require('./converter');

function activate(context) {
    const command = vscode.commands.registerCommand('bb-converter.convert', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Нет редактора');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);
        
        if (!text) {
            vscode.window.showErrorMessage('Нет выделенного текста');
            return;
        }

        try {
            const converter = new HtmlToBbConverter();
            const result = converter.convert(text);
            
            editor.edit(editBuilder => {
                editBuilder.replace(selection, result);
            });
            
            vscode.window.showInformationMessage('Готово!');
        } catch (error) {
            vscode.window.showErrorMessage('Ошибка: ' + error.message);
        }
    });
    
    context.subscriptions.push(command);
}

function deactivate() {}
module.exports = { activate, deactivate };