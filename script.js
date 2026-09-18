// بيانات الكلية المطابقة للمخططات المرفقة
const campusData = {
  A: {
    "الدور الأرضي": {
      corridorsSvg: `
        <rect x="180" y="80" width="40" height="420" fill="#0f172a" stroke="#334155" />
        <rect x="180" y="460" width="500" height="40" fill="#0f172a" stroke="#334155" />
        <path d="M 400,460 L 720,320 L 720,360 L 400,500 Z" fill="#0f172a" stroke="#334155" />
      `,
      rooms: [
        { id: "A-G-1", label: "A-G-1", x: 60, y: 80, w: 110, h: 70, routePoints: "200,480 200,115 170,115" },
        { id: "A-G-2", label: "A-G-2", x: 60, y: 160, w: 110, h: 70, routePoints: "200,480 200,195 170,195" },
        { id: "A-G-3", label: "A-G-3", x: 60, y: 240, w: 110, h: 70, routePoints: "200,480 200,275 170,275" },
        { id: "A-G-4", label: "A-G-4", x: 60, y: 320, w: 110, h: 70, routePoints: "200,480 200,355 170,355" },
        { id: "A-G-5", label: "A-G-5", x: 60, y: 400, w: 110, h: 70, routePoints: "200,480 200,435 170,435" },
        { id: "A-G-14", label: "A-G-14", x: 230, y: 160, w: 80, h: 60, routePoints: "200,480 200,190 230,190" },
        { id: "A-G-13", label: "A-G-13", x: 230, y: 230, w: 80, h: 50, routePoints: "200,480 200,255 230,255" },
        { id: "A-G-12", label: "A-G-12", x: 230, y: 290, w: 80, h: 50, routePoints: "200,480 200,315 230,315" },
        { id: "A-G-6", label: "A-G-6", x: 60, y: 510, w: 110, h: 80, routePoints: "200,480 200,550 170,550" },
        { id: "A-G-7", label: "A-G-7", x: 180, y: 510, w: 40, h: 80, routePoints: "200,480 200,510" },
        { id: "A-G-8", label: "A-G-8", x: 230, y: 510, w: 100, h: 80, routePoints: "200,480 280,480 280,510" },
        { id: "A-G-9", label: "A-G-9", x: 340, y: 510, w: 100, h: 80, routePoints: "200,480 390,480 390,510" },
        { id: "A-G-10", label: "A-G-10", x: 450, y: 510, w: 100, h: 80, routePoints: "200,480 500,480 500,510" },
        { id: "A-G-11", label: "A-G-11", x: 570, y: 510, w: 60, h: 80, routePoints: "200,480 570,480 570,510" },
        { id: "A-G-15", label: "A-G-15\n(القاعة الكبرى)", x: 730, y: 300, w: 150, h: 100, type: "blue-bg", routePoints: "200,480 400,480 720,340 730,340" }
      ]
    },
    "الدور الأول": {
      corridorsSvg: `
        <rect x="180" y="80" width="40" height="420" fill="#0f172a" stroke="#334155" />
        <rect x="180" y="460" width="450" height="40" fill="#0f172a" stroke="#334155" />
      `,
      rooms: [
        { id: "A-F-1", label: "A-F-1", x: 60, y: 80, w: 110, h: 70, routePoints: "200,480 200,115 170,115" },
        { id: "A-F-2", label: "A-F-2", x: 60, y: 160, w: 110, h: 70, routePoints: "200,480 200,195 170,195" },
        { id: "A-F-3", label: "A-F-3", x: 60, y: 240, w: 110, h: 70, routePoints: "200,480 200,275 170,275" },
        { id: "A-F-4", label: "A-F-4", x: 60, y: 320, w: 110, h: 70, routePoints: "200,480 200,355 170,355" },
        { id: "A-F-5", label: "A-F-5", x: 60, y: 400, w: 110, h: 70, routePoints: "200,480 200,435 170,435" },
        { id: "A-F-17", label: "A-F-17", x: 230, y: 220, w: 70, h: 50, routePoints: "200,480 200,245 230,245" },
        { id: "A-F-11", label: "A-F-11", x: 230, y: 280, w: 70, h: 50, routePoints: "200,480 200,305 230,305" },
        { id: "A-F-14", label: "A-F-14", x: 310, y: 220, w: 80, h: 60, routePoints: "200,480 200,250 310,250" },
        { id: "A-F-10", label: "A-F-10", x: 310, y: 350, w: 70, h: 60, routePoints: "200,480 345,480 345,410" },
        { id: "A-F-13", label: "A-F-13\n(العميدة)", x: 390, y: 350, w: 100, h: 60, type: "blue-bg", routePoints: "200,480 440,480 440,410" },
        { id: "A-F-6", label: "A-F-6", x: 180, y: 510, w: 40, h: 80, routePoints: "200,480 200,510" },
        { id: "A-F-7", label: "A-F-7", x: 230, y: 510, w: 100, h: 80, routePoints: "200,480 280,480 280,510" },
        { id: "A-F-8", label: "A-F-8", x: 340, y: 510, w: 100, h: 80, routePoints: "200,480 390,480 390,510" },
        { id: "A-F-9", label: "A-F-9", x: 450, y: 510, w: 100, h: 80, routePoints: "200,480 500,480 500,510" }
      ]
    }
  },
  B: {
    "الدور الأرضي": {
      corridorsSvg: `
        <rect x="230" y="80" width="40" height="520" fill="#0f172a" stroke="#334155" />
        <rect x="530" y="80" width="40" height="520" fill="#0f172a" stroke="#334155" />
        <rect x="270" y="320" width="260" height="40" fill="#0f172a" stroke="#334155" />
      `,
      rooms: [
        // العمود الأيسر (الشرقي) B-G-11 حتى B-G-15
        { id: "B-G-11", label: "B-G-11", x: 580, y: 80, w: 120, h: 80, routePoints: "250,580 550,580 550,120 580,120" },
        { id: "B-G-12", label: "B-G-12", x: 580, y: 180, w: 120, h: 80, routePoints: "250,580 550,580 550,220 580,220" },
        { id: "B-G-13", label: "B-G-13", x: 580, y: 280, w: 120, h: 80, routePoints: "250,580 550,580 550,320 580,320" },
        { id: "B-G-14", label: "B-G-14", x: 580, y: 380, w: 120, h: 80, routePoints: "250,580 550,580 550,420 580,420" },
        { id: "B-G-15", label: "B-G-15", x: 580, y: 480, w: 120, h: 80, routePoints: "250,580 550,580 550,520 580,520" },

        // العمود الأوسط B-G-1 إلى B-G-7
        { id: "B-G-1", label: "B-G-1", x: 90, y: 480, w: 120, h: 80, routePoints: "250,580 250,520 210,520" },
        { id: "B-G-2", label: "B-G-2", x: 280, y: 480, w: 120, h: 80, routePoints: "250,580 250,520 280,520" },
        { id: "B-G-3", label: "B-G-3", x: 90, y: 380, w: 120, h: 80, routePoints: "250,580 250,420 210,420" },
        { id: "B-G-4", label: "B-G-4", x: 90, y: 280, w: 120, h: 80, routePoints: "250,580 250,320 210,320" },
        { id: "B-G-5", label: "B-G-5\n(العيادة/الخدمات)", x: 90, y: 180, w: 120, h: 80, type: "green-bg", routePoints: "250,580 250,220 210,220" },
        { id: "B-G-6", label: "B-G-6", x: 90, y: 80, w: 120, h: 80, routePoints: "250,580 250,120 210,120" },
        { id: "B-G-7", label: "B-G-7", x: 280, y: 80, w: 120, h: 80, routePoints: "250,580 250,120 280,120" }
      ]
    },
    "الدور الأول": {
      corridorsSvg: `
        <rect x="230" y="80" width="40" height="520" fill="#0f172a" stroke="#334155" />
        <rect x="530" y="80" width="40" height="520" fill="#0f172a" stroke="#334155" />
        <rect x="270" y="320" width="260" height="40" fill="#0f172a" stroke="#334155" />
      `,
      rooms: [
        { id: "B-F-11", label: "B-F-11", x: 580, y: 80, w: 120, h: 80, routePoints: "250,580 550,580 550,120 580,120" },
        { id: "B-F-12", label: "B-F-12", x: 580, y: 180, w: 120, h: 80, routePoints: "250,580 550,580 550,220 580,220" },
        { id: "B-F-13", label: "B-F-13", x: 580, y: 280, w: 120, h: 80, routePoints: "250,580 550,580 550,320 580,320" },
        { id: "B-F-14", label: "B-F-14", x: 580, y: 380, w: 120, h: 80, routePoints: "250,580 550,580 550,420 580,420" },
        { id: "B-F-15", label: "B-F-15", x: 580, y: 480, w: 120, h: 80, routePoints: "250,580 550,580 550,520 580,520" },
        { id: "B-F-01", label: "B-F-01", x: 90, y: 480, w: 120, h: 80, routePoints: "250,580 250,520 210,520" },
        { id: "B-F-02", label: "B-F-02", x: 90, y: 380, w: 120, h: 80, routePoints: "250,580 250,420 210,420" },
        { id: "B-F-03", label: "B-F-03", x: 90, y: 280, w: 120, h: 80, routePoints: "250,580 250,320 210,320" },
        { id: "B-F-04", label: "B-F-04", x: 280, y: 280, w: 120, h: 80, routePoints: "250,580 250,320 280,320" },
        { id: "B-F-05", label: "B-F-05", x: 90, y: 180, w: 120, h: 80, routePoints: "250,580 250,220 210,220" },
        { id: "B-F-06", label: "B-F-06", x: 90, y: 80, w: 120, h: 80, routePoints: "250,580 250,120 210,120" },
        { id: "B-F-07", label: "B-F-07", x: 280, y: 80, w: 120, h: 80, routePoints: "250,580 250,120 280,120" }
      ]
    },
    "الدور الثاني": {
      corridorsSvg: `
        <rect x="230" y="80" width="40" height="520" fill="#0f172a" stroke="#334155" />
        <rect x="530" y="80" width="40" height="520" fill="#0f172a" stroke="#334155" />
        <rect x="270" y="320" width="260" height="40" fill="#0f172a" stroke="#334155" />
      `,
      rooms: [
        { id: "B-S-11", label: "B-S-11", x: 580, y: 80, w: 120, h: 80, routePoints: "250,580 550,580 550,120 580,120" },
        { id: "B-S-12", label: "B-S-12", x: 580, y: 180, w: 120, h: 80, routePoints: "250,580 550,580 550,220 580,220" },
        { id: "B-S-13", label: "B-S-13", x: 580, y: 280, w: 120, h: 80, routePoints: "250,580 550,580 550,320 580,320" },
        { id: "B-S-14", label: "B-S-14", x: 580, y: 380, w: 120, h: 80, routePoints: "250,580 550,580 550,420 580,420" },
        { id: "B-S-15", label: "B-S-15", x: 580, y: 480, w: 120, h: 80, routePoints: "250,580 550,580 550,520 580,520" },
        { id: "B-S-01", label: "B-S-01", x: 90, y: 480, w: 120, h: 80, routePoints: "250,580 250,520 210,520" },
        { id: "B-S-02", label: "B-S-02", x: 90, y: 380, w: 120, h: 80, routePoints: "250,580 250,420 210,420" },
        { id: "B-S-03", label: "B-S-03", x: 90, y: 280, w: 120, h: 80, routePoints: "250,580 250,320 210,320" },
        { id: "B-S-04", label: "B-S-04", x: 280, y: 280, w: 120, h: 80, routePoints: "250,580 250,320 280,320" },
        { id: "B-S-05", label: "B-S-05", x: 90, y: 180, w: 120, h: 80, routePoints: "250,580 250,220 210,220" },
        { id: "B-S-06", label: "B-S-06", x: 90, y: 80, w: 120, h: 80, routePoints: "250,580 250,120 210,120" },
        { id: "B-S-07", label: "B-S-07", x: 280, y: 80, w: 120, h: 80, routePoints: "250,580 250,120 280,120" }
      ]
    }
  }
};

let selectedBldg = 'A';
let selectedFloor = 'الدور الأرضي';

// متغيرات التكبير والسحب
let scale = 1;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;

const board = document.getElementById('blueprintBoard');
const wrapper = document.getElementById('mapWrapper');

window.onload = function() {
  renderFloorsMenu();
  renderBlueprint();
  initPanZoom();
};

/* محرك التكبير والسحب السلس (Pan & Zoom) */
function initPanZoom() {
  wrapper.onmousedown = function(e) {
    if (e.target.classList.contains('room-node')) return;
    e.preventDefault();
    startX = e.clientX - pointX;
    startY = e.clientY - pointY;
    isDragging = true;
  };

  window.onmousemove = function(e) {
    if (!isDragging) return;
    e.preventDefault();
    pointX = e.clientX - startX;
    pointY = e.clientY - startY;
    updateTransform();
  };

  window.onmouseup = function() {
    isDragging = false;
  };

  wrapper.onwheel = function(e) {
    e.preventDefault();
    const xs = (e.clientX - pointX) / scale;
    const ys = (e.clientY - pointY) / scale;
    const delta = -e.deltaY;
    (delta > 0) ? (scale *= 1.1) : (scale /= 1.1);
    scale = Math.min(Math.max(0.5, scale), 2.5);
    pointX = e.clientX - xs * scale;
    pointY = e.clientY - ys * scale;
    updateTransform();
  };
}

function updateTransform() {
  board.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}

function zoomIn() {
  scale = Math.min(scale * 1.2, 2.5);
  updateTransform();
}

function zoomOut() {
  scale = Math.max(scale / 1.2, 0.5);
  updateTransform();
}

function resetZoom() {
  scale = 1;
  pointX = 0;
  pointY = 0;
  updateTransform();
}

/* اختيار المبنى والدور */
function selectBuilding(b) {
  selectedBldg = b;
  document.getElementById('bldg-A').classList.toggle('active', b === 'A');
  document.getElementById('bldg-B').classList.toggle('active', b === 'B');

  selectedFloor = Object.keys(campusData[b])[0];
  renderFloorsMenu();
  renderBlueprint();
  clearNavigation();
}

function renderFloorsMenu() {
  const container = document.getElementById('floorSelector');
  container.innerHTML = '';

  Object.keys(campusData[selectedBldg]).forEach(fl => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${fl === selectedFloor ? 'active' : ''}`;
    btn.innerText = fl;
    btn.onclick = () => {
      selectedFloor = fl;
      renderFloorsMenu();
      renderBlueprint();
      clearNavigation();
    };
    container.appendChild(btn);
  });
}

function renderBlueprint() {
  const svgCorridors = document.getElementById('corridorSvg');
  const roomsLayer = document.getElementById('roomsContainer');
  const dropdown = document.getElementById('roomDropdown');

  const currentData = campusData[selectedBldg][selectedFloor];

  svgCorridors.innerHTML = currentData.corridorsSvg;
  roomsLayer.innerHTML = '';
  dropdown.innerHTML = '<option value="">اختر القاعة...</option>';

  currentData.rooms.forEach(room => {
    const node = document.createElement('div');
    node.className = `room-node ${room.type || ''}`;
    node.id = `node-${room.id}`;
    node.innerText = room.label;

    node.style.left = room.x + 'px';
    node.style.top = room.y + 'px';
    node.style.width = room.w + 'px';
    node.style.height = room.h + 'px';

    node.onclick = () => {
      dropdown.value = room.id;
      highlightAndRoute();
    };

    roomsLayer.appendChild(node);

    const opt = document.createElement('option');
    opt.value = room.id;
    opt.innerText = room.label.replace('\n', ' ');
    dropdown.appendChild(opt);
  });
}

/* توجيه المسارات داخل الممرات */
function highlightAndRoute() {
  const roomId = document.getElementById('roomDropdown').value;
  const pathElem = document.getElementById('routePath');
  const marker = document.getElementById('liveMarker');
  const banner = document.getElementById('infoBanner');

  document.querySelectorAll('.room-node').forEach(n => n.classList.remove('selected'));

  if (!roomId) {
    clearNavigation();
    return;
  }

  const room = campusData[selectedBldg][selectedFloor].rooms.find(r => r.id === roomId);
  const nodeElem = document.getElementById(`node-${roomId}`);

  if (room && nodeElem) {
    nodeElem.classList.add('selected');

    const points = room.routePoints.split(' ');
    let pathD = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i]}`;
    }

    pathElem.setAttribute('d', pathD);

    const lastPoint = points[points.length - 1].split(',');
    marker.setAttribute('transform', `translate(${lastPoint[0]}, ${lastPoint[1]})`);
    marker.style.display = 'block';

    document.getElementById('infoText').innerText = `المسار المباشر نحو ${room.label.replace('\n', ' ')} (مبنى ${selectedBldg} - ${selectedFloor})`;
    banner.style.display = 'flex';
  }
}

function clearNavigation() {
  document.getElementById('roomDropdown').value = '';
  document.getElementById('routePath').setAttribute('d', '');
  document.getElementById('liveMarker').style.display = 'none';
  document.getElementById('infoBanner').style.display = 'none';
  document.querySelectorAll('.room-node').forEach(n => n.classList.remove('selected'));
}

/* طوي وإظهار الشريط العلوي */
function toggleHeader() {
  const header = document.getElementById('topControls');
  const icon = document.getElementById('toggleIcon');
  header.classList.toggle('collapsed');
  
  if (header.classList.contains('collapsed')) {
    icon.className = 'fas fa-chevron-down';
  } else {
    icon.className = 'fas fa-chevron-up';
  }
}

/* النافذة المنبثقة للباركود */
function openQrModal() {
  document.getElementById('qrModal').style.display = 'flex';
}

function closeQrModal() {
  document.getElementById('qrModal').style.display = 'none';
}

function testQrScan(b, fl, rm) {
  closeQrModal();
  selectBuilding(b);
  selectedFloor = fl;
  renderFloorsMenu();
  renderBlueprint();
  
  setTimeout(() => {
    document.getElementById('roomDropdown').value = rm;
    highlightAndRoute();
  }, 100);
}
