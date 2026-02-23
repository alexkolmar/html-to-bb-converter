const vscode = require('vscode');
const HtmlToBbConverter = require('./converter');

function activate(context) {
    console.log('Расширение активировано!');
    
    // КОМАНДА 1: Конвертация HTML в BB
    const convertCommand = vscode.commands.registerCommand(
        'bb-converter.convert', 
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Нет активного редактора');
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (!text) {
                vscode.window.showErrorMessage('Нет выделенного текста');
                return;
            }

            try {
                // Получаем настройки
                const config = vscode.workspace.getConfiguration('bbConverter');
                const minify = config.get('minify', true);
                const preserveLineBreaks = config.get('preserveLineBreaks', true);
                
                // Конвертируем
                const converter = new HtmlToBbConverter();
                let result = converter.convert(text);
                
                // Применяем очистку если нужно
                if (minify && converter.cleanWhitespace) {
                    result = converter.cleanWhitespace(result, preserveLineBreaks);
                }
                
                // Заменяем выделенный текст
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, result);
                });
                
                vscode.window.showInformationMessage('Конвертация завершена!');
                
            } catch (error) {
                vscode.window.showErrorMessage('Ошибка: ' + error.message);
            }
        }
    );

    // НОВОЕ: Форматирование всего документа
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('bbcode', {
        provideDocumentFormattingEdits(document) {
            const converter = new HtmlToBbConverter();
            const text = document.getText();
            const formatted = converter.cleanWhitespace(text, true);
            
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    });

    // НОВОЕ: Форматирование выделенного фрагмента
    const rangeFormatter = vscode.languages.registerDocumentRangeFormattingEditProvider('bbcode', {
        provideDocumentRangeFormattingEdits(document, range) {
            const converter = new HtmlToBbConverter();
            const text = document.getText(range);
            const formatted = converter.cleanWhitespace(text, true);
            
            return [vscode.TextEdit.replace(range, formatted)];
        }
    });

    context.subscriptions.push(convertCommand, formatter, rangeFormatter);
}

function deactivate() {}

module.exports = { activate, deactivate };