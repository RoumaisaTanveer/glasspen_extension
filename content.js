document.addEventListener('glasspen-activate', () => {
  if (document.getElementById('glasspen-canvas')) return;

  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  document.head.appendChild(fa);

  const STORAGE_KEY = 'glasspen_paths';
  const NOTES_KEY = 'glasspen_notes';

  function savePaths() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
  }

  function loadPaths() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }

  function clearSavedPaths() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function saveNotes() {
    const notes = [...document.querySelectorAll('.glasspen-note')].map(note => ({
      text: note.querySelector('textarea').value,
      top: note.style.top,
      left: note.style.left,
      color: note.style.backgroundColor
    }));
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function loadNotes() {
    const saved = localStorage.getItem(NOTES_KEY);
    if (!saved) return;
    try {
      const notes = JSON.parse(saved);
      for (const note of notes) createStickyNote(note.top, note.left, note.text, note.color);
    } catch {}
  }

  function createStickyNote(top = '300px', left = '300px', text = '', color = noteColorPicker?.value || '#ffff88') {
    const note = document.createElement('div');
    note.className = 'glasspen-note';
    Object.assign(note.style, {
      position: 'fixed',
      top,
      left,
      width: '200px',
      height: '150px',
      backgroundColor: color,
      border: '1px solid #000',
      padding: '5px',
      zIndex: '1000002',
      resize: 'both',
      overflow: 'auto',
      boxShadow: '2px 2px 6px rgba(0,0,0,0.2)'
    });
    note.style.cursor = 'grab';
    let offsetX, offsetY;
    let dragging = false;

    note.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
      dragging = true;
      note.style.cursor = 'grabbing';
      offsetX = e.clientX - note.offsetLeft;
      offsetY = e.clientY - note.offsetTop;

      function move(e) {
        if (!dragging) return;
        note.style.left = e.clientX - offsetX + 'px';
        note.style.top = e.clientY - offsetY + 'px';
      }

      function stopMove() {
        dragging = false;
        note.style.cursor = 'grab';
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', stopMove);
        saveNotes();
      }

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', stopMove);
    });

    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = 'calc(100% - 25px)';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.background = 'transparent';
    textarea.style.resize = 'none';
    textarea.value = text;
    textarea.oninput = saveNotes;

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-times"></i>';
    Object.assign(delBtn.style, {
      position: 'absolute',
      top: '2px',
      right: '4px',
      background: 'transparent',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer'
    });
    delBtn.onclick = () => {
      note.remove();
      saveNotes();
    };

    note.appendChild(delBtn);
    note.appendChild(textarea);
    document.body.appendChild(note);
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'glasspen-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = `${document.documentElement.scrollWidth}px`;
  canvas.style.height = `${document.documentElement.scrollHeight}px`;
  canvas.style.zIndex = '999999';
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'crosshair';
  document.body.appendChild(canvas);

  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;

  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;
  let currentPath = [];
  let isEraser = false;
  let isHighlight = false;
  let paths = loadPaths();

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const path of paths) {
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.beginPath();
      for (let i = 0; i < path.points.length; i++) {
        const p = path.points[i];
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }
    savePaths();
  }

  function eraseAt(x, y) {
    const threshold = 10;
    for (let i = paths.length - 1; i >= 0; i--) {
      for (const p of paths[i].points) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          paths.splice(i, 1);
          redraw();
          return;
        }
      }
    }
  }

  function start(x, y) {
    drawing = true;
    currentPath = [{ x, y }];
  }

  function draw(x, y) {
    if (!drawing) return;
    if (isEraser) {
      eraseAt(x, y);
      return;
    }

    currentPath.push({ x, y });
    ctx.strokeStyle = isHighlight ? 'rgba(255,255,0,0.4)' : colorPicker.value;
    ctx.lineWidth = isHighlight ? 22 : parseInt(thicknessPicker.value);
    ctx.beginPath();
    const len = currentPath.length;
    if (len < 2) return;
    ctx.moveTo(currentPath[len - 2].x, currentPath[len - 2].y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stop() {
    if (!drawing || isEraser) return;
    if (currentPath.length > 1) {
      paths.push({
        color: isHighlight ? 'rgba(255,255,0,0.4)' : colorPicker.value,
        width: isHighlight ? 22 : parseInt(thicknessPicker.value),
        points: currentPath,
        highlight: isHighlight
      });
      savePaths();
    }
    drawing = false;
  }

  canvas.addEventListener('mousedown', e => start(e.pageX, e.pageY));
  canvas.addEventListener('mousemove', e => draw(e.pageX, e.pageY));
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);

  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    start(touch.pageX, touch.pageY);
  });
  canvas.addEventListener('touchmove', e => {
    const touch = e.touches[0];
    draw(touch.pageX, touch.pageY);
  });
  canvas.addEventListener('touchend', stop);

  const toolbar = document.createElement('div');
  toolbar.id = 'glasspen-toolbar';
  Object.assign(toolbar.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    zIndex: '1000001',
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    fontFamily: 'sans-serif',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
  });
  document.body.appendChild(toolbar);

  function createIconButton(iconHTML, onClick) {
    const btn = document.createElement('button');
    btn.innerHTML = iconHTML;
    Object.assign(btn.style, {
      width: '32px',
      height: '32px',
      fontSize: '16px',
      cursor: 'pointer',
      borderRadius: '6px',
      border: '1px solid #aaa',
      backgroundColor: '#fff'
    });
    btn.onclick = () => {
      onClick();
      [...toolbar.querySelectorAll('button')].forEach(b => b.style.backgroundColor = '#fff');
      btn.style.backgroundColor = '#ddd';
    };
    toolbar.appendChild(btn);
    return btn;
  }

  createIconButton('<i class="fas fa-times"></i>', () => {
    [canvas, toolbar].forEach(el => el.remove());
    document.querySelectorAll('.glasspen-note').forEach(n => n.remove());
  });

  createIconButton('<i class="fas fa-undo"></i>', () => {
    paths.pop();
    redraw();
  });

  const eraserBtn = createIconButton('<i class="fas fa-eraser"></i>', () => {
    isEraser = !isEraser;
    isHighlight = false;
    redraw();
  });

  const highlightBtn = createIconButton('<i class="fas fa-highlighter"></i>', () => {
    isHighlight = !isHighlight;
    isEraser = false;
    redraw();
  });

  createIconButton('<i class="fas fa-trash"></i>', () => {
    paths.length = 0;
    clearSavedPaths();
    redraw();
  });

  createIconButton('<i class="fas fa-sticky-note"></i>', () => {
    createStickyNote();
    saveNotes();
  });

  const penDropdown = document.createElement('div');
  penDropdown.style.display = 'flex';
  penDropdown.style.flexDirection = 'column';
  penDropdown.style.alignItems = 'center';

  const penIcon = document.createElement('button');
  penIcon.innerHTML = '<i class="fas fa-pen"></i>';
  Object.assign(penIcon.style, {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #aaa',
    backgroundColor: '#fff'
  });
  penDropdown.appendChild(penIcon);

  const penOptions = document.createElement('div');
  penOptions.style.display = 'none';
  penOptions.style.position = 'absolute';
  penOptions.style.marginTop = '40px';
  penOptions.style.backgroundColor = '#fff';
  penOptions.style.border = '1px solid #aaa';
  penOptions.style.borderRadius = '6px';
  penOptions.style.padding = '6px';

  colorPicker = document.createElement('select');
  ['red', 'blue', 'green', 'black'].forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    colorPicker.appendChild(option);
  });
  colorPicker.value = 'red';
  penOptions.appendChild(colorPicker);

  thicknessPicker = document.createElement('select');
  [1, 2, 4, 6, 8, 10].forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}px`;
    thicknessPicker.appendChild(option);
  });
  thicknessPicker.value = 2;
  penOptions.appendChild(thicknessPicker);

  penDropdown.appendChild(penOptions);
  toolbar.appendChild(penDropdown);

  penIcon.addEventListener('click', () => {
    penOptions.style.display = penOptions.style.display === 'none' ? 'block' : 'none';
    isHighlight = false;
    isEraser = false;
    [...toolbar.querySelectorAll('button')].forEach(b => b.style.backgroundColor = '#fff');
    penIcon.style.backgroundColor = '#ddd';
  });

  const noteColorPicker = document.createElement('select');
  [['#ffff88', 'Yellow'], ['#ffc0cb', 'Pink'], ['#add8e6', 'Blue'], ['#90ee90', 'Green']].forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    noteColorPicker.appendChild(opt);
  });
  toolbar.appendChild(noteColorPicker);

  redraw();
  loadNotes();
});
