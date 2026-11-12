// DOM overlay: the opening scroll, side panel, hover tip, legend, toolbar, tour caption, 81-难 sheet.
export function createUI({ categories, onPrev, onNext, onHome, onTour, onNan, onNight, onSound }) {
  const $ = (s) => document.querySelector(s);
  const intro = $('#intro'), enter = $('#enter'), bar = $('#intro .bar i');
  const panel = $('#panel'), tip = $('#tip'), caption = $('#caption'), tourbar = $('#tourbar');
  const nan = $('#nan');

  $('#legend').innerHTML = categories.map((c) => `<span><i style="background:${c.color}"></i>${c.name}</span>`).join('');
  $('#prev').onclick = onPrev;
  $('#next').onclick = onNext;
  $('#home').onclick = onHome;
  $('#brand').onclick = onHome;
  $('#t-tour').onclick = onTour;
  $('#tour-stop').onclick = onTour;
  $('#t-nan').onclick = onNan;
  $('#nan-close').onclick = onNan;
  nan.addEventListener('click', (e) => { if (e.target === nan) onNan(); });
  $('#t-night').onclick = onNight;
  $('#t-sound').onclick = onSound;

  let enterCb = null;
  enter.onclick = () => {
    intro.classList.add('gone');
    document.body.classList.add('entered');
    enterCb?.();
  };
  let capTimer = null;

  return {
    progress(p) {
      bar.style.width = `${Math.round(p * 100)}%`;
      if (p >= 1) { enter.disabled = false; enter.textContent = '展 卷'; }
    },
    onEnter(cb) { enterCb = cb; },
    show(s, cat, built, nans = []) {
      panel.querySelector('.idx').textContent = `${s.index + 1} / 45`;
      panel.querySelector('.cat').innerHTML = `<i style="background:${cat.color}"></i>${cat.long}`;
      panel.querySelector('.name').textContent = s.name;
      panel.querySelector('.hui').textContent = s.title;
      const q = panel.querySelector('.quote');
      q.textContent = s.quote; q.hidden = !s.quote;
      panel.querySelector('.note').textContent = s.note;
      panel.querySelector('.nans').innerHTML = nans.length ? `<b>本站诸难</b>` + nans.map((x) => `第${x.n}难 ${x.name}`).join('　') : '';
      panel.classList.toggle('draft', !built);
      panel.classList.add('open');
    },
    hide() { panel.classList.remove('open'); },
    tip(html, x, y) {
      if (!html) { tip.style.opacity = 0; return; }
      tip.innerHTML = html;
      tip.style.opacity = 1;
      tip.style.transform = `translate(${x + 14}px, ${y + 12}px)`;
    },
    // tour
    caption(hui, text, ms = 6000) {
      clearTimeout(capTimer);
      caption.querySelector('.hui').textContent = hui || '';
      caption.querySelector('p').textContent = text || '';
      caption.classList.toggle('show', !!text);
      if (text) capTimer = setTimeout(() => caption.classList.remove('show'), ms);
    },
    touring(on, i = 0, n = 45, name = '') {
      document.body.classList.toggle('touring', on);
      $('#t-tour').classList.toggle('on', on);
      tourbar.querySelector('i').style.setProperty('--p', `${((i + 1) / n) * 100}%`);
      tourbar.querySelector('span').textContent = on ? `${i + 1} / ${n}　${name}` : '';
      if (!on) this.caption(null, null);
    },
    // 81 难
    buildNan(list, sceneOf, catColor, onPick) {
      const grid = nan.querySelector('.grid');
      grid.innerHTML = '';
      for (const x of list) {
        const s = x.scene ? sceneOf(x.scene) : null;
        const c = document.createElement('button');
        c.className = 'cell' + (s ? '' : ' none');
        c.style.setProperty('--c', s ? catColor(s) : '#c9c1b3');
        c.innerHTML = `<span class="n">第${x.n}难</span><span class="nm">${x.name}${x.note ? '*' : ''}</span><span class="sc">${s ? s.name : '—'}</span>`;
        if (x.note) c.title = x.note;
        c.dataset.scene = x.scene || '';
        if (s) c.onclick = () => onPick(s.index);
        grid.appendChild(c);
      }
    },
    nanOpen(open, sceneId = null) {
      nan.classList.toggle('open', open);
      $('#t-nan').classList.toggle('on', open);
      nan.querySelectorAll('.cell').forEach((c) => c.classList.toggle('here', !!sceneId && c.dataset.scene === sceneId));
    },
    get nanIsOpen() { return nan.classList.contains('open'); },
    setNight(on) { document.body.classList.toggle('night', on); $('#t-night').classList.toggle('on', on); $('#t-night').textContent = on ? '昼' : '夜'; },
    setSound(on) { $('#t-sound').classList.toggle('on', on); },
  };
}
