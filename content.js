document.addEventListener('glasspen-activate', () => {
  if (document.getElementById('glasspen-canvas')) return;

  // Create full-page canvas
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

  let drawing = false;
  let currentPath = [];
  const paths = [];
  let isEraser = false;

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
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = parseInt(thicknessPicker.value);
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
        color: colorPicker.value,
        width: parseInt(thicknessPicker.value),
        points: currentPath
      });
    }
    drawing = false;
  }

  // Mouse
  canvas.addEventListener('mousedown', e => start(e.pageX, e.pageY));
  canvas.addEventListener('mousemove', e => draw(e.pageX, e.pageY));
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);

  // Touch
  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    start(touch.pageX, touch.pageY);
  });
  canvas.addEventListener('touchmove', e => {
    const touch = e.touches[0];
    draw(touch.pageX, touch.pageY);
  });
  canvas.addEventListener('touchend', stop);

  // Buttons
  function makeButton(text, top, action) {
    const btn = document.createElement('button');
    btn.textContent = text;
    Object.assign(btn.style, {
      position: 'fixed',
      top: `${top}px`,
      right: '20px',
      zIndex: '1000001',
      padding: '8px 12px',
      backgroundColor: '#fff',
      border: '1px solid #000',
      borderRadius: '5px',
      fontSize: '14px',
      cursor: 'pointer',
    });
    btn.onclick = action;
    document.body.appendChild(btn);
    return btn;
  }

  const stopBtn = makeButton('❌ Stop', 20, () => {
    [canvas, stopBtn, undoBtn, eraserBtn, colorPicker, thicknessPicker].forEach(el => el.remove());
  });

  const undoBtn = makeButton('↩️ Undo', 60, () => {
    paths.pop();
    redraw();
  });

  const eraserBtn = makeButton('🧽 Eraser: Off', 100, () => {
    isEraser = !isEraser;
    eraserBtn.textContent = isEraser ? '✏️ Eraser: On' : '🧽 Eraser: Off';
  });

  const colorPicker = document.createElement('select');
  ['red', 'blue', 'green', 'black'].forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    colorPicker.appendChild(option);
  });
  colorPicker.value = 'red';
  Object.assign(colorPicker.style, {
    position: 'fixed',
    top: '140px',
    right: '20px',
    zIndex: '1000001',
    padding: '4px'
  });
  document.body.appendChild(colorPicker);

  const thicknessPicker = document.createElement('select');
  [1, 2, 4, 6].forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}px`;
    thicknessPicker.appendChild(option);
  });
  thicknessPicker.value = 2;
  Object.assign(thicknessPicker.style, {
    position: 'fixed',
    top: '180px',
    right: '20px',
    zIndex: '1000001',
    padding: '4px'
  });
  document.body.appendChild(thicknessPicker);
});
