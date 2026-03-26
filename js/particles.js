// Particle system — canvas overlay for cinematic scene effects
window.Carrera = window.Carrera || {};

window.Carrera.particles = (function() {
    var canvas = null;
    var ctx = null;
    var particles = [];
    var animId = null;
    var currentPreset = null;
    var MAX_PARTICLES = 100;

    // Preset configurations per scene type
    var presets = {
        forest: {
            spawnRate: 0.3,
            maxCount: 25,
            create: function() {
                return {
                    x: Math.random() * canvas.width,
                    y: -10,
                    vx: (Math.random() - 0.3) * 0.8,
                    vy: 0.3 + Math.random() * 0.6,
                    size: 8 + Math.random() * 12,
                    opacity: 0.3 + Math.random() * 0.4,
                    life: 1,
                    decay: 0.001 + Math.random() * 0.002,
                    rotation: Math.random() * 360,
                    rotSpeed: (Math.random() - 0.5) * 2,
                    type: 'leaf',
                    color: ['#7cb342', '#8bc34a', '#c0ca33', '#ff8f00'][Math.floor(Math.random() * 4)]
                };
            }
        },
        river: {
            spawnRate: 0.15,
            maxCount: 20,
            create: function() {
                var isMist = Math.random() > 0.5;
                return {
                    x: -20,
                    y: canvas.height * (0.3 + Math.random() * 0.4),
                    vx: 0.3 + Math.random() * 0.5,
                    vy: (Math.random() - 0.5) * 0.2,
                    size: isMist ? (30 + Math.random() * 50) : (3 + Math.random() * 5),
                    opacity: isMist ? (0.05 + Math.random() * 0.08) : (0.4 + Math.random() * 0.4),
                    life: 1,
                    decay: 0.002 + Math.random() * 0.002,
                    type: isMist ? 'mist' : 'droplet',
                    color: isMist ? 'rgba(200,220,255,' : 'rgba(150,200,255,'
                };
            }
        },
        tunnel: {
            spawnRate: 0.2,
            maxCount: 30,
            create: function() {
                return {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: -0.1 + (Math.random() - 0.5) * 0.2,
                    size: 2 + Math.random() * 4,
                    opacity: 0.001,
                    fadeIn: true,
                    maxOpacity: 0.4 + Math.random() * 0.5,
                    life: 1,
                    decay: 0.003 + Math.random() * 0.003,
                    phase: Math.random() * Math.PI * 2,
                    type: 'firefly',
                    color: '#c8ff64'
                };
            }
        },
        den: {
            spawnRate: 0.08,
            maxCount: 15,
            create: function() {
                return {
                    x: canvas.width * (0.2 + Math.random() * 0.6),
                    y: canvas.height * 0.7 + Math.random() * canvas.height * 0.2,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: -0.2 - Math.random() * 0.3,
                    size: 2 + Math.random() * 3,
                    opacity: 0.2 + Math.random() * 0.3,
                    life: 1,
                    decay: 0.003 + Math.random() * 0.004,
                    type: 'dust',
                    color: 'rgba(210,180,140,'
                };
            }
        },
        treasure: {
            spawnRate: 0.4,
            maxCount: 40,
            create: function() {
                return {
                    x: canvas.width * (0.2 + Math.random() * 0.6),
                    y: canvas.height * (0.3 + Math.random() * 0.5),
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -0.3 - Math.random() * 0.5,
                    size: 2 + Math.random() * 5,
                    opacity: 0.5 + Math.random() * 0.5,
                    life: 1,
                    decay: 0.005 + Math.random() * 0.005,
                    type: 'sparkle',
                    phase: Math.random() * Math.PI * 2,
                    color: ['#ffd700', '#fff8dc', '#ffa500', '#fffacd'][Math.floor(Math.random() * 4)]
                };
            }
        },
        victory: {
            spawnRate: 0.5,
            maxCount: 50,
            create: function() {
                return {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: -0.2 - Math.random() * 0.3,
                    size: 2 + Math.random() * 4,
                    opacity: 0.3 + Math.random() * 0.6,
                    life: 1,
                    decay: 0.003 + Math.random() * 0.004,
                    type: 'star',
                    phase: Math.random() * Math.PI * 2,
                    color: ['#ffd700', '#e9c46a', '#a855f7', '#3b82f6', '#f43f5e', '#10b981'][Math.floor(Math.random() * 6)]
                };
            }
        }
    };

    // Map background classes to preset names
    var bgToPreset = {
        'bg-forest-clearing': 'forest',
        'bg-river': 'river',
        'bg-tunnel': 'tunnel',
        'bg-den': 'den',
        'bg-treasure': 'treasure',
        'bg-victory': 'victory'
    };

    function init() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function start(bgClass) {
        var presetName = bgToPreset[bgClass];
        if (!presetName) { stop(); return; }

        init();
        currentPreset = presets[presetName];
        particles = [];

        if (!animId) {
            loop();
        }
    }

    function stop() {
        currentPreset = null;
        particles = [];
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function loop() {
        if (!currentPreset || !ctx) {
            animId = null;
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Spawn new particles
        if (particles.length < Math.min(currentPreset.maxCount, MAX_PARTICLES) && Math.random() < currentPreset.spawnRate) {
            particles.push(currentPreset.create());
        }

        // Update & draw
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            // Fade-in for particles that start invisible (e.g. fireflies)
            if (p.fadeIn && p.opacity < p.maxOpacity) {
                p.opacity = Math.min(p.opacity + 0.008, p.maxOpacity);
            }

            if (p.life <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50 || p.y < -50) {
                particles.splice(i, 1);
                continue;
            }

            drawParticle(p);
        }

        animId = requestAnimationFrame(loop);
    }

    function drawParticle(p) {
        ctx.save();
        var alpha = p.opacity * Math.min(p.life, 1);

        switch (p.type) {
            case 'leaf':
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation + (Date.now() * p.rotSpeed * 0.01)) * Math.PI / 180);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
                // Leaf vein
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(-p.size * 0.4, 0);
                ctx.lineTo(p.size * 0.4, 0);
                ctx.stroke();
                break;

            case 'mist':
                ctx.globalAlpha = alpha;
                var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, p.color + '0.08)');
                grad.addColorStop(1, p.color + '0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'droplet':
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color + alpha + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'firefly':
                var flicker = Math.sin(Date.now() * 0.003 + p.phase) * 0.5 + 0.5;
                ctx.globalAlpha = alpha * flicker;
                // Glow
                var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                glow.addColorStop(0, 'rgba(200,255,100,0.3)');
                glow.addColorStop(1, 'rgba(200,255,100,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fill();
                // Core
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'dust':
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color + alpha + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'sparkle':
                var sparkleFlicker = Math.sin(Date.now() * 0.005 + p.phase) * 0.3 + 0.7;
                ctx.globalAlpha = alpha * sparkleFlicker;
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                // 4-point star
                var s = p.size;
                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.lineTo(s * 0.3, -s * 0.3);
                ctx.lineTo(s, 0);
                ctx.lineTo(s * 0.3, s * 0.3);
                ctx.lineTo(0, s);
                ctx.lineTo(-s * 0.3, s * 0.3);
                ctx.lineTo(-s, 0);
                ctx.lineTo(-s * 0.3, -s * 0.3);
                ctx.closePath();
                ctx.fill();
                break;

            case 'star':
                var starFlicker = Math.sin(Date.now() * 0.004 + p.phase) * 0.3 + 0.7;
                ctx.globalAlpha = alpha * starFlicker;
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                // Simple diamond
                var sz = p.size;
                ctx.beginPath();
                ctx.moveTo(0, -sz);
                ctx.lineTo(sz * 0.4, 0);
                ctx.lineTo(0, sz);
                ctx.lineTo(-sz * 0.4, 0);
                ctx.closePath();
                ctx.fill();
                // Cross glow
                ctx.globalAlpha = alpha * starFlicker * 0.3;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-sz * 1.5, 0);
                ctx.lineTo(sz * 1.5, 0);
                ctx.moveTo(0, -sz * 1.5);
                ctx.lineTo(0, sz * 1.5);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    return {
        start: start,
        stop: stop,
        resize: resize
    };
})();
