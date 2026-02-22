const { JSDOM } = require('jsdom');

class HtmlToBbConverter {
    convert(htmlString) {
        const dom = new JSDOM(htmlString);
        const body = dom.window.document.body;
        
        let result = '';
        for (const child of body.childNodes) {
            result += this.processNode(child);
        }
        
        return result;
    }

    processNode(node) {
        // Текст
        if (node.nodeType === 3) {
            return node.textContent;
        }
        
        // Не элемент
        if (node.nodeType !== 1) {
            return '';
        }
        
        const tagName = node.tagName.toLowerCase();
        const children = this.processChildren(node);
        
        // Правила конвертации
        switch(tagName) {
            case 'div':
                return `[block=${node.className || 'unknown'}]${children}[/block]`;
            case 'h1':
                return `[block=bh1]${children}[/block]`;
            case 'span':
                return `[block=bspan]${children}[/block]`;
            case 'a':
                return `[url=${node.href || '#'}]${children}[/url]`;
            case 'img':
                return '[img][/img]';
            case 'ul':
                return `[ul]${children}[/ul]`;
            case 'li':
            case 'p':
                return children;
            default:
                return children;
        }
    }

    processChildren(node) {
        let result = '';
        for (const child of node.childNodes) {
            result += this.processNode(child);
        }
        return result;
    }
}

module.exports = HtmlToBbConverter;