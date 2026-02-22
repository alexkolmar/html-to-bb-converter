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
        const attributes = this.extractAttributes(node);
        const children = this.processChildren(node);
        
        // 1. Сначала обрабатываем title для abbr
        let content = children;
        if (attributes.title) {
            content = `[abbr="${attributes.title}"]${content}[/abbr]`;
        }
        
        // 2. Специальные теги
        switch(tagName) {
            case 'a':
                if (attributes.href) {
                    return `[url=${attributes.href}]${content}[/url]`;
                }
                return content;
                
            case 'img':
                if (attributes.src) {
                    let imgTag = `[img]${attributes.src}[/img]`;
                    // Если есть title (уже обработали выше), он обернет картинку
                    return attributes.title ? content : imgTag;
                }
                return '[img][/img]';
                
            case 'b':
            case 'strong':
                return `[b]${content}[/b]`;
                
            case 'i':
            case 'em':
                return `[i]${content}[/i]`;
                
            case 'u':
                return `[u]${content}[/u]`;
                
            case 'div':
                return `[block=${attributes.class || 'unknown'}]${content}[/block]`;
                
            case 'h1':
                return `[block=bh1]${content}[/block]`;
            case 'h2':
                return `[block=bh2]${content}[/block]`;
            case 'h3':
                return `[block=bh3]${content}[/block]`;
            case 'span':
                return `[block=bspan]${content}[/block]`;
                
            case 'ul':
                return `[ul]${content}[/ul]`;
            case 'ol':
                return `[ol]${content}[/ol]`;
                
            // Теги, которые удаляем
            case 'li':
            case 'p':
            case 'br':
                return content;
                
            default:
                return content;
        }
    }

    processChildren(node) {
        let result = '';
        for (const child of node.childNodes) {
            result += this.processNode(child);
        }
        return result;
    }

    extractAttributes(node) {
        const attrs = {};
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }
}

module.exports = HtmlToBbConverter;