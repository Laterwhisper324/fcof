const fs = require('fs');

const appCode = fs.readFileSync('app.js', 'utf8');
const cssCode = fs.readFileSync('style.css', 'utf8');

const classRegex = /class=["']([^"']+)["']/g;
let m;
const classesUsadas = new Set();
while ((m = classRegex.exec(appCode)) !== null) {
  m[1].split(/\s+/).forEach((c) => {
    if (c && !c.includes('{{') && !c.includes('}}') && !c.startsWith('ng-')) {
      classesUsadas.add(c);
    }
  });
}

const faltando = [];
for (const cls of classesUsadas) {
  const reg = new RegExp('\\.' + cls + '(?![a-zA-Z0-9_-])');
  if (!reg.test(cssCode)) {
    faltando.push(cls);
  }
}

console.log('Classes usadas:', classesUsadas.size);
console.log('Faltando no CSS (' + faltando.length + '):', faltando);
