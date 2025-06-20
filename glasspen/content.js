document.addEventListener('glasspen-activate', () => {
  if (document.getElementById('glasspen-canvas')) return;

  // FontAwesome for icons
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
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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

  // --- Sticky Notes ---
  function createStickyNote(top, left, text = '', color = currentNoteColor) {
    if (!top || !left) {
      const noteWidth = 200, noteHeight = 150, padding = 40;
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
      width: '200px',
      height: '150px',
      backgroundColor: color,
      border: '1px solid #000',
      padding: '5px',
      zIndex: '1000002',
      resize: 'both',
      overflow: 'auto',
      boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
      cursor: 'grab'
    });
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
 // Set initial position AFTER appending to DOM
document.body.appendChild(toolbar);

   

// Defer the positioning to after render  so that tool bar doesnt go out of window size
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
  // Prevent drag if clicking a button or input
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
  // Pen color swatches
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
  // Pen thickness slider
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
  // Highlighter color swatches
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
  // Highlighter thickness slider
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

    // For now, show in an alert (you can later render it in a sticky note)
   showGlasspenPopup(summary, 'Summary');



  } catch (err) {
    console.error('Error summarizing:', err);
    alert('Something went wrong while summarizing.');
  }finally {
    // Remove loading state
    summarizeBtn.disabled = false;
    summarizeBtn.innerHTML = `<i class="fas fa-scroll"></i>`;
  }

});

  toolbar.appendChild(summarizeBtn);
  
// --- Explain Tool ---
const explainBtn = document.createElement('button');
explainBtn.innerHTML = `<i class="fas fa-magic"></i>`; // 🪄 magic wand icon
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

    // Show explanation in a sticky note
  showGlasspenPopup(explanation, 'Explanation');

  } catch (err) {
    console.error('Error explaining:', err);
    alert('Something went wrong while explaining.');
  }finally {
    // Remove loading state
    explainBtn.disabled = false;
    explainBtn.innerHTML = `<i class="fas fa-magic"></i>`;
  }
});

toolbar.appendChild(explainBtn);

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
    document.querySelectorAll('.glasspen-note').forEach(note => note.remove());
    localStorage.removeItem(NOTES_KEY);
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

  // --- Window resize handler ---
  function handleResize() {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    paths = paths.map(path => ({
      ...path,
      points: path.points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
      }))
    }));
    document.querySelectorAll('.glasspen-note').forEach(note => {
      const left = parseFloat(note.style.left);
      const top = parseFloat(note.style.top);
      note.style.left = (left * scaleX) + 'px';
      note.style.top = (top * scaleY) + 'px';
    });
    redraw();
    saveNotes();
  }
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
  });

  redraw();
  loadNotes();
});
