// Lê o texto de um catálogo em PDF e tenta achar os produtos (nome, ref, marca, preço).
(function (root) {
  function linhasDaPagina(items) {
    const its = items.filter(i => i.str && i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5] }));
    its.sort((a, b) => b.y - a.y || a.x - b.x);
    const linhas = [];
    for (const it of its) {
      const l = linhas[linhas.length - 1];
      if (l && Math.abs(l.y - it.y) < 3) l.its.push(it); else linhas.push({ y: it.y, its: [it] });
    }
    return linhas.map(l => l.its.sort((a, b) => a.x - b.x).map(i => i.s.trim()).join(' ').replace(/\s+/g, ' ').trim());
  }
  function produtosDasLinhas(linhas, pagina) {
    const out = []; let p = null;
    const limpa = s => s.replace(/\b(Disponível|Fora de linha|Indisponível|Lançamento)\b/gi, '').trim();
    linhas.forEach((l, i) => {
      const ref = l.match(/Ref\.?:\s*([\w.\-]+)/i);
      if (ref) {
        let nome = '';
        for (let j = i - 1; j >= 0 && j >= i - 2; j--) { const c = limpa(linhas[j]); if (c && !/^R\$|Quant|Preço|NCM|Marca/i.test(c)) { nome = c; break; } }
        p = { nome, ref: ref[1], marca: '', preco: null, unidade: '', pagina, foraDeLinha: /fora de linha/i.test(l + ' ' + (linhas[i - 1] || '')) };
        return;
      }
      if (!p) return;
      const m = l.match(/Marca:\s*(.+)$/i); if (m) p.marca = m[1].trim();
      const pr = l.match(/R\$\s*([\d.]+,\d{2})\s*(?:\/\s*(\S+))?/);
      if (pr) { p.preco = parseFloat(pr[1].replace(/\./g, '').replace(',', '.')); p.unidade = pr[2] || ''; if (p.nome) out.push(p); p = null; }
    });
    return out;
  }
  const api = { linhasDaPagina, produtosDasLinhas };
  if (typeof module !== 'undefined') module.exports = api; else root.CatalogoParse = api;
})(this);
