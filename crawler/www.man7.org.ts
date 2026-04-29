import { CheerioCrawler } from 'crawlee';
import TurndownService from 'turndown';
import fs from 'fs/promises';
import path from 'path';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

// Disable automatic escaping to keep Markdown clean and readable
turndownService.escape = (text) => text;

// Configure turndown to handle <pre> tags better for man pages
turndownService.addRule('pre', {
    filter: 'pre',
    replacement: (content) => `\n\`\`\`\n${content}\n\`\`\`\n`
});

const crawler = new CheerioCrawler({
    async requestHandler({ request, $, enqueueLinks, log }) {
        const title = $('title').text();
        const commandName = title.split(/[(\s]/)[0].trim().toLowerCase();
        log.info(`Processing ${request.loadedUrl}: ${title}`);

        let contentHtml = '';
        let capturing = false;
        let currentSection = '';
        
        $('body').find('h1, h2, h3, pre, p, table').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            
            if ($el.is('table.head') || ($el.is('h2') && text.toUpperCase().startsWith('NAME'))) {
                capturing = true;
                if ($el.is('table.head')) return;
            }
            if ($el.is('table.foot') || ($el.is('h2') && text.toUpperCase().includes('COLOPHON'))) {
                capturing = false;
                return;
            }
            if (!capturing) return;

            if ($el.is('h1, h2, h3')) {
                currentSection = text.replace(/\[top\]/g, '').trim().toUpperCase();
            }

            if ($el.is('pre')) {
                const rawHtml = $el.html() || '';
                const lines = rawHtml.split('\n');
                const cleanedLines = lines.map(line => line.startsWith('       ') ? line.slice(7) : line);
                
                const blocks: string[][] = [[]];
                cleanedLines.forEach(line => {
                    if (line.trim() === '') {
                        if (blocks[blocks.length - 1].length > 0) blocks.push([]);
                    } else {
                        blocks[blocks.length - 1].push(line);
                    }
                });

                blocks.forEach(blockLines => {
                    if (blockLines.length === 0) return;
                    const blockText = blockLines.join('\n').replace(/<[^>]+>/g, '').trim();

                    const isCodeSection = ['SYNOPSIS', 'EXAMPLES'].includes(currentSection);
                    const looksLikeCommand = blockText.toLowerCase().startsWith(commandName) || 
                                           (blockText.includes('[') && blockText.includes(']') && blockText.includes('...'));

                    if (isCodeSection || looksLikeCommand) {
                        contentHtml += `<pre><code class="language-sh">${blockText}</code></pre>`;
                    } else {
                        // Option List Parsing
                        const isOptionBlock = blockLines[0].trim().startsWith('<b>-') || blockLines[0].trim().startsWith('-');
                        if (isOptionBlock) {
                            contentHtml += '<ul>';
                            let currentItem = '';
                            blockLines.forEach(line => {
                                const trimmed = line.trim();
                                const startsWithDash = trimmed.startsWith('<b>-') || trimmed.startsWith('-');

                                if (startsWithDash) {
                                    // Split signature from description
                                    // Heuristic: signature ends at the first text node that has word-characters but doesn't start with '-'
                                    // or after a significant gap.
                                    const $line = $.load(`<div>${line}</div>`, null, false);
                                    let sigParts: string[] = [];
                                    let descHtml = '';
                                    let foundDesc = false;

                                    $line('div').contents().each((_, node) => {
                                        const $node = $(node);
                                        const text = $node.text();
                                        
                                        if (!foundDesc) {
                                            if (node.type === 'text') {
                                                if (text.trim().length > 0 && !text.trim().startsWith('-') && !text.trim().startsWith('[') && !text.trim().startsWith(',')) {
                                                    foundDesc = true;
                                                    descHtml += text;
                                                } else {
                                                    sigParts.push(text);
                                                }
                                            } else if ($node.is('b')) {
                                                sigParts.push(`\`${text.trim()}\``);
                                            } else if ($node.is('i')) {
                                                sigParts.push(`\`*${text.trim()}*\``);
                                            } else {
                                                sigParts.push($.html($node));
                                            }
                                        } else {
                                            descHtml += $.html($node);
                                        }
                                    });

                                    const sig = sigParts.join('').trim().replace(/ ,/g, ',');
                                    const $desc = $.load(`<span>${descHtml}</span>`, null, false);
                                    $desc('b').each((_, b) => {
                                        const t = $desc(b).text().trim();
                                        $desc(b).replaceWith(`\`${t}\``);
                                    });
                                    $desc('i').each((_, i) => {
                                        const t = $desc(i).text().trim();
                                        $desc(i).replaceWith(`*${t}*`);
                                    });
                                    const desc = $desc.text().trim();

                                    if (sig.includes('`-')) {
                                        if (currentItem) contentHtml += `<li>${currentItem}</li>`;
                                        currentItem = `${sig}: ${desc.replace(/^,/, '').trim()}`;
                                    } else {
                                        currentItem += ' ' + sig + ' ' + desc;
                                    }
                                } else {
                                    const $desc = $.load(`<span>${line}</span>`, null, false);
                                    $desc('b').each((_, b) => {
                                        const t = $desc(b).text().trim();
                                        $desc(b).replaceWith(`\`${t}\``);
                                    });
                                    $desc('i').each((_, i) => {
                                        const t = $desc(i).text().trim();
                                        $desc(i).replaceWith(`*${t}*`);
                                    });
                                    currentItem += ' ' + $desc.text().trim();
                                }
                            });
                            if (currentItem) contentHtml += `<li>${currentItem}</li>`;
                            contentHtml += '</ul>';
                        } else {
                            // Normal paragraph with semantic formatting
                            const $p = $.load(`<span>${blockLines.join('\n')}</span>`, null, false);
                            $p('b').each((_, b) => {
                                const t = $p(b).text().trim();
                                $p(b).replaceWith(`\`${t}\``);
                            });
                            $p('i').each((_, i) => {
                                const t = $p(i).text().trim();
                                $p(i).replaceWith(`*${t}*`);
                            });
                            contentHtml += `<p>${$p.text().replace(/\n/g, ' ').trim()}</p>`;
                        }
                    }
                });
            } else if ($el.is('h1, h2, h3, p')) {
                if ($el.is('h2, h3')) {
                    $el.find('a').each((_, a) => {
                        if ($(a).text().toLowerCase().includes('top')) $(a).remove();
                    });
                }
                contentHtml += $.html($el);
            }
        });

        const markdown = turndownService.turndown(contentHtml);

        const url = new URL(request.loadedUrl);
        const hostname = url.hostname;
        let pathname = url.pathname;
        let targetFile: string;
        if (pathname.endsWith('/') || !pathname.includes('.')) {
            const segments = pathname.split('/').filter(Boolean);
            const last = segments[segments.length - 1] || 'index';
            targetFile = path.join('data', hostname, pathname, `${last}.md`);
        } else {
            const mdPath = pathname.replace(/\.[^.]+$/, '') + '.md';
            targetFile = path.join('data', hostname, mdPath);
        }

        const absolutePath = path.resolve(process.cwd(), targetFile);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        
        const finalContent = `# ${title}\n\nSource: ${request.loadedUrl}\n\n${markdown}`;
        await fs.writeFile(absolutePath, finalContent);
        log.info(`Saved to ${absolutePath} (${finalContent.length} bytes)`);

        await enqueueLinks({
            globs: ['https://man7.org/linux/man-pages/**'],
        });
    },
    maxRequestsPerCrawl: 2,
});

(async () => {
    await crawler.run(['https://man7.org/linux/man-pages/man1/ls.1.html']);
})();

