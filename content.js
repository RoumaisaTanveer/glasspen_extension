document.addEventListener('glasspen-activate', () => {
  // Avoid adding canvas twice
  if (document.getElementById('glasspen-canvas')) return;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'glasspen-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '999999';
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'crosshair';
  document.body.appendChild(canvas);

  // Canvas context setup
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  // Drawing logic
  let drawing = false;
  canvas.addEventListener('mousedown', e => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  });

  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  // Stop Drawing Button
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
  };

  document.body.appendChild(stopBtn);
});
