// Controlador de la Vista de Jugadores (player.html)
window.Carrera = window.Carrera || {};

window.Carrera.playerView = (function() {
    var typeTimer = null;
    var audioReady = false;
    var pendingAmbient = null; // Store ambient preset to play when audio activates
    var cinematicMode = false; // true when AI images are available
    var showingChapterCard = false;
    var pendingMessages = [];
    var chapterCardTimer = null;
    var pendingChoices = null;  // Buffer choices until narrative typing finishes
    var narrativeFinished = false;

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

        // Always apply cinematic UI enhancements (serif fonts, glassmorphism, etc.)
        document.querySelector('.player-wrap').classList.add('has-cinematic-ui');

        // Preload images — sets cinematicMode for parallax + cinematic transitions
        if (window.Carrera.images) {
            window.Carrera.images.preloadAll().then(function() {
                var anyScene = ['bg-forest-clearing', 'bg-river', 'bg-tunnel', 'bg-den', 'bg-treasure', 'bg-victory']
                    .some(function(bg) { return window.Carrera.images.isAvailable(bg); });
                if (anyScene) {
                    cinematicMode = true;
                }
            });
        }

        // Parallax on mousemove (subtle, 2% max)
        document.addEventListener('mousemove', function(e) {
            if (!cinematicMode) return;
            var bgEl = document.getElementById('player-background');
            if (!bgEl || !bgEl.classList.contains('has-image')) return;
            var xOff = ((e.clientX / window.innerWidth) - 0.5) * 2; // -1 to 1
            var yOff = ((e.clientY / window.innerHeight) - 0.5) * 2;
            bgEl.style.backgroundPosition = (50 + xOff * 2) + '% ' + (50 + yOff * 2) + '%';
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

    function flushPendingMessages() {
        showingChapterCard = false;
        var msgs = pendingMessages.slice();
        pendingMessages = [];
        msgs.forEach(function(msg) {
            dispatch(msg.type, msg.data);
        });
    }

    // Dispatch ALL messages immediately - only audio calls are gated
    function dispatch(type, data) {
        // Buffer narrative/choices during chapter card reveal
        if (showingChapterCard && (type === 'narrative_show' || type === 'choices_show')) {
            pendingMessages.push({ type: type, data: data });
            return;
        }
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
            case 'team_show': handleTeamShow(data); break;
            case 'team_hide': handleTeamHide(); break;
            case 'roll_prompt': handleRollPrompt(data); break;
            case 'character_selection': handleCharacterSelection(data); break;
            case 'team_confirmed': handleTeamConfirmed(data); break;
            case 'level_up': handleLevelUp(data); break;
            case 'badge_earned': handleBadgeEarned(data); break;
            case 'loot_reveal': handleLootReveal(data); break;
        }
    }

    function showWaiting() {
        // Set illustrated forest background (matching GM title screen)
        var bgEl = document.getElementById('player-background');
        var images = window.Carrera.images;
        var forestSrc = images ? images.getSceneSrc('bg-forest-clearing') : null;
        if (bgEl) {
            if (forestSrc) {
                bgEl.className = 'scene-background has-image has-cinematic bg-forest-clearing';
                bgEl.style.backgroundImage = 'url(' + forestSrc + ')';
            } else {
                bgEl.className = 'scene-background bg-forest-clearing';
            }
        }

        var main = document.getElementById('player-main');
        if (main) {
            main.innerHTML =
                '<div class="waiting-screen">' +
                '<div class="waiting-title-block">' +
                '<h1 class="waiting-game-title">¡A la Carrera!</h1>' +
                '<p class="waiting-game-sub">Aventuras en el Bosque de Bristley</p>' +
                '</div>' +
                '<div id="player-char-selection" class="player-char-selection"></div>' +
                '<div class="waiting-sub">Esperando al Game Master...</div>' +
                '</div>';
        }
        // Start ambient particles
        if (window.Carrera.particles) {
            window.Carrera.particles.start('bg-forest-clearing');
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
        // Cancel any pending chapter card from previous scene
        if (chapterCardTimer) { clearTimeout(chapterCardTimer); chapterCardTimer = null; }
        showingChapterCard = false;
        pendingMessages = [];
        pendingChoices = null;
        narrativeFinished = false;
        // Store scene number from GM
        lastSceneNum = data.sceneNum || null;

        var bgEl = document.getElementById('player-background');
        var main = document.getElementById('player-main');
        var overlay = document.getElementById('scene-transition-overlay');
        var bgClass = data.backgroundClass || '';
        var images = window.Carrera.images;
        var sceneSrc = images ? images.getSceneSrc(bgClass) : null;
        var isVictory = bgClass === 'bg-victory';
        var skipChapterCard = isVictory || data.resend;

        // Stop previous particles
        if (window.Carrera.particles) {
            window.Carrera.particles.stop();
        }

        if (sceneSrc && overlay) {
            // === Cinematic transition: fade through black + chapter card ===
            overlay.classList.add('active');

            setTimeout(function() {
                applySceneBackground(bgEl, bgClass, sceneSrc);
                safePlayAmbient(data.ambientPreset);
                updateStatusDisplay(data);

                if (window.Carrera.particles) {
                    window.Carrera.particles.start(bgClass);
                }

                if (!skipChapterCard) {
                    // Show dramatic chapter card
                    showChapterCard(main, data, sceneSrc);
                    showingChapterCard = true;

                    // Reveal (shows chapter card)
                    setTimeout(function() {
                        overlay.classList.remove('active');
                        if (main) main.style.opacity = '1';
                    }, 100);

                    // After chapter card, build real content and flush buffered messages
                    chapterCardTimer = setTimeout(function() {
                        chapterCardTimer = null;
                        buildSceneContent(main, data, sceneSrc);
                        flushPendingMessages();
                    }, 3000);
                } else {
                    // Victory: no chapter card, just reveal
                    buildSceneContent(main, data, sceneSrc);
                    setTimeout(function() {
                        overlay.classList.remove('active');
                        if (main) main.style.opacity = '1';
                    }, 100);
                }
            }, 450);
        } else {
            // === Fallback: fade + chapter card ===
            if (main) {
                main.style.transition = 'opacity 0.3s ease';
                main.style.opacity = '0';
            }

            setTimeout(function() {
                applySceneBackground(bgEl, bgClass, null);
                safePlayAmbient(data.ambientPreset);
                updateStatusDisplay(data);

                if (window.Carrera.particles) {
                    window.Carrera.particles.start(bgClass);
                }

                if (!skipChapterCard) {
                    showChapterCard(main, data, null);
                    showingChapterCard = true;
                    if (main) setTimeout(function() { main.style.opacity = '1'; }, 50);

                    chapterCardTimer = setTimeout(function() {
                        chapterCardTimer = null;
                        buildSceneContent(main, data, null);
                        flushPendingMessages();
                    }, 3000);
                } else {
                    buildSceneContent(main, data, null);
                    if (main) setTimeout(function() { main.style.opacity = '1'; }, 50);
                }
            }, 300);
        }
    }

    // === Chapter Card ===
    function showChapterCard(main, data, sceneSrc) {
        if (!main) return;
        var sceneNum = lastSceneNum;

        main.innerHTML =
            '<div class="chapter-card-overlay">' +
            (sceneNum ? '<div class="chapter-number">Capítulo ' + sceneNum + '</div>' : '') +
            '<div class="chapter-divider"></div>' +
            '<div class="chapter-emoji">' + esc(data.emoji || '') + '</div>' +
            '<div class="chapter-title">' + esc(data.titulo || '') + '</div>' +
            '</div>';
    }

    // Scene number is now sent directly from GM via scene_load message
    var lastSceneNum = null;

    function applySceneBackground(bgEl, bgClass, sceneSrc) {
        if (!bgEl) return;
        // Always clear leftover bg-extra elements from previous scene
        var oldExtras = bgEl.querySelectorAll('.bg-extra');
        oldExtras.forEach(function(el) { el.remove(); });

        if (sceneSrc) {
            bgEl.className = 'scene-background has-image has-cinematic ' + bgClass;
            bgEl.style.backgroundImage = 'url(' + sceneSrc + ')';
            bgEl.style.backgroundPosition = '50% 50%';
        } else {
            bgEl.className = 'scene-background ' + bgClass;
            bgEl.style.backgroundImage = '';
            bgEl.style.backgroundPosition = '';
            renderBackgroundExtras(bgEl, bgClass);
        }
    }

    function buildSceneContent(main, data, sceneSrc) {
        if (!main) return;

        // Only show emoji illustrations when there's no background image
        var illustration = sceneSrc ? null : sceneIllustrations[data.backgroundClass];
        var illustrationHtml = '';
        if (illustration) {
            illustrationHtml =
                '<div class="scene-illustration scene-illustration-' + illustration.frame + '">' +
                '<pre class="scene-art">' + illustration.art + '</pre>' +
                '</div>';
        }

        main.innerHTML =
            '<div class="scene-content-player">' +
            '<h2 id="player-scene-title" class="player-title">' + esc(data.emoji || '') + ' ' + esc(data.titulo || '') + '</h2>' +
            illustrationHtml +
            '<div id="player-narrative" class="player-narrative" style="display:none;"></div>' +
            '<div id="player-dice-area" class="dice-area"></div>' +
            '<div id="player-choices" class="player-choices"></div>' +
            '<div id="player-outcome" class="player-outcome"></div>' +
            '</div>';
    }

    // === Narrative ===
    function handleNarrativeShow(data) {
        var el = document.getElementById('player-narrative');
        if (!el) return;
        el.textContent = '';
        el.style.display = 'block';
        el.classList.add('typing');
        narrativeFinished = false;
        typeText(el, data.text || '', function() {
            el.classList.remove('typing');
            narrativeFinished = true;
            // Show buffered choices after a short beat
            if (pendingChoices) {
                var choicesData = pendingChoices;
                pendingChoices = null;
                setTimeout(function() {
                    renderChoices(choicesData);
                }, 1500);
            }
        });
    }

    // === Choices ===
    function handleChoicesShow(data) {
        // Buffer choices until narrative typing finishes
        if (!narrativeFinished) {
            pendingChoices = data;
            return;
        }
        // Narrative already done — show after short delay
        pendingChoices = null;
        setTimeout(function() {
            renderChoices(data);
        }, 1500);
    }

    function renderChoices(data) {
        var el = document.getElementById('player-choices');
        if (!el) return;
        el.innerHTML = '';
        el.style.opacity = '0';

        if (data.choices && data.choices.length > 0) {
            data.choices.forEach(function(choice, i) {
                var div = document.createElement('div');
                div.className = 'choice-btn choice-btn-interactive';
                div.style.animationDelay = (i * 0.15) + 's';
                div.style.cursor = 'pointer';
                div.innerHTML =
                    '<span class="choice-emoji">' + esc(choice.emoji || '') + '</span>' +
                    '<span class="choice-text">' + esc(choice.texto || '') + '</span>';

                if (choice.badge) {
                    div.innerHTML += '<span class="choice-badge ' + (choice.badgeClass || '') + '">' + esc(choice.badge) + '</span>';
                }

                // Player can click to select this choice
                (function(index) {
                    div.addEventListener('click', function() {
                        // Highlight selected, disable others
                        el.querySelectorAll('.choice-btn').forEach(function(btn) {
                            btn.classList.remove('choice-selected');
                            btn.style.pointerEvents = 'none';
                            btn.style.opacity = '0.4';
                        });
                        div.classList.add('choice-selected');
                        div.style.opacity = '1';

                        // Send selection to GM
                        window.Carrera.sync.send('player_choice_select', { index: index });
                        safePlayEffect('click');
                    });
                })(i);

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

        // Hide choices during dice
        var choicesEl = document.getElementById('player-choices');
        if (choicesEl) { choicesEl.style.opacity = '0'; }

        // Hide illustration during dice
        var illEl = document.querySelector('.scene-illustration');
        if (illEl) illEl.style.display = 'none';

        window.Carrera.dice.animateRollPredetermined(diceArea, data.rollResult, function() {
            // Screen shake on result for dramatic impact
            var wrap = document.querySelector('.player-wrap');
            if (wrap) {
                wrap.classList.add('screen-shake');
                setTimeout(function() { wrap.classList.remove('screen-shake'); }, 500);
            }
        });
    }

    // === Outcome ===
    function handleOutcomeShow(data) {
        var el = document.getElementById('player-outcome');
        if (!el) return;

        // Hide illustration to make room
        var illEl = document.querySelector('.scene-illustration');
        if (illEl) illEl.style.display = 'none';

        // Clear dice area
        var diceArea = document.getElementById('player-dice-area');
        if (diceArea) { diceArea.innerHTML = ''; diceArea.className = 'dice-area'; }

        el.style.display = 'block';
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'slideUp 0.4s ease-out';
        el.innerHTML = '';

        // Result-type coloring
        el.className = 'player-outcome';
        if (data.resultType && data.resultType !== 'direct') {
            el.classList.add('result-' + data.resultType);
        }

        // Result type icon header
        var resultIcons = {
            critico: '⭐ ¡Crítico!', exito: '✅ ¡Éxito!',
            complicacion: '⚠️ Complicación', juerga: '🎪 ¡Oh No!'
        };
        if (data.resultType && resultIcons[data.resultType]) {
            var iconEl = document.createElement('div');
            iconEl.className = 'outcome-type-badge result-badge-' + data.resultType;
            iconEl.textContent = resultIcons[data.resultType];
            el.appendChild(iconEl);
        }

        if (data.banner) {
            var bannerEl = document.createElement('div');
            bannerEl.className = data.bannerClass || 'auto-success-banner';
            bannerEl.textContent = data.banner;
            el.appendChild(bannerEl);
        }

        if (data.text) {
            var textEl = document.createElement('div');
            textEl.className = 'outcome-text';
            textEl.id = 'outcome-text-content';
            el.appendChild(textEl);
            // Type the outcome text for drama
            typeText(textEl, data.text, function() {});
        }

        if (data.clockWarning) {
            var warnEl = document.createElement('div');
            warnEl.className = 'clock-warning';
            warnEl.textContent = data.clockWarning;
            el.appendChild(warnEl);
        }

        // Screen shake for complicacion/juerga
        if (data.resultType === 'complicacion' || data.resultType === 'juerga') {
            var wrap = document.querySelector('.player-wrap');
            if (wrap) {
                wrap.classList.add('screen-shake');
                setTimeout(function() { wrap.classList.remove('screen-shake'); }, 500);
            }
        }

        // Show continue button or waiting indicator
        if (data.hasNext) {
            var contEl = document.createElement('button');
            contEl.className = 'btn-player-continue';
            contEl.textContent = '▶ Continuar la aventura';
            contEl.addEventListener('click', function() {
                window.Carrera.sync.send('player_continue', {});
                contEl.textContent = '⏳ Cargando...';
                contEl.disabled = true;
                safePlayEffect('click');
            });
            el.appendChild(contEl);
        } else {
            var waitEl = document.createElement('div');
            waitEl.className = 'player-waiting-gm';
            waitEl.innerHTML = '<span class="waiting-dots">La aventura continúa</span>';
            el.appendChild(waitEl);
        }
    }

    // === Roll Prompt (shown when GM needs kids to roll) ===
    function handleRollPrompt(data) {
        var diceArea = document.getElementById('player-dice-area');
        if (!diceArea) return;

        // Hide illustration
        var illEl = document.querySelector('.scene-illustration');
        if (illEl) illEl.style.display = 'none';

        diceArea.innerHTML = '';
        diceArea.className = 'dice-area active';

        var dieType = data.dieType || 8;
        var prompt = document.createElement('div');
        prompt.className = 'roll-prompt';
        prompt.innerHTML =
            '<div class="roll-prompt-emoji">🎲</div>' +
            '<div class="roll-prompt-text">¡Tira el d' + dieType + '!</div>' +
            '<div class="roll-prompt-detail">' + esc(data.emoji || '') + ' ' + esc(data.texto || '') + '</div>' +
            (data.ventaja ? '<div class="roll-prompt-advantage">🎲🎲 ¡Con ventaja! Tira 2 y quédate con el mejor</div>' : '') +
            '<div class="roll-prompt-input-row">' +
            '<span class="roll-prompt-die-label">d' + dieType + ':</span>' +
            '<input type="number" id="player-roll-input" class="player-roll-input" min="1" max="' + dieType + '" placeholder="1-' + dieType + '" inputmode="numeric">' +
            '<button id="btn-player-roll" class="btn-player-roll">¡Enviar!</button>' +
            '</div>';

        diceArea.appendChild(prompt);

        // Bind dice input
        var btnRoll = document.getElementById('btn-player-roll');
        var rollInput = document.getElementById('player-roll-input');
        if (btnRoll && rollInput) {
            btnRoll.addEventListener('click', function() {
                submitPlayerRoll(rollInput);
            });
            rollInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') submitPlayerRoll(rollInput);
            });
        }

        safePlayEffect('suspense');
    }

    function submitPlayerRoll(inputEl) {
        var val = parseInt(inputEl.value, 10);
        if (isNaN(val) || val < 1) {
            inputEl.focus();
            return;
        }
        // Send roll value to GM for resolution
        window.Carrera.sync.send('player_dice_roll', { value: val });

        // Disable input after sending
        inputEl.disabled = true;
        var btn = document.getElementById('btn-player-roll');
        if (btn) {
            btn.textContent = '✅ Enviado';
            btn.disabled = true;
        }
        safePlayEffect('click');
    }

    // === Team Display (sidebar on player) ===
    function handleTeamShow(data) {
        // Remove existing
        handleTeamHide();

        var panel = document.createElement('div');
        panel.id = 'player-team-panel';
        panel.className = 'player-team-panel';
        var images = window.Carrera.images;

        var html = '<div class="player-team-header">⚔️ Equipo de Aventura</div>';
        if (data.team) {
            data.team.forEach(function(p) {
                var portraitSrc = images ? images.getCharacterSrc(p.id) : null;
                var avatarHtml;
                if (portraitSrc) {
                    avatarHtml = '<img class="ptm-portrait" src="' + portraitSrc + '" alt="' + esc(p.nombre) + '" style="border-color: ' + (p.color || '#f4a261') + ';">';
                } else {
                    avatarHtml = '<div class="ptm-avatar">' + esc(p.emoji) + '</div>';
                }
                html += '<div class="player-team-member" style="border-color: ' + (p.color || '#f4a261') + ';">';
                html += avatarHtml;
                html += '<div class="ptm-info">';
                html += '<div class="ptm-name">' + esc(p.nombre) + '</div>';
                html += '<div class="ptm-species">' + esc(p.especie) + ' · <span class="ptm-level">Nivel ' + (p.level || 1) + '</span>' + (p.titulo ? ' · ' + esc(p.titulo) : '') + '</div>';
                html += '<div class="ptm-tags">';
                html += '<span class="ptm-tag">⚡ ' + esc(p.habilidad) + '</span>';
                html += '<span class="ptm-tag">🔧 ' + esc(p.herramienta) + '</span>';
                html += '<span class="ptm-tag">✨ ' + esc(p.talento) + '</span>';
                html += '<span class="ptm-tag">🐾 ' + esc(p.rasgo) + '</span>';
                html += '</div></div></div>';
            });
        }

        panel.innerHTML = html;
        document.querySelector('.player-wrap').appendChild(panel);

        // Auto-hide after 15 seconds
        setTimeout(function() { handleTeamHide(); }, 15000);
    }

    function handleTeamHide() {
        var existing = document.getElementById('player-team-panel');
        if (existing) existing.remove();
    }

    // === Character Selection (synced from GM — full cards) ===
    function handleCharacterSelection(data) {
        var container = document.getElementById('player-char-selection');
        if (!container) return;

        var images = window.Carrera.images;
        var html = '';

        if (data.team && data.team.length > 0) {
            html += '<div class="pcs-label">Equipo de aventura</div>';
            html += '<div class="pcs-cards">';
            data.team.forEach(function(p, i) {
                var portraitSrc = images ? images.getCharacterSrc(p.id) : null;
                var avatarContent;
                if (portraitSrc) {
                    avatarContent = '<img class="pcs-card-portrait" src="' + portraitSrc + '" alt="' + esc(p.nombre) + '" style="border-color:' + (p.color || '#f4a261') + ';">';
                } else {
                    avatarContent = '<span class="pcs-card-emoji">' + esc(p.emoji) + '</span>';
                }

                var tagsHtml = '';
                if (p.habilidad) {
                    tagsHtml =
                        '<div class="pcs-tag pcs-tag-skill"><span>⚡</span> ' + esc(p.habilidad.nombre) + '</div>' +
                        '<div class="pcs-tag pcs-tag-tool"><span>🔧</span> ' + esc(p.herramienta.nombre) + '</div>' +
                        '<div class="pcs-tag pcs-tag-talent"><span>✨</span> ' + esc(p.talento.nombre) + '</div>' +
                        '<div class="pcs-tag pcs-tag-trait"><span>🐾</span> ' + esc(p.rasgo.nombre) + '</div>';
                }

                html += '<div class="pcs-card" style="animation-delay:' + (i * 0.15) + 's;--card-color:' + (p.color || '#f4a261') + ';">' +
                    avatarContent +
                    '<div class="pcs-card-info">' +
                    '<div class="pcs-card-name">' + esc(p.nombre) + '</div>' +
                    '<div class="pcs-card-species">' + esc(p.especie) + '</div>' +
                    (p.descripcionCorta ? '<div class="pcs-card-desc">' + esc(p.descripcionCorta) + '</div>' : '') +
                    (tagsHtml ? '<div class="pcs-card-tags">' + tagsHtml + '</div>' : '') +
                    '</div></div>';
            });
            html += '</div>';

            var remaining = data.total - data.team.length;
            if (remaining > 0) {
                html += '<div class="pcs-remaining">' + remaining + ' puesto' + (remaining > 1 ? 's' : '') + ' por elegir...</div>';
            }
        }

        container.innerHTML = html;
    }

    // === Team Confirmed — spectacular full-screen team review ===
    function handleTeamConfirmed(data) {
        if (!data.team || data.team.length === 0) return;

        var main = document.getElementById('player-main');
        if (!main) return;

        safePlayEffect('scene_transition');

        var images = window.Carrera.images;
        var cardsHtml = '';

        data.team.forEach(function(p, i) {
            var portraitSrc = images ? images.getCharacterSrc(p.id) : null;
            var avatarContent;
            if (portraitSrc) {
                avatarContent = '<img class="tc-portrait" src="' + portraitSrc + '" alt="' + esc(p.nombre) + '" style="border-color:' + (p.color || '#f4a261') + ';">';
            } else {
                avatarContent = '<div class="tc-emoji">' + esc(p.emoji) + '</div>';
            }

            cardsHtml +=
                '<div class="tc-card" style="animation-delay:' + (0.3 + i * 0.2) + 's;--card-color:' + (p.color || '#f4a261') + ';">' +
                '<div class="tc-card-top">' +
                avatarContent +
                '<div class="tc-card-header">' +
                '<div class="tc-name">' + esc(p.nombre) + '</div>' +
                '<div class="tc-species">' + esc(p.especie) + '</div>' +
                (p.gremio ? '<div class="tc-guild">' + esc(p.gremio) + '</div>' : '') +
                '</div>' +
                '</div>' +
                '<div class="tc-tags">' +
                '<div class="tc-tag tc-tag-skill"><span class="tc-tag-icon">⚡</span><div><strong>Habilidad:</strong> ' + esc(p.habilidad.nombre) + '<br><small>' + esc(p.habilidad.descripcion) + '</small></div></div>' +
                '<div class="tc-tag tc-tag-tool"><span class="tc-tag-icon">🔧</span><div><strong>Herramienta:</strong> ' + esc(p.herramienta.nombre) + '<br><small>' + esc(p.herramienta.descripcion) + '</small></div></div>' +
                '<div class="tc-tag tc-tag-talent"><span class="tc-tag-icon">✨</span><div><strong>Talento:</strong> ' + esc(p.talento.nombre) + '<br><small>' + esc(p.talento.descripcion) + '</small></div></div>' +
                '<div class="tc-tag tc-tag-trait"><span class="tc-tag-icon">🐾</span><div><strong>Rasgo:</strong> ' + esc(p.rasgo.nombre) + '<br><small>' + esc(p.rasgo.descripcion) + '</small></div></div>' +
                '</div>' +
                '</div>';
        });

        main.innerHTML =
            '<div class="team-confirmed-screen">' +
            '<div class="tc-title">⚔️ Tu Equipo de Aventura ⚔️</div>' +
            '<div class="tc-cards">' + cardsHtml + '</div>' +
            '<div class="tc-waiting">Preparando la aventura...</div>' +
            '</div>';
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

        // Cancel any chapter card in progress
        showingChapterCard = false;
        pendingMessages = [];
        cancelTyping();

        main.style.transition = 'opacity 0.3s ease';
        main.style.opacity = '0';

        var bgEl = document.getElementById('player-background');
        var images = window.Carrera.images;
        var victorySrc = images ? images.getSceneSrc('bg-victory') : null;

        if (window.Carrera.particles) {
            window.Carrera.particles.stop();
        }

        setTimeout(function() {
            applySceneBackground(bgEl, 'bg-victory', victorySrc);

            if (window.Carrera.particles) {
                window.Carrera.particles.start('bg-victory');
            }

            var teamHtml = '<div class="victory-team">';
            if (data.team) {
                data.team.forEach(function(p, i) {
                    var portraitSrc = images ? images.getCharacterSrc(p.id) : null;
                    var delay = 'animation-delay:' + (0.5 + i * 0.2) + 's;';
                    var levelLabel = p.level ? '<span class="victory-level">Nv.' + p.level + '</span>' : '';
                    if (portraitSrc) {
                        teamHtml += '<div class="victory-character" style="' + delay + '"><img class="victory-portrait" src="' + portraitSrc + '" alt="' + esc(p.nombre) + '" style="border-color: ' + (p.color || 'var(--gold)') + ';"><span>' + esc(p.nombre) + '</span>' + levelLabel + '</div>';
                    } else {
                        teamHtml += '<div class="victory-character" style="' + delay + '"><span class="victory-emoji">' + esc(p.emoji) + '</span><span>' + esc(p.nombre) + '</span>' + levelLabel + '</div>';
                    }
                });
            }
            teamHtml += '</div>';

            var victoryIll = victorySrc ? null : sceneIllustrations['bg-victory'];

            main.innerHTML =
                '<div class="victory-rays"></div>' +
                '<div class="scene-content-player victory-content">' +
                '<div class="victory-crown">🏆</div>' +
                '<h2 class="player-title victory-title">' + esc(data.titulo || '¡VICTORIA!') + '</h2>' +
                (victoryIll ? '<div class="scene-illustration scene-illustration-victory"><pre class="scene-art">' + victoryIll.art + '</pre></div>' : '') +
                '<div id="player-narrative" class="player-narrative"></div>' +
                teamHtml +
                '<div class="victory-message">🏆 ¡Aventura completada! 🏆</div>' +
                '<div class="victory-stats">' +
                '<span>📍 ' + (data.sceneNumber || 5) + ' escenas</span>' +
                '<span>🎲 d' + (data.currentDie || 8) + '</span>' +
                '<span>⏰ ' + (data.clockTotal || 0) + ' reloj</span>' +
                '</div>' +
                '<div class="victory-fin">FIN</div>' +
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

        var colors = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#e63946', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#ffd700', '#ff69b4'];
        var shapes = ['confetti-piece', 'confetti-piece confetti-circle', 'confetti-piece confetti-strip'];

        for (var i = 0; i < 120; i++) {
            var piece = document.createElement('div');
            piece.className = shapes[Math.floor(Math.random() * shapes.length)];
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2.5 + 's';
            piece.style.animationDuration = (2 + Math.random() * 4) + 's';
            var size = 6 + Math.random() * 16;
            piece.style.width = size + 'px';
            piece.style.height = size + 'px';
            // Add some rotation for variety
            piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
            container.appendChild(piece);
        }

        setTimeout(function() {
            var pieces = container.querySelectorAll('.confetti-piece');
            pieces.forEach(function(p) { p.remove(); });
            container.style.display = 'none';
        }, 8000);
    }

    // === Level Up Ceremony ===
    function handleLevelUp(data) {
        safePlayEffect('triumph');

        var overlay = document.createElement('div');
        overlay.className = 'levelup-overlay';
        overlay.innerHTML =
            '<div class="levelup-content">' +
            '<div class="levelup-emoji">' + esc(data.emoji) + '</div>' +
            '<div class="levelup-title">¡NIVEL ' + data.level + '!</div>' +
            '<div class="levelup-name">' + esc(data.nombre) + '</div>' +
            '<div class="levelup-rank">' + esc(data.titulo) + '</div>' +
            '<div class="levelup-unlock">' + esc(data.desbloqueo) + '</div>' +
            '</div>';

        document.querySelector('.player-wrap').appendChild(overlay);

        // Launch confetti
        setTimeout(function() { launchConfetti(); }, 300);

        // Auto-remove after 5 seconds
        setTimeout(function() {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(function() { overlay.remove(); }, 500);
        }, 5000);
    }

    // === Badge Earned Toast ===
    function handleBadgeEarned(data) {
        safePlayEffect('success');

        var toast = document.createElement('div');
        toast.className = 'badge-toast';
        toast.innerHTML =
            '<span class="badge-toast-emoji">' + esc(data.emoji) + '</span>' +
            '<div class="badge-toast-info">' +
            '<div class="badge-toast-title">🏅 ¡Badge desbloqueado!</div>' +
            '<div class="badge-toast-name">' + esc(data.nombre) + '</div>' +
            '</div>';

        document.querySelector('.player-wrap').appendChild(toast);

        // Auto-dismiss after 4 seconds
        setTimeout(function() {
            toast.classList.add('badge-toast-exit');
            setTimeout(function() { toast.remove(); }, 500);
        }, 4000);
    }

    // === Loot Reveal ===
    function handleLootReveal(data) {
        if (!data.items || data.items.length === 0) return;

        safePlayEffect('triumph');

        var overlay = document.createElement('div');
        overlay.className = 'loot-overlay';
        var cardsHtml = data.items.map(function(item, i) {
            var rarezaColors = { comun: '#86efac', raro: '#93c5fd', legendario: '#fde047' };
            var rarezaLabels = { comun: 'Comun', raro: 'Raro', legendario: 'Legendario' };
            var color = rarezaColors[item.rareza] || '#fff';
            return '<div class="loot-card" style="animation-delay:' + (i * 0.6) + 's;border-color:' + color + ';">' +
                '<div class="loot-card-glow" style="background:' + color + ';"></div>' +
                '<div class="loot-card-emoji">' + esc(item.emoji) + '</div>' +
                '<div class="loot-card-name">' + esc(item.nombre) + '</div>' +
                '<div class="loot-card-rareza" style="color:' + color + ';">' + (rarezaLabels[item.rareza] || '') + '</div>' +
                '<div class="loot-card-desc">' + esc(item.descripcion) + '</div>' +
                '</div>';
        }).join('');

        overlay.innerHTML =
            '<div class="loot-content">' +
            '<div class="loot-title">🎁 ¡Loot encontrado!</div>' +
            '<div class="loot-cards">' + cardsHtml + '</div>' +
            '</div>';

        document.querySelector('.player-wrap').appendChild(overlay);

        setTimeout(function() { launchConfetti(); }, 800);

        setTimeout(function() {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(function() { overlay.remove(); }, 500);
        }, 6000);
    }

    // === Helpers ===
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return { init: init };
})();
