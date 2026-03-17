// Controlador de la Vista de Jugadores (player.html)
window.Carrera = window.Carrera || {};

window.Carrera.playerView = (function() {
    var typeTimer = null;
    var audioReady = false;
    var pendingAmbient = null; // Store ambient preset to play when audio activates

    // Scene illustrations - emoji art compositions per scene
    var sceneIllustrations = {
        'bg-forest-clearing': {
            art: '🌳🌿🌳\n  🦊🐈‍⬛\n🍃 🗺️ 🍃\n  🌱🌱',
            frame: 'forest'
        },
        'bg-river': {
            art: '  🌲  🌲\n💧🪨💧🪨💧\n~~ 🦊🐈‍⬛ ~~\n💧🪨💧🪨💧',
            frame: 'river'
        },
        'bg-tunnel': {
            art: '🪨🪨🪨🪨🪨\n🕯️  👀👀  🕯️\n  ✨ ↓ ✨\n🪨🪨🪨🪨🪨',
            frame: 'tunnel'
        },
        'bg-den': {
            art: '  🏠\n🫖 🦡 🍪\n💢"¡FUERA!"💢\n  🐾🐾',
            frame: 'den'
        },
        'bg-treasure': {
            art: '   🌳\n🪨🪨🔒🪨🪨\n✨💎👑💎✨\n  🗝️❓',
            frame: 'treasure'
        },
        'bg-victory': {
            art: '⭐🏆⭐\n🎆💎🎆\n🦊🎉🐈‍⬛\n🎊🎊🎊',
            frame: 'victory'
        }
    };

    function init() {
        window.Carrera.sync.init('player');

        window.Carrera.sync.onMessage(function(msg) {
            dispatch(msg.type, msg.data);
        });

        // Activate audio on ANY user interaction
        var activateOnce = function() {
            if (!audioReady) {
                activateAudio();
            }
            document.removeEventListener('click', activateOnce);
            document.removeEventListener('touchstart', activateOnce);
        };
        document.addEventListener('click', activateOnce);
        document.addEventListener('touchstart', activateOnce);

        showWaiting();
    }

    function activateAudio() {
        if (audioReady) return;
        try {
            window.Carrera.audio.init();
            window.Carrera.audio.resume();
            audioReady = true;
            // Play pending ambient
            if (pendingAmbient) {
                window.Carrera.audio.playAmbient(pendingAmbient);
                pendingAmbient = null;
            }
        } catch (e) {}
    }

    // Dispatch ALL messages immediately - only audio calls are gated
    function dispatch(type, data) {
        switch (type) {
            case 'scene_load': handleSceneLoad(data); break;
            case 'narrative_show': handleNarrativeShow(data); break;
            case 'choices_show': handleChoicesShow(data); break;
            case 'choices_hide': handleChoicesHide(); break;
            case 'dice_roll': handleDiceRoll(data); break;
            case 'outcome_show': handleOutcomeShow(data); break;
            case 'status_update': handleStatusUpdate(data); break;
            case 'effect_play': handleEffectPlay(data); break;
            case 'confetti': launchConfetti(); break;
            case 'custom_text': handleCustomText(data); break;
            case 'victory': handleVictory(data); break;
            case 'volume_change': handleVolumeChange(data); break;
            case 'ambient_change': handleAmbientChange(data); break;
        }
    }

    function showWaiting() {
        var main = document.getElementById('player-main');
        if (main) {
            main.innerHTML =
                '<div class="waiting-screen">' +
                '<span class="waiting-emoji">🐾</span>' +
                '<div class="waiting-text">Esperando al Game Master...</div>' +
                '<div class="waiting-sub">La aventura comenzará pronto</div>' +
                '<button class="btn-activate-audio" id="btn-activate">🔊 Toca para activar sonido</button>' +
                '</div>';

            document.getElementById('btn-activate').addEventListener('click', function() {
                activateAudio();
                this.textContent = '✅ ¡Sonido activado!';
                this.style.background = 'rgba(34, 197, 94, 0.3)';
                this.style.animation = 'none';
            });
        }
    }

    // === SAFE audio helpers — never crash if audio not ready ===
    function safePlayAmbient(preset) {
        if (audioReady) {
            window.Carrera.audio.playAmbient(preset);
        } else {
            pendingAmbient = preset;
        }
    }

    function safePlayEffect(effect) {
        if (!audioReady) return;
        var audio = window.Carrera.audio;
        var fn = {
            click: audio.playClick, dice_roll: audio.playDiceRoll,
            success: audio.playSuccess, critical: audio.playCritical,
            failure: audio.playFailure, hijinx: audio.playHijinx,
            triumph: audio.playTriumph, clock_tick: audio.playClockTick,
            clock_alarm: audio.playClockAlarm,
            scene_transition: audio.playSceneTransition,
            suspense: audio.playSuspense
        }[effect];
        if (fn) fn();
    }

    // === Scene Load ===
    function handleSceneLoad(data) {
        cancelTyping();

        var bgEl = document.getElementById('player-background');
        var main = document.getElementById('player-main');

        // Fade out
        if (main) {
            main.style.transition = 'opacity 0.3s ease';
            main.style.opacity = '0';
        }

        setTimeout(function() {
            if (bgEl) {
                bgEl.className = 'scene-background ' + (data.backgroundClass || '');
                renderBackgroundExtras(bgEl, data.backgroundClass);
            }

            safePlayAmbient(data.ambientPreset);

            // Build scene with illustration
            var illustration = sceneIllustrations[data.backgroundClass];
            var illustrationHtml = '';
            if (illustration) {
                illustrationHtml =
                    '<div class="scene-illustration scene-illustration-' + illustration.frame + '">' +
                    '<pre class="scene-art">' + illustration.art + '</pre>' +
                    '</div>';
            }

            if (main) {
                main.innerHTML =
                    '<div class="scene-content-player">' +
                    '<h2 id="player-scene-title" class="player-title">' + esc(data.emoji || '') + ' ' + esc(data.titulo || '') + '</h2>' +
                    illustrationHtml +
                    '<div id="player-narrative" class="player-narrative" style="display:none;"></div>' +
                    '<div id="player-dice-area" class="dice-area"></div>' +
                    '<div id="player-choices" class="player-choices"></div>' +
                    '<div id="player-outcome" class="player-outcome"></div>' +
                    '</div>';

                setTimeout(function() { main.style.opacity = '1'; }, 50);
            }

            updateStatusDisplay(data);
        }, 300);
    }

    // === Narrative ===
    function handleNarrativeShow(data) {
        var el = document.getElementById('player-narrative');
        if (!el) return;
        el.textContent = '';
        el.style.display = 'block';
        el.classList.add('typing');
        typeText(el, data.text || '', function() {
            el.classList.remove('typing');
        });
    }

    // === Choices ===
    function handleChoicesShow(data) {
        var el = document.getElementById('player-choices');
        if (!el) return;
        el.innerHTML = '';
        el.style.opacity = '0';

        if (data.choices && data.choices.length > 0) {
            data.choices.forEach(function(choice, i) {
                var div = document.createElement('div');
                div.className = 'choice-btn';
                div.style.animationDelay = (i * 0.15) + 's';
                div.innerHTML =
                    '<span class="choice-emoji">' + esc(choice.emoji || '') + '</span>' +
                    '<span class="choice-text">' + esc(choice.texto || '') + '</span>';

                if (choice.badge) {
                    div.innerHTML += '<span class="choice-badge ' + (choice.badgeClass || '') + '">' + esc(choice.badge) + '</span>';
                }
                el.appendChild(div);
            });

            setTimeout(function() { el.style.opacity = '1'; }, 100);
        }
    }

    function handleChoicesHide() {
        var el = document.getElementById('player-choices');
        if (el) {
            el.style.opacity = '0';
            setTimeout(function() { el.innerHTML = ''; }, 400);
        }
    }

    // === Dice ===
    function handleDiceRoll(data) {
        var diceArea = document.getElementById('player-dice-area');
        if (!diceArea || !data.rollResult) return;

        var outcomeEl = document.getElementById('player-outcome');
        if (outcomeEl) { outcomeEl.style.display = 'none'; outcomeEl.innerHTML = ''; }

        // Hide illustration during dice
        var illEl = document.querySelector('.scene-illustration');
        if (illEl) illEl.style.display = 'none';

        window.Carrera.dice.animateRollPredetermined(diceArea, data.rollResult, function() {});
    }

    // === Outcome ===
    function handleOutcomeShow(data) {
        var el = document.getElementById('player-outcome');
        if (!el) return;

        // Hide illustration to make room
        var illEl = document.querySelector('.scene-illustration');
        if (illEl) illEl.style.display = 'none';

        el.style.display = 'block';
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'slideUp 0.4s ease-out';
        el.innerHTML = '';

        if (data.banner) {
            var bannerEl = document.createElement('div');
            bannerEl.className = data.bannerClass || 'auto-success-banner';
            bannerEl.textContent = data.banner;
            el.appendChild(bannerEl);
        }

        if (data.text) {
            var textEl = document.createElement('p');
            textEl.className = 'outcome-text';
            textEl.textContent = data.text;
            el.appendChild(textEl);
        }

        if (data.clockWarning) {
            var warnEl = document.createElement('div');
            warnEl.className = 'clock-warning';
            warnEl.textContent = data.clockWarning;
            el.appendChild(warnEl);
        }

        // Show "waiting for GM" indicator
        var waitEl = document.createElement('div');
        waitEl.className = 'player-waiting-gm';
        waitEl.innerHTML = '<span class="waiting-dots">La aventura continúa</span>';
        el.appendChild(waitEl);
    }

    // === Status ===
    function handleStatusUpdate(data) { updateStatusDisplay(data); }

    function updateStatusDisplay(data) {
        if (!data) return;

        var dieDisplay = document.getElementById('player-die-display');
        if (dieDisplay && data.currentDie) {
            dieDisplay.textContent = '🎲 d' + data.currentDie;
        }

        var clockDisplay = document.getElementById('player-clock-display');
        if (clockDisplay && typeof data.clockFilled !== 'undefined') {
            clockDisplay.innerHTML = '';
            for (var i = 0; i < 4; i++) {
                var seg = document.createElement('div');
                seg.className = 'clock-segment' + (i < data.clockFilled ? ' filled' : '');
                clockDisplay.appendChild(seg);
            }
        }

        var sceneCounter = document.getElementById('player-scene-counter');
        if (sceneCounter && data.sceneLabel) {
            sceneCounter.textContent = data.sceneLabel;
        }
    }

    // === Effects ===
    function handleEffectPlay(data) {
        safePlayEffect(data.effect);
    }

    // === Custom Text ===
    function handleCustomText(data) {
        var el = document.getElementById('player-narrative');
        if (!el) {
            var main = document.getElementById('player-main');
            if (main) {
                main.innerHTML =
                    '<div class="scene-content-player">' +
                    '<div id="player-narrative" class="player-narrative"></div>' +
                    '</div>';
                el = document.getElementById('player-narrative');
            }
        }
        if (!el) return;
        el.textContent = '';
        el.style.display = 'block';
        el.classList.add('typing');
        typeText(el, data.text || '', function() {
            el.classList.remove('typing');
        });
    }

    // === Victory ===
    function handleVictory(data) {
        var main = document.getElementById('player-main');
        if (!main) return;

        main.style.transition = 'opacity 0.3s ease';
        main.style.opacity = '0';

        var bgEl = document.getElementById('player-background');

        setTimeout(function() {
            if (bgEl) {
                bgEl.className = 'scene-background bg-victory';
                renderBackgroundExtras(bgEl, 'bg-victory');
            }

            var teamHtml = '<div class="victory-team">';
            if (data.team) {
                data.team.forEach(function(p) {
                    teamHtml += '<div class="victory-character"><span class="victory-emoji">' + esc(p.emoji) + '</span><span>' + esc(p.nombre) + '</span></div>';
                });
            }
            teamHtml += '</div>';

            var victoryIll = sceneIllustrations['bg-victory'];

            main.innerHTML =
                '<div class="scene-content-player victory-content">' +
                '<h2 class="player-title victory-title">' + esc(data.emoji || '🏆') + ' ' + esc(data.titulo || '¡VICTORIA!') + '</h2>' +
                (victoryIll ? '<div class="scene-illustration scene-illustration-victory"><pre class="scene-art">' + victoryIll.art + '</pre></div>' : '') +
                '<div id="player-narrative" class="player-narrative"></div>' +
                teamHtml +
                '<div class="victory-message">🏆 ¡Aventura completada! 🏆</div>' +
                '<div class="victory-stats">' +
                '<span>📍 Escenas: ' + (data.sceneNumber || 5) + '</span>' +
                '<span>🎲 Dado final: d' + (data.currentDie || 8) + '</span>' +
                '<span>⏰ Reloj total: ' + (data.clockTotal || 0) + '</span>' +
                '</div>' +
                '</div>';

            main.style.opacity = '1';

            var narEl = document.getElementById('player-narrative');
            if (narEl && data.narrativa) {
                narEl.style.display = 'block';
                typeText(narEl, data.narrativa, function() {});
            }
        }, 300);
    }

    // === Volume ===
    function handleVolumeChange(data) {
        if (!audioReady) return;
        if (typeof data.ambient !== 'undefined') window.Carrera.audio.setAmbientVolume(data.ambient);
        if (typeof data.sfx !== 'undefined') window.Carrera.audio.setSfxVolume(data.sfx);
        if (typeof data.muted !== 'undefined') {
            if (data.muted !== window.Carrera.audio.isMuted()) {
                window.Carrera.audio.toggleMute();
            }
        }
    }

    function handleAmbientChange(data) {
        if (data.preset) safePlayAmbient(data.preset);
    }

    // === Typing ===
    function cancelTyping() {
        if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
    }

    function typeText(element, text, callback) {
        cancelTyping();
        var i = 0;
        var speed = 18;
        element.textContent = '';

        function skipToEnd() {
            cancelTyping();
            element.textContent = text;
            element.removeEventListener('click', skipToEnd);
            if (callback) callback();
        }

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                typeTimer = setTimeout(type, speed);
            } else {
                element.removeEventListener('click', skipToEnd);
                if (callback) callback();
            }
        }

        element.addEventListener('click', skipToEnd);
        type();
    }

    // === Background Extras ===
    function renderBackgroundExtras(bgEl, bgClass) {
        var oldExtras = bgEl.querySelectorAll('.bg-extra');
        oldExtras.forEach(function(el) { el.remove(); });

        var configs = {
            'bg-forest-clearing': { count: 12, create: function() {
                var el = document.createElement('div');
                el.className = 'bg-extra floating-leaf';
                el.textContent = ['🍃', '🍂', '🌿', '🌸'][Math.floor(Math.random() * 4)];
                el.style.left = Math.random() * 100 + '%';
                el.style.animationDelay = Math.random() * 8 + 's';
                el.style.animationDuration = (5 + Math.random() * 7) + 's';
                el.style.fontSize = (1.2 + Math.random() * 1.8) + 'rem';
                return el;
            }},
            'bg-tunnel': { count: 20, create: function() {
                var el = document.createElement('div');
                el.className = 'bg-extra bg-firefly';
                el.style.left = (3 + Math.random() * 94) + '%';
                el.style.top = (3 + Math.random() * 94) + '%';
                el.style.animationDelay = Math.random() * 5 + 's';
                el.style.animationDuration = (2 + Math.random() * 5) + 's';
                return el;
            }},
            'bg-treasure': { count: 22, create: function() {
                var el = document.createElement('div');
                el.className = 'bg-extra bg-sparkle';
                el.textContent = ['✨', '💫', '⭐', '🌟', '💎'][Math.floor(Math.random() * 5)];
                el.style.left = (3 + Math.random() * 94) + '%';
                el.style.top = (3 + Math.random() * 94) + '%';
                el.style.animationDelay = Math.random() * 3 + 's';
                el.style.animationDuration = (1 + Math.random() * 2.5) + 's';
                el.style.fontSize = (0.8 + Math.random() * 2.5) + 'rem';
                return el;
            }},
            'bg-river': { count: 8, create: function() {
                var el = document.createElement('div');
                el.className = 'bg-extra bg-splash';
                el.textContent = ['💧', '🫧'][Math.floor(Math.random() * 2)];
                el.style.left = (5 + Math.random() * 90) + '%';
                el.style.top = (35 + Math.random() * 20) + '%';
                el.style.animationDelay = Math.random() * 4 + 's';
                el.style.animationDuration = (2 + Math.random() * 2) + 's';
                el.style.fontSize = (1 + Math.random()) + 'rem';
                return el;
            }},
            'bg-den': { count: 5, create: function() {
                var el = document.createElement('div');
                el.className = 'bg-extra bg-sparkle';
                el.textContent = ['🕯️', '☕', '🍪'][Math.floor(Math.random() * 3)];
                el.style.left = (20 + Math.random() * 60) + '%';
                el.style.top = (40 + Math.random() * 40) + '%';
                el.style.animationDelay = Math.random() * 3 + 's';
                el.style.animationDuration = (2 + Math.random() * 3) + 's';
                el.style.fontSize = (1 + Math.random()) + 'rem';
                return el;
            }},
            'bg-victory': { count: 30, create: function() {
                var el = document.createElement('div');
                el.className = 'bg-extra bg-star';
                el.textContent = ['⭐', '🌟', '✨', '💫', '🎆'][Math.floor(Math.random() * 5)];
                el.style.left = Math.random() * 100 + '%';
                el.style.top = Math.random() * 100 + '%';
                el.style.animationDelay = Math.random() * 3 + 's';
                el.style.animationDuration = (0.8 + Math.random() * 2.5) + 's';
                el.style.fontSize = (0.8 + Math.random() * 3) + 'rem';
                return el;
            }}
        };

        var cfg = configs[bgClass];
        if (cfg) {
            for (var i = 0; i < cfg.count; i++) {
                bgEl.appendChild(cfg.create());
            }
        }
    }

    // === Confetti ===
    function launchConfetti() {
        var container = document.getElementById('confetti-container');
        if (!container) return;
        container.style.display = 'block';

        var colors = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#e63946', '#a855f7', '#3b82f6', '#10b981', '#f43f5e'];
        var shapes = ['confetti-piece', 'confetti-piece confetti-circle', 'confetti-piece confetti-strip'];

        for (var i = 0; i < 70; i++) {
            var piece = document.createElement('div');
            piece.className = shapes[Math.floor(Math.random() * shapes.length)];
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (2 + Math.random() * 3) + 's';
            var size = 8 + Math.random() * 14;
            piece.style.width = size + 'px';
            piece.style.height = size + 'px';
            container.appendChild(piece);
        }

        setTimeout(function() {
            var pieces = container.querySelectorAll('.confetti-piece');
            pieces.forEach(function(p) { p.remove(); });
        }, 7000);
    }

    // === Helpers ===
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return { init: init };
})();
