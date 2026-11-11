/* Código usado tanto no app do computador quanto no do celular */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const semAcento = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const soDigitos = s => String(s ?? '').replace(/\D/g, '');
const dinheiro = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pad = n => String(n).padStart(2, '0');
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const hojeISO = () => isoLocal(new Date()).slice(0, 10);
const dataBR = iso => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '';
const quandoBR = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const emDias = n => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); return isoLocal(d); };

const ETAPAS = [
  { id: 'novo', nome: 'Novo', cor: '#3b82c4' },
  { id: 'contato', nome: 'Em contato', cor: '#d98a1c' },
  { id: 'negociando', nome: 'Negociando', cor: '#7c4dd6' },
  { id: 'cliente', nome: 'Cliente', cor: '#1a9b57' },
  { id: 'sem', nome: 'Sem interesse', cor: '#8a94a1' },
];
const PED_STATUS = ['Em aberto', 'Enviado', 'Faturado', 'Entregue', 'Cancelado'];
const CAMPOS = [
  ['cidade', 'Cidade'], ['uf', 'UF'], ['gerente', 'Gerente'], ['consultor', 'Consultor'], ['razao', 'Razão social'], ['zbrm', 'ZBRM'],
  ['situacao', 'Situação'], ['cnpj', 'CNPJ loja'], ['telefone', 'Telefone franqueado'], ['franqueado', 'Franqueado'], ['responsavel', 'Responsável'],
];
const COLECOES = ['leads', 'pedidos', 'lembretes', 'catalogos'];

function analisaTel(tel) {
  let d = soDigitos(tel).replace(/^0+/, '');
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11) return { wa: '55' + d, tipo: 'cel' };
  if (d.length === 10) return { wa: '55' + d, tipo: /^..[2-5]/.test(d) ? 'fixo' : 'cel' };
  return { wa: null, tipo: d.length ? 'incompleto' : 'vazio' };
}
function fmtCnpj(c) { const d = soDigitos(c); return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : (c || ''); }
const vazio = v => !String(v ?? '').trim() || /^(SEM INFO|-|NONE|N\/A)$/i.test(String(v).trim());
const totalPedido = p => p.itens.reduce((s, i) => s + (Number(i.qtd) || 0) * (Number(i.preco) || 0), 0);
function textoPedido(p) {
  return `*Pedido — ${dataBR(p.data)}*\n` + p.itens.map(i => `• ${i.qtd}x ${i.nome}${i.ref ? ` (ref. ${i.ref})` : ''} — ${dinheiro(i.qtd * i.preco)}`).join('\n') + `\n*Total: ${dinheiro(totalPedido(p))}*` + (p.obs ? `\n${p.obs}` : '');
}
function produtosDe(D) {
  const m = new Map();
  [...D.catalogos].sort((a, b) => a.adicionadoEm.localeCompare(b.adicionadoEm)).forEach(c => (c.produtos || []).forEach(p => m.set(p.ref, p)));
  return [...m.values()];
}

/* ---------- calendário da Agenda ---------- */
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
function calendarioHTML(mes /* 'AAAA-MM' */, lembretes, diaSel) {
  const [a, m] = mes.split('-').map(Number), hoje = hojeISO(), agora = isoLocal(new Date());
  const prim = new Date(a, m - 1, 1).getDay(), dias = new Date(a, m, 0).getDate();
  const porDia = {};
  lembretes.forEach(l => { const d = l.quando.slice(0, 10); (porDia[d] = porDia[d] || []).push(l); });
  let h = `<div class="cal-top"><button data-mes="-1" aria-label="Mês anterior">‹</button><strong>${MESES[m - 1]} ${a}</strong><button data-mes="1" aria-label="Próximo mês">›</button></div>
    <div class="cal-grade">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<span class="cal-sem">${d}</span>`).join('')}${'<span></span>'.repeat(prim)}`;
  for (let d = 1; d <= dias; d++) {
    const iso = `${a}-${pad(m)}-${pad(d)}`, ls = porDia[iso] || [], ab = ls.filter(l => !l.feito);
    const cls = [iso === hoje ? 'hoje' : '', iso === diaSel ? 'sel' : '', ab.some(l => l.quando < agora) ? 'atras' : ''].join(' ');
    h += `<button class="cal-dia ${cls}" data-dia="${iso}">${d}${ab.length ? `<i>${ab.length}</i>` : ls.length ? '<i class="ok">✓</i>' : ''}</button>`;
  }
  return h + '</div>';
}
function mudaMes(mes, delta) { const [a, m] = mes.split('-').map(Number); const d = new Date(a, m - 1 + delta, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }

/* ---------- carimbo de alteração (para saber qual lado mexeu por último) ---------- */
const semMod = r => JSON.stringify({ ...r, mod: undefined });
function fotografar(D) { const s = new Map(); COLECOES.forEach(c => D[c].forEach(r => s.set(r.id, semMod(r)))); return s; }
function carimbar(D, foto) {
  const agora = new Date().toISOString(), vistos = new Set(); let mudou = false;
  D.apagados = D.apagados || {};
  COLECOES.forEach(c => D[c].forEach(r => {
    vistos.add(r.id); const s = semMod(r);
    if (foto.get(r.id) !== s || !r.mod) { r.mod = agora; foto.set(r.id, s); mudou = true; }
  }));
  for (const id of [...foto.keys()]) if (!vistos.has(id)) { D.apagados[id] = agora; foto.delete(id); mudou = true; }
  return mudou;
}

/* ---------- juntar o que está no aparelho com o que está na nuvem ---------- */
function mesclar(L, R) {
  if (!R) return { dados: L, puxar: false, empurrar: true };
  let puxar = false, empurrar = false;
  const limite = new Date(Date.now() - 180 * 864e5).toISOString();
  const ap = {}, la = L.apagados || {}, ra = R.apagados || {};
  for (const k of new Set([...Object.keys(la), ...Object.keys(ra)])) {
    const v = (la[k] || '') > (ra[k] || '') ? la[k] : ra[k];
    if (v < limite) continue;
    ap[k] = v; if (la[k] !== v) puxar = true; if (ra[k] !== v) empurrar = true;
  }
  const dados = { apagados: ap };
  for (const c of COLECOES) {
    const m = new Map();
    (L[c] || []).forEach(x => m.set(x.id, { x, l: true, r: false }));
    (R[c] || []).forEach(x => {
      const a = m.get(x.id);
      if (!a) return m.set(x.id, { x, l: false, r: true, novoL: true });
      a.r = true;
      if ((x.mod || '') > (a.x.mod || '')) { a.x = x; a.novoL = true; } else if ((x.mod || '') < (a.x.mod || '')) a.novoR = true;
    });
    dados[c] = [];
    for (const [id, e] of m) {
      if (ap[id] && ap[id] >= (e.x.mod || '')) { if (e.l) puxar = true; if (e.r) empurrar = true; continue; }
      if (e.novoL) puxar = true;
      if (e.novoR || !e.r) empurrar = true;
      dados[c].push(e.x);
    }
  }
  return { dados, puxar, empurrar };
}
// aplica o resultado sem trocar os objetos que as telas já estão usando
function aplicar(D, novo) {
  D.apagados = novo.apagados;
  for (const c of COLECOES) {
    const atual = new Map(D[c].map(x => [x.id, x]));
    D[c] = novo[c].map(n => {
      const a = atual.get(n.id); if (!a) return n;
      if (a !== n) { for (const k of Object.keys(a)) delete a[k]; Object.assign(a, n); }
      return a;
    });
  }
}

/* ---------- nuvem: os dados ficam num repositório privado do GitHub do usuário ---------- */
const b64 = {
  deBytes(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); },
  paraBytes(t) { const s = atob(t.replace(/\s/g, '')); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; },
  deTexto: t => b64.deBytes(new TextEncoder().encode(t)),
  paraTexto: t => new TextDecoder().decode(b64.paraBytes(t)),
};
const Nuvem = {
  base: 'https://api.github.com', REPO: 'carteira-dados', SITE: 'carteira-app', ARQ: 'dados.json',
  cfg: null, sha: null, etag: null, ocupado: false, sujo: false, estado: 'off', erro: '', ultima: null,
  dados: () => ({}), aoReceber() {}, aoMudar() {},
  ligada() { return !!(this.cfg && this.cfg.token && this.cfg.dono); },
  marca(estado, erro) { this.estado = estado; this.erro = erro || ''; if (estado === 'ok') this.ultima = new Date(); this.aoMudar(); },
  api(metodo, caminho, corpo, extra) {
    return fetch(this.base + caminho, {
      method: metodo, cache: 'no-store',
      headers: { Authorization: 'Bearer ' + this.cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(corpo ? { 'Content-Type': 'application/json' } : {}), ...extra },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  },
  async falha(r) {
    let m = ''; try { m = (await r.json()).message || ''; } catch {}
    if (r.status === 401) return new Error('O código de acesso (token) não é mais válido. Gere um novo e conecte de novo.');
    if (r.status === 403) return new Error('O GitHub recusou o acesso (403). ' + m);
    return new Error(`Erro ${r.status} do GitHub. ${m}`);
  },
  caminho(arq) { return `/repos/${this.cfg.dono}/${this.REPO}/contents/${arq}`; },
  mudou() { this.sujo = true; clearTimeout(this.t); this.t = setTimeout(() => this.ciclo(), 1500); },
  async ciclo() {
    if (!this.ligada() || this.ocupado) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return this.marca('offline');
    this.ocupado = true; this.marca('sync');
    try {
      for (let t = 0; t < 4; t++) {
        const r = await this.api('GET', this.caminho(this.ARQ), null, this.etag && !this.sujo ? { 'If-None-Match': this.etag } : {});
        let remoto = null;
        if (r.status === 304) break;
        if (r.status === 404) this.sha = null;
        else if (r.ok) {
          const j = await r.json(); this.sha = j.sha; this.etag = r.headers.get('etag');
          let c = j.content;
          if (!c && j.size) { const b = await this.api('GET', `/repos/${this.cfg.dono}/${this.REPO}/git/blobs/${j.sha}`); if (!b.ok) throw await this.falha(b); c = (await b.json()).content; }
          remoto = JSON.parse(b64.paraTexto(c));
        } else throw await this.falha(r);
        const m = mesclar(this.dados(), remoto);
        if (m.puxar) this.aoReceber(m.dados);
        this.sujo = false;
        if (!m.empurrar) break;
        const envio = { apagados: m.dados.apagados }; COLECOES.forEach(c => envio[c] = m.dados[c]);
        const p = await this.api('PUT', this.caminho(this.ARQ), { message: 'sincronização', content: b64.deTexto(JSON.stringify(envio)), ...(this.sha ? { sha: this.sha } : {}) });
        if (p.status === 409 || p.status === 422) { this.sujo = true; this.etag = null; continue; } // o outro aparelho gravou no meio: junta de novo
        if (!p.ok) throw await this.falha(p);
        this.sha = (await p.json()).content.sha; this.etag = null;
        break;
      }
      this.marca('ok');
    } catch (e) { this.marca('erro', /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? 'Sem internet no momento. Vou tentar de novo sozinho.' : e.message); }
    finally { this.ocupado = false; if (this.sujo && this.estado !== 'erro') { clearTimeout(this.t); this.t = setTimeout(() => this.ciclo(), 2000); } }
  },
  iniciar(seg = 40) {
    this.ciclo();
    clearInterval(this.ti); this.ti = setInterval(() => { if (typeof document === 'undefined' || !document.hidden) this.ciclo(); }, seg * 1000);
    if (typeof document !== 'undefined' && !this.ouvindo) {
      this.ouvindo = true;
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.ciclo(); });
      window.addEventListener('online', () => this.ciclo());
    }
  },
  parar() { clearInterval(this.ti); clearTimeout(this.t); this.cfg = null; this.sha = this.etag = null; this.sujo = false; this.marca('off'); },
  // arquivos grandes (PDF dos catálogos)
  async existe(arq) { const r = await this.api('GET', `/repos/${this.cfg.dono}/${this.REPO}/contents/${arq.split('/').slice(0, -1).join('/')}`); if (!r.ok) return null; const f = (await r.json()).find(x => x.path === arq); return f ? f.sha : null; },
  async enviarArquivo(arq, bytes) {
    const sha = await this.existe(arq); if (sha) return true;
    const r = await this.api('PUT', this.caminho(arq), { message: 'catálogo', content: b64.deBytes(bytes) });
    if (!r.ok && r.status !== 422) throw await this.falha(r); return true;
  },
  async baixarArquivo(arq) { const r = await this.api('GET', this.caminho(arq), null, { Accept: 'application/vnd.github.raw+json' }); if (!r.ok) throw await this.falha(r); return new Uint8Array(await r.arrayBuffer()); },
  async apagarArquivo(arq) { const sha = await this.existe(arq); if (sha) await this.api('DELETE', this.caminho(arq), { message: 'remover catálogo', sha }); },
  // primeira configuração, feita pelo computador: cria os dois repositórios e publica o app do celular
  async instalar(token, arquivosSite, passo = () => {}) {
    this.cfg = { token, dono: '?' };
    passo('Conferindo o código…');
    const u = await this.api('GET', '/user'); if (!u.ok) { this.cfg = null; throw await this.falha(u); }
    const dono = (await u.json()).login; this.cfg.dono = dono;
    const garante = async (nome, privado, descricao) => {
      const r = await this.api('GET', `/repos/${dono}/${nome}`);
      if (r.ok) return;
      const c = await this.api('POST', '/user/repos', { name: nome, private: privado, auto_init: true, description: descricao });
      if (!c.ok) throw new Error(c.status === 403 || c.status === 404 ? 'O código não tem a permissão “repo”. Gere outro marcando a caixinha “repo”.' : (await this.falha(c)).message);
      await new Promise(ok => setTimeout(ok, 1500));
    };
    passo('Criando o cofre dos seus dados (privado)…');
    await garante(this.REPO, true, 'Dados da Minha Carteira (privado)');
    passo('Publicando o app do celular…');
    await garante(this.SITE, false, 'App Minha Carteira para celular');
    const lista = await this.api('GET', `/repos/${dono}/${this.SITE}/contents/`);
    const shas = Object.fromEntries((lista.ok ? await lista.json() : []).map(f => [f.path, f.sha]));
    for (const f of arquivosSite) {
      const r = await this.api('PUT', `/repos/${dono}/${this.SITE}/contents/${f.nome}`, { message: 'app do celular', content: f.b64, ...(shas[f.nome] ? { sha: shas[f.nome] } : {}) });
      if (!r.ok) throw await this.falha(r);
    }
    passo('Ligando o endereço do app…');
    const pg = await this.api('POST', `/repos/${dono}/${this.SITE}/pages`, { source: { branch: 'main', path: '/' } });
    if (!pg.ok && pg.status !== 409) throw await this.falha(pg);
    return { token, dono };
  },
  link() { return `https://${this.cfg.dono.toLowerCase()}.github.io/${this.SITE}/#d=${encodeURIComponent(this.cfg.dono)}&t=${encodeURIComponent(this.cfg.token)}`; },
};
if (typeof module !== 'undefined') module.exports = { mesclar, carimbar, fotografar, aplicar, COLECOES };
