document.addEventListener('glasspen-activate', () => {
  if (document.getElementById('glasspen-canvas')) return;

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

  const ctx = canvas.getContext('2d');
  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  let drawing = false;
  let currentPath = [];
  const paths = [];

  const startDrawing = (e) => {
    drawing = true;
    currentPath = [{ x: e.pageX, y: e.pageY }];
    ctx.beginPath();
    ctx.moveTo(e.pageX, e.pageY);
  };

  const draw = (e) => {
    if (!drawing) return;
    const x = e.pageX;
    const y = e.pageY;
    currentPath.push({ x, y });
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (drawing) {
      paths.push(currentPath);
    }
    drawing = false;
  };

  const redrawAll = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const path of paths) {
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const point = path[i];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();
    }
  };

  // Event listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Stop Button
  const stopBtn = document.createElement('button');
  stopBtn.textContent = '❌ Stop Drawing';
  Object.assign(stopBtn.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '1000001',
    padding: '10px 15px',
    backgroundColor: '#fff',
    color: '#000',
    border: '2px solid #000',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  });
  stopBtn.onclick = () => {
    canvas.remove();
    stopBtn.remove();
    undoBtn.remove();
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    canvas.removeEventListener('mouseleave', stopDrawing);
  };
  document.body.appendChild(stopBtn);

  // Undo Button
  const undoBtn = document.createElement('button');
  undoBtn.textContent = '↩️ Undo';
  Object.assign(undoBtn.style, {
    position: 'fixed',
    top: '60px',
    right: '20px',
    zIndex: '1000001',
    padding: '10px 15px',
    backgroundColor: '#fff',
    color: '#000',
    border: '2px solid #000',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  });
  undoBtn.onclick = () => {
    paths.pop(); // remove last stroke
    redrawAll();
  };
  document.body.appendChild(undoBtn);
});
