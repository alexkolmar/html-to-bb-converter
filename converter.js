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

    // НОВЫЙ МЕТОД: очистка от лишних пробелов
    cleanWhitespace(text, preserveLineBreaks = true) {
        if (!preserveLineBreaks) {
            // Если не сохранять переносы — всё в одну строку
            return text.replace(/\s+/g, ' ').trim();
        }
        
        // Сохраняем переносы, убираем лишнее
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .join('\n');
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
                    // Если есть title, оборачиваем картинку в abbr
                    if (attributes.title) {
                        return `[abbr="${attributes.title}"]${imgTag}[/abbr]`;
                    }
                    return imgTag;
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

            case 's':
            case 'del':
                return `[s]${content}[/s]`;
                
            // Обработка специальных форумных блоков
            case 'div':
                // Проверяем на цитаты и скрытый текст
                if (attributes.class) {
                    // Цитата с автором
                    if (attributes.class.includes('quote-box') && attributes.class.includes('answer-box')) {
                        // Ищем cite и blockquote внутри
                        const cite = this.findChild(node, 'cite');
                        const blockquote = this.findChild(node, 'blockquote');
                        
                        if (cite && blockquote) {
                            // Извлекаем автора из cite (формат: "бродяга написал(а):")
                            const citeText = this.getTextContent(cite).trim();
                            
                            // Убираем " написал(а):" в конце
                            const author = citeText.replace(/\s+написал\(а\):\s*$/, '').trim();
                            
                            // Берём текст из blockquote без обработки тегов
                            const quoteContent = this.getTextContent(blockquote);
                            return `[quote="${author}"]${quoteContent}[/quote]`;
                        }
                    }
                    
                    // Скрытый текст
                    if (attributes.class.includes('quote-box') && attributes.class.includes('hide-box')) {
                        const cite = this.findChild(node, 'cite');
                        const blockquote = this.findChild(node, 'blockquote');
                        
                        if (cite && blockquote) {
                            // Извлекаем число сообщений из cite
                            const citeText = this.getTextContent(cite).trim();
                            const countMatch = citeText.match(/от\s+(\d+)\s+сообщени[йя]/);
                            const hideCount = countMatch ? countMatch[1] : '999999999';
                            
                            // Берём текст из blockquote без обработки тегов
                            const hideContent = this.getTextContent(blockquote);
                            return `[hide=${hideCount}]${hideContent}[/hide]`;
                        }
                    }
                }
                // Если не специальный блок — обычная обработка div
                return `[block=${attributes.class || 'unknown'}]${content}[/block]`;
                
            case 'h1':
                return `[block=bh1]${content}[/block]`;
            case 'h2':
                return `[block=bh2]${content}[/block]`;
            case 'h3':
                return `[block=bh3]${content}[/block]`;
            case 'h4':
                return `[block=bh4]${content}[/block]`;
            case 'h5':
                return `[block=bh5]${content}[/block]`;
            case 'h6':
                return `[block=bh6]${content}[/block]`;
            case 'span':
                return `[block=bspan]${content}[/block]`;
                
            case 'ul':
                return `[ul]${content}[/ul]`;
            case 'ol':
                return `[ol]${content}[/ol]`;

            // Таблицы
            case 'table':
                return `[table]${content}[/table]`;
            case 'tr':
                return `[tr]${content}[/tr]`;
            case 'td':
                // Сохраняем colspan и rowspan если есть
                let tdAttrs = '';
                if (attributes.colspan) tdAttrs += ` colspan="${attributes.colspan}"`;
                if (attributes.rowspan) tdAttrs += ` rowspan="${attributes.rowspan}"`;
                return `[td${tdAttrs}]${content}[/td]`;
            case 'th':
                // th конвертируем в td, так как в BB нет аналога
                let thAttrs = '';
                // ...
                if (attributes.colspan) thAttrs += ` colspan="${attributes.colspan}"`;
                if (attributes.rowspan) thAttrs += ` rowspan="${attributes.rowspan}"`;
                return `[td${thAttrs}]${content}[/td]`;
                
            // Теги, которые удаляем
            case 'li':
            case 'p':
            case 'br':
            case 'tbody':
            case 'thead':
            case 'tfoot':
                return content;

            // Цитаты
            case 'blockquote':
                return `[quote]${content}[/quote]`;
            
            // Разделитель
            case 'hr':
                return '[hr]';
            
            // Спойлеры
            case 'details':
                // Ищем summary внутри
                const summary = this.findSummary(node);
                const detailsContent = this.getDetailsContent(node);
                if (summary) {
                    return `[spoiler="${summary}"]${detailsContent}[/spoiler]`;
                }
                return `[spoiler]${detailsContent}[/spoiler]`;
                
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

    cleanWhitespace(text) {
        return text
            // Разбиваем на строки
            .split('\n')
            // Убираем пробелы по краям каждой строки
            .map(line => line.trim())
            // Убираем пустые строки
            .filter(line => line !== '')
            // Склеиваем обратно с одиночным переносом
            .join('\n');
    }

    extractAttributes(node) {
        const attrs = {};
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    // Вспомогательный метод для поиска summary в details
    findSummary(node) {
        for (const child of node.childNodes) {
            if (child.nodeType === 1 && child.tagName.toLowerCase() === 'summary') {
                return this.processChildren(child).trim();
            }
        }
        return null;
    }

    // Вспомогательный метод для получения содержимого details без summary
    getDetailsContent(node) {
        let content = '';
        for (const child of node.childNodes) {
            if (child.nodeType === 1 && child.tagName.toLowerCase() === 'summary') {
                continue; // пропускаем summary
            }
            content += this.processNode(child);
        }
        return content;
    }

    // Вспомогательный метод для поиска первого дочернего элемента по тегу
    findChild(node, tagName) {
        for (const child of node.childNodes) {
            if (child.nodeType === 1 && child.tagName.toLowerCase() === tagName) {
                return child;
            }
        }
        return null;
    }

    // Получить чистый текст из узла (без HTML-тегов)
    getTextContent(node) {
        let text = '';
        for (const child of node.childNodes) {
            if (child.nodeType === 3) { // текстовый узел
                text += child.textContent;
            } else if (child.nodeType === 1) { // элемент
                text += this.getTextContent(child);
            }
        }
        return text;
    }

}

module.exports = HtmlToBbConverter;