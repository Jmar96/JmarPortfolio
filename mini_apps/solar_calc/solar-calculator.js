const DEFAULT_APPLIANCES = [
  { name: 'Laptop',               w: 65,  h: 4,  q: 1, motor: false },
  { name: 'LED Bulb',             w: 6,   h: 4,  q: 1, motor: false },
  { name: 'LED Bulb',             w: 3,   h: 8,  q: 1, motor: false },
  { name: 'Fan',                  w: 30,  h: 8,  q: 1, motor: true  },
  { name: 'WiFi Router',          w: 13,  h: 24, q: 1, motor: false },
  { name: 'LG AC 1.5hp Inverter', w: 800, h: 13, q: 0, motor: false },
];

let rowId = 0;

/* ── APPLIANCE ROWS ──────────────────────────── */

function addRow(data = {}) {
  const id = ++rowId;
  const tbody = document.getElementById('applianceBody');
  const tr = document.createElement('tr');
  tr.id = 'row-' + id;

  const name  = data.name  || '';
  const w     = data.w  !== undefined ? data.w  : '';
  const h     = data.h  !== undefined ? data.h  : '';
  const q     = data.q  !== undefined ? data.q  : 1;
  const motor = data.motor ? 'checked' : '';

  tr.innerHTML = `
    <td><input type="text"   value="${name}" placeholder="Appliance name" oninput="recalcRow(${id})"></td>
    <td><input type="number" id="w-${id}" value="${w}" min="0" placeholder="W"   oninput="recalcRow(${id})"></td>
    <td><input type="number" id="h-${id}" value="${h}" min="0" step="0.5" placeholder="hrs" oninput="recalcRow(${id})"></td>
    <td><input type="number" id="q-${id}" value="${q}" min="0" placeholder="1"   oninput="recalcRow(${id})"></td>
    <td><input type="number" id="wh-${id}" class="computed" readonly placeholder="0"></td>
    <td class="td-motor"><input type="checkbox" class="motor-check" id="m-${id}" ${motor} onchange="recalcRow(${id})"></td>
    <td><input type="number" id="mw-${id}" class="computed" readonly placeholder="0"></td>
    <td><button class="btn-del" onclick="delRow(${id})" title="Remove">✕</button></td>
  `;

  tbody.appendChild(tr);
  recalcRow(id);
}

function delRow(id) {
  const el = document.getElementById('row-' + id);
  if (el) el.remove();
  recalcTotals();
}

function recalcRow(id) {
  const w     = parseFloat(document.getElementById('w-' + id)?.value) || 0;
  const h     = parseFloat(document.getElementById('h-' + id)?.value) || 0;
  const q     = parseFloat(document.getElementById('q-' + id)?.value) || 0;
  const motor = document.getElementById('m-' + id)?.checked;

  const wh = w * h * q;
  const mw = (motor ? w * 3 : w) * q;

  const whEl = document.getElementById('wh-' + id);
  const mwEl = document.getElementById('mw-' + id);
  if (whEl) whEl.value = wh.toFixed(1);
  if (mwEl) mwEl.value = mw.toFixed(1);

  recalcTotals();
}

function recalcTotals() {
  let totalWh = 0, totalMotorW = 0;

  document.querySelectorAll('#applianceBody tr').forEach(tr => {
    const id    = tr.id.replace('row-', '');
    const w     = parseFloat(document.getElementById('w-' + id)?.value) || 0;
    const h     = parseFloat(document.getElementById('h-' + id)?.value) || 0;
    const q     = parseFloat(document.getElementById('q-' + id)?.value) || 0;
    const motor = document.getElementById('m-' + id)?.checked;
    totalWh     += w * h * q;
    totalMotorW += (motor ? w * 3 : w) * q;
  });

  document.getElementById('totalEnergy').textContent  = totalWh.toFixed(0)     + ' Wh';
  document.getElementById('totalMotorW').textContent  = totalMotorW.toFixed(0) + ' W';
  
  const invEff = document.getElementById('invEff').value;
  let inverterW = totalWh + (totalMotorW * invEff) + totalMotorW;
  document.getElementById('inverterW').value          = inverterW;
  updateLossDisplay();
}

/* ── AGGREGATION HELPERS ─────────────────────── */

function getTotalWh() {
  let t = 0;
  document.querySelectorAll('#applianceBody tr').forEach(tr => {
    const id = tr.id.replace('row-', '');
    const w  = parseFloat(document.getElementById('w-' + id)?.value) || 0;
    const h  = parseFloat(document.getElementById('h-' + id)?.value) || 0;
    const q  = parseFloat(document.getElementById('q-' + id)?.value) || 0;
    t += w * h * q;
  });
  return t;
}

function getTotalMotorW() {
  let t = 0;
  document.querySelectorAll('#applianceBody tr').forEach(tr => {
    const id    = tr.id.replace('row-', '');
    const w     = parseFloat(document.getElementById('w-' + id)?.value) || 0;
    const q     = parseFloat(document.getElementById('q-' + id)?.value) || 0;
    const motor = document.getElementById('m-' + id)?.checked;
    t += (motor ? w * 3 : w) * q;
  });
  return t;
}

/* ── SYSTEM LOSS LIVE DISPLAY ────────────────── */

function updateLossDisplay() {
  const baseWh = getTotalWh();
  const solar  = parseFloat(document.getElementById('lossSolar').value) / 100 || 0;
  const wires  = parseFloat(document.getElementById('lossWires').value) / 100 || 0;
  const scc    = parseFloat(document.getElementById('lossSCC').value)   / 100 || 0;
  const batt   = parseFloat(document.getElementById('lossBatt').value)  / 100 || 0;
  const inv    = parseFloat(document.getElementById('lossInv').value)   / 100 || 0;
  const total  = solar + wires + scc + batt + inv;

  document.getElementById('lossSolarVal').textContent = (baseWh * solar).toFixed(1) + ' Wh';
  document.getElementById('lossWiresVal').textContent = (baseWh * wires).toFixed(1) + ' Wh';
  document.getElementById('lossSCCVal').textContent   = (baseWh * scc).toFixed(1)   + ' Wh';
  document.getElementById('lossBattVal').textContent  = (baseWh * batt).toFixed(1)  + ' Wh';
  document.getElementById('lossInvVal').textContent   = (baseWh * inv).toFixed(1)   + ' Wh';
  document.getElementById('totalLossPct').textContent = (total * 100).toFixed(1)    + '%';
  document.getElementById('totalLossWh').textContent  = (baseWh * total).toFixed(1) + ' Wh';
}

/* ── MATH HELPER ─────────────────────────────── */

function roundUp(val, dec) {
  const m = Math.pow(10, dec);
  return Math.ceil(val * m) / m;
}

/* ── MAIN CALCULATION ────────────────────────── */

function calculate() {
  const totalWh     = getTotalWh();
  const totalMotorW = getTotalMotorW();

  /* System loss */
  const solar         = parseFloat(document.getElementById('lossSolar').value) / 100 || 0;
  const wires         = parseFloat(document.getElementById('lossWires').value) / 100 || 0;
  const scc           = parseFloat(document.getElementById('lossSCC').value)   / 100 || 0;
  const batt          = parseFloat(document.getElementById('lossBatt').value)  / 100 || 0;
  const inv           = parseFloat(document.getElementById('lossInv').value)   / 100 || 0;
  const totalLossFrac = solar + wires + scc + batt + inv;
  const totalWithLoss = Math.ceil(totalWh + totalWh * totalLossFrac);

  /* Battery */
  const battVolt     = parseFloat(document.getElementById('battVolt').value);
  const battType     = document.getElementById('battType').value;
  const daysAuto     = parseFloat(document.getElementById('daysAuto').value) || 1;
  const battAhDesired = parseFloat(document.getElementById('battAh').value)  || 100;
  const dod          = battType === 'Lead Acid' ? 0.5 : 0.8;
  const totalLoadAuto = totalWithLoss * daysAuto;
  const battAhCalc   = (totalLoadAuto / dod) / battVolt;
  const battCapacity = battVolt * battAhDesired;
  const battUsable   = battCapacity * dod;

  /* Solar panel */
  const psh        = parseFloat(document.getElementById('psh').value) || 3.5;
  const solarWatts = Math.round(battUsable / psh);

  /* SCC */
  const sccType    = document.getElementById('sccType').value;
  const isc        = parseFloat(document.getElementById('panelISC').value) || 11.85;
  const numStrings = parseFloat(document.getElementById('numStrings').value) || 1;
  const panelW     = parseFloat(document.getElementById('arrayw').value) || 200;
  let sccAmps;
  if (sccType === 'PWM') {
    sccAmps = roundUp(isc * numStrings * 1.25, 1);
  } else {
    sccAmps = roundUp((panelW * numStrings) / battVolt, 1);
  }

  /* Inverter */
  const invEff      = parseFloat(document.getElementById('invEff').value) || 0.2;
  const minInverter = totalMotorW + (totalMotorW * invEff) + totalWh;

  /* Circuit breakers */
  const sf1a    = parseFloat(document.getElementById('cbSF1a').value) || 1.25;
  const sf1b    = parseFloat(document.getElementById('cbSF1b').value) || 1.25;
  const cb1     = roundUp(isc * sf1a * sf1b, 1);

  const arrayw  = parseFloat(document.getElementById('arrayw').value) || 200;
  const sf2     = parseFloat(document.getElementById('cbSF2').value) || 1.25;
  const cb2     = roundUp((arrayw / battVolt) * sf2, 1);

  const inverterW = parseFloat(document.getElementById('inverterW').value) || 500;
  const sf3       = parseFloat(document.getElementById('cbSF3').value) || 1;
  const cb3       = roundUp((inverterW / battVolt) * sf3, 1);

  const maxLoad  = parseFloat(document.getElementById('maxLoad').value)  || 0.7;
  const gridVolt = parseFloat(document.getElementById('gridVolt').value) || 220;
  const sf4      = parseFloat(document.getElementById('cbSF4').value)    || 1.25;
  const cb4      = Math.ceil(((inverterW * maxLoad) / gridVolt) * sf4);

  /* Wire VDI */
  const imp   = parseFloat(document.getElementById('panelIMP').value) || 8.83;
  const vmp   = parseFloat(document.getElementById('panelVMP').value) || 37.4;
  const w1len = parseFloat(document.getElementById('w1len').value) || 25;
  const w1vd  = parseFloat(document.getElementById('w1vd').value) || 2;
  const vdi1  = roundUp((imp * w1len) / (vmp * w1vd), 2);

  const w2amps = parseFloat(document.getElementById('w2amps').value) || 40;
  const w2len  = parseFloat(document.getElementById('w2len').value)  || 5;
  const w2volt = parseFloat(document.getElementById('w2volt').value) || 12.8;
  const w2vd   = parseFloat(document.getElementById('w2vd').value)   || 2;
  const vdi2   = roundUp((w2amps * w2len) / (w2volt * w2vd), 2);

  const w3invw  = parseFloat(document.getElementById('w3invw').value) || 1000;
  const w3amps  = w3invw / w2volt;
  const w3len   = parseFloat(document.getElementById('w3len').value) || 5.5;
  const w3vd    = parseFloat(document.getElementById('w3vd').value)  || 2;
  const vdi3    = roundUp((w3amps * w3len) / (w2volt * w3vd), 2);

  /* ── Write results ── */
  document.getElementById('r-totalLoad').textContent    = totalWithLoss + ' Wh';
  document.getElementById('r-totalLoadAuto').textContent = totalLoadAuto.toFixed(0) + ' Wh';
  document.getElementById('r-inverter').textContent     = Math.ceil(minInverter) + ' W';
  document.getElementById('r-battAhCalc').textContent   = Math.ceil(battAhCalc) + ' Ah';
  document.getElementById('r-battery').textContent      = battVolt + 'V — ' + battAhDesired + 'Ah';
  document.getElementById('r-battEnergy').textContent   = battUsable.toFixed(0) + ' Wh';
  document.getElementById('r-solar').textContent        = solarWatts + ' W';
  document.getElementById('r-scc').textContent          = sccAmps + ' A';
  document.getElementById('r-cb1').textContent          = cb1 + ' A';
  document.getElementById('r-cb2').textContent          = cb2 + ' A';
  document.getElementById('r-cb3').textContent          = cb3 + ' A';
  document.getElementById('r-cb4').textContent          = cb4 + ' A';
  document.getElementById('r-w1vdi').textContent        = vdi1;
  document.getElementById('r-w1amps').textContent       = imp + ' A (IMP)';
  document.getElementById('r-w1len').textContent        = w1len + ' ft';
  document.getElementById('r-w2vdi').textContent        = vdi2;
  document.getElementById('r-w2amps').textContent       = w2amps + ' A';
  document.getElementById('r-w2len').textContent        = w2len + ' ft';
  document.getElementById('r-w3vdi').textContent        = vdi3.toFixed(2);
  document.getElementById('r-w3amps').textContent       = w3amps.toFixed(2) + ' A';
  document.getElementById('r-w3len').textContent        = w3len + ' ft';

  const sec = document.getElementById('resultsSection');
  sec.style.display = 'block';
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── INIT ────────────────────────────────────── */
DEFAULT_APPLIANCES.forEach(a => addRow(a));
recalcTotals();
updateLossDisplay();
