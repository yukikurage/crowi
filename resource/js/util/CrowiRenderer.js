import marked from 'marked';
import hljs from 'highlight.js';

import MarkdownFixer from './PreProcessor/MarkdownFixer';
import Linker        from './PreProcessor/Linker';
import ImageExpander from './PreProcessor/ImageExpander';

import Tsv2Table from './LangProcessor/Tsv2Table';
import Template from './LangProcessor/Template';

export default class CrowiRenderer {


  constructor(plugins) {
    this.preProcessors = [
      new MarkdownFixer(),
      new Linker(),
      new ImageExpander(),
    ];

    this.langProcessors = {
      'tsv2table': new Tsv2Table(),
      'tsv2table-h': new Tsv2Table({header: true}),
      'template': new Template(),
    };

    this.parseMarkdown = this.parseMarkdown.bind(this);
    this.codeRenderer = this.codeRenderer.bind(this);
  }

  preProcess(markdown) {
    for (let i = 0; i < this.preProcessors.length; i++) {
      if (!this.preProcessors[i].process) {
        continue;
      }
      markdown = this.preProcessors[i].process(markdown);
    }
    return markdown;
  }

  codeRenderer(code, lang, escaped) {
    let result = '', hl;


    if (lang) {
      const langPattern = lang.split(':')[0];
      if (this.langProcessors[langPattern]) {
        return this.langProcessors[langPattern].process(code, lang);
      }

      try {
        hl = hljs.highlight(lang, code);
        result = hl.value;
        escaped = true;
      } catch (e) {
        result = code;
      }

      result = (escape ? result : Crowi.escape(result, true));
      return `<pre><code class="lang-${lang}">${result}\n</code></pre>\n`;
    }

    // no lang specified
    return `<pre><code>${Crowi.escape(code, true)}\n</code></pre>`;

  }

  parseMarkdown(markdown) {
    let parsed = '';

    const markedRenderer = new marked.Renderer();
    markedRenderer.code = this.codeRenderer;

    try {
      // TODO
      marked.setOptions({
        gfm: true,
        tables: true,
        breaks: true,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        renderer: markedRenderer,
      });

      parsed = marked(markdown);
    } catch (e) { console.log(e, e.stack); }

    return parsed;
  }

  render(markdown) {
    let html = '';

    markdown = this.preProcess(markdown);
    html = this.parseMarkdown(markdown);

    return html;
  }
}