document.addEventListener('glasspen-activate', () => {
  if (document.getElementById('glasspen-canvas')) return;

  // FontAwesome for icons
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  document.head.appendChild(fa);

 const PAGE_ID = location.pathname + location.search; // or use location.href for full uniqueness
const STORAGE_KEY = 'glasspen_paths_' + PAGE_ID;
const NOTES_KEY = 'glasspen_notes_' + PAGE_ID;


  function savePaths() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
  }
  function loadPaths() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
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

  // --- Canvas ---
  const canvas = document.createElement('canvas');
  canvas.id = 'glasspen-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = `${document.documentElement.scrollWidth}px`;
  canvas.style.height = `${document.documentElement.scrollHeight}px`;
  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
  canvas.style.zIndex = '999999';
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'crosshair';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;
  let currentPath = [];
  let isEraser = false;
  let isHighlight = false;
  let paths = loadPaths();

  // --- TOOL STATE ---
  let currentPenColor = 'red';
  let currentPenThickness = 2;
  let currentHighlightColor = 'rgba(255,255,0,0.4)';
  let currentHighlightThickness = 22;
  let currentNoteColor = '#ffff88';

function createStickyNote(top, left, text = '', color = currentNoteColor) {
  if (!top || !left) {
    const noteWidth = 220, noteHeight = 160, padding = 40;
    const maxLeft = window.innerWidth - noteWidth - padding;
    const maxTop = window.innerHeight - noteHeight - padding;
    left = Math.floor(Math.random() * maxLeft) + padding + 'px';
    top = Math.floor(Math.random() * maxTop) + padding + 'px';
  }

  const note = document.createElement('div');
  note.className = 'glasspen-note';
  Object.assign(note.style, {
    position: 'fixed',
    top,
    left,
    width: '220px',
    height: '160px',
    backgroundColor: color,
    borderRadius: '12px',
    border: '1px solid #ccc',
    padding: '10px',
    zIndex: '1000002',
    resize: 'both',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'fixed',
    transition: 'box-shadow 0.2s ease',
  });
  
  
  // --- Dragging ---
  let offsetX, offsetY, dragging = false;
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

  // --- Header with Buttons ---
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });

  const btnStyle = {
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555'
  };

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="fa fa-eye-slash"></i>';
  Object.assign(closeBtn.style, btnStyle);
  closeBtn.title = 'Hide note';
  closeBtn.onclick = () => {
    note.style.display = 'none';
  };

  const delBtn = document.createElement('button');
  delBtn.innerHTML = '<i class="fa fa-trash"></i>';
  Object.assign(delBtn.style, btnStyle);
  delBtn.title = 'Delete note';
  delBtn.onclick = () => {
    note.remove();
    saveNotes();
  };

  header.appendChild(closeBtn);
  header.appendChild(delBtn);

  // --- Text Area ---
  const textarea = document.createElement('textarea');
  Object.assign(textarea.style, {
    flex: '1',
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    resize: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
  });
  textarea.value = text;
  textarea.addEventListener('input', () => {
    clearTimeout(note._timeout);
    note._timeout = setTimeout(saveNotes, 500);
  });

  note.appendChild(header);
  note.appendChild(textarea);
  document.body.appendChild(note);
}

  function showGlasspenPopup(text, label = 'AI Response') {
    const popup = document.createElement('div');
    Object.assign(popup.style, {
      position: 'fixed',
      top: '80px',
      right: '20px',
      maxWidth: '360px',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '12px 16px 16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      zIndex: '1000003',
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#333',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.5'
    });

    const heading = document.createElement('div');
    heading.textContent = label;
    heading.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 15px; color: #444;';
    popup.appendChild(heading);

    const content = document.createElement('div');
    content.textContent = text;
    popup.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '6px',
      right: '10px',
      background: 'transparent',
      border: 'none',
      fontSize: '14px',
      cursor: 'pointer',
      color: '#666'
    });
    closeBtn.onclick = () => popup.remove();

    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
  }

  // --- Drawing Logic ---
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const path of paths) {
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.beginPath();
      for (let i = 0; i < path.points.length; i++) {
        const p = path.points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    savePaths();
  }
  function eraseAt(x, y) {
    const threshold = 10;
    for (let i = paths.length - 1; i >= 0; i--) {
      for (const p of paths[i].points) {
        const dx = p.x - x, dy = p.y - y;
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
    if (isEraser) return eraseAt(x, y);
    currentPath.push({ x, y });
    ctx.strokeStyle = isHighlight ? currentHighlightColor : currentPenColor;
    ctx.lineWidth = isHighlight ? currentHighlightThickness : currentPenThickness;
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
        color: isHighlight ? currentHighlightColor : currentPenColor,
        width: isHighlight ? currentHighlightThickness : currentPenThickness,
        points: currentPath,
        highlight: isHighlight
      });
      savePaths();
    }
    drawing = false;
  }

  function getPageCoords(e) {
    if (e.touches && e.touches.length) {
      return {
        x: e.touches[0].pageX,
        y: e.touches[0].pageY
      };
    }
    return {
      x: e.pageX,
      y: e.pageY
    };
  }

  // Drawing event listeners (enabled only when drawing mode is ON)
  function enableCanvasEvents() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onMouseUp);
  }
  function disableCanvasEvents() {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onMouseUp);
  }
  function onMouseDown(e) {
    const { x, y } = getPageCoords(e);
    start(x, y);
  }
  function onMouseMove(e) {
    const { x, y } = getPageCoords(e);
    draw(x, y);
  }
  function onMouseUp(e) {
    stop();
  }
  function onTouchStart(e) {
    const { x, y } = getPageCoords(e);
    start(x, y);
  }
  function onTouchMove(e) {
    const { x, y } = getPageCoords(e);
    draw(x, y);
  }

  // --- Toolbar ---
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

  // Toolbar positioning
  const padding = 20;
  requestAnimationFrame(() => {
    const toolbarWidth = toolbar.offsetWidth;
    const toolbarHeight = toolbar.offsetHeight;
    let initialLeft = window.innerWidth - toolbarWidth - padding;
    let initialTop = padding;
    initialLeft = Math.max(padding, Math.min(initialLeft, window.innerWidth - toolbarWidth - padding));
    initialTop = Math.max(padding, Math.min(initialTop, window.innerHeight - toolbarHeight - padding));
    toolbar.style.left = initialLeft + 'px';
    toolbar.style.top = initialTop + 'px';
    toolbar.style.right = 'auto';
    toolbar.style.position = 'fixed';
    toolbar.style.cursor = 'move';
  });

  let isDraggingToolbar = false;
  let dragStartX = 0, dragStartY = 0;
  let toolbarStartLeft = 0, toolbarStartTop = 0;

  toolbar.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    isDraggingToolbar = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    toolbarStartLeft = parseInt(toolbar.style.left, 10);
    toolbarStartTop = parseInt(toolbar.style.top, 10);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDraggingToolbar) return;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const newLeft = Math.max(padding, Math.min(toolbarStartLeft + deltaX, window.innerWidth - toolbar.offsetWidth - padding));
    const newTop = Math.max(padding, Math.min(toolbarStartTop + deltaY, window.innerHeight - toolbar.offsetHeight - padding));
    toolbar.style.left = newLeft + 'px';
    toolbar.style.top = newTop + 'px';
  });
  document.addEventListener('mouseup', () => {
    isDraggingToolbar = false;
  });

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

  // --- DRAW TOGGLE BUTTON ---
// --- DRAW TOGGLE BUTTON (chrome://extensions/ style) ---
let drawingEnabled = true;

// Toggle container
const toggleContainer = document.createElement('div');
toggleContainer.style.display = 'flex';
toggleContainer.style.alignItems = 'center';
toggleContainer.style.gap = '6px';

// Label
const toggleLabel = document.createElement('span');
toggleLabel.textContent = '';
toggleLabel.style.fontSize = '14px';
toggleLabel.style.fontFamily = 'sans-serif';
toggleLabel.style.userSelect = 'none';
toggleContainer.appendChild(toggleLabel);

// Toggle switch
const toggleSwitch = document.createElement('label');
toggleSwitch.style.position = 'relative';
toggleSwitch.style.display = 'inline-block';
toggleSwitch.style.width = '44px';
toggleSwitch.style.height = '24px';
toggleSwitch.style.cursor = 'pointer';

const toggleInput = document.createElement('input');
toggleInput.type = 'checkbox';
toggleInput.checked = drawingEnabled;
toggleInput.style.opacity = '0';
toggleInput.style.width = '0';
toggleInput.style.height = '0';

const slider = document.createElement('span');
slider.style.position = 'absolute';
slider.style.top = '0';
slider.style.left = '0';
slider.style.right = '0';
slider.style.bottom = '0';
slider.style.background = drawingEnabled ? '#4285f4' : '#ccc';
slider.style.borderRadius = '24px';
slider.style.transition = 'background 0.2s';
slider.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10) inset';

// The circle
const sliderCircle = document.createElement('span');
sliderCircle.style.position = 'absolute';
sliderCircle.style.height = '20px';
sliderCircle.style.width = '20px';
sliderCircle.style.left = drawingEnabled ? '22px' : '2px';
sliderCircle.style.top = '2px';
sliderCircle.style.background = '#fff';
sliderCircle.style.borderRadius = '50%';
sliderCircle.style.transition = 'left 0.2s';
sliderCircle.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)';

slider.appendChild(sliderCircle);
toggleSwitch.appendChild(toggleInput);
toggleSwitch.appendChild(slider);
toggleContainer.appendChild(toggleSwitch);
toolbar.appendChild(toggleContainer);

function updateDrawingMode() {
  if (drawingEnabled) {
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'crosshair';
    slider.style.background = '#4285f4';
    sliderCircle.style.left = '22px';
    enableCanvasEvents();
  } else {
    canvas.style.pointerEvents = 'none';
    canvas.style.cursor = 'default';
    slider.style.background = '#ccc';
    sliderCircle.style.left = '2px';
    disableCanvasEvents();
  }
}

toggleInput.onchange = () => {
  drawingEnabled = toggleInput.checked;
  updateDrawingMode();
};
updateDrawingMode();


  // --- Pen Tool ---
  const penDropdown = document.createElement('div');
  penDropdown.style.cssText = 'display:flex; flex-direction:column; align-items:center; position:relative;';
  const penIcon = document.createElement('button');
  penIcon.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/1250/1250615.png" alt="Pen" style="width:20px; height:20px;">`;
  Object.assign(penIcon.style, {
    width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #aaa', backgroundColor: '#fff'
  });
  const penOptions = document.createElement('div');
  penOptions.style.cssText = 'display:none; position:absolute; margin-top:40px; background:#fff; border:1px solid #aaa; border-radius:6px; padding:10px; gap:8px; flex-direction:column;';
  const penColors = ['red', 'blue', 'green', 'black', 'purple', 'orange'];
  const penColorRow = document.createElement('div');
  penColorRow.style.display = 'flex';
  penColors.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.style.cssText = `width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #ccc; margin-right:4px;`;
    colorBtn.onclick = () => {
      currentPenColor = color;
      penOptions.style.display = 'none';
    };
    penColorRow.appendChild(colorBtn);
  });
  penOptions.appendChild(penColorRow);
  const penSliderLabel = document.createElement('label');
  penSliderLabel.textContent = 'Thickness';
  penSliderLabel.style.fontSize = '12px';
  penSliderLabel.style.marginTop = '4px';
  const penSlider = document.createElement('input');
  penSlider.type = 'range';
  penSlider.min = '1';
  penSlider.max = '10';
  penSlider.value = currentPenThickness;
  penSlider.style.width = '100px';
  penSlider.oninput = () => {
    currentPenThickness = parseInt(penSlider.value);
  };
  penOptions.appendChild(penSliderLabel);
  penOptions.appendChild(penSlider);
  penDropdown.append(penIcon, penOptions);
  toolbar.appendChild(penDropdown);
  penIcon.addEventListener('click', () => {
    penOptions.style.display = penOptions.style.display === 'none' ? 'flex' : 'none';
    highlightOptions.style.display = 'none';
    noteColorOptions.style.display = 'none';
    isHighlight = false;
    isEraser = false;
  });

  // --- Highlighter Tool ---
  const highlightDropdown = document.createElement('div');
  highlightDropdown.style.cssText = 'display:flex; flex-direction:column; align-items:center; position:relative;';
  const highlightIcon = document.createElement('button');
  highlightIcon.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/1164/1164631.png" alt="Highlighter" style="width:20px; height:20px;">`;
  Object.assign(highlightIcon.style, {
    width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #aaa', backgroundColor: '#fff'
  });
  const highlightOptions = document.createElement('div');
  highlightOptions.style.cssText = 'display:none; position:absolute; margin-top:40px; background:#fff; border:1px solid #aaa; border-radius:6px; padding:10px; gap:8px; flex-direction:column;';
  const highlightColors = [
    'rgba(255,255,0,0.4)', 'rgba(0,255,255,0.4)', 'rgba(255,0,255,0.4)', 'rgba(255,165,0,0.4)', 'rgba(0,255,0,0.4)'
  ];
  const highlightColorRow = document.createElement('div');
  highlightColorRow.style.display = 'flex';
  highlightColors.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.style.cssText = `width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #ccc; margin-right:4px;`;
    colorBtn.onclick = () => {
      currentHighlightColor = color;
      highlightOptions.style.display = 'none';
    };
    highlightColorRow.appendChild(colorBtn);
  });
  highlightOptions.appendChild(highlightColorRow);
  const highlightSliderLabel = document.createElement('label');
  highlightSliderLabel.textContent = 'Thickness';
  highlightSliderLabel.style.fontSize = '12px';
  highlightSliderLabel.style.marginTop = '4px';
  const highlightSlider = document.createElement('input');
  highlightSlider.type = 'range';
  highlightSlider.min = '10';
  highlightSlider.max = '30';
  highlightSlider.value = currentHighlightThickness;
  highlightSlider.style.width = '100px';
  highlightSlider.oninput = () => {
    currentHighlightThickness = parseInt(highlightSlider.value);
  };
  highlightOptions.appendChild(highlightSliderLabel);
  highlightOptions.appendChild(highlightSlider);
  highlightDropdown.append(highlightIcon, highlightOptions);
  toolbar.appendChild(highlightDropdown);
  highlightIcon.addEventListener('click', () => {
    highlightOptions.style.display = highlightOptions.style.display === 'none' ? 'flex' : 'none';
    penOptions.style.display = 'none';
    noteColorOptions.style.display = 'none';
    isHighlight = true;
    isEraser = false;
  });

  // --- Sticky Note Tool ---
  const noteDropdown = document.createElement('div');
  noteDropdown.style.cssText = 'display:flex; flex-direction:column; align-items:center; position:relative;';
  const stickyNoteBtn = document.createElement('button');
  stickyNoteBtn.innerHTML = '<i class="fas fa-sticky-note"></i>';
  Object.assign(stickyNoteBtn.style, {
    width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #aaa', backgroundColor: '#fff'
  });
  const noteColorOptions = document.createElement('div');
  noteColorOptions.style.cssText = 'display:none; position:absolute; margin-top:40px; background:#fff; border:1px solid #aaa; border-radius:6px; padding:10px; gap:8px; flex-direction:row;';
  const noteColors = [
    ['#ffff88', 'Yellow'],
    ['#ffc0cb', 'Pink'],
    ['#add8e6', 'Blue'],
    ['#90ee90', 'Green'],
    ['#fff', 'White']
  ];
  noteColors.forEach(([color, label]) => {
    const colorBtn = document.createElement('button');
    colorBtn.title = label;
    colorBtn.style.cssText = `width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #ccc; margin-right:4px;`;
    colorBtn.onclick = () => {
      currentNoteColor = color;
      noteColorOptions.style.display = 'none';
      createStickyNote(undefined, undefined, '', currentNoteColor);
      saveNotes();
    };
    noteColorOptions.appendChild(colorBtn);
  });
  noteDropdown.append(stickyNoteBtn, noteColorOptions);
  toolbar.appendChild(noteDropdown);
  stickyNoteBtn.addEventListener('click', () => {
    noteColorOptions.style.display = noteColorOptions.style.display === 'none' ? 'flex' : 'none';
    penOptions.style.display = 'none';
    highlightOptions.style.display = 'none';
  });
// Example icon HTML for Notes List (you can replace with any SVG or icon)

  // --- Summarize Tool ---
  const summarizeBtn = document.createElement('button');
  summarizeBtn.innerHTML = `<i class="fas fa-scroll"></i>`;
  summarizeBtn.title = 'Summarize Selected Text';
  Object.assign(summarizeBtn.style, {
    width: '32px',
    height: '32px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: '1px solid #aaa',
    backgroundColor: '#fff'
  });

  summarizeBtn.addEventListener('click', async () => {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      alert('Please select some text to summarize.');
      return;
    }
    summarizeBtn.disabled = true;
    summarizeBtn.innerHTML = `<i class="fa fa-magic fa-spin"></i> Summarizing...`;
    try {
      const response = await fetch('http://localhost:3000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText })
      });
      const data = await response.json();
      const summary = data.summary || 'No summary returned.';
      showGlasspenPopup(summary, 'Summary');
    } catch (err) {
      console.error('Error summarizing:', err);
      alert('Something went wrong while summarizing.');
    } finally {
      summarizeBtn.disabled = false;
      summarizeBtn.innerHTML = `<i class="fas fa-scroll"></i>`;
    }
  });
  toolbar.appendChild(summarizeBtn);

  // --- Explain Tool ---
  const explainBtn = document.createElement('button');
  explainBtn.innerHTML = `<i class="fas fa-magic"></i>`;
  explainBtn.title = 'Explain Selected Text';
  Object.assign(explainBtn.style, {
    width: '32px',
    height: '32px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: '1px solid #aaa',
    backgroundColor: '#fff'
  });

  explainBtn.addEventListener('click', async () => {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      alert('Please select some text to explain.');
      return;
    }
    explainBtn.disabled = true;
    explainBtn.innerHTML = `<i class="fa fa-magic fa-spin"></i> Explaining...`;
    try {
      const response = await fetch('http://localhost:3000/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Explain this: " + selectedText })
      });
      const data = await response.json();
      const explanation = data.summary || 'No explanation returned.';
      showGlasspenPopup(explanation, 'Explanation');
    } catch (err) {
      console.error('Error explaining:', err);
      alert('Something went wrong while explaining.');
    } finally {
      explainBtn.disabled = false;
      explainBtn.innerHTML = `<i class="fas fa-magic"></i>`;
    }
  });
  toolbar.appendChild(explainBtn);
  // --- Create container div to hold textarea ---
// --- Constants ---
const TEXTBOXES_STORAGE_KEY = STORAGE_KEY + '_transparent_textboxes'; // STORAGE_KEY should be defined in your code

// --- Container for all text boxes ---
const textBoxesParent = document.createElement('div');
document.body.appendChild(textBoxesParent);

// --- Load saved text boxes data ---
let textBoxesData = JSON.parse(localStorage.getItem(TEXTBOXES_STORAGE_KEY)) || [];

// --- Function to save all text boxes data ---
function saveAllTextBoxes() {
  const data = [];
  textBoxesParent.childNodes.forEach(container => {
    const textarea = container.querySelector('textarea');
    data.push({
      id: container._id,
      content: textarea.value,
      left: container.style.left,
      top: container.style.top,
      width: container.style.width,
      height: container.style.height,
    });
  });
  localStorage.setItem(TEXTBOXES_STORAGE_KEY, JSON.stringify(data));
}

// --- Function to create a new text box ---
function createTextBox(id, content = '', left = 100, top = 100, width = '320px', height = '220px') {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'absolute',
    top: top,
    left: left,
    width: width,
    height: height,
    maxWidth: '80vw',
    maxHeight: '60vh',
    zIndex: 1000000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'auto',
    fontFamily: 'Arial, sans-serif',
    resize: 'both',
    boxSizing: 'border-box',
    padding: '12px',
    cursor: 'grab',
    userSelect: 'none',
  });

  const textarea = document.createElement('textarea');
  Object.assign(textarea.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    resize: 'none',
    padding: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    color: '#000',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    userSelect: 'text',
    cursor: 'text',
    overflowY: 'auto',
    overflowX: 'hidden',
  });
  textarea.value = content;
  container.appendChild(textarea);
  textBoxesParent.appendChild(container);

  container._id = id;

  // --- Dragging logic ---
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function isOnResizeHandle(e) {
    const rect = container.getBoundingClientRect();
    const resizeHandleSize = 16; // px from bottom-right corner
    return (
      e.clientX >= rect.right - resizeHandleSize &&
      e.clientY >= rect.bottom - resizeHandleSize
    );
  }

  container.addEventListener('mousedown', e => {
    if (e.target === textarea) return; // Don't drag if clicking textarea
    if (isOnResizeHandle(e)) return;   // Don't drag if clicking resize handle

    isDragging = true;
    const rect = container.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    let newLeft = e.clientX - dragOffsetX + window.pageXOffset;
    let newTop = e.clientY - dragOffsetY + window.pageYOffset;
    newLeft = Math.max(newLeft, 0);
    newTop = Math.max(newTop, 0);
    container.style.left = newLeft + 'px';
    container.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
      saveAllTextBoxes();
    }
  });

  // Save content on input
  textarea.addEventListener('input', () => {
    saveAllTextBoxes();
  });

  // Save size on container resize (using ResizeObserver)
  const resizeObserver = new ResizeObserver(() => {
    saveAllTextBoxes();
  });
  resizeObserver.observe(container);

  return { container, textarea };
}

// --- Load all saved text boxes ---
function loadAllTextBoxes() {
  textBoxesData.forEach(box => {
    createTextBox(
      box.id,
      box.content,
      box.left,
      box.top,
      box.width,
      box.height
    );
  });
}

// --- Add button to toolbar ---
const addTextBoxBtn = document.createElement('button');
addTextBoxBtn.textContent = 'T';
Object.assign(addTextBoxBtn.style, {
  height: '32px',
  width: '32px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  borderRadius: '6px',
  border: '1px solid #aaa',
  backgroundColor: '#f9f9f9',
  padding: '0',
  fontFamily: 'sans-serif',
  userSelect: 'none',
  marginLeft: '4px',
  textAlign: 'center',
  lineHeight: '32px',
});
addTextBoxBtn.title = 'Add Text Box';
toolbar.appendChild(addTextBoxBtn);

addTextBoxBtn.onclick = () => {
  const id = 'tb_' + Date.now();
  let left = '100px';
  let top = '100px';

  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    left = (rect.left + scrollLeft) + 'px';
    top = (rect.top + scrollTop + rect.height + 5) + 'px';
  }

  createTextBox(id, '', left, top);
  saveAllTextBoxes();
};

// Initialize on load
loadAllTextBoxes();


  // --- Other Toolbar Buttons ---
  createIconButton('<i class="fas fa-undo"></i>', () => {
    paths.pop();
    redraw();
  });
  createIconButton('<i class="fas fa-eraser"></i>', () => {
    isEraser = !isEraser;
    isHighlight = false;
    penOptions.style.display = 'none';
    highlightOptions.style.display = 'none';
    noteColorOptions.style.display = 'none';
    redraw();
  });
 createIconButton('<i class="fas fa-trash"></i>', () => {
  paths.length = 0;
  clearSavedPaths();
  redraw();

  // Remove all notes
  document.querySelectorAll('.glasspen-note').forEach(note => note.remove());
  localStorage.removeItem(NOTES_KEY);

  // Remove all text boxes
  textBoxesParent.innerHTML = '';
  localStorage.removeItem(TEXTBOXES_STORAGE_KEY);
});

  createIconButton('<i class="fas fa-times"></i>', () => {
    [canvas, toolbar, noteDropdown].forEach(el => el && el.remove());
    document.querySelectorAll('.glasspen-note').forEach(n => n.remove());
  });

  // --- Dropdown close logic ---
  document.addEventListener('mousedown', (e) => {
    if (!penDropdown.contains(e.target)) penOptions.style.display = 'none';
    if (!highlightDropdown.contains(e.target)) highlightOptions.style.display = 'none';
    if (!noteDropdown.contains(e.target)) noteColorOptions.style.display = 'none';
  });
// --- Create container div to hold textarea ---



  // --- Window resize/scroll/DOM change handler ---
  function updateCanvasSize() {
    const newWidth = document.documentElement.scrollWidth;
    const newHeight = document.documentElement.scrollHeight;
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      // Scale paths to new size
      const scaleX = newWidth / canvas.width;
      const scaleY = newHeight / canvas.height;
      paths = paths.map(path => ({
        ...path,
        points: path.points.map(point => ({
          x: point.x * scaleX,
          y: point.y * scaleY
        }))
      }));
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      redraw();
    }
  }
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateCanvasSize, 150);
  });
  window.addEventListener('scroll', updateCanvasSize);
  new MutationObserver(updateCanvasSize).observe(document.body, { childList: true, subtree: true });

  redraw();
  loadNotes();
});
