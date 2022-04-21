const fs = require('fs')
const markdown = require('markdown-it')
const shiki = require('shiki')




shiki.getHighlighter({
  theme: 'nord'
}).then(highlighter => {
  const md = markdown({
    html: true,
    highlight: (code, lang) => {
      return highlighter.codeToHtml(code, { lang })
    }
  })

  fs.readdirSync(`${process.cwd()}/theory`).forEach(file => {
    const f = fs.readFileSync(`${process.cwd()}/theory/${file}`, 'utf-8');
    const html = md.render(f)
    fs.writeFileSync(`${process.cwd()}/public/sw/theory/${file}`, html);
  });
});