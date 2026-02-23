class BbFormatter {
    constructor(indentSize = 4) {
        this.indentSize = indentSize;
        this.indentChar = ' ';
    }

    format(text) {
        const lines = text.split('\n');
        let indentLevel = 0;
        const result = [];

        for (let line of lines) {
            const trimmedLine = line.trim();
            
            // Если строка пустая — оставляем пустую строку
            if (trimmedLine === '') {
                result.push('');
                continue;
            }

            // Проверяем, является ли строка закрывающим тегом
            if (this.isClosingTag(trimmedLine)) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Добавляем отступ
            const indentedLine = this.indentChar.repeat(indentLevel * this.indentSize) + trimmedLine;
            result.push(indentedLine);

            // Проверяем, является ли строка открывающим тегом (и не самозакрывающимся)
            if (this.isOpeningTag(trimmedLine) && !this.isSelfClosing(trimmedLine)) {
                indentLevel++;
            }
        }

        return result.join('\n');
    }

    isOpeningTag(line) {
        // Проверяем наличие открывающего тега без слеша
        return /\[[a-zA-Z0-9_]+(?:=[^\]]+)?\]/.test(line) && 
               !line.includes('[/') && 
               !line.match(/\[\/[a-zA-Z0-9_]+\]/);
    }

    isClosingTag(line) {
        // Проверяем наличие закрывающего тега
        return /\[\/[a-zA-Z0-9_]+\]/.test(line);
    }

    isSelfClosing(line) {
        // Теги, которые обычно не содержат вложений
        const selfClosingTags = ['img', 'hr'];
        for (const tag of selfClosingTags) {
            if (line.includes(`[${tag}]`) || line.includes(`[${tag}=`)) {
                return true;
            }
        }
        return false;
    }
}

module.exports = BbFormatter;