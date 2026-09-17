(() => {
  const STORAGE_KEY = 'yard-spots-demo-v1';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const seed = {
    A02: 'MSCU 742918-3', A05: 'TCLU 983104-2',
    B01: 'CMAU 104582-7', B04: 'TEMU 583204-1', B07: 'FSCU 902117-5',
    C02: 'OOLU 670442-0', C05: 'MEDU 487630-2',
    D01: 'TRHU 718205-6', D03: 'CXDU 614927-4', D06: 'SEGU 125408-9', D08: 'APZU 504128-7'
  };

  const spots = [
    ...Array.from({ length: 8 }, (_, index) => ({ code: `A${String(index + 1).padStart(2, '0')}`, x: 180 + index * 79, y: 121, w: 70, h: 75 })),
    ...Array.from({ length: 7 }, (_, index) => ({ code: `B${String(index + 1).padStart(2, '0')}`, x: 817, y: 230 + index * 45, w: 95, h: 38 })),
    ...Array.from({ length: 7 }, (_, index) => ({ code: `C${String(index + 1).padStart(2, '0')}`, x: 89, y: 230 + index * 45, w: 95, h: 38 })),
    ...Array.from({ length: 8 }, (_, index) => ({ code: `D${String(index + 1).padStart(2, '0')}`, x: index < 4 ? 100 + index * 76 : 602 + (index - 4) * 76, y: 549, w: 70, h: 73 }))
  ];
  const byCode = new Map(spots.map(spot => [spot.code, spot]));
  const els = Object.fromEntries(['spotLayer','totalCount','occupiedCount','freeCount','searchTab','assignTab','searchPane','assignPane','searchForm','searchInput','searchFeedback','assignForm','spotCode','containerInput','assignFeedback','detailPanel','resetButton','exampleSearch','sampleNumber'].map(id => [id, document.getElementById(id)]));
  let assignments = loadAssignments();
  let mode = 'search';
  let selected = null;
  let found = null;

  function normalize(number) { return String(number || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function format(number) { const clean = normalize(number); return clean.length === 11 ? `${clean.slice(0,4)} ${clean.slice(4,10)}-${clean.slice(10)}` : clean; }
  function loadAssignments() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const clean = {};
        for (const [spot, number] of Object.entries(saved)) if (byCode.has(spot) && /^[A-Z]{4}[0-9]{7}$/.test(normalize(number))) clean[spot] = format(number);
        return clean;
      }
    } catch (_) { /* Private browsing can disable storage; the demo stays usable. */ }
    return { ...seed };
  }
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments)); } catch (_) { /* The in-memory demo still works. */ } }
  function svg(name, attrs = {}) { const node = document.createElementNS(SVG_NS, name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; }
  function safe(text) { return String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }
  function setFeedback(element, text, kind = '') { element.textContent = text; element.className = `feedback${kind ? ` ${kind}` : ''}`; }

  function makeSpot(spot) {
    const occupied = !!assignments[spot.code];
    const group = svg('g', { class: `spot ${occupied ? 'occupied' : 'free'}${found === spot.code ? ' found' : ''}${selected === spot.code ? ' selected' : ''}`, tabindex: 0, role: 'button', 'aria-label': `${spot.code} სპოტი, ${occupied ? `დაკავებულია, ${assignments[spot.code]}` : 'თავისუფალია'}`, 'data-code': spot.code });
    group.append(svg('rect', { class: 'focus-ring', x: spot.x - 5, y: spot.y - 5, width: spot.w + 10, height: spot.h + 10, rx: 10 }));
    group.append(svg('rect', { class: 'outer', x: spot.x, y: spot.y, width: spot.w, height: spot.h }));
    group.append(svg('rect', { class: 'ribs', x: spot.x + 7, y: spot.y + 7, width: spot.w - 14, height: spot.h - 14, rx: 2 }));
    const cx = spot.x + spot.w / 2;
    const cy = spot.y + spot.h / 2;
    const code = svg('text', { class: 'spot-code', x: cx, y: cy + (occupied ? -1 : 5) }); code.textContent = spot.code; group.append(code);
    if (occupied) { const number = svg('text', { class: 'spot-number', x: cx, y: cy + 12 }); number.textContent = normalize(assignments[spot.code]).slice(-5); group.append(number); }
    group.addEventListener('click', () => chooseSpot(spot.code));
    group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseSpot(spot.code); } });
    return group;
  }
  function renderMap() { els.spotLayer.replaceChildren(...spots.map(makeSpot)); }
  function renderCounts() { els.totalCount.textContent = spots.length; els.occupiedCount.textContent = Object.keys(assignments).length; els.freeCount.textContent = spots.length - Object.keys(assignments).length; }
  function renderDetail() {
    if (!selected) {
      els.detailPanel.innerHTML = '<div class="detail-placeholder"><span class="detail-glyph" aria-hidden="true">⌖</span><strong>სპოტი ჯერ არ არის არჩეული</strong><p>დააჭირეთ სპოტს რუკაზე ან მოძებნეთ კონტეინერი.</p></div>';
      return;
    }
    const number = assignments[selected];
    els.detailPanel.innerHTML = `<div class="detail-head"><div><span>არჩეული სპოტი</span><strong>${safe(selected)}</strong></div><span class="status-pill${number ? ' occupied' : ''}">${number ? 'დაკავებული' : 'თავისუფალი'}</span></div>${number ? `<p class="detail-container">${safe(number)}</p><p class="detail-small">კონტეინერი დგას ${safe(selected)} სპოტზე</p><button type="button" class="detail-action" id="releaseSpot">გატანის დაფიქსირება ↗</button>` : `<p class="detail-container">ხელმისაწვდომია</p><p class="detail-small">აირჩიეთ განთავსება და შეიყვანეთ ნომერი.</p><button type="button" class="detail-action" id="detailAssign">კონტეინერის განთავსება ↗</button>`}`;
    document.getElementById('releaseSpot')?.addEventListener('click', releaseSpot);
    document.getElementById('detailAssign')?.addEventListener('click', () => { setMode('assign'); els.containerInput.focus(); });
  }
  function render() { renderCounts(); renderMap(); renderDetail(); els.spotCode.value = selected || ''; }

  function setMode(next) {
    mode = next;
    const searching = next === 'search';
    els.searchPane.hidden = !searching; els.assignPane.hidden = searching;
    els.searchTab.classList.toggle('active', searching); els.assignTab.classList.toggle('active', !searching);
    els.searchTab.setAttribute('aria-selected', String(searching)); els.assignTab.setAttribute('aria-selected', String(!searching));
  }
  function chooseSpot(code) {
    selected = code;
    found = null;
    if (!assignments[code] && mode === 'search') setMode('assign');
    if (assignments[code] && mode === 'assign') setFeedback(els.assignFeedback, `${code} დაკავებულია. აირჩიეთ თავისუფალი სპოტი.`, 'error');
    else if (mode === 'assign') setFeedback(els.assignFeedback, `${code} არჩეულია. შეიყვანეთ კონტეინერის ნომერი.`);
    render();
  }
  function showFound(code) {
    selected = code; found = code; setMode('search'); render();
    setFeedback(els.searchFeedback, `ნაპოვნია: ${assignments[code]} დგას ${code} სპოტზე.`, 'success');
    document.querySelector(`[data-code="${code}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  function search(number) {
    const query = normalize(number);
    if (!query) { found = null; setFeedback(els.searchFeedback, 'შეიყვანეთ კონტეინერის ნომერი.', 'error'); render(); return; }
    const code = Object.keys(assignments).find(spot => normalize(assignments[spot]) === query);
    if (code) showFound(code);
    else { found = null; selected = null; render(); setFeedback(els.searchFeedback, 'ამ ნომრით კონტეინერი იარდში ვერ მოიძებნა.', 'error'); }
  }
  function assign(event) {
    event.preventDefault();
    const code = selected;
    const number = normalize(els.containerInput.value);
    if (!code) { setFeedback(els.assignFeedback, 'ჯერ რუკაზე აირჩიეთ თავისუფალი სპოტი.', 'error'); return; }
    if (assignments[code]) { setFeedback(els.assignFeedback, `${code} უკვე დაკავებულია.`, 'error'); return; }
    if (!/^[A-Z]{4}[0-9]{7}$/.test(number)) { setFeedback(els.assignFeedback, 'გამოიყენეთ ფორმატი: 4 ასო და 7 ციფრი (მაგ. TEMU 583204-1).', 'error'); return; }
    if (Object.values(assignments).some(value => normalize(value) === number)) { setFeedback(els.assignFeedback, 'ეს კონტეინერი უკვე სხვა სპოტზეა განთავსებული.', 'error'); return; }
    assignments[code] = format(number); persist(); els.containerInput.value = ''; found = code; render();
    setFeedback(els.assignFeedback, `${format(number)} წარმატებით განთავსდა ${code} სპოტზე.`, 'success');
  }
  function releaseSpot() {
    if (!selected || !assignments[selected]) return;
    const code = selected;
    if (!window.confirm(`${assignments[code]} გატანილია ${code} სპოტიდან?`)) return;
    delete assignments[code]; found = null; persist(); render();
    setFeedback(els.assignFeedback, `${code} სპოტი კვლავ თავისუფალია.`, 'success');
    setFeedback(els.searchFeedback, 'გატანა დაფიქსირდა. მოძებნეთ სხვა კონტეინერი.', 'success');
  }
  function resetDemo() {
    if (!window.confirm('აღვადგინოთ საწყისი სატესტო მონაცემები? თქვენ მიერ შეტანილი ცვლილებები ამ ბრაუზერში წაიშლება.')) return;
    assignments = { ...seed }; selected = null; found = null; persist(); els.searchInput.value = ''; els.containerInput.value = ''; render(); setMode('search');
    setFeedback(els.searchFeedback, 'სატესტო მონაცემები აღდგენილია.', 'success');
  }
  els.searchTab.addEventListener('click', () => setMode('search'));
  els.assignTab.addEventListener('click', () => setMode('assign'));
  els.searchForm.addEventListener('submit', event => { event.preventDefault(); search(els.searchInput.value); });
  els.assignForm.addEventListener('submit', assign);
  els.resetButton.addEventListener('click', resetDemo);
  for (const button of [els.exampleSearch, els.sampleNumber]) button.addEventListener('click', () => { els.searchInput.value = 'MSCU 742918-3'; search(els.searchInput.value); });
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { assignments = loadAssignments(); if (selected && !byCode.has(selected)) selected = null; render(); } });
  render();
})();
