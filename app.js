(() => {
  const STORAGE_KEY = 'yard-spots-demo-v5';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const inventory = `
MSMU7709524 MSMU6398201 TCNU3278686 CAIU9867123 CAIU7758890 MSCU5416358
TGBU5568529 CAIU7763156 MSNU5078819 MSNU9302151 MSNU7473638 MSDU5877374
MSNU7355506 MSNU7180476 MEDU4452906 TGBU9879088 MRKU5054214 GAOU7716744
MRSU6119272 TCLU9408455 FFAU7102769 UETU8538761 MSNU5490359 MSDU7015569
MSNU8073641 MSDU5374343 MSBU5344824 TCKU6416064 TCNU1614040 MSDU5829890
MRKU2132313 MRSU7905770 CAAU4724852 TCKU6888538 SELU4035650 HAMU3669822
CAIU7172390 HAMU3527010 FFAU2345637 MRKU6442868 MSKU1829199 FANU3482520
SEGU5617083 MSNU5302889 MRSU8928738 MSBU5068407 HAMU3773740 HAMU4124196
MRSU2823684 HAMU4881414 MEDU7211081 FFAU8347832
  `.trim().split(/\s+/);
  const seed = {
    A07: 'MSMU 770952-4', A08: 'MSMU 639820-1',
    B01: 'TCNU 327868-6', B03: 'CAIU 986712-3',
    C02: 'CAIU 775889-0', D03: 'MSCU 541635-8',
    E01: 'TGBU 556852-9', E03: 'CAIU 776315-6',
    F04: 'MSNU 507881-9', F06: 'MSNU 930215-1'
  };

  // Every door edge follows its nearby straight yard edge. The long axis is its
  // inward normal, so containers in one row stay parallel and leave the aisle open.
  function edgeRow(prefix, start, end, count, centerFraction, length, width, setback, side) {
    const dx = end[0] - start[0], dy = end[1] - start[1], edgeLength = Math.hypot(dx, dy);
    const tangent = [dx / edgeLength, dy / edgeLength];
    const normal = [-tangent[1] * side, tangent[0] * side];
    return Array.from({ length: count }, (_, index) => {
      // Leave a gap equal to 20% of the container width between neighboring spots.
      const pitch = width * 1.2;
      const fraction = centerFraction + (index - (count - 1) / 2) * pitch / edgeLength;
      const door = [start[0] + dx * fraction + normal[0] * setback, start[1] + dy * fraction + normal[1] * setback];
      const half = width / 2;
      const corners = [
        [door[0] - tangent[0] * half, door[1] - tangent[1] * half],
        [door[0] + tangent[0] * half, door[1] + tangent[1] * half],
        [door[0] + tangent[0] * half + normal[0] * length, door[1] + tangent[1] * half + normal[1] * length],
        [door[0] - tangent[0] * half + normal[0] * length, door[1] - tangent[1] * half + normal[1] * length]
      ];
      return { code: `${prefix}${String(index + 1).padStart(2, '0')}`, corners, center: [door[0] + normal[0] * length / 2, door[1] + normal[1] * length / 2], tangent, normal, width, length };
    });
  }
  function extendedRow(prefix, start, end, oldCount, oldCenter, addedAbove, addedBelow, length, width, setback, side) {
    const edgeLength = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const center = oldCenter + (addedBelow - addedAbove) * width * 1.2 / (2 * edgeLength);
    return edgeRow(prefix, start, end, oldCount + addedAbove + addedBelow, center, length, width, setback, side);
  }
  // The top boundary is one straight edge. Preserve A/B numbering while keeping
  // the first six A and final five B footprints clear of the two access points.
  const topSpots = edgeRow('T', [368, 27], [895, 171], 18, .5, 137.5, 23.4, 28, 1)
    .map((spot, index) => ({ ...spot, code: index < 8 ? `A${String(index + 1).padStart(2, '0')}` : `B${String(index - 7).padStart(2, '0')}` }))
    .filter(spot => (spot.code.startsWith('A') && Number(spot.code.slice(1)) >= 7) || (spot.code.startsWith('B') && Number(spot.code.slice(1)) <= 5));
  const spots = [
    ...topSpots,
    ...edgeRow('C', [285, 278], [141, 558], 10, .455, 123.2, 23.4, 17, -1),
    ...extendedRow('D', [895, 171], [681, 764], 10, .6, 1, 5, 126.5, 23.4, 20, 1),
    ...edgeRow('E', [381, 691], [160, 1380], 10, .43, 123.2, 24.6, 18, -1),
    ...extendedRow('F', [808, 891], [604, 1498], 10, .331, 2, 3, 123.2, 24.6, 18, 1)
  ];
  const byCode = new Map(spots.map(spot => [spot.code, spot]));
  const els = Object.fromEntries(['spotLayer','totalCount','occupiedCount','freeCount','searchTab','assignTab','searchPane','assignPane','searchForm','searchInput','searchFeedback','assignForm','spotCode','containerInput','assignFeedback','detailPanel','resetButton','exampleSearch','sampleNumber','mapWrap','zoomOut','zoomIn'].map(id => [id, document.getElementById(id)]));
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
    const title = svg('title'); title.textContent = occupied ? `${spot.code} · ${assignments[spot.code]}` : `${spot.code} · თავისუფალი`; group.append(title);
    const points = spot.corners.map(point => point.map(value => value.toFixed(1)).join(',')).join(' ');
    group.append(svg('polygon', { class: 'hit-area', points }));
    group.append(svg('polygon', { class: 'focus-ring', points }));
    group.append(svg('polygon', { class: 'outer', points }));
    const door = spot.corners;
    group.append(svg('line', { class: 'door-edge', x1: door[0][0], y1: door[0][1], x2: door[1][0], y2: door[1][1] }));
    const cx = spot.center[0], cy = spot.center[1];
    let angle = Math.atan2(spot.normal[1], spot.normal[0]) * 180 / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    const code = svg('text', { class: 'spot-code', x: cx, y: cy, 'dominant-baseline': 'central', transform: `rotate(${angle.toFixed(1)} ${cx} ${cy})` }); code.textContent = spot.code; group.append(code);
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
    else { found = null; selected = null; render(); setFeedback(els.searchFeedback, inventory.includes(query) ? 'ეს ნომერი მოწოდებულ სიაშია, მაგრამ დემო რუკაზე სპოტი ჯერ არ მინიჭებია.' : 'ამ ნომრით კონტეინერი იარდში ვერ მოიძებნა.', 'error'); }
  }
  function assign(event) {
    event.preventDefault();
    const code = selected;
    const number = normalize(els.containerInput.value);
    if (!code) { setFeedback(els.assignFeedback, 'ჯერ რუკაზე აირჩიეთ თავისუფალი სპოტი.', 'error'); return; }
    if (assignments[code]) { setFeedback(els.assignFeedback, `${code} უკვე დაკავებულია.`, 'error'); return; }
    if (!/^[A-Z]{4}[0-9]{7}$/.test(number)) { setFeedback(els.assignFeedback, 'გამოიყენეთ ფორმატი: 4 ასო და 7 ციფრი (მაგ. TCNU 327868-6).', 'error'); return; }
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
  let zoomLevel = 0;
  function setZoom(next) {
    const x = (els.mapWrap.scrollLeft + els.mapWrap.clientWidth / 2) / els.mapWrap.scrollWidth;
    const y = (els.mapWrap.scrollTop + els.mapWrap.clientHeight / 2) / els.mapWrap.scrollHeight;
    zoomLevel = Math.max(0, Math.min(3, next));
    els.mapWrap.dataset.zoom = String(zoomLevel);
    els.zoomOut.disabled = zoomLevel === 0;
    els.zoomIn.disabled = zoomLevel === 3;
    els.mapWrap.scrollLeft = x * els.mapWrap.scrollWidth - els.mapWrap.clientWidth / 2;
    els.mapWrap.scrollTop = y * els.mapWrap.scrollHeight - els.mapWrap.clientHeight / 2;
  }
  els.searchTab.addEventListener('click', () => setMode('search'));
  els.assignTab.addEventListener('click', () => setMode('assign'));
  els.searchForm.addEventListener('submit', event => { event.preventDefault(); search(els.searchInput.value); });
  els.assignForm.addEventListener('submit', assign);
  els.resetButton.addEventListener('click', resetDemo);
  els.zoomOut.addEventListener('click', () => setZoom(zoomLevel - 1));
  els.zoomIn.addEventListener('click', () => setZoom(zoomLevel + 1));
  for (const number of inventory) { const option = document.createElement('option'); option.value = format(number); document.getElementById('containerOptions').append(option); }
  for (const button of [els.exampleSearch, els.sampleNumber]) button.addEventListener('click', () => { els.searchInput.value = 'MSMU 770952-4'; search(els.searchInput.value); });
  document.querySelectorAll('[data-zone]').forEach(button => button.addEventListener('click', () => document.querySelector(`[data-code^="${button.dataset.zone}"]`)?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })));
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { assignments = loadAssignments(); if (selected && !byCode.has(selected)) selected = null; render(); } });
  render();
  if (window.innerWidth < 611) els.mapWrap.scrollLeft = (els.mapWrap.scrollWidth - els.mapWrap.clientWidth) / 2;
})();
