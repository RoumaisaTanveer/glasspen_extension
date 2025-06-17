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
 // let mouse events pass through
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  let drawing = false;

  const startDrawing = (e) => {
    drawing = true;
    canvas.style.pointerEvents = 'auto';
    ctx.beginPath();
    ctx.moveTo(e.pageX, e.pageY);
  };

  const draw = (e) => {
    if (!drawing) return;
    ctx.lineTo(e.pageX, e.pageY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawing = false;
  };

  // Use page events so it tracks actual document
  document.addEventListener('mousedown', startDrawing);
  document.addEventListener('mousemove', draw);
  document.addEventListener('mouseup', stopDrawing);

  // STOP BUTTON
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
    clearBtn.remove();
    document.removeEventListener('mousedown', startDrawing);
    document.removeEventListener('mousemove', draw);
    document.removeEventListener('mouseup', stopDrawing);
  };
  document.body.appendChild(stopBtn);

  // CLEAR BUTTON
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🧹 Clear Drawing';
  Object.assign(clearBtn.style, {
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
  clearBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  document.body.appendChild(clearBtn);
});
