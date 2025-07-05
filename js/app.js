// Tozu Dumana Kat Rauf - Düşman Yavaş ve Tamirci Görünümlü

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const messageDisplay = document.getElementById('message');

    // Oyun ayarları
    const gridWidth = 5;
    const gridHeight = 10;
    const cellWidth = 80;
    // cellHeight artık dinamik:
    let cellHeight = 80;
    let rauf = { x: 2, y: 0, breaking: false, breakAnim: 0 };
    let score = 0;
    let windows = [];
    let gameActive = true;
    let level = 1;
    let enemies = [];
    let enemyCooldowns = [];
    let strongRate = 0.25;

    // Camları oluştur (bazıları güçlü cam)
    function createWindows() {
        windows = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const strong = Math.random() < strongRate;
                windows.push({ x, y, broken: false, breakAnim: 0, strong, hit: 0 });
            }
        }
    }

    // Rauf'u çiz (piksel-art tarzı)
    function drawRauf() {
        // Rauf'u bulunduğu camın tam ortasına yerleştir
        const px = rauf.x * cellWidth + cellWidth / 2;
        const py = canvas.height - (rauf.y * cellHeight + cellHeight / 2);
        ctx.save();
        ctx.translate(px, py);
        if (rauf.breaking && rauf.breakAnim > 0) {
            ctx.rotate(Math.sin(rauf.breakAnim/2) * 0.2);
        }
        // Rauf'un boyutunu cellHeight'e göre orantılı yap
        const scale = cellHeight / 60;
        ctx.scale(scale, scale);
        // Gövde
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-18, 0, 36, 28);
        // Kafa
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.ellipse(0, -16, 18, 16, 0, 0, Math.PI*2);
        ctx.fill();
        // Gözler
        ctx.fillStyle = '#222';
        ctx.fillRect(-7, -20, 4, 4);
        ctx.fillRect(3, -20, 4, 4);
        // Kol (kırma animasyonu)
        ctx.save();
        ctx.rotate(rauf.breaking ? -0.7 : -0.2);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(16, 0, 10, 22);
        ctx.restore();
        ctx.restore();
    }

    // Tamirci düşmanları çiz
    function drawEnemies() {
        enemies.forEach(enemy => {
            const px = enemy.x * cellWidth + cellWidth/2;
            const py = canvas.height - (enemy.y * cellHeight + cellHeight/2);
            ctx.save();
            ctx.translate(px, py);
            // Gövde (mavi tulum)
            ctx.fillStyle = '#1976d2';
            ctx.fillRect(-16, 0, 32, 28);
            // Kafa (açık ten)
            ctx.fillStyle = '#ffe0b2';
            ctx.beginPath();
            ctx.ellipse(0, -14, 14, 14, 0, 0, Math.PI*2);
            ctx.fill();
            // Şapka
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(-14, -22, 28, 8);
            ctx.beginPath();
            ctx.arc(0, -14, 14, Math.PI, 2*Math.PI);
            ctx.fill();
            // Gözler
            ctx.fillStyle = '#222';
            ctx.fillRect(-6, -18, 4, 4);
            ctx.fillRect(2, -18, 4, 4);
            // Anahtar (elinde)
            ctx.save();
            ctx.rotate(-0.5);
            ctx.fillStyle = '#ffd600';
            ctx.fillRect(16, 10, 12, 4);
            ctx.beginPath();
            ctx.arc(28, 12, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            ctx.restore();
        });
    }

    // Her seviye için bina rengi ve cam çerçevesi değişsin
    function getBuildingColors(level) {
        const colors = [
            { body: '#b0bec5', border: '#455a64', window: '#b2ebf2', strong: '#4fc3f7' },
            { body: '#ffe082', border: '#ffb300', window: '#fff9c4', strong: '#ffd54f' },
            { body: '#c5e1a5', border: '#388e3c', window: '#e8f5e9', strong: '#81c784' },
            { body: '#b39ddb', border: '#512da8', window: '#ede7f6', strong: '#9575cd' },
            { body: '#ffab91', border: '#d84315', window: '#fbe9e7', strong: '#ff7043' }
        ];
        return colors[(level-1)%colors.length];
    }

    // Bina görselini ve seviye temasını güçlendirmek için drawWindows fonksiyonunu güncelle
    function drawWindows() {
        const theme = getBuildingColors(level);
        // Bina gövdesi (arka plan)
        ctx.save();
        ctx.fillStyle = theme.body;
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, 32);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // Camlar
        windows.forEach(w => {
            const px = w.x * cellWidth;
            const py = canvas.height - ((w.y + 1) * cellHeight);
            ctx.save();
            ctx.translate(px, py);
            ctx.fillStyle = theme.border;
            ctx.fillRect(0, 0, cellWidth, cellHeight);
            if (!w.broken) {
                ctx.fillStyle = w.strong ? theme.strong : theme.window;
                ctx.fillRect(8, 8, cellWidth-16, cellHeight-16);
                ctx.strokeStyle = '#e0f7fa';
                ctx.beginPath();
                ctx.moveTo(12, 12); ctx.lineTo(cellWidth-20, 20);
                ctx.stroke();
                if (w.strong && w.hit === 1) {
                    ctx.strokeStyle = theme.border;
                    ctx.beginPath();
                    ctx.moveTo(20, 20); ctx.lineTo(cellWidth-20, cellHeight-20);
                    ctx.stroke();
                }
            } else {
                ctx.fillStyle = '#424242';
                ctx.fillRect(8, 8, cellWidth-16, cellHeight-16);
                ctx.strokeStyle = '#e0f7fa';
                ctx.beginPath();
                ctx.moveTo(12, 12); ctx.lineTo(cellWidth-20, cellHeight-20);
                ctx.moveTo(cellWidth-20, 12); ctx.lineTo(12, cellHeight-20);
                ctx.stroke();
                if (w.breakAnim > 0) {
                    ctx.globalAlpha = w.breakAnim/8;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(cellWidth/2, cellHeight/2, 20+w.breakAnim*2, 0, Math.PI*2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }
            ctx.restore();
        });
    }

    // Oyun alanını çiz
    function draw() {
        // Her çizimde cellHeight'ı canvas yüksekliğine göre ayarla
        cellHeight = canvas.height / gridHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWindows();
        drawEnemies();
        drawRauf();
        // Seviye göstergesini canvas yerine üstteki div'e yaz
        const levelBar = document.getElementById('level-bar');
        if (levelBar) {
            levelBar.textContent = `Seviye: ${level}`;
        }
    }

    // Klavye kontrolleri (WASD + ok tuşları)
    function handleKey(e) {
        if (!gameActive) return;
        let moved = false;
        if (["ArrowLeft", "a", "A"].includes(e.key) && rauf.x > 0) { rauf.x--; moved = true; }
        if (["ArrowRight", "d", "D"].includes(e.key) && rauf.x < gridWidth-1) { rauf.x++; moved = true; }
        if (["ArrowUp", "w", "W"].includes(e.key) && rauf.y < gridHeight-1) { rauf.y++; moved = true; }
        if (["ArrowDown", "s", "S"].includes(e.key) && rauf.y > 0) { rauf.y--; moved = true; }
        if (e.key === ' ' || e.key === 'Enter') {
            smashWindow();
        }
        if (moved) {
            rauf.breaking = false;
            rauf.breakAnim = 0;
        }
    }

    // Cam kırma
    function smashWindow() {
        if (rauf.breaking) return;
        const w = windows.find(w => w.x === rauf.x && w.y === rauf.y);
        if (w && !w.broken) {
            if (w.strong) {
                w.hit++;
                if (w.hit >= 2) {
                    w.broken = true;
                    w.breakAnim = 8;
                    score += 20;
                } else {
                    score += 5;
                }
            } else {
                w.broken = true;
                w.breakAnim = 8;
                score += 10;
            }
            rauf.breaking = true;
            rauf.breakAnim = 8;
            scoreDisplay.textContent = `Puan: ${score}`;
            checkWin();
        }
    }

    // Düşman hareketi (yavaş ve cam tamiri)
    function updateEnemies() {
        enemies.forEach((enemy, i) => {
            enemy.pos += enemy.speed;
            if (enemy.pos >= 1) {
                if (Math.random() < 0.4) {
                    if (Math.random() < 0.5) enemy.dirX *= -1;
                    enemy.x += enemy.dirX;
                    if (enemy.x < 0) { enemy.x = 0; enemy.dirX = 1; }
                    if (enemy.x > gridWidth-1) { enemy.x = gridWidth-1; enemy.dirX = -1; }
                } else {
                    if (Math.random() < 0.5) enemy.dirY *= -1;
                    enemy.y += enemy.dirY;
                    if (enemy.y < 0) { enemy.y = 0; enemy.dirY = 1; }
                    if (enemy.y > gridHeight-1) { enemy.y = gridHeight-1; enemy.dirY = -1; }
                }
                // Kırık camı tamir et
                const w = windows.find(w => w.x === enemy.x && w.y === enemy.y);
                if (w && w.broken) {
                    w.broken = false;
                    w.hit = 0;
                    w.breakAnim = 0;
                }
                enemy.pos = 0;
            }
        });
    }

    // Çarpışma kontrolü
    function checkEnemyCollision() {
        enemies.forEach((enemy, i) => {
            if (enemy.x === rauf.x && enemy.y === rauf.y && enemyCooldowns[i] === 0) {
                score = Math.max(0, score - 20);
                scoreDisplay.textContent = `Puan: ${score}`;
                messageDisplay.textContent = 'Tamirciye çarptın! -20 puan';
                enemyCooldowns[i] = 30;
            }
            if (enemyCooldowns[i] > 0) enemyCooldowns[i]--;
        });
    }

    // Kazanma kontrolü
    function checkWin() {
        if (windows.every(w => w.broken)) {
            gameActive = false;
            messageDisplay.textContent = `Seviye ${level} tamamlandı! Yeni seviye için bir tuşa bas.`;
            document.addEventListener('keydown', nextLevelListener, { once: true });
        }
    }

    // Sonraki seviyeye geçiş
    function nextLevelListener() {
        level++;
        strongRate = Math.min(0.5, strongRate + 0.07);
        startGame();
    }

    // Animasyon döngüsü
    function gameLoop() {
        updateEnemies();
        checkEnemyCollision();
        windows.forEach(w => { if (w.breakAnim > 0) w.breakAnim--; });
        if (rauf.breakAnim > 0) rauf.breakAnim--;
        if (rauf.breakAnim === 0) rauf.breaking = false;
        draw();
        requestAnimationFrame(gameLoop);
    }

    // Oyun başlat
    function startGame() {
        createWindows();
        scoreDisplay.textContent = `Puan: ${score}`;
        rauf = { x: 2, y: 0, breaking: false, breakAnim: 0 };
        // Düşman sayısı ve hızı level ile artar, ama hız daha düşük
        enemies = [];
        enemyCooldowns = [];
        for (let i = 0; i < Math.min(1 + Math.floor(level/2), 5); i++) {
            enemies.push({
                x: Math.floor(Math.random()*gridWidth),
                y: gridHeight-1,
                dirX: Math.random() < 0.5 ? 1 : -1,
                dirY: -1,
                speed: 0.045 + 0.02*level + Math.random()*0.02, // DAHA YAVAŞ
                pos: 0
            });
            enemyCooldowns.push(0);
        }
        gameActive = true;
        messageDisplay.innerHTML = `<b>Kontroller:</b><br>
        Klavye: Yön tuşları/WASD ile hareket, Boşluk/Enter ile kır<br>
        Mobil: Ok tuşları ve <b>Kır</b> butonu<br><br>
        Seviye ${level} - Başlamak için hareket et!`;
        draw();
        setTimeout(() => {
            draw();
        }, 100);
    }

    // Oyun başlat fonksiyonunu seçili bölüme göre başlat
    function getSelectedLevel() {
        let level = 1;
        try {
            const stored = localStorage.getItem('selectedLevel');
            if(stored) level = parseInt(stored);
        } catch(e) {}
        return level;
    }

    // === GİRİŞ EKRANI ve BÖLÜM SEÇİMİ ===
    let selectedLevel = 1;
    // Eğer game.html'deysek, giriş ekranı ve seviye butonları oluşturulmasın
    if (window.location.pathname.endsWith('game.html')) {
        // Oyun doğrudan seçili bölümle başlasın
        level = getSelectedLevel();
        strongRate = 0.25 + 0.07 * (level-1);
        score = 0;
        startGame();
        gameLoop();
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            const startScreen = document.getElementById('start-screen');
            const levelButtonsDiv = document.getElementById('level-buttons');
            const btnStart = document.getElementById('btn-start');
            // Bölüm butonlarını oluştur
            for (let i = 1; i <= 5; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.className = 'level-btn' + (i === 1 ? ' selected' : '');
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedLevel = i;
                });
                levelButtonsDiv.appendChild(btn);
            }
            btnStart.addEventListener('click', () => {
                startScreen.style.display = 'none';
                level = selectedLevel;
                strongRate = 0.25 + 0.07 * (level-1);
                score = 0;
                startGame();
                gameLoop();
            });
        });
    }

    document.addEventListener('keydown', handleKey);

    // Mobil kontroller
    function mobileMove(dir) {
        if (!gameActive) return;
        let moved = false;
        if (dir === 'left' && rauf.x > 0) { rauf.x--; moved = true; }
        if (dir === 'right' && rauf.x < gridWidth-1) { rauf.x++; moved = true; }
        if (dir === 'up' && rauf.y < gridHeight-1) { rauf.y++; moved = true; }
        if (dir === 'down' && rauf.y > 0) { rauf.y--; moved = true; }
        if (moved) {
            rauf.breaking = false;
            rauf.breakAnim = 0;
        }
    }
    function mobileBreak() {
        if (!gameActive) return;
        smashWindow();
    }
    // Butonlara event ekle
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnBreak = document.getElementById('btn-break');
    if (btnUp) btnUp.addEventListener('touchstart', e => { e.preventDefault(); mobileMove('up'); });
    if (btnDown) btnDown.addEventListener('touchstart', e => { e.preventDefault(); mobileMove('down'); });
    if (btnLeft) btnLeft.addEventListener('touchstart', e => { e.preventDefault(); mobileMove('left'); });
    if (btnRight) btnRight.addEventListener('touchstart', e => { e.preventDefault(); mobileMove('right'); });
    if (btnBreak) btnBreak.addEventListener('touchstart', e => { e.preventDefault(); mobileBreak(); });
    // Mouse ile de çalışsın
    if (btnUp) btnUp.addEventListener('mousedown', e => { e.preventDefault(); mobileMove('up'); });
    if (btnDown) btnDown.addEventListener('mousedown', e => { e.preventDefault(); mobileMove('down'); });
    if (btnLeft) btnLeft.addEventListener('mousedown', e => { e.preventDefault(); mobileMove('left'); });
    if (btnRight) btnRight.addEventListener('mousedown', e => { e.preventDefault(); mobileMove('right'); });
    if (btnBreak) btnBreak.addEventListener('mousedown', e => { e.preventDefault(); mobileBreak(); });

    // startGame();
    // gameLoop();
});
