// Tozu Dumana Kat Rauf - Modern Gaming Edition

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const messageDisplay = document.getElementById('message');

    // Oyun ayarları
    const gridWidth = 5;
    const gridHeight = 10;
    const cellWidth = 80;
    const MAX_LEVEL = 20; // Increased from 5 to 20 levels
    
    // Gamer-friendly constants
    const COMBO_TIME_WINDOW = 1500; // Time window to keep combo (ms)
    const COMBO_TIMEOUT = 2000; // Time before combo resets (ms)
    const ENEMIES_PER_LEVEL_DIVISOR = 3; // Divisor for calculating enemy count
    const MAX_ENEMIES = 6; // Maximum number of enemies
    const ENEMY_STUN_DURATION = 15000; // 15 seconds stun duration in milliseconds
    
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
    
    // Gamer-friendly features
    let combo = 0;
    let maxCombo = 0;
    let comboTimer = null;
    let totalWindowsBroken = 0;
    let lastBreakTime = 0;
    
    // Create combo display element
    function createComboDisplay() {
        if (!document.getElementById('combo-display')) {
            const comboDiv = document.createElement('div');
            comboDiv.id = 'combo-display';
            document.body.appendChild(comboDiv);
        }
    }
    
    // Create progress bar
    function createProgressBar() {
        const gameWrapper = document.getElementById('game-wrapper');
        if (gameWrapper && !document.getElementById('progress-container')) {
            const container = document.createElement('div');
            container.id = 'progress-container';
            const bar = document.createElement('div');
            bar.id = 'progress-bar';
            container.appendChild(bar);
            const levelBar = document.getElementById('level-bar');
            if (levelBar) {
                levelBar.parentNode.insertBefore(container, levelBar.nextSibling);
            }
        }
    }
    
    // Update progress bar
    function updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const brokenCount = windows.filter(w => w.broken).length;
            const totalCount = windows.length;
            const progress = (brokenCount / totalCount) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }
    
    // Show combo
    function showCombo(comboCount) {
        const comboDisplay = document.getElementById('combo-display');
        if (comboDisplay && comboCount >= 2) {
            comboDisplay.textContent = `${comboCount}x COMBO!`;
            comboDisplay.classList.add('active');
            setTimeout(() => {
                comboDisplay.classList.remove('active');
            }, 800);
        }
    }
    
    // Screen shake effect
    function screenShake() {
        const gameWrapper = document.getElementById('game-wrapper');
        if (gameWrapper) {
            gameWrapper.classList.add('shake');
            setTimeout(() => {
                gameWrapper.classList.remove('shake');
            }, 300);
        }
    }

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

    // Rauf'u çiz (modern piksel-art tarzı)
    function drawRauf() {
        // Rauf'u bulunduğu camın tam ortasına yerleştir
        const px = rauf.x * cellWidth + cellWidth / 2;
        const py = canvas.height - (rauf.y * cellHeight + cellHeight / 2);
        ctx.save();
        ctx.translate(px, py);
        if (rauf.breaking && rauf.breakAnim > 0) {
            ctx.rotate(Math.sin(rauf.breakAnim/2) * 0.3);
        }
        // Rauf'un boyutunu cellHeight'e göre orantılı yap
        const scale = cellHeight / 60;
        ctx.scale(scale, scale);
        
        // Glow effect
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        
        // Gövde (modern neon red)
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(-18, 0, 36, 28);
        
        // Armor details
        ctx.fillStyle = '#cc0044';
        ctx.fillRect(-16, 2, 8, 24);
        ctx.fillRect(8, 2, 8, 24);
        
        // Kafa
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(0, -16, 18, 16, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Visor/Gözler (cyberpunk style)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-12, -22, 24, 6);
        
        // Eye dots
        ctx.fillStyle = '#000';
        ctx.fillRect(-7, -20, 4, 3);
        ctx.fillRect(3, -20, 4, 3);
        
        // Kol (kırma animasyonu with glow)
        ctx.save();
        ctx.rotate(rauf.breaking ? -0.7 : -0.2);
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(16, 0, 10, 22);
        // Hammer/tool
        if (rauf.breaking) {
            ctx.fillStyle = '#888';
            ctx.fillRect(18, 22, 6, 12);
            ctx.fillStyle = '#ff3366';
            ctx.fillRect(14, 32, 14, 8);
        }
        ctx.restore();
        ctx.restore();
    }

    // Tamirci düşmanları çiz (modern style)
    function drawEnemies() {
        enemies.forEach(enemy => {
            const px = enemy.x * cellWidth + cellWidth/2;
            const py = canvas.height - (enemy.y * cellHeight + cellHeight/2);
            ctx.save();
            ctx.translate(px, py);
            
            // If stunned, reduce opacity and add different glow
            const isStunned = enemy.stunned && enemy.stunnedUntil > Date.now();
            if (isStunned) {
                ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Date.now() / 100); // Blinking effect
            }
            
            // Glow effect
            ctx.shadowColor = isStunned ? '#ffff00' : '#0088ff';
            ctx.shadowBlur = 12;
            
            // Gövde (blue tech suit)
            ctx.fillStyle = isStunned ? '#666666' : '#0066cc';
            ctx.fillRect(-16, 0, 32, 28);
            
            // Tech details
            ctx.fillStyle = isStunned ? '#888888' : '#00aaff';
            ctx.fillRect(-14, 4, 4, 20);
            ctx.fillRect(10, 4, 4, 20);
            
            // Kafa (açık ten)
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffd5b5';
            ctx.beginPath();
            ctx.ellipse(0, -14, 14, 14, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Tech visor/helmet
            ctx.shadowColor = isStunned ? '#ffff00' : '#00ffff';
            ctx.fillStyle = '#003366';
            ctx.fillRect(-14, -24, 28, 10);
            ctx.fillStyle = isStunned ? '#ffff00' : '#00ffff';
            ctx.fillRect(-10, -22, 20, 4);
            
            // Gözler - stunned olunca spiral/sersem gözler
            if (isStunned) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1.5;
                // Sol spiral göz
                ctx.beginPath();
                ctx.arc(-4, -16, 3, 0, Math.PI * 4);
                ctx.stroke();
                // Sağ spiral göz
                ctx.beginPath();
                ctx.arc(4, -16, 3, 0, Math.PI * 4);
                ctx.stroke();
                
                // Stun stars/yıldızlar
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 3; i++) {
                    const angle = (Date.now() / 200) + (i * Math.PI * 2 / 3);
                    const starX = Math.cos(angle) * 20;
                    const starY = -30 + Math.sin(angle * 2) * 3;
                    ctx.beginPath();
                    ctx.arc(starX, starY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                ctx.fillStyle = '#222';
                ctx.fillRect(-6, -18, 4, 4);
                ctx.fillRect(2, -18, 4, 4);
            }
            
            // Tech tool (wrench) - stunned olunca düşmüş göster
            ctx.save();
            if (isStunned) {
                ctx.rotate(0.8); // dropped wrench
                ctx.globalAlpha = 0.4;
            } else {
                ctx.rotate(-0.4);
            }
            ctx.shadowColor = '#ffff00';
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(16, 8, 14, 4);
            ctx.beginPath();
            ctx.arc(30, 10, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            
            ctx.restore();
        });
    }

    // Her seviye için bina rengi ve cam çerçevesi (expanded to 20 levels)
    function getBuildingColors(level) {
        const colors = [
            { body: '#1a1a2e', border: '#00f5ff', window: '#0a3d62', strong: '#00a8cc', name: 'Neon Tower' },
            { body: '#2d132c', border: '#ff00ff', window: '#4a0e4e', strong: '#c850c0', name: 'Cyber Plaza' },
            { body: '#0c1618', border: '#39ff14', window: '#1e3a1e', strong: '#32cd32', name: 'Matrix Hub' },
            { body: '#1a1a1a', border: '#ff3131', window: '#3d0000', strong: '#ff6b6b', name: 'Red District' },
            { body: '#0d1b2a', border: '#ffd700', window: '#2d3436', strong: '#f1c40f', name: 'Golden Gate' },
            { body: '#16213e', border: '#e94560', window: '#1f4068', strong: '#f05454', name: 'Sunset Tower' },
            { body: '#1b1b2f', border: '#7b2cbf', window: '#2a2a4a', strong: '#9d4edd', name: 'Purple Haze' },
            { body: '#0f0f23', border: '#00d4ff', window: '#1a1a3e', strong: '#0099cc', name: 'Ice Palace' },
            { body: '#1f1f1f', border: '#ff6b35', window: '#2d2d2d', strong: '#f77f00', name: 'Fire Core' },
            { body: '#0a0a0a', border: '#b8b8b8', window: '#1a1a1a', strong: '#e0e0e0', name: 'Chrome City' },
            { body: '#1a0a2e', border: '#ff1493', window: '#2e1a4a', strong: '#ff69b4', name: 'Pink Dream' },
            { body: '#0a1a0a', border: '#00ff7f', window: '#1a2e1a', strong: '#00fa9a', name: 'Emerald Tower' },
            { body: '#1a1a0a', border: '#ffff00', window: '#2e2e1a', strong: '#ffd700', name: 'Solar Spire' },
            { body: '#0a0a1a', border: '#4169e1', window: '#1a1a2e', strong: '#6495ed', name: 'Royal Blue' },
            { body: '#1a0a0a', border: '#dc143c', window: '#2e1a1a', strong: '#ff4500', name: 'Crimson Peak' },
            { body: '#0f1923', border: '#00bcd4', window: '#1a2e3d', strong: '#00e5ff', name: 'Aqua Nexus' },
            { body: '#1e0533', border: '#e040fb', window: '#2e1a4a', strong: '#ea80fc', name: 'Violet Storm' },
            { body: '#0a1f0a', border: '#76ff03', window: '#1a3d1a', strong: '#b2ff59', name: 'Lime Zone' },
            { body: '#1f0a1f', border: '#ff1744', window: '#3d1a3d', strong: '#ff5252', name: 'Ruby Complex' },
            { body: '#000000', border: '#ffffff', window: '#111111', strong: '#cccccc', name: 'Final Boss' }
        ];
        return colors[(level-1) % colors.length];
    }

    // Bina görselini ve seviye temasını güçlendirmek için drawWindows fonksiyonunu güncelle
    function drawWindows() {
        const theme = getBuildingColors(level);
        
        // Bina gövdesi (arka plan with grid effect)
        ctx.save();
        ctx.fillStyle = theme.body;
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 4;
        ctx.shadowColor = theme.border;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
        ctx.fill();
        ctx.stroke();
        
        // Grid overlay effect
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        ctx.restore();
        
        // Camlar
        windows.forEach(w => {
            const px = w.x * cellWidth;
            const py = canvas.height - ((w.y + 1) * cellHeight);
            ctx.save();
            ctx.translate(px, py);
            
            // Window frame with glow
            ctx.shadowColor = theme.border;
            ctx.shadowBlur = w.broken ? 0 : 8;
            ctx.fillStyle = theme.border;
            ctx.fillRect(4, 4, cellWidth-8, cellHeight-8);
            
            if (!w.broken) {
                // Glass with gradient
                const gradient = ctx.createLinearGradient(8, 8, cellWidth-16, cellHeight-16);
                gradient.addColorStop(0, w.strong ? theme.strong : theme.window);
                gradient.addColorStop(1, w.strong ? theme.border : theme.window);
                ctx.fillStyle = gradient;
                ctx.fillRect(8, 8, cellWidth-16, cellHeight-16);
                
                // Shine effect
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.moveTo(12, 12);
                ctx.lineTo(24, 12);
                ctx.lineTo(12, 24);
                ctx.closePath();
                ctx.fill();
                
                // Crack indicator for strong windows
                if (w.strong && w.hit === 1) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(cellWidth/2, 12);
                    ctx.lineTo(cellWidth/2 - 10, cellHeight/2);
                    ctx.lineTo(cellWidth/2 + 10, cellHeight - 12);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cellWidth/2, cellHeight/2);
                    ctx.lineTo(cellWidth - 12, cellHeight/2 + 10);
                    ctx.stroke();
                }
            } else {
                // Broken window (dark hole)
                ctx.fillStyle = '#000';
                ctx.fillRect(8, 8, cellWidth-16, cellHeight-16);
                
                // Broken glass shards
                ctx.strokeStyle = theme.border;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(8, 8);
                ctx.lineTo(cellWidth/2, cellHeight/2);
                ctx.moveTo(cellWidth-8, 8);
                ctx.lineTo(cellWidth/2, cellHeight/2);
                ctx.moveTo(8, cellHeight-8);
                ctx.lineTo(cellWidth/2, cellHeight/2);
                ctx.moveTo(cellWidth-8, cellHeight-8);
                ctx.lineTo(cellWidth/2, cellHeight/2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                
                // Break animation particles
                if (w.breakAnim > 0) {
                    ctx.globalAlpha = w.breakAnim/8;
                    ctx.fillStyle = theme.border;
                    for (let i = 0; i < 5; i++) {
                        const angle = (Math.PI * 2 / 5) * i + w.breakAnim/4;
                        const dist = 10 + (8 - w.breakAnim) * 5;
                        ctx.beginPath();
                        ctx.arc(
                            cellWidth/2 + Math.cos(angle) * dist,
                            cellHeight/2 + Math.sin(angle) * dist,
                            3, 0, Math.PI*2
                        );
                        ctx.fill();
                    }
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
        
        // Update progress
        updateProgress();
        
        // Seviye göstergesini canvas yerine üstteki div'e yaz
        const levelBar = document.getElementById('level-bar');
        if (levelBar) {
            const theme = getBuildingColors(level);
            levelBar.innerHTML = `
                <span>LVL ${level}/${MAX_LEVEL}</span>
                <span style="color: ${theme.border}; font-size: 0.8rem;">${theme.name}</span>
                ${combo >= 2 ? `<span style="color: #ff00ff;">🔥 ${combo}x</span>` : ''}
            `;
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
            e.preventDefault();
            smashWindow();
        }
        if (moved) {
            rauf.breaking = false;
            rauf.breakAnim = 0;
        }
    }

    // Cam kırma with combo system
    function smashWindow() {
        if (rauf.breaking) return;
        
        // Check if there's an enemy at Rauf's position to stun
        const enemyToStun = enemies.find(e => e.x === rauf.x && e.y === rauf.y && !e.stunned);
        if (enemyToStun) {
            // Stun the enemy for 15 seconds
            enemyToStun.stunned = true;
            enemyToStun.stunnedUntil = Date.now() + ENEMY_STUN_DURATION;
            
            // Play animation
            rauf.breaking = true;
            rauf.breakAnim = 8;
            
            // Give bonus points for stunning enemy
            score += 25;
            scoreDisplay.textContent = `Puan: ${score}`;
            
            // Show message
            messageDisplay.textContent = '💥 Tamirciyi sersemlettin! 15 saniye hareketsiz!';
            messageDisplay.style.color = '#ffff00';
            setTimeout(() => {
                messageDisplay.style.color = '';
            }, 2000);
            
            screenShake();
            return;
        }
        
        const w = windows.find(w => w.x === rauf.x && w.y === rauf.y);
        if (w && !w.broken) {
            const now = Date.now();
            
            // Combo system
            if (now - lastBreakTime < COMBO_TIME_WINDOW) {
                combo++;
                if (combo > maxCombo) maxCombo = combo;
                showCombo(combo);
            } else {
                combo = 1;
            }
            lastBreakTime = now;
            
            // Clear combo timer
            if (comboTimer) clearTimeout(comboTimer);
            comboTimer = setTimeout(() => {
                combo = 0;
            }, COMBO_TIMEOUT);
            
            // Calculate score with combo multiplier
            let baseScore = 0;
            if (w.strong) {
                w.hit++;
                if (w.hit >= 2) {
                    w.broken = true;
                    w.breakAnim = 8;
                    baseScore = 20;
                    screenShake();
                } else {
                    baseScore = 5;
                }
            } else {
                w.broken = true;
                w.breakAnim = 8;
                baseScore = 10;
            }
            
            // Apply combo multiplier
            const comboMultiplier = Math.min(combo, 5);
            const earnedScore = baseScore * comboMultiplier;
            score += earnedScore;
            
            if (w.broken) totalWindowsBroken++;
            
            rauf.breaking = true;
            rauf.breakAnim = 8;
            
            // Update score display with animation
            scoreDisplay.textContent = `Puan: ${score}`;
            if (comboMultiplier > 1) {
                scoreDisplay.style.color = '#ff00ff';
                setTimeout(() => {
                    scoreDisplay.style.color = '';
                }, 200);
            }
            
            checkWin();
        }
    }

    // Düşman hareketi (yavaş ve cam tamiri)
    function updateEnemies() {
        enemies.forEach((enemy, i) => {
            // Skip stunned enemies
            if (enemy.stunned && enemy.stunnedUntil > Date.now()) {
                return;
            }
            // Clear stun if expired
            if (enemy.stunned && enemy.stunnedUntil <= Date.now()) {
                enemy.stunned = false;
            }
            
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
                combo = 0; // Reset combo on hit
                scoreDisplay.textContent = `Puan: ${score}`;
                messageDisplay.textContent = '⚡ Tamirciye çarptın! -20 puan | Combo sıfırlandı!';
                messageDisplay.style.color = '#ff3131';
                setTimeout(() => {
                    messageDisplay.style.color = '';
                }, 1000);
                enemyCooldowns[i] = 30;
                screenShake();
            }
            if (enemyCooldowns[i] > 0) enemyCooldowns[i]--;
        });
    }

    // Kazanma kontrolü
    function checkWin() {
        if (windows.every(w => w.broken)) {
            gameActive = false;
            const bonusScore = Math.floor(combo * 10);
            score += bonusScore;
            
            if (level >= MAX_LEVEL) {
                messageDisplay.innerHTML = `🏆 TEBRİKLER! Tüm seviyeleri tamamladın!<br>
                    Toplam Puan: ${score} | Max Combo: ${maxCombo}x<br>
                    <span style="font-size: 0.9rem; color: #00f5ff;">Oyunu yeniden başlatmak için bir tuşa bas.</span>`;
            } else {
                messageDisplay.innerHTML = `✨ Seviye ${level} tamamlandı!<br>
                    Combo Bonus: +${bonusScore} | Yeni seviye için bir tuşa bas.`;
            }
            scoreDisplay.textContent = `Puan: ${score}`;
            document.addEventListener('keydown', nextLevelListener, { once: true });
            document.addEventListener('touchstart', nextLevelListener, { once: true });
        }
    }

    // Sonraki seviyeye geçiş
    function nextLevelListener(e) {
        if (e.type === 'touchstart') e.preventDefault();
        
        if (level >= MAX_LEVEL) {
            // Reset game
            level = 1;
            score = 0;
            combo = 0;
            maxCombo = 0;
            totalWindowsBroken = 0;
            strongRate = 0.25;
        } else {
            level++;
            strongRate = Math.min(0.6, strongRate + 0.03);
        }
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
        createComboDisplay();
        createProgressBar();
        scoreDisplay.textContent = `Puan: ${score}`;
        rauf = { x: 2, y: 0, breaking: false, breakAnim: 0 };
        combo = 0;
        
        // Düşman sayısı ve hızı level ile artar, ama hız daha düşük
        enemies = [];
        enemyCooldowns = [];
        const enemyCount = Math.min(1 + Math.floor(level / ENEMIES_PER_LEVEL_DIVISOR), MAX_ENEMIES);
        for (let i = 0; i < enemyCount; i++) {
            enemies.push({
                x: Math.floor(Math.random()*gridWidth),
                y: gridHeight-1,
                dirX: Math.random() < 0.5 ? 1 : -1,
                dirY: -1,
                speed: 0.04 + 0.015*level + Math.random()*0.015,
                pos: 0,
                stunned: false,
                stunnedUntil: 0
            });
            enemyCooldowns.push(0);
        }
        gameActive = true;
        
        const theme = getBuildingColors(level);
        messageDisplay.innerHTML = `
            <b style="color: ${theme.border};">${theme.name}</b> - Seviye ${level}/${MAX_LEVEL}<br>
            <span style="font-size: 0.85rem; color: #888;">
                🎮 WASD/Oklar: Hareket | Space/Enter: Kır | 💥 Düşmana vur: 15sn sersemlet!
            </span>
        `;
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
        strongRate = 0.25 + 0.03 * (level-1);
        score = 0;
        startGame();
        gameLoop();
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            const startScreen = document.getElementById('start-screen');
            const levelButtonsDiv = document.getElementById('level-buttons');
            const btnStart = document.getElementById('btn-start');
            
            // Bölüm butonlarını oluştur (20 seviye)
            for (let i = 1; i <= MAX_LEVEL; i++) {
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
            
            // Add controls hint
            const controlsHint = document.createElement('div');
            controlsHint.id = 'controls-hint';
            controlsHint.innerHTML = `
                <div style="margin-bottom: 8px;"><strong>🎮 Kontroller</strong></div>
                <div>
                    <span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span> 
                    veya 
                    <span class="key">↑</span><span class="key">←</span><span class="key">↓</span><span class="key">→</span> 
                    Hareket
                </div>
                <div style="margin-top: 5px;">
                    <span class="key">SPACE</span> veya <span class="key">ENTER</span> Cam Kır / Düşmana Vur
                </div>
                <div style="margin-top: 8px; color: #ffff00;">
                    💥 Düşmana vurarak 15 saniye sersemlet!
                </div>
                <div style="margin-top: 5px; color: #ff00ff;">
                    🔥 Hızlı kırarak combo yap, puan çarpanı kazan!
                </div>
            `;
            btnStart.parentNode.insertBefore(controlsHint, btnStart);
            
            btnStart.addEventListener('click', () => {
                startScreen.style.display = 'none';
                level = selectedLevel;
                strongRate = 0.25 + 0.03 * (level-1);
                score = 0;
                startGame();
                gameLoop();
            });
        });
    }

    document.addEventListener('keydown', handleKey);

    // Mobil kontroller - Virtual Joystick
    const MOBILE_REPEAT_DELAY = 120; // ms - hareket tekrar hızı
    const JOYSTICK_THRESHOLD = 0.3; // Joystick hassasiyeti (0-1 arası)
    
    let joystickActive = false;
    let joystickInterval = null;
    let currentDirection = null;
    
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
    
    // Virtual Joystick Setup
    function setupJoystick() {
        const joystickContainer = document.getElementById('joystick-container');
        const joystickBase = document.getElementById('joystick-base');
        const joystickThumb = document.getElementById('joystick-thumb');
        
        if (!joystickContainer || !joystickBase || !joystickThumb) return;
        
        let baseRect = null;
        let centerX = 0;
        let centerY = 0;
        let maxDistance = 0;
        
        function updateBaseRect() {
            baseRect = joystickBase.getBoundingClientRect();
            centerX = baseRect.left + baseRect.width / 2;
            centerY = baseRect.top + baseRect.height / 2;
            maxDistance = baseRect.width / 2 - 10;
        }
        
        function getDirection(normalizedX, normalizedY) {
            const absX = Math.abs(normalizedX);
            const absY = Math.abs(normalizedY);
            
            // Check if joystick is moved enough
            if (absX < JOYSTICK_THRESHOLD && absY < JOYSTICK_THRESHOLD) {
                return null;
            }
            
            // Determine primary direction
            if (absX > absY) {
                return normalizedX > 0 ? 'right' : 'left';
            } else {
                return normalizedY > 0 ? 'down' : 'up';
            }
        }
        
        function handleJoystickMove(clientX, clientY) {
            if (!joystickActive) return;
            
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
            const angle = Math.atan2(deltaY, deltaX);
            
            // Calculate thumb position
            const thumbX = Math.cos(angle) * distance;
            const thumbY = Math.sin(angle) * distance;
            
            joystickThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
            
            // Calculate normalized direction (-1 to 1), clamped to valid range
            const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
            const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
            
            const newDirection = getDirection(normalizedX, normalizedY);
            
            if (newDirection !== currentDirection) {
                currentDirection = newDirection;
                
                // Clear previous interval
                if (joystickInterval) {
                    clearInterval(joystickInterval);
                    joystickInterval = null;
                }
                
                // Start new movement if direction exists
                if (currentDirection) {
                    mobileMove(currentDirection); // Initial movement
                    joystickInterval = setInterval(() => {
                        if (currentDirection) mobileMove(currentDirection);
                    }, MOBILE_REPEAT_DELAY);
                }
            }
        }
        
        function handleJoystickStart(e) {
            e.preventDefault();
            updateBaseRect();
            joystickActive = true;
            joystickThumb.classList.add('active');
            
            const touch = e.touches ? e.touches[0] : e;
            handleJoystickMove(touch.clientX, touch.clientY);
        }
        
        function handleJoystickEnd(e) {
            e.preventDefault();
            joystickActive = false;
            currentDirection = null;
            joystickThumb.classList.remove('active');
            joystickThumb.style.transform = 'translate(-50%, -50%)';
            
            if (joystickInterval) {
                clearInterval(joystickInterval);
                joystickInterval = null;
            }
        }
        
        function handleJoystickMoveEvent(e) {
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            handleJoystickMove(touch.clientX, touch.clientY);
        }
        
        // Touch events
        joystickContainer.addEventListener('touchstart', handleJoystickStart, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (joystickActive) handleJoystickMoveEvent(e);
        }, { passive: false });
        document.addEventListener('touchend', (e) => {
            if (joystickActive) handleJoystickEnd(e);
        }, { passive: false });
        document.addEventListener('touchcancel', (e) => {
            if (joystickActive) handleJoystickEnd(e);
        }, { passive: false });
        
        // Mouse events for desktop testing
        joystickContainer.addEventListener('mousedown', handleJoystickStart);
        document.addEventListener('mousemove', (e) => {
            if (joystickActive) handleJoystickMove(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', handleJoystickEnd);
        
        // Update base rect on resize
        window.addEventListener('resize', updateBaseRect);
    }
    
    // Break button setup
    function setupBreakButton(btn) {
        if (!btn) return;
        
        function handleBreakStart(e) {
            e.preventDefault();
            btn.classList.add('active');
            mobileBreak();
        }
        
        function handleBreakEnd(e) {
            e.preventDefault();
            btn.classList.remove('active');
        }
        
        // Touch events
        btn.addEventListener('touchstart', handleBreakStart, { passive: false });
        btn.addEventListener('touchend', handleBreakEnd, { passive: false });
        btn.addEventListener('touchcancel', handleBreakEnd, { passive: false });
        
        // Mouse events
        btn.addEventListener('mousedown', handleBreakStart);
        btn.addEventListener('mouseup', handleBreakEnd);
        btn.addEventListener('mouseleave', handleBreakEnd);
    }
    
    // Initialize controls
    setupJoystick();
    setupBreakButton(document.getElementById('btn-break'));

    // startGame();
    // gameLoop();
});
