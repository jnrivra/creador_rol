// Motor de Aventura - GM Dashboard + Sync
window.Carrera = window.Carrera || {};

window.Carrera.adventure = (function() {
    var state = {
        currentSceneId: null,
        sceneNumber: 0,
        totalScenes: 5,
        flags: {},
        history: [],
        currentOption: null,
        diceHistory: [],
        gameLog: [],
        lastRoll: null,
        pendingNextScene: null,
        playerDriven: false
    };

    // Adventure context for progression tracking
    var advCtx = null;

    function setAdventureContext(ctx) {
        advCtx = ctx;
    }

    function reset() {
        state.currentSceneId = null;
        state.sceneNumber = 0;
        state.flags = {};
        state.history = [];
        state.currentOption = null;
        state.diceHistory = [];
        state.gameLog = [];
        state.lastRoll = null;
        state.pendingNextScene = null;
        state.playerDriven = false;
        window.Carrera.dice.reset();
        window.Carrera.clock.reset();
        window.Carrera.characters.resetSkills();
    }

    function start() {
        reset();
        // Calculate total scenes from current adventure (exclude victoria)
        var scenes = window.Carrera.scenes || {};
        var count = 0;
        for (var key in scenes) {
            if (key !== 'victoria') count++;
        }
        state.totalScenes = count || 5;
        listenPlayerActions();
        loadScene('scene1');
    }

    // Listen for player-initiated actions (choice selection, dice rolls)
    function listenPlayerActions() {
        window.Carrera.sync.onMessage(function(msg) {
            if (msg.sender === 'gm') return;

            if (msg.type === 'player_choice_select') {
                handlePlayerChoiceSelect(msg.data);
            } else if (msg.type === 'player_dice_roll') {
                handlePlayerDiceRoll(msg.data);
            } else if (msg.type === 'player_continue') {
                handlePlayerContinue();
            }
        });
    }

    function handlePlayerChoiceSelect(data) {
        var scene = window.Carrera.scenes[state.currentSceneId];
        if (!scene || !scene.opciones) return;
        if (state.currentOption) return; // Already resolving an option

        var idx = data.index;
        if (idx < 0 || idx >= scene.opciones.length) return;

        var opcion = scene.opciones[idx];
        state.playerDriven = true;
        addLog('🎮 Jugadores eligieron: ' + opcion.emoji + ' ' + opcion.texto);
        gmResolveOption(opcion);
    }

    function handlePlayerDiceRoll(data) {
        var opcion = state.currentOption;
        if (!opcion) return;

        var rollValue = parseInt(data.value, 10);
        if (isNaN(rollValue) || rollValue < 1) return;

        // Cap at current die max
        var maxDie = window.Carrera.dice.getCurrentDie() || 20;
        if (rollValue > maxDie) rollValue = maxDie;

        // Mark as player-driven so resolution auto-sends
        state.playerDriven = true;

        // Fill in the GM inline input and resolve
        var inlineInput = document.getElementById('gm-inline-roll-input');
        if (inlineInput) {
            inlineInput.value = rollValue;
            inlineResolveRoll(opcion);
        }
    }

    function handlePlayerContinue() {
        if (state.pendingNextScene) {
            var nextId = state.pendingNextScene;
            state.pendingNextScene = null;
            if (!checkRandomEvent(nextId)) {
                loadScene(nextId);
            }
        }
    }

    function loadScene(sceneId) {
        var scene = window.Carrera.scenes[sceneId];
        if (!scene) return;

        state.currentSceneId = sceneId;
        state.currentOption = null;

        // Calculate scene number from ID
        if (sceneId !== 'victoria') {
            var num = parseInt(sceneId.replace('scene', ''), 10);
            if (!isNaN(num)) state.sceneNumber = num;
        }

        // Scene transition chime + ambient
        window.Carrera.audio.playSceneTransition();
        window.Carrera.sync.send('effect_play', { effect: 'scene_transition' });
        window.Carrera.audio.playAmbient(scene.ambientPreset);

        // Render GM dashboard
        renderGMScene(scene);
        updateGMStatus();
        clearLastRollDisplay();

        // Send to player (include scene number for chapter card)
        window.Carrera.sync.send('scene_load', {
            titulo: scene.titulo,
            emoji: scene.emoji,
            ambientPreset: scene.ambientPreset,
            backgroundClass: scene.backgroundClass,
            sceneNum: sceneId !== 'victoria' ? state.sceneNumber : null
        });

        sendStatusUpdate();

        // Auto-send narrative, then choices 3s after typing ends
        var narrativeLen = (scene.narrativa || '').length;
        var typingMs = narrativeLen * 18;

        setTimeout(function() {
            sendNarrativeToPlayer();

            if (scene.opciones && scene.opciones.length > 0) {
                setTimeout(function() {
                    sendChoicesToPlayer(scene);
                }, typingMs + 3000);
            }
        }, 400);

        // Background (subtle on GM)
        var bgEl = document.getElementById('scene-background');
        if (bgEl) {
            bgEl.className = 'scene-background ' + (scene.backgroundClass || '');
            bgEl.style.opacity = '0.3';
        }

        state.history.push(sceneId);
        addLog('Escena cargada: ' + scene.emoji + ' ' + scene.titulo);

        // Track scene completion for XP (except first scene and victoria)
        if (sceneId !== 'scene1' && sceneId !== 'victoria' && state.history.length > 1) {
            trackSceneComplete();
        }

        if (scene.id === 'victoria') {
            handleVictory(scene);
        }
    }

    // --- Resend current state (for player reconnection) ---

    function resendCurrentState() {
        var scene = window.Carrera.scenes[state.currentSceneId];
        if (!scene) return;

        window.Carrera.sync.send('scene_load', {
            titulo: scene.titulo,
            emoji: scene.emoji,
            ambientPreset: scene.ambientPreset,
            backgroundClass: scene.backgroundClass,
            resend: true,
            sceneNum: state.currentSceneId !== 'victoria' ? state.sceneNumber : null
        });
        sendStatusUpdate();

        var narrativeLen = (scene.narrativa || '').length;
        var typingMs = narrativeLen * 18;

        setTimeout(function() {
            sendNarrativeToPlayer();

            if (scene.opciones && scene.opciones.length > 0) {
                setTimeout(function() {
                    sendChoicesToPlayer(scene);
                }, typingMs + 3000);
            }
        }, 400);

        addLog('Estado reenviado a jugadores');
        flashSendConfirmation('btn-resend-state');
    }

    // --- Render GM ---

    function renderGMScene(scene) {
        var titleEl = document.getElementById('gm-scene-title');
        if (titleEl) titleEl.textContent = scene.emoji + ' ' + scene.titulo;

        var narrativeEl = document.getElementById('gm-narrative');
        if (narrativeEl) narrativeEl.textContent = scene.narrativa || '';

        var notesEl = document.getElementById('gm-notes');
        if (notesEl) {
            var notesText = scene.notasGM || '';
            var teamNote = getTeamRelevanceNote(scene);
            if (teamNote) notesText += '\n\n🎯 ' + teamNote;
            notesEl.textContent = notesText;
        }

        renderTeamTags(scene);
        renderGMOptions(scene);

        var indicator = document.getElementById('gm-scene-indicator');
        if (indicator) {
            indicator.textContent = scene.id === 'victoria' ?
                '🏆 ¡Victoria!' :
                'Escena ' + state.sceneNumber + '/' + state.totalScenes;
        }

        var select = document.getElementById('gm-scene-select');
        if (select) select.value = scene.id;
    }

    function renderTeamTags(scene) {
        var container = document.getElementById('gm-team-tags');
        if (!container) return;

        var team = window.Carrera.characters.getTeam();
        var html = '';

        team.forEach(function(p) {
            html += '<div style="margin-bottom:0.4rem;">';
            html += '<strong style="color:white;">' + p.emoji + ' ' + p.nombre + ':</strong><br>';
            var tags = [
                { name: p.habilidad.nombre, type: '⚡', used: p.habilidad.usada },
                { name: p.herramienta.nombre, type: '🔧' },
                { name: p.talento.nombre, type: '✨' },
                { name: p.rasgo.nombre, type: '🐾' }
            ];
            html += tags.map(function(t) {
                var isRelevant = false;
                var isAutoSuccess = false;
                if (scene.opciones) {
                    scene.opciones.forEach(function(op) {
                        if (op.tagsRelevantes && op.tagsRelevantes.indexOf(t.name) !== -1) isRelevant = true;
                        if (op.autoExitoTags && op.autoExitoTags.indexOf(t.name) !== -1) isAutoSuccess = true;
                    });
                }
                var label = t.type + ' ' + t.name;
                if (t.used) label += ' (usada)';
                if (isAutoSuccess) return '<span style="color:#4ade80;font-weight:700;">⚡ ' + t.name + '</span>';
                if (isRelevant) return '<span class="gm-tag-match">★ ' + t.name + '</span>';
                return '<span style="color:rgba(255,255,255,0.4);font-size:0.8rem;">' + label + '</span>';
            }).join(' · ');
            html += '</div>';
        });

        container.innerHTML = html;
    }

    function renderGMOptions(scene) {
        var container = document.getElementById('gm-options');
        if (!container) return;
        container.innerHTML = '';

        if (!scene.opciones || scene.opciones.length === 0) {
            container.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.8rem;">Sin opciones (escena final)</div>';
            return;
        }

        scene.opciones.forEach(function(opcion, index) {
            var card = document.createElement('div');
            card.className = 'gm-option-card';
            card.dataset.optionText = opcion.texto;

            // Header
            var header = '<div class="gm-option-header">';
            header += '<span class="gm-option-emoji">' + opcion.emoji + '</span>';
            header += '<span class="gm-option-text">' + opcion.texto + '</span>';
            if (opcion.requiereTirada) {
                header += '<button class="btn-gm-toggle-preview" title="Ver resultados posibles">👁</button>';
            }
            header += '</div>';

            // Info line
            var info = buildOptionInfo(opcion);

            // Result preview (hidden by default)
            var preview = '';
            if (opcion.requiereTirada && opcion.resultados) {
                preview = '<div class="gm-result-preview" style="display:none;">';
                var types = ['critico', 'exito', 'complicacion', 'juerga'];
                var labels = {
                    critico: { emoji: '⭐', name: 'Crítico', color: '#fde047' },
                    exito: { emoji: '✅', name: 'Éxito', color: '#86efac' },
                    complicacion: { emoji: '⚠️', name: 'Complicación', color: '#fdba74' },
                    juerga: { emoji: '🎪', name: '¡Oh No!', color: '#d8b4fe' }
                };
                types.forEach(function(tipo) {
                    var r = opcion.resultados[tipo];
                    if (r) {
                        var l = labels[tipo];
                        preview += '<div class="gm-preview-entry" style="border-left: 2px solid ' + l.color + ';">';
                        preview += '<strong style="color:' + l.color + ';">' + l.emoji + ' ' + l.name + '</strong>';
                        if (r.reloj) preview += ' <span style="color:rgba(255,255,255,0.4);font-size:0.7rem;">⏰+' + r.reloj + '</span>';
                        if (r.flag) preview += ' <span style="color:rgba(255,255,255,0.4);font-size:0.7rem;">🏴' + r.flag + '</span>';
                        preview += '<div style="color:rgba(255,255,255,0.6);font-size:0.75rem;margin-top:0.15rem;">' + r.texto.substring(0, 100) + (r.texto.length > 100 ? '...' : '') + '</div>';
                        preview += '</div>';
                    }
                });
                preview += '</div>';
            }

            // Action buttons (no "send choices" — choices auto-send after narrative)
            var actions = '<div class="gm-option-actions">';
            actions += '<button class="btn-gm-action btn-resolve">▶ Resolver</button>';
            actions += '</div>';

            card.innerHTML = header + info + preview + actions;
            container.appendChild(card);

            // Toggle preview
            var toggleBtn = card.querySelector('.btn-gm-toggle-preview');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var prev = card.querySelector('.gm-result-preview');
                    if (prev) {
                        var isHidden = prev.style.display === 'none';
                        prev.style.display = isHidden ? 'block' : 'none';
                        this.textContent = isHidden ? '🔽' : '👁';
                    }
                });
            }

            card.querySelector('.btn-resolve').addEventListener('click', function() {
                gmResolveOption(opcion);
            });
        });
    }

    function buildOptionInfo(opcion) {
        var info = '<div class="gm-option-info">';
        if (opcion.requiereTirada) {
            var hasAdv = window.Carrera.characters.checkAdvantage(opcion.tagsRelevantes);
            var hasAutoSuccess = opcion.autoExitoTags && window.Carrera.characters.checkAutoSuccess(opcion.autoExitoTags);
            var skillAuto = window.Carrera.characters.checkSkillAutoSuccess(opcion.tagsRelevantes);
            var flagAuto = opcion.autoExitoFlags && opcion.autoExitoFlags.some(function(f) { return state.flags[f]; });

            var diff = (opcion.dificultad || 10) + window.Carrera.dice.getDifficultyBonus();
            var diffLabel = window.Carrera.dice.getDifficultyLabel(diff);

            if (hasAutoSuccess || skillAuto || flagAuto) {
                info += '<span style="color:#4ade80;font-weight:700;">⚡ Auto-éxito</span> ';
            } else if (hasAdv) {
                info += '<span style="color:#fbbf24;font-weight:700;">🎲🎲 Ventaja</span> ';
            } else {
                info += '🎲 ';
            }

            info += '<span style="color:rgba(255,255,255,0.5);">Dif: ' + diff + ' (' + diffLabel + ')</span> ';
            info += '<span style="font-size:0.65rem;color:rgba(255,255,255,0.35);">≥' + (diff+5) + '⭐ ≥' + diff + '✅ ≥' + (diff-4) + '⚠️ <' + (diff-4) + '🎪</span>';

            if (opcion.tagsRelevantes && opcion.tagsRelevantes.length > 0) {
                var matchingTags = opcion.tagsRelevantes.filter(function(t) {
                    return window.Carrera.characters.hasTag(t);
                });
                if (matchingTags.length > 0) {
                    info += '<br><span style="color:#4ade80;font-size:0.7rem;">✓ ' + matchingTags.join(', ') + '</span>';
                }
            }
        } else {
            info += '<span style="color:#93c5fd;">→ Progresión directa</span>';
        }
        info += '</div>';
        return info;
    }

    function getTeamRelevanceNote(scene) {
        if (!scene.opciones) return '';
        var notes = [];
        scene.opciones.forEach(function(op) {
            if (!op.tagsRelevantes) return;
            var matching = op.tagsRelevantes.filter(function(tag) {
                return window.Carrera.characters.hasTag(tag);
            });
            if (matching.length > 0) {
                notes.push('"' + op.texto + '" → ventaja con: ' + matching.join(', '));
            }
        });
        return notes.length > 0 ? 'Tags del equipo relevantes:\n' + notes.join('\n') : '';
    }

    // --- Visual feedback ---

    function flashSendConfirmation(btnOrId) {
        var btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
        if (!btn) return;
        var origText = btn.textContent;
        btn.textContent = '✅ Enviado';
        btn.style.background = 'rgba(34, 197, 94, 0.3)';
        setTimeout(function() {
            btn.textContent = origText;
            btn.style.background = '';
        }, 1200);
    }

    // --- Send to Player ---

    function sendNarrativeToPlayer() {
        var scene = window.Carrera.scenes[state.currentSceneId];
        if (!scene) return;
        window.Carrera.sync.send('narrative_show', { text: scene.narrativa });
        addLog('📤 Narrativa enviada');
    }

    function sendChoicesToPlayer(scene) {
        if (!scene) scene = window.Carrera.scenes[state.currentSceneId];
        if (!scene || !scene.opciones) return;

        var choices = scene.opciones.map(function(op) {
            var badge = '';
            var badgeClass = '';
            if (op.requiereTirada) {
                var hasAdv = window.Carrera.characters.checkAdvantage(op.tagsRelevantes);
                var hasAutoSuccess = op.autoExitoTags && window.Carrera.characters.checkAutoSuccess(op.autoExitoTags);
                var skillAuto = window.Carrera.characters.checkSkillAutoSuccess(op.tagsRelevantes);
                var flagAuto = op.autoExitoFlags && op.autoExitoFlags.some(function(f) { return state.flags[f]; });

                if (hasAutoSuccess || skillAuto || flagAuto) {
                    badge = '⚡ ¡Auto-éxito!';
                    badgeClass = 'auto-success';
                } else if (hasAdv) {
                    badge = '🎲🎲 ¡Ventaja!';
                    badgeClass = 'advantage';
                } else {
                    badge = '🎲 Tirada';
                    badgeClass = 'roll';
                }
            }

            return { emoji: op.emoji, texto: op.texto, badge: badge, badgeClass: badgeClass };
        });

        window.Carrera.sync.send('choices_show', { choices: choices });
        addLog('📤 Opciones enviadas');
    }

    function sendStatusUpdate() {
        window.Carrera.sync.send('status_update', {
            currentDie: window.Carrera.dice.getCurrentDie(),
            clockFilled: window.Carrera.clock.getFilled(),
            sceneLabel: state.currentSceneId === 'victoria' ?
                '🏆 ¡Victoria!' :
                'Escena ' + state.sceneNumber + '/' + state.totalScenes
        });
    }

    // --- GM Resolve ---

    function gmResolveOption(opcion) {
        state.currentOption = opcion;
        var sync = window.Carrera.sync;

        sync.send('choices_hide', {});

        if (!opcion.requiereTirada) {
            var text = opcion.narrativaResultado || '';
            sync.send('outcome_show', { text: text, resultType: 'direct', hasNext: !!opcion.siguienteEscena });
            addLog('▶ Sin tirada: ' + opcion.texto);
            state.playerDriven = false;
            showGMOutcome(text, opcion.siguienteEscena, 'direct');
            state.currentOption = null;
            return;
        }

        // Auto-success via tags
        if (opcion.autoExitoTags && window.Carrera.characters.checkAutoSuccess(opcion.autoExitoTags)) {
            resolveAutoSuccess(opcion, '⚡ ¡La herramienta perfecta!');
            return;
        }

        // Auto-success via flags
        if (opcion.autoExitoFlags) {
            var hasFlag = opcion.autoExitoFlags.some(function(f) { return state.flags[f]; });
            if (hasFlag) {
                resolveAutoSuccess(opcion, '🎁 ¡El regalo de antes les ayuda!');
                return;
            }
        }

        // Skill auto-success
        var skillPlayer = window.Carrera.characters.checkSkillAutoSuccess(opcion.tagsRelevantes);
        if (skillPlayer) {
            window.Carrera.characters.markSkillUsed(skillPlayer.id);
            trackSkillUsed(skillPlayer.id);
            var resultado = opcion.resultados.exito;
            var banner = skillPlayer.emoji + ' ¡' + skillPlayer.nombre + ' usa ' + skillPlayer.habilidad.nombre + '!';

            if (resultado.flag) state.flags[resultado.flag] = true;

            sync.send('outcome_show', {
                banner: banner,
                bannerClass: 'auto-success-banner skill-banner',
                text: resultado.texto,
                resultType: 'critico',
                hasNext: !!opcion.siguienteEscena
            });
            sync.send('effect_play', { effect: 'critical' });
            window.Carrera.audio.playCritical();

            addLog('⚡ Auto-éxito habilidad: ' + skillPlayer.nombre);
            showGMOutcome(banner + '\n' + resultado.texto, opcion.siguienteEscena, 'critico');
            state.currentOption = null;
            return;
        }

        // Needs dice roll — show inline dice resolver
        var hasAdvantage = window.Carrera.characters.checkAdvantage(opcion.tagsRelevantes);

        if (opcion.ventajaConFlags) {
            var flagAdvantage = opcion.ventajaConFlags.some(function(f) { return state.flags[f]; });
            if (flagAdvantage) hasAdvantage = true;
        }

        if (opcion.usaPistaExtra && state.flags.pistaExtra) {
            hasAdvantage = true;
        }

        // Tell player to roll dice!
        var diff = (opcion.dificultad || 10) + window.Carrera.dice.getDifficultyBonus();
        var currentDie = window.Carrera.dice.getCurrentDie() || 8;
        window.Carrera.sync.send('roll_prompt', {
            texto: opcion.texto,
            emoji: opcion.emoji,
            dificultad: diff,
            ventaja: hasAdvantage,
            dieType: currentDie
        });

        showInlineDiceResolver(opcion, hasAdvantage, diff);
        addLog('🎯 ' + opcion.texto + (hasAdvantage ? ' (ventaja)' : '') + ' — Dificultad ' + diff);
    }

    // Show dice input INLINE in the options panel (replaces options with dice UI)
    function showInlineDiceResolver(opcion, hasAdvantage, diff) {
        var container = document.getElementById('gm-options');
        if (!container) return;

        var currentDie = window.Carrera.dice.getCurrentDie() || 4;
        var diffLabel = window.Carrera.dice.getDifficultyLabel(diff);

        // Thresholds for reference
        var thresholds = '≥' + (diff + 5) + ' ⭐Crítico · ≥' + diff + ' ✅Éxito · ≥' + (diff - 4) + ' ⚠️Complicación · <' + (diff - 4) + ' 🎪¡Oh No!';

        container.innerHTML =
            '<div class="gm-inline-dice">' +
            // Header: selected option
            '<div class="gm-dice-header">' +
            '<span style="font-size:1.3rem;">' + opcion.emoji + '</span>' +
            '<div>' +
            '<div style="color:white;font-weight:700;font-size:0.95rem;">' + escapeHtml(opcion.texto) + '</div>' +
            '<div style="font-size:0.75rem;color:rgba(255,255,255,0.5);">Dificultad: ' + diff + ' (' + diffLabel + ')' +
            (hasAdvantage ? ' · <span style="color:#fbbf24;">🎲🎲 Ventaja</span>' : '') + '</div>' +
            '</div>' +
            '</div>' +

            // Thresholds reference
            '<div style="font-size:0.65rem;color:rgba(255,255,255,0.35);margin-bottom:0.8rem;text-align:center;">' + thresholds + '</div>' +

            // Die type selector
            '<div class="gm-dice-selector" style="margin-bottom:0.6rem;">' +
            buildDieSelectorHtml(currentDie) +
            '</div>' +

            // Roll input row
            '<div class="gm-dice-input-row" style="margin-bottom:0.6rem;">' +
            '<span id="gm-inline-die-label" style="color:rgba(255,255,255,0.6);font-size:0.85rem;font-weight:700;">d' + currentDie + ':</span>' +
            '<input type="number" id="gm-inline-roll-input" class="gm-roll-input" min="1" max="' + currentDie + '" placeholder="1-' + currentDie + '" autofocus>' +
            '<label class="gm-advantage-check"><input type="checkbox" id="gm-inline-advantage"' + (hasAdvantage ? ' checked' : '') + '> Ventaja</label>' +
            '<button id="btn-inline-resolve" class="btn-roll-dice">✅ Calcular</button>' +
            '</div>' +

            // Manual override
            '<div class="gm-manual-results">' +
            '<span style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-right:0.3rem;">Forzar resultado:</span>' +
            '<button class="btn-manual-result btn-manual-critico" data-result="critico">⭐ Crítico</button>' +
            '<button class="btn-manual-result btn-manual-exito" data-result="exito">✅ Éxito</button>' +
            '<button class="btn-manual-result btn-manual-complicacion" data-result="complicacion">⚠️ Complicación</button>' +
            '<button class="btn-manual-result btn-manual-juerga" data-result="juerga">🎪 ¡Oh No!</button>' +
            '</div>' +

            // Cancel
            '<div style="margin-top:0.6rem;text-align:center;">' +
            '<button id="btn-inline-cancel" class="btn-gm-action btn-send-choices" style="font-size:0.7rem;">← Volver a opciones</button>' +
            '</div>' +
            '</div>';

        // Bind die type selector
        container.querySelectorAll('.btn-die-type').forEach(function(btn) {
            btn.addEventListener('click', function() {
                container.querySelectorAll('.btn-die-type').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                var newDie = parseInt(this.dataset.die, 10);
                window.Carrera.dice.setCurrentDie(newDie);
                var inp = document.getElementById('gm-inline-roll-input');
                var lbl = document.getElementById('gm-inline-die-label');
                if (inp) { inp.max = newDie; inp.placeholder = '1-' + newDie; inp.value = ''; inp.focus(); }
                if (lbl) lbl.textContent = 'd' + newDie + ':';
            });
        });

        // Bind resolve button
        var btnResolve = document.getElementById('btn-inline-resolve');
        if (btnResolve) {
            btnResolve.addEventListener('click', function() {
                inlineResolveRoll(opcion);
            });
        }

        // Enter key resolves
        var inlineInput = document.getElementById('gm-inline-roll-input');
        if (inlineInput) {
            inlineInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') inlineResolveRoll(opcion);
            });
            setTimeout(function() { inlineInput.focus(); }, 100);
        }

        // Bind manual result buttons
        container.querySelectorAll('.btn-manual-result').forEach(function(btn) {
            btn.addEventListener('click', function() {
                gmManualResolve(this.dataset.result);
            });
        });

        // Cancel button
        var btnCancel = document.getElementById('btn-inline-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', function() {
                state.currentOption = null;
                var scene = window.Carrera.scenes[state.currentSceneId];
                if (scene) renderGMOptions(scene);
            });
        }
    }

    function buildDieSelectorHtml(currentDie) {
        var dice = [
            { val: 4, svg: '<polygon points="20,4 36,34 4,34" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="20" y="27" text-anchor="middle" font-size="11" fill="currentColor" font-weight="bold">4</text>' },
            { val: 6, svg: '<rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="20" y="26" text-anchor="middle" font-size="12" fill="currentColor" font-weight="bold">6</text>' },
            { val: 8, svg: '<polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="20" y="26" text-anchor="middle" font-size="12" fill="currentColor" font-weight="bold">8</text>' },
            { val: 10, svg: '<polygon points="20,2 36,15 32,36 8,36 4,15" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="20" y="26" text-anchor="middle" font-size="10" fill="currentColor" font-weight="bold">10</text>' },
            { val: 12, svg: '<polygon points="20,2 34,10 38,26 28,38 12,38 2,26 6,10" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="20" y="26" text-anchor="middle" font-size="10" fill="currentColor" font-weight="bold">12</text>' },
            { val: 20, svg: '<polygon points="20,2 36,12 36,28 20,38 4,28 4,12" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="20" y="26" text-anchor="middle" font-size="10" fill="currentColor" font-weight="bold">20</text>' }
        ];
        return dice.map(function(d) {
            return '<button class="btn-die-type' + (d.val === currentDie ? ' active' : '') + '" data-die="' + d.val + '" title="d' + d.val + '">' +
                '<svg viewBox="0 0 40 40" width="28" height="28">' + d.svg + '</svg></button>';
        }).join('');
    }

    // Inline dice resolution (called from inline dice panel)
    function inlineResolveRoll(opcion) {
        var input = document.getElementById('gm-inline-roll-input');
        if (!input || !input.value) {
            input && input.focus();
            return;
        }

        var rollValue = parseInt(input.value, 10);
        var maxDie = window.Carrera.dice.getCurrentDie() || 20;
        if (isNaN(rollValue) || rollValue < 1 || rollValue > maxDie) {
            addLog('⚠️ El número debe ser entre 1 y ' + maxDie);
            return;
        }

        var advCheck = document.getElementById('gm-inline-advantage');
        var hasAdvantage = advCheck ? advCheck.checked : false;
        var baseDiff = opcion.dificultad || 10;

        var rollResult = window.Carrera.dice.resolve(rollValue, baseDiff, hasAdvantage);

        // Send to player
        window.Carrera.sync.send('dice_roll', { rollResult: rollResult });
        window.Carrera.audio.playDiceRoll();

        state.lastRoll = rollResult;

        var label = window.Carrera.dice.getResultLabel(rollResult.tipo);
        state.diceHistory.unshift({
            value: rollResult.valor,
            difficulty: rollResult.dificultad,
            type: rollResult.tipo,
            advantage: hasAdvantage,
            label: label.texto
        });
        renderDiceHistory();
        showLastRollDisplay(rollResult);

        addLog('🎲 ' + rollResult.valor + ' vs dif.' + rollResult.dificultad + ' → ' + label.texto + (hasAdvantage ? ' (ventaja)' : ''));

        // Show result inline immediately
        showInlineResult(opcion, rollResult);

        // Result sound
        setTimeout(function() {
            if (rollResult.tipo === 'critico') window.Carrera.audio.playCritical();
            else if (rollResult.tipo === 'exito') window.Carrera.audio.playSuccess();
            else if (rollResult.tipo === 'juerga') window.Carrera.audio.playHijinx();
            else window.Carrera.audio.playFailure();
        }, 800);

        // Resolve after short delay
        setTimeout(function() {
            resolveRollResult(opcion, rollResult);
        }, 1500);
    }

    function showInlineResult(opcion, rollResult) {
        var container = document.getElementById('gm-options');
        if (!container) return;

        var label = window.Carrera.dice.getResultLabel(rollResult.tipo);
        var colors = { critico: '#fde047', exito: '#86efac', complicacion: '#fdba74', juerga: '#d8b4fe' };
        var color = colors[rollResult.tipo] || '#fff';

        container.innerHTML =
            '<div style="text-align:center;padding:1rem;animation:popIn 0.3s ease-out;">' +
            '<div style="font-size:3rem;font-weight:900;color:' + color + ';text-shadow:0 0 20px ' + color + '40;">' +
            rollResult.valor +
            '</div>' +
            '<div style="font-size:0.85rem;color:rgba(255,255,255,0.5);">vs dificultad ' + rollResult.dificultad + (rollResult.ventaja ? ' 🎲🎲' : '') + '</div>' +
            '<div style="font-size:1.5rem;font-weight:800;color:' + color + ';margin-top:0.3rem;">' +
            label.emoji + ' ' + label.texto +
            '</div>' +
            '<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:0.5rem;">Preparando resolución...</div>' +
            '</div>';
    }

    function resolveAutoSuccess(opcion, message) {
        var resultado = opcion.resultados.exito;
        if (resultado.flag) state.flags[resultado.flag] = true;

        window.Carrera.sync.send('outcome_show', {
            banner: message,
            bannerClass: 'auto-success-banner',
            text: resultado.texto,
            resultType: 'exito',
            hasNext: !!opcion.siguienteEscena
        });
        window.Carrera.sync.send('effect_play', { effect: 'success' });
        window.Carrera.audio.playSuccess();

        addLog('⚡ Auto-éxito: ' + message);
        showGMOutcome(message + '\n' + resultado.texto, opcion.siguienteEscena, 'exito');
        state.currentOption = null;
    }

    // --- Dice ---

    // GM inputs the number the kids rolled — delegates to inline resolver
    function gmResolveRoll() {
        var opcion = state.currentOption;
        if (!opcion) {
            addLog('⚠️ Selecciona una opción primero (▶ Resolver)');
            return;
        }

        var inlineInput = document.getElementById('gm-inline-roll-input');
        if (inlineInput) {
            if (inlineInput.value) {
                inlineResolveRoll(opcion);
            } else {
                inlineInput.focus();
            }
        }
    }

    function showLastRollDisplay(rollResult) {
        var container = document.getElementById('gm-last-roll');
        if (!container) return;

        var label = window.Carrera.dice.getResultLabel(rollResult.tipo);
        var colors = { critico: '#fde047', exito: '#86efac', complicacion: '#fdba74', juerga: '#d8b4fe' };

        container.innerHTML =
            '<div class="gm-last-roll-display" style="border-color: ' + (colors[rollResult.tipo] || '#fff') + ';">' +
            '<div class="gm-last-roll-value" style="color: ' + (colors[rollResult.tipo] || '#fff') + ';">' +
            rollResult.valor +
            '</div>' +
            '<div class="gm-last-roll-info">' +
            '<span class="gm-last-roll-type">' + label.emoji + ' ' + label.texto + '</span>' +
            '<span class="gm-last-roll-die">vs dificultad ' + rollResult.dificultad + (rollResult.ventaja ? ' 🎲🎲' : '') + '</span>' +
            '</div>' +
            '</div>';

        container.style.animation = 'none';
        container.offsetHeight; // reflow
        container.style.animation = 'popIn 0.3s ease-out';
    }

    function clearLastRollDisplay() {
        var container = document.getElementById('gm-last-roll');
        if (container) container.innerHTML = '';
    }

    // --- Manual Resolve ---

    function gmManualResolve(tipo) {
        var opcion = state.currentOption;
        if (!opcion) {
            addLog('⚠️ Selecciona una opción primero (click ▶ Resolver)');
            return;
        }

        var resultado = opcion.resultados[tipo];
        if (!resultado) resultado = opcion.resultados.complicacion;

        // Track for progression
        trackRollResult(tipo);

        var label = window.Carrera.dice.getResultLabel(tipo);

        window.Carrera.sync.send('choices_hide', {});

        var effectMap = { critico: 'critical', exito: 'success', complicacion: 'failure', juerga: 'hijinx' };
        window.Carrera.sync.send('effect_play', { effect: effectMap[tipo] || 'success' });

        // Play SFX on GM too
        if (tipo === 'critico') window.Carrera.audio.playCritical();
        else if (tipo === 'exito') window.Carrera.audio.playSuccess();
        else if (tipo === 'juerga') window.Carrera.audio.playHijinx();
        else window.Carrera.audio.playFailure();

        // Apply clock
        var clockWarning = null;
        if (resultado.reloj && resultado.reloj > 0) {
            var clockResult = window.Carrera.clock.fill(resultado.reloj);
            sendStatusUpdate();
            updateGMStatus();

            if (clockResult.difficultyUp) {
                var bonus = window.Carrera.dice.getDifficultyBonus();
                clockWarning = '⏰ ¡El reloj se llenó! Dificultad +' + bonus;
                // Track clock fills for resistencia badge
                if (advCtx && advCtx.campaign) {
                    advCtx.campaign.stats.vecesRelojLleno = (advCtx.campaign.stats.vecesRelojLleno || 0) + 1;
                }
            }
        }

        if (resultado.flag) state.flags[resultado.flag] = true;

        addLog('📝 Manual: ' + label.texto + ' → "' + opcion.texto + '"');

        // Show resolution proposals (same flow as dice roll)
        try {
            showResolutionProposals(tipo, opcion, resultado, clockWarning);
        } catch (e) {
            addLog('⚠️ Error en propuestas: ' + e.message);
            window.Carrera.sync.send('outcome_show', { text: resultado.texto, clockWarning: clockWarning, resultType: tipo });
            showGMOutcome(resultado.texto, opcion.siguienteEscena, tipo);
        }
        state.currentOption = null;
    }

    // === Progression Hooks ===
    function trackRollResult(tipo) {
        if (!advCtx || !advCtx.campaign) return;

        var campaign = advCtx.campaign;
        var stats = campaign.stats;
        stats.tiradas = (stats.tiradas || 0) + 1;
        advCtx.tiradaNum = (advCtx.tiradaNum || 0) + 1;

        if (tipo === 'critico') {
            stats.criticosTotales = (stats.criticosTotales || 0) + 1;
            advCtx.criticosAventura = (advCtx.criticosAventura || 0) + 1;
            advCtx.rachaExitos = (advCtx.rachaExitos || 0) + 1;
            if (advCtx.tiradaNum === 1) advCtx.primeraTiradaCritico = true;
        } else if (tipo === 'exito') {
            stats.exitosTotales = (stats.exitosTotales || 0) + 1;
            advCtx.exitosAventura = (advCtx.exitosAventura || 0) + 1;
            advCtx.rachaExitos = (advCtx.rachaExitos || 0) + 1;
        } else if (tipo === 'complicacion') {
            stats.complicacionesTotales = (stats.complicacionesTotales || 0) + 1;
            advCtx.complicacionesAventura = (advCtx.complicacionesAventura || 0) + 1;
            advCtx.rachaExitos = 0;
        } else if (tipo === 'juerga') {
            stats.juergasTotales = (stats.juergasTotales || 0) + 1;
            advCtx.juergasAventura = (advCtx.juergasAventura || 0) + 1;
            advCtx.rachaExitos = 0;
        }

        // Award XP for the roll result
        var xpResults = window.Carrera.progression.awardTeamXP(campaign, tipo);
        xpResults.forEach(function(r) {
            if (r.awarded > 0) {
                addLog('📈 ' + r.player.emoji + ' +' + r.awarded + ' XP (' + tipo + ')');
            }
            if (r.levelUp) {
                handleLevelUp(r.player, r.newLevel);
            }
        });

        // Check badges
        advCtx.flags = state.flags;
        var newBadges = window.Carrera.badges.checkBadges(campaign, advCtx);
        newBadges.forEach(function(badge) {
            handleBadgeEarned(badge);
        });

        // Auto-save
        window.Carrera.campaignUI.autoSave();
    }

    function trackSceneComplete() {
        if (!advCtx || !advCtx.campaign) return;

        advCtx.escenasCompletadas = (advCtx.escenasCompletadas || 0) + 1;
        advCtx.campaign.stats.escenasCompletadas = (advCtx.campaign.stats.escenasCompletadas || 0) + 1;

        var xpResults = window.Carrera.progression.awardTeamXP(advCtx.campaign, 'completar_escena');
        xpResults.forEach(function(r) {
            if (r.awarded > 0) {
                addLog('📈 ' + r.player.emoji + ' +' + r.awarded + ' XP (escena)');
            }
            if (r.levelUp) {
                handleLevelUp(r.player, r.newLevel);
            }
        });

        window.Carrera.campaignUI.autoSave();
    }

    function trackSkillUsed(playerId) {
        if (!advCtx) return;
        advCtx.habilidadesUsadas = (advCtx.habilidadesUsadas || 0) + 1;

        if (advCtx.campaign) {
            window.Carrera.progression.awardPlayerXP(advCtx.campaign, playerId, 'usar_habilidad');
            addLog('📈 +3 XP (habilidad)');
            window.Carrera.campaignUI.autoSave();
        }
    }

    function handleLevelUp(player, newLevel) {
        addLog('🎉 ¡LEVEL UP! ' + player.emoji + ' ' + player.nombre + ' → Nivel ' + newLevel.level + ' (' + newLevel.titulo + ')');

        // Send to player view
        window.Carrera.sync.send('level_up', {
            playerId: player.id,
            emoji: player.emoji,
            nombre: player.nombre,
            level: newLevel.level,
            titulo: newLevel.titulo,
            desbloqueo: newLevel.desbloqueo
        });
    }

    function handleBadgeEarned(badge) {
        addLog('🏅 Badge: ' + badge.emoji + ' ' + badge.nombre);

        window.Carrera.sync.send('badge_earned', {
            id: badge.id,
            emoji: badge.emoji,
            nombre: badge.nombre,
            descripcion: badge.descripcion
        });
    }

    // === Random Events ===
    function checkRandomEvent(nextSceneId) {
        if (!window.Carrera.randomEventDefs) return false;
        if (nextSceneId === 'victoria') return false;
        if (Math.random() > 0.25) return false; // 25% chance

        var events = window.Carrera.randomEventDefs;
        var event = events[Math.floor(Math.random() * events.length)];
        showRandomEventGM(event, nextSceneId);
        return true;
    }

    function showRandomEventGM(event, nextSceneId) {
        var container = document.getElementById('gm-options');
        if (!container) return;

        addLog('🎲 Evento aleatorio: ' + event.emoji + ' ' + event.titulo);

        var html = '<div class="gm-option-card" style="border-color:rgba(168,85,247,0.5);background:rgba(168,85,247,0.15);">' +
            '<div style="font-size:1.5rem;margin-bottom:0.3rem;">' + event.emoji + ' ' + event.titulo + '</div>' +
            '<div style="color:rgba(255,255,255,0.8);font-size:0.85rem;margin-bottom:0.8rem;">' + event.narrativa + '</div>';

        if (event.tipo === 'desafio') {
            html += '<div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.5rem;">Dificultad: ' + event.dificultad + '</div>';
        }

        html += '<div style="display:flex;gap:0.5rem;">' +
            '<button class="btn-gm-action btn-resolve" id="btn-event-play">▶ Jugar evento</button>' +
            '<button class="btn-gm-action btn-send-choices" id="btn-event-skip">⏭️ Saltar</button>' +
            '</div></div>';

        container.innerHTML = html;

        document.getElementById('btn-event-play').addEventListener('click', function() {
            // Send narrative to player
            window.Carrera.sync.send('narrative_show', { text: event.narrativa });

            if (event.tipo === 'desafio') {
                // Mini-challenge: need a dice roll
                handleEventChallenge(event, nextSceneId, container);
            } else {
                // Encounter/Social: just narrative + reward
                applyEventReward(event);
                setTimeout(function() { loadScene(nextSceneId); }, 3000);
            }
        });

        document.getElementById('btn-event-skip').addEventListener('click', function() {
            addLog('⏭️ Evento saltado');
            loadScene(nextSceneId);
        });
    }

    function handleEventChallenge(event, nextSceneId, container) {
        // Show resolve buttons for mini-challenge
        var html = '<div class="gm-option-card" style="border-color:rgba(168,85,247,0.5);background:rgba(168,85,247,0.15);">' +
            '<div style="font-size:1.2rem;margin-bottom:0.3rem;">' + event.emoji + ' ' + event.titulo + ' — Tirada</div>' +
            '<div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:0.5rem;">Dificultad: ' + event.dificultad + '</div>' +
            '<div style="display:flex;gap:0.5rem;">' +
            '<button class="btn-gm-action btn-manual-critico" id="btn-event-success">✅ Exito</button>' +
            '<button class="btn-gm-action btn-manual-complicacion" id="btn-event-fail">⚠️ Fallo</button>' +
            '</div></div>';

        container.innerHTML = html;

        document.getElementById('btn-event-success').addEventListener('click', function() {
            window.Carrera.sync.send('outcome_show', { text: event.exitoTexto, resultType: 'exito' });
            window.Carrera.sync.send('effect_play', { effect: 'success' });
            window.Carrera.audio.playSuccess();
            if (event.exitoReward === 'xp' && advCtx && advCtx.campaign) {
                var evResults = window.Carrera.progression.awardTeamXP(advCtx.campaign, 'completar_escena');
                evResults.forEach(function(r) {
                    if (r.levelUp) handleLevelUp(r.player, r.newLevel);
                });
                addLog('📈 +XP por evento');
            }
            window.Carrera.campaignUI.autoSave();
            setTimeout(function() { loadScene(nextSceneId); }, 3000);
        });

        document.getElementById('btn-event-fail').addEventListener('click', function() {
            window.Carrera.sync.send('outcome_show', { text: event.falloTexto, resultType: 'complicacion' });
            window.Carrera.sync.send('effect_play', { effect: 'failure' });
            window.Carrera.audio.playFailure();
            if (event.falloReward === 'clock') {
                window.Carrera.clock.fill(event.falloAmount || 1);
                sendStatusUpdate();
                updateGMStatus();
            }
            setTimeout(function() { loadScene(nextSceneId); }, 3000);
        });
    }

    function applyEventReward(event) {
        if (!advCtx || !advCtx.campaign) return;
        if (event.rewardType === 'xp') {
            // Award XP directly and check level-ups
            var amount = event.rewardAmount || 3;
            advCtx.campaign.equipo.forEach(function(p) {
                var oldLevel = p.level || 1;
                p.xp = (p.xp || 0) + amount;
                var lvlData = window.Carrera.progression.getLevelForXP(p.xp);
                p.level = lvlData.level;
                if (lvlData.level > oldLevel) {
                    handleLevelUp(p, lvlData);
                }
            });
            addLog('📈 +' + amount + ' XP (evento)');
        } else if (event.rewardType === 'clock') {
            var clockAmount = event.rewardAmount || 0;
            if (clockAmount < 0) {
                for (var ci = 0; ci < Math.abs(clockAmount); ci++) {
                    window.Carrera.clock.manualEmpty();
                }
                addLog('💚 Reloj ' + clockAmount + ' (evento)');
                sendStatusUpdate();
                updateGMStatus();
            }
        } else if (event.rewardType === 'item_chance') {
            var loot = window.Carrera.loot.generateLoot(1);
            if (loot.length > 0) {
                // Give to first player who has room
                for (var i = 0; i < advCtx.campaign.equipo.length; i++) {
                    if (window.Carrera.loot.addItem(advCtx.campaign.equipo[i], loot[0])) {
                        addLog('🎁 ' + advCtx.campaign.equipo[i].emoji + ' recibe ' + loot[0].emoji + ' ' + loot[0].nombre);
                        break;
                    }
                }
            }
        }
        window.Carrera.campaignUI.autoSave();
    }

    function resolveRollResult(opcion, rollData) {
        var tipo = rollData.tipo;
        var resultado = opcion.resultados[tipo];
        if (!resultado) resultado = opcion.resultados.complicacion;

        // Track for progression
        trackRollResult(tipo);

        var effectMap = { critico: 'critical', exito: 'success', complicacion: 'failure', juerga: 'hijinx' };
        window.Carrera.sync.send('effect_play', { effect: effectMap[tipo] || 'success' });

        // Apply clock BEFORE showing proposals (so GM sees updated state)
        var clockWarning = null;
        if (resultado.reloj && resultado.reloj > 0) {
            var clockResult = window.Carrera.clock.fill(resultado.reloj);
            sendStatusUpdate();
            updateGMStatus();

            if (clockResult.difficultyUp) {
                var bonus = window.Carrera.dice.getDifficultyBonus();
                clockWarning = '⏰ ¡El reloj se llenó! Dificultad +' + bonus;
                // Track clock fills for resistencia badge
                if (advCtx && advCtx.campaign) {
                    advCtx.campaign.stats.vecesRelojLleno = (advCtx.campaign.stats.vecesRelojLleno || 0) + 1;
                }
            }

            window.Carrera.sync.send('effect_play', { effect: 'clock_tick' });
        }

        // Set flags
        if (resultado.flag) state.flags[resultado.flag] = true;

        // If player-driven, auto-send the original result text (skip GM proposal selection)
        if (state.playerDriven) {
            state.playerDriven = false;
            var outcomeData = { text: resultado.texto, resultType: tipo, hasNext: !!opcion.siguienteEscena };
            if (clockWarning) outcomeData.clockWarning = clockWarning;
            window.Carrera.sync.send('outcome_show', outcomeData);
            addLog('📖 Auto-resolución (player): ' + resultado.texto.substring(0, 60) + '...');
            showGMOutcome(resultado.texto, opcion.siguienteEscena, tipo);
        } else {
            // Show resolution proposals to GM for manual selection
            try {
                showResolutionProposals(tipo, opcion, resultado, clockWarning);
            } catch (e) {
                addLog('⚠️ Error en propuestas: ' + e.message);
                window.Carrera.sync.send('outcome_show', { text: resultado.texto, clockWarning: clockWarning, resultType: tipo, hasNext: !!opcion.siguienteEscena });
                showGMOutcome(resultado.texto, opcion.siguienteEscena, tipo);
            }
        }
        state.currentOption = null;
    }

    // === Resolution Proposals Panel ===
    function showResolutionProposals(tipo, opcion, resultado, clockWarning) {
        var container = document.getElementById('gm-options');
        if (!container) return;

        var colors = {
            critico: 'rgba(234,179,8,0.15)', exito: 'rgba(34,197,94,0.15)',
            complicacion: 'rgba(249,115,22,0.15)', juerga: 'rgba(168,85,247,0.15)',
            direct: 'rgba(147,197,253,0.15)'
        };
        var borderColors = {
            critico: 'rgba(234,179,8,0.5)', exito: 'rgba(34,197,94,0.5)',
            complicacion: 'rgba(249,115,22,0.5)', juerga: 'rgba(168,85,247,0.5)',
            direct: 'rgba(147,197,253,0.5)'
        };

        var bg = colors[tipo] || colors.exito;
        var border = borderColors[tipo] || borderColors.exito;
        var nextSceneId = opcion.siguienteEscena;
        var nextScene = window.Carrera.scenes[nextSceneId];
        var nextLabel = nextScene ? (nextScene.emoji + ' ' + nextScene.titulo) : (nextSceneId || '???');

        // Generate 3 proposals (with fallback if generator not loaded)
        var proposals;
        try {
            var resGen = window.Carrera.resolutions;
            if (resGen) {
                proposals = resGen.generate(tipo, opcion, resultado.texto);
            } else {
                proposals = [resultado.texto];
            }
        } catch (e) {
            proposals = [resultado.texto];
            addLog('⚠️ Generator error: ' + e.message);
        }

        renderProposalCards(container, proposals, tipo, bg, border, nextLabel, nextSceneId, clockWarning, opcion, resultado);
    }

    function renderProposalCards(container, proposals, tipo, bg, border, nextLabel, nextSceneId, clockWarning, opcion, resultado) {
        var typeLabels = {
            critico: '⭐ CRITICO', exito: '✅ ÉXITO',
            complicacion: '⚠️ COMPLICACIÓN', juerga: '🎪 ¡OH NO!'
        };

        var html = '<div style="margin-bottom:0.6rem;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
            '<span style="color:rgba(255,255,255,0.7);font-size:0.8rem;font-weight:700;">' + (typeLabels[tipo] || '') + ' — Elige la resolución narrativa:</span>' +
            '<button class="btn-gm-action btn-send-choices" id="btn-reroll-proposals" style="font-size:0.65rem;">🔄 Nuevas ideas</button>' +
            '</div>';

        proposals.forEach(function(text, i) {
            html += '<div class="gm-option-card gm-proposal-card" data-index="' + i + '" style="border-color:' + border + ';background:' + bg + ';cursor:pointer;margin-bottom:0.5rem;transition:all 0.2s;">' +
                '<div style="display:flex;gap:0.5rem;align-items:flex-start;">' +
                '<span style="font-size:1.2rem;font-weight:800;color:rgba(255,255,255,0.5);flex-shrink:0;">' + (i + 1) + '</span>' +
                '<div style="color:rgba(255,255,255,0.9);font-size:0.8rem;line-height:1.5;">' + escapeHtml(text) + '</div>' +
                '</div>' +
                '</div>';
        });

        html += '</div>';
        container.innerHTML = html;

        // Click on a proposal card to select it
        container.querySelectorAll('.gm-proposal-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var idx = parseInt(this.dataset.index, 10);
                var selectedText = proposals[idx];
                confirmResolution(selectedText, nextSceneId, tipo, clockWarning, container);
            });

            // Hover effect
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });

        // Reroll button
        var rerollBtn = document.getElementById('btn-reroll-proposals');
        if (rerollBtn) {
            rerollBtn.addEventListener('click', function() {
                var resGen = window.Carrera.resolutions;
                var newProposals = resGen ? resGen.regenerate(tipo, opcion, resultado.texto) : [resultado.texto];
                renderProposalCards(container, newProposals, tipo, bg, border, nextLabel, nextSceneId, clockWarning, opcion, resultado);
                addLog('🔄 Nuevas propuestas de resolución generadas');
            });
        }
    }

    function confirmResolution(text, nextSceneId, resultType, clockWarning, container) {
        // Send to player
        var outcomeData = { text: text, resultType: resultType };
        if (clockWarning) outcomeData.clockWarning = clockWarning;
        if (nextSceneId) outcomeData.hasNext = true;
        window.Carrera.sync.send('outcome_show', outcomeData);

        addLog('📖 Resolución enviada: ' + text.substring(0, 60) + '...');

        // Show continue panel
        showGMOutcome(text, nextSceneId, resultType);
    }

    function showGMOutcome(text, nextSceneId, resultType) {
        var container = document.getElementById('gm-options');
        if (!container) return;

        var colors = {
            critico: 'rgba(234,179,8,0.2)', exito: 'rgba(34,197,94,0.2)',
            complicacion: 'rgba(249,115,22,0.2)', juerga: 'rgba(168,85,247,0.2)',
            direct: 'rgba(147,197,253,0.2)'
        };
        var borderColors = {
            critico: 'rgba(234,179,8,0.4)', exito: 'rgba(34,197,94,0.4)',
            complicacion: 'rgba(249,115,22,0.4)', juerga: 'rgba(168,85,247,0.4)',
            direct: 'rgba(147,197,253,0.4)'
        };

        var bg = colors[resultType] || colors.exito;
        var border = borderColors[resultType] || borderColors.exito;

        var nextScene = window.Carrera.scenes[nextSceneId];
        var nextLabel = nextScene ? (nextScene.emoji + ' ' + nextScene.titulo) : nextSceneId;

        container.innerHTML =
            '<div class="gm-option-card" style="border-color:' + border + ';background:' + bg + ';">' +
            '<div style="color:rgba(255,255,255,0.9);font-size:0.85rem;margin-bottom:0.8rem;white-space:pre-wrap;line-height:1.5;">' + escapeHtml(text) + '</div>' +
            '<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">' +
            '<button class="btn-gm-action btn-resolve" id="btn-gm-continue" style="font-size:0.85rem;padding:0.4rem 1rem;">▶ Continuar → ' + nextLabel + '</button>' +
            '<button class="btn-gm-action btn-send-choices" id="btn-gm-resend-outcome" style="font-size:0.7rem;">📤 Reenviar resultado</button>' +
            '</div>' +
            '</div>';

        // Store for player-initiated continue
        state.pendingNextScene = nextSceneId;

        document.getElementById('btn-gm-continue').addEventListener('click', function() {
            state.pendingNextScene = null;
            // Check for random event before next scene
            if (!checkRandomEvent(nextSceneId)) {
                loadScene(nextSceneId);
            }
        });

        document.getElementById('btn-gm-resend-outcome').addEventListener('click', function() {
            window.Carrera.sync.send('outcome_show', { text: text });
            flashSendConfirmation(this);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // --- Victory ---

    function handleVictory(scene) {
        var isExhausted = window.Carrera.clock.isExhausted();
        var narrativeText = isExhausted ? scene.narrativaAgotados : scene.narrativa;
        var team = window.Carrera.characters.getTeam();

        // === End-of-adventure progression ===
        var lootDrops = [];
        if (advCtx && advCtx.campaign) {
            var campaign = advCtx.campaign;

            // Award completion XP
            var xpResults = window.Carrera.progression.awardTeamXP(campaign, 'completar_aventura');
            xpResults.forEach(function(r) {
                if (r.awarded > 0) addLog('📈 ' + r.player.emoji + ' +' + r.awarded + ' XP (aventura completada)');
                if (r.levelUp) handleLevelUp(r.player, r.newLevel);
            });

            // Bonus: clock never full
            if (window.Carrera.clock.getTotal() === 0) {
                window.Carrera.progression.awardTeamXP(campaign, 'reloj_nunca_lleno');
                addLog('📈 +10 XP bonus (reloj nunca lleno)');
            }

            // Record adventure completion
            campaign.aventurasCompletadas.push({
                adventureId: advCtx.adventureId,
                fecha: new Date().toISOString(),
                resultados: {
                    criticos: advCtx.criticosAventura || 0,
                    exitos: advCtx.exitosAventura || 0,
                    complicaciones: advCtx.complicacionesAventura || 0,
                    juergas: advCtx.juergasAventura || 0
                },
                relojTotal: window.Carrera.clock.getTotal(),
                equipoIds: campaign.equipo.map(function(p) { return p.id; })
            });

            // Check badges with adventure-complete context
            advCtx.adventureComplete = true;
            advCtx.relojTotal = window.Carrera.clock.getTotal();
            advCtx.relojExhausted = isExhausted;
            advCtx.flags = state.flags;
            // vecesRelojLleno is tracked in resolveRollResult/gmManualResolve when clock fills

            var newBadges = window.Carrera.badges.checkBadges(campaign, advCtx);
            newBadges.forEach(function(badge) { handleBadgeEarned(badge); });

            // Generate loot
            lootDrops = window.Carrera.loot.generateLoot(2);

            window.Carrera.campaignUI.autoSave();
        }

        var narrativeEl = document.getElementById('gm-narrative');
        if (narrativeEl) narrativeEl.textContent = narrativeText;

        var optionsEl = document.getElementById('gm-options');
        if (optionsEl) {
            var teamHtml = team.map(function(p) { return p.emoji + ' ' + p.nombre; }).join(' · ');

            // XP summary
            var xpSummary = '';
            if (advCtx && advCtx.campaign) {
                xpSummary = advCtx.campaign.equipo.map(function(p) {
                    return p.emoji + ' Nv.' + p.level + ' (' + (p.xp || 0) + ' XP)';
                }).join(' · ');
            }

            // Loot display
            var lootHtml = '';
            if (lootDrops.length > 0) {
                lootHtml = '<div style="margin-top:0.5rem;"><strong style="color:var(--gold);">🎁 Loot:</strong> ';
                lootHtml += lootDrops.map(function(item) {
                    var color = window.Carrera.loot.getRarezaColor(item.rareza);
                    return '<span style="color:' + color + ';">' + item.emoji + ' ' + item.nombre + '</span>';
                }).join(' · ');
                lootHtml += '</div>';
            }

            optionsEl.innerHTML =
                '<div class="gm-option-card" style="border-color: var(--gold); text-align: center; background: rgba(234,179,8,0.1);">' +
                '<div style="font-size:1.3rem;color:var(--gold);font-weight:800;margin-bottom:0.5rem;">🏆 ¡Victoria! 🏆</div>' +
                '<div style="color:white;margin-bottom:0.5rem;font-size:1rem;">' + teamHtml + '</div>' +
                '<div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-bottom:0.5rem;">' +
                '📍 Escenas: ' + state.sceneNumber +
                ' · 🎲 Dado: d' + window.Carrera.dice.getCurrentDie() +
                ' · ⏰ Reloj: ' + window.Carrera.clock.getTotal() +
                (isExhausted ? ' · 😴 Agotados' : '') +
                '</div>' +
                (xpSummary ? '<div style="color:rgba(255,255,255,0.5);font-size:0.8rem;margin-bottom:0.5rem;">' + xpSummary + '</div>' : '') +
                lootHtml +
                '<div style="display:flex;gap:0.5rem;justify-content:center;margin-top:0.8rem;flex-wrap:wrap;">' +
                (lootDrops.length > 0 ? '<button class="btn-gm-action btn-resolve" id="btn-gm-loot" style="font-size:0.85rem;">🎁 Repartir Loot</button>' : '') +
                '<button class="btn-gm-action btn-resolve" id="btn-gm-replay" style="font-size:0.85rem;">' +
                (advCtx && advCtx.campaign ? '🗺️ Volver a Campañas' : '🏠 Volver al inicio') +
                '</button>' +
                '</div>' +
                '</div>';

            document.getElementById('btn-gm-replay').addEventListener('click', function() {
                window.Carrera.audio.stopAmbient();
                if (advCtx && advCtx.campaign) {
                    window.Carrera.app.showScreen('adventure-select');
                } else {
                    window.Carrera.app.showScreen('title');
                }
            });

            // Loot button
            var btnLoot = document.getElementById('btn-gm-loot');
            if (btnLoot && lootDrops.length > 0) {
                btnLoot.addEventListener('click', function() {
                    // Distribute loot to players
                    if (advCtx && advCtx.campaign) {
                        var distributed = [];
                        lootDrops.forEach(function(item, idx) {
                            var playerIdx = idx % advCtx.campaign.equipo.length;
                            var player = advCtx.campaign.equipo[playerIdx];
                            if (window.Carrera.loot.addItem(player, item)) {
                                distributed.push(player.emoji + ' recibe ' + item.emoji + ' ' + item.nombre);
                            } else {
                                distributed.push(player.emoji + ' inventario lleno, ' + item.emoji + ' perdido');
                            }
                        });
                        addLog('🎁 Loot: ' + distributed.join(' · '));
                        window.Carrera.campaignUI.autoSave();

                        // Send loot reveal to player
                        window.Carrera.sync.send('loot_reveal', {
                            items: lootDrops.map(function(item) {
                                return { emoji: item.emoji, nombre: item.nombre, rareza: item.rareza, descripcion: item.descripcion };
                            })
                        });

                        btnLoot.textContent = '✅ Loot repartido';
                        btnLoot.disabled = true;
                    }
                });
            }
        }

        // Send to player (include level info if campaign active)
        var campaign = advCtx ? advCtx.campaign : null;
        window.Carrera.sync.send('victory', {
            titulo: scene.titulo,
            emoji: scene.emoji,
            narrativa: narrativeText,
            team: team.map(function(p) {
                var cp = null;
                if (campaign) {
                    for (var ei = 0; ei < campaign.equipo.length; ei++) {
                        if (campaign.equipo[ei].id === p.id) { cp = campaign.equipo[ei]; break; }
                    }
                }
                return {
                    id: p.id, emoji: p.emoji, nombre: p.nombre, color: p.color,
                    level: cp ? cp.level : 1,
                    xp: cp ? cp.xp : 0
                };
            }),
            sceneNumber: state.sceneNumber,
            currentDie: window.Carrera.dice.getCurrentDie(),
            clockTotal: window.Carrera.clock.getTotal()
        });

        setTimeout(function() {
            window.Carrera.sync.send('effect_play', { effect: 'triumph' });
            window.Carrera.audio.playTriumph();
        }, 500);

        setTimeout(function() { window.Carrera.sync.send('confetti', {}); }, 1000);
        setTimeout(function() { window.Carrera.sync.send('confetti', {}); }, 3000);
        setTimeout(function() { window.Carrera.sync.send('confetti', {}); }, 5000);

        addLog('🏆 ¡VICTORIA!');
    }

    // --- GM Status ---

    function updateGMStatus() {
        var bonus = window.Carrera.dice.getDifficultyBonus();
        var clockState = window.Carrera.clock.getState();

        var dieEl = document.getElementById('gm-current-die');
        if (dieEl) dieEl.textContent = '+' + bonus;

        var statusClock = document.getElementById('gm-status-clock');
        if (statusClock) {
            statusClock.innerHTML = '';
            for (var i = 0; i < clockState.segments; i++) {
                var seg = document.createElement('div');
                seg.className = 'clock-segment' + (i < clockState.filled ? ' filled' : '');
                seg.style.width = '14px';
                seg.style.height = '14px';
                statusClock.appendChild(seg);
            }
        }

        window.Carrera.clock.render();
    }

    // --- Dice History ---

    function renderDiceHistory() {
        var container = document.getElementById('gm-dice-history');
        if (!container) return;

        var colors = { critico: '#fde047', exito: '#86efac', complicacion: '#fdba74', juerga: '#d8b4fe' };

        container.innerHTML = state.diceHistory.slice(0, 15).map(function(entry) {
            var c = colors[entry.type] || '#fff';
            return '<div class="gm-dice-history-entry" style="color:' + c + ';">' + (entry.value || entry.result || '?') + ' vs ' + (entry.difficulty || '?') + ' → ' + entry.label + (entry.advantage ? ' 🎲🎲' : '') + '</div>';
        }).join('');
    }

    // --- Game Log ---

    function addLog(text) {
        var timestamp = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        state.gameLog.unshift({ time: timestamp, text: text });
        if (state.gameLog.length > 50) state.gameLog.pop();

        var container = document.getElementById('gm-log');
        if (container) {
            var entry = document.createElement('div');
            entry.className = 'gm-log-entry';
            entry.textContent = '[' + timestamp + '] ' + text;
            container.insertBefore(entry, container.firstChild);

            while (container.children.length > 50) {
                container.removeChild(container.lastChild);
            }
        }

        try {
            sessionStorage.setItem('carrera-game-log', JSON.stringify(state.gameLog));
        } catch (e) {}
    }

    // --- Juergas Library ---

    function initJuergasLibrary() {
        var container = document.getElementById('gm-juergas');
        if (!container) return;

        var juergas = window.Carrera.juergasGenericas || [];
        juergas.forEach(function(j, i) {
            var btn = document.createElement('button');
            btn.className = 'btn-quick';
            btn.textContent = '🎪 #' + (i + 1);
            btn.title = j;
            btn.addEventListener('click', function() {
                window.Carrera.sync.send('custom_text', { text: j });
                window.Carrera.sync.send('effect_play', { effect: 'hijinx' });
                window.Carrera.audio.playHijinx();
                addLog('🎪 ¡Oh No!: ' + j.substring(0, 50) + '...');
                flashSendConfirmation(btn);
            });
            container.appendChild(btn);
        });
    }

    function getState() {
        return state;
    }

    return {
        reset: reset,
        start: start,
        loadScene: loadScene,
        getState: getState,
        sendNarrativeToPlayer: sendNarrativeToPlayer,
        sendChoicesToPlayer: sendChoicesToPlayer,
        gmResolveRoll: gmResolveRoll,
        gmManualResolve: gmManualResolve,
        updateGMStatus: updateGMStatus,
        sendStatusUpdate: sendStatusUpdate,
        initJuergasLibrary: initJuergasLibrary,
        resendCurrentState: resendCurrentState,
        addLog: addLog,
        setAdventureContext: setAdventureContext
    };
})();
