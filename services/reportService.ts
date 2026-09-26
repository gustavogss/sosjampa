import { AppData, SupplyCategory } from '@/contexts/DataContext';

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  alimentos: 'Alimentos',
  higiene: 'Higiene',
  roupas: 'Roupas',
  medicamentos: 'Medicamentos',
  outros: 'Outros',
};

const CATEGORY_COLORS: Record<SupplyCategory, string> = {
  alimentos: '#2E7D32',
  higiene: '#00838F',
  roupas: '#6A1B9A',
  medicamentos: '#B71C1C',
  outros: '#E65100',
};

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Em Atendimento',
  parcial: 'Parcialmente',
  atendido: 'Atendido',
};

const STATUS_COLORS: Record<string, string> = {
  ativo: '#B71C1C',
  parcial: '#E65100',
  atendido: '#2E7D32',
};

// ─── HTML Generator ───────────────────────────────────────────────────────────

export function generateReportHTML(data: AppData): string {
  const { supplies, pixTransactions, families, familiesAttended } = data;
  const totalPix = pixTransactions.reduce((s, t) => s + t.amount, 0);
  const totalItems = supplies.reduce((s, i) => s + i.quantity, 0);
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Supply categories summary
  const catMap: Partial<Record<SupplyCategory, number>> = {};
  for (const s of supplies) {
    catMap[s.category] = (catMap[s.category] ?? 0) + s.quantity;
  }
  const catEntries = Object.entries(catMap) as [SupplyCategory, number][];
  const totalCatQty = catEntries.reduce((s, [, v]) => s + v, 0);

  // Pix rows
  const pixRows = pixTransactions.map((t) => `
    <tr>
      <td>${formatDateTime(t.date)}</td>
      <td>${t.sender}</td>
      <td>${t.description || '—'}</td>
      <td class="amount">${formatCurrency(t.amount)}</td>
    </tr>
  `).join('');

  // Supply rows
  const supplyRows = supplies.map((s) => `
    <tr>
      <td><span class="cat-badge" style="background:${CATEGORY_COLORS[s.category]}18;color:${CATEGORY_COLORS[s.category]};border:1px solid ${CATEGORY_COLORS[s.category]}40">${CATEGORY_LABELS[s.category]}</span></td>
      <td>${s.name}</td>
      <td class="qty">${s.quantity} ${s.unit}</td>
      <td>${formatDate(s.date)}</td>
    </tr>
  `).join('');

  // Category chart bars
  const catBars = catEntries.map(([cat, qty]) => {
    const pct = totalCatQty > 0 ? Math.round((qty / totalCatQty) * 100) : 0;
    return `
      <div class="cat-bar-row">
        <div class="cat-bar-label">
          <span class="cat-dot" style="background:${CATEGORY_COLORS[cat]}"></span>
          ${CATEGORY_LABELS[cat]}
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${pct}%;background:${CATEGORY_COLORS[cat]}"></div>
        </div>
        <div class="cat-bar-value">${qty} un. (${pct}%)</div>
      </div>
    `;
  }).join('');

  // Family rows
  const familyRows = families.map((f) => {
    const familyTotalPix = f.attendance
      .filter((a) => a.type === 'pix' && a.value)
      .reduce((s, a) => s + (a.value ?? 0), 0);

    const attendanceRows = f.attendance.map((a) => `
      <tr class="attendance-row">
        <td colspan="2" class="att-desc">
          <span class="att-type-badge ${a.type}">${a.type === 'pix' ? 'Financeiro' : a.type === 'supply' ? 'Mantimento' : 'Anotação'}</span>
          ${a.description}
          ${a.value ? `<strong style="color:#2E7D32"> ${formatCurrency(a.value)}</strong>` : ''}
        </td>
        <td class="att-date">${formatDateTime(a.date)}</td>
      </tr>
    `).join('');

    return `
      <tr class="family-header-row">
        <td>
          <span class="status-badge" style="background:${STATUS_COLORS[f.status]}18;color:${STATUS_COLORS[f.status]};border:1px solid ${STATUS_COLORS[f.status]}40">${STATUS_LABELS[f.status]}</span>
          <strong>${f.name}</strong>
        </td>
        <td>${f.members} membros · ${f.address}</td>
        <td class="amount">${familyTotalPix > 0 ? formatCurrency(familyTotalPix) : '—'}</td>
      </tr>
      ${attendanceRows}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Relatório SOS Jampa</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #fff;
    padding: 32px;
    line-height: 1.5;
  }

  /* ── Header ── */
  .report-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 3px solid #B71C1C;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .report-logo-title { display: flex; align-items: center; gap: 14px; }
  .report-logo-circle {
    width: 54px; height: 54px; border-radius: 50%;
    background: #B71C1C;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 20px; font-weight: 800;
    flex-shrink: 0;
  }
  .report-title { font-size: 22px; font-weight: 800; color: #121212; }
  .report-subtitle { font-size: 12px; color: #757575; margin-top: 3px; }
  .report-meta { text-align: right; }
  .report-date { font-size: 12px; color: #757575; }
  .report-label { font-size: 11px; color: #999; margin-bottom: 2px; }

  /* ── Summary Cards ── */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 32px;
  }
  .summary-card {
    border-radius: 10px;
    padding: 16px;
    border: 1px solid #e0e0e0;
  }
  .summary-card-label { font-size: 11px; color: #757575; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
  .summary-card-value { font-size: 22px; font-weight: 800; }
  .summary-card-sub { font-size: 11px; color: #757575; margin-top: 4px; }
  .card-red { border-top: 3px solid #B71C1C; }
  .card-green { border-top: 3px solid #2E7D32; }
  .card-blue { border-top: 3px solid #00838F; }
  .card-orange { border-top: 3px solid #E65100; }

  /* ── Sections ── */
  .section { margin-bottom: 32px; page-break-inside: avoid; }
  .section-title {
    font-size: 13px; font-weight: 700; color: #121212;
    text-transform: uppercase; letter-spacing: 0.7px;
    border-left: 3px solid #B71C1C;
    padding-left: 10px;
    margin-bottom: 14px;
  }

  /* ── Category Bars ── */
  .cat-bar-row {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 10px;
  }
  .cat-bar-label {
    display: flex; align-items: center; gap: 7px;
    width: 120px; font-size: 12px; color: #333; flex-shrink: 0;
  }
  .cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .cat-bar-track {
    flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden;
  }
  .cat-bar-fill { height: 100%; border-radius: 5px; }
  .cat-bar-value { width: 100px; text-align: right; font-size: 11px; color: #757575; flex-shrink: 0; }

  /* ── Tables ── */
  table {
    width: 100%; border-collapse: collapse; font-size: 12px;
  }
  th {
    background: #121212; color: #fff;
    padding: 9px 12px; text-align: left;
    font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
  }
  td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #fafafa; }
  .amount { font-weight: 700; color: #2E7D32; text-align: right; white-space: nowrap; }
  .qty { font-weight: 700; color: #B71C1C; text-align: right; }

  /* ── Badges ── */
  .cat-badge, .status-badge, .att-type-badge {
    display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 10px; font-weight: 600;
    margin-right: 5px; white-space: nowrap;
  }
  .att-type-badge.pix { background: #E8F5E9; color: #2E7D32; border: 1px solid #a5d6a7; }
  .att-type-badge.supply { background: #E3F2FD; color: #1565C0; border: 1px solid #90caf9; }
  .att-type-badge.note { background: #FFF3E0; color: #E65100; border: 1px solid #ffcc80; }

  /* ── Family rows ── */
  .family-header-row td { background: #FFEBEE; font-size: 12px; }
  .family-header-row td:first-child { border-left: 3px solid #B71C1C; }
  .attendance-row td { padding-left: 24px; font-size: 11px; color: #555; background: #fff; }
  .att-desc { color: #333; }
  .att-date { color: #999; white-space: nowrap; font-size: 10px; }

  /* ── Footer ── */
  .report-footer {
    margin-top: 40px; padding-top: 16px;
    border-top: 1px solid #e0e0e0;
    text-align: center; font-size: 11px; color: #999;
    line-height: 1.8;
  }

  @media print {
    body { padding: 16px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ── Report Header ── -->
<div class="report-header">
  <div class="report-logo-title">
    <div class="report-logo-circle">SOS</div>
    <div>
      <div class="report-title">SOS Jampa</div>
      <div class="report-subtitle">Relatório de Arrecadação e Distribuição de Recursos</div>
    </div>
  </div>
  <div class="report-meta">
    <div class="report-label">Gerado em</div>
    <div class="report-date">${now}</div>
    <div class="report-label" style="margin-top:6px">João Pessoa — PB</div>
  </div>
</div>

<!-- ── Summary Cards ── -->
<div class="summary-grid">
  <div class="summary-card card-red">
    <div class="summary-card-label">Total Arrecadado</div>
    <div class="summary-card-value" style="color:#B71C1C">${formatCurrency(totalPix)}</div>
    <div class="summary-card-sub">${pixTransactions.length} transações via Pix</div>
  </div>
  <div class="summary-card card-green">
    <div class="summary-card-label">Famílias Atendidas</div>
    <div class="summary-card-value" style="color:#2E7D32">${familiesAttended}</div>
    <div class="summary-card-sub">${families.length} cadastradas no sistema</div>
  </div>
  <div class="summary-card card-blue">
    <div class="summary-card-label">Itens em Estoque</div>
    <div class="summary-card-value" style="color:#00838F">${totalItems}</div>
    <div class="summary-card-sub">${supplies.length} tipos de mantimentos</div>
  </div>
</div>

<!-- ── Supply Categories ── -->
${catEntries.length > 0 ? `
<div class="section">
  <div class="section-title">Distribuição por Categoria</div>
  ${catBars}
</div>
` : ''}

<!-- ── Financial History ── -->
${pixTransactions.length > 0 ? `
<div class="section">
  <div class="section-title">Histórico Financeiro — Pix Recebidos</div>
  <table>
    <thead>
      <tr>
        <th style="width:150px">Data / Hora</th>
        <th>Doador</th>
        <th>Descrição</th>
        <th style="width:110px;text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>${pixRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align:right;font-weight:700;font-size:12px;padding:10px 12px">Total Arrecadado</td>
        <td class="amount" style="font-size:14px">${formatCurrency(totalPix)}</td>
      </tr>
    </tfoot>
  </table>
</div>
` : ''}

<!-- ── Supplies Inventory ── -->
${supplies.length > 0 ? `
<div class="section">
  <div class="section-title">Inventário de Mantimentos</div>
  <table>
    <thead>
      <tr>
        <th style="width:120px">Categoria</th>
        <th>Item</th>
        <th style="width:100px;text-align:right">Quantidade</th>
        <th style="width:110px">Data</th>
      </tr>
    </thead>
    <tbody>${supplyRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:right;font-weight:700;font-size:12px;padding:10px 12px">Total em Estoque</td>
        <td class="qty" style="font-size:14px;text-align:right">${totalItems} un.</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
</div>
` : ''}

<!-- ── Families ── -->
${families.length > 0 ? `
<div class="section">
  <div class="section-title">Famílias Cadastradas e Histórico de Atendimento</div>
  <table>
    <thead>
      <tr>
        <th style="width:200px">Nome / Status</th>
        <th>Endereço / Membros</th>
        <th style="width:110px;text-align:right">Valor Recebido</th>
      </tr>
    </thead>
    <tbody>${familyRows}</tbody>
  </table>
</div>
` : ''}

<!-- ── Footer ── -->
<div class="report-footer">
  <strong>SOS Jampa</strong> — Controle de Recursos para Famílias Desabrigadas<br/>
  João Pessoa, Paraíba · sosjampa@ajuda.org.br<br/>
  Este relatório foi gerado automaticamente pelo aplicativo SOS Jampa © 2026
</div>

</body>
</html>`;
}
