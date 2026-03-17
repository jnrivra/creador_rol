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
        lastRoll: null
    };

    function reset() {
        state.currentSceneId = null;
        state.sceneNumber = 0;
        state.flags = {};
        state.history = [];
        state.currentOption = null;
        state.diceHistory = [];
        state.gameLog = [];
        state.lastRoll = null;
        window.Carrera.dice.reset();
        window.Carrera.clock.reset();
        window.Carrera.characters.resetSkills();
    }

    function start() {
        reset();
        loadScene('scene1');
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

        // Reset advantage checkbox
        var advCheck = document.getElementById('gm-advantage-check');
        if (advCheck) advCheck.checked = false;

        // Scene transition chime + ambient
        window.Carrera.audio.playSceneTransition();
        window.Carrera.sync.send('effect_play', { effect: 'scene_transition' });
        window.Carrera.audio.playAmbient(scene.ambientPreset);

        // Render GM dashboard
        renderGMScene(scene);
        updateGMStatus();
        clearLastRollDisplay();

        // Send to player
        window.Carrera.sync.send('scene_load', {
            titulo: scene.titulo,
            emoji: scene.emoji,
            ambientPreset: scene.ambientPreset,
            backgroundClass: scene.backgroundClass
        });

        sendStatusUpdate();

        // Auto-send narrative at 400ms, then choices 5s after typing ends
        var narrativeLen = (scene.narrativa || '').length;
        var typingDuration = narrativeLen * 18;

        setTimeout(function() {
            sendNarrativeToPlayer();

            // Chain: choices arrive 5s after narrative finishes typing
            if (scene.opciones && scene.opciones.length > 0) {
                setTimeout(function() {
                    sendChoicesToPlayer(scene);
                }, typingDuration + 5000);
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
            backgroundClass: scene.backgroundClass
        });
        sendStatusUpdate();

        var narrativeLen = (scene.narrativa || '').length;
        var typingDuration = narrativeLen * 18;

        setTimeout(function() {
            sendNarrativeToPlayer();

            if (scene.opciones && scene.opciones.length > 0) {
                setTimeout(function() {
                    sendChoicesToPlayer(scene);
                }, typingDuration + 5000);
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
                    juerga: { emoji: '🎪', name: 'Juerga', color: '#d8b4fe' }
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
            sync.send('outcome_show', { text: text });
            addLog('▶ Sin tirada: ' + opcion.texto);
            showGMOutcome(text, opcion.siguienteEscena, 'direct');
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
            var resultado = opcion.resultados.exito;
            var banner = skillPlayer.emoji + ' ¡' + skillPlayer.nombre + ' usa ' + skillPlayer.habilidad.nombre + '!';

            if (resultado.flag) state.flags[resultado.flag] = true;

            sync.send('outcome_show', {
                banner: banner,
                bannerClass: 'auto-success-banner skill-banner',
                text: resultado.texto
            });
            sync.send('effect_play', { effect: 'critical' });
            window.Carrera.audio.playCritical();

            addLog('⚡ Auto-éxito habilidad: ' + skillPlayer.nombre);
            showGMOutcome(banner + '\n' + resultado.texto, opcion.siguienteEscena, 'critico');
            return;
        }

        // Needs dice roll
        var hasAdvantage = window.Carrera.characters.checkAdvantage(opcion.tagsRelevantes);

        if (opcion.ventajaConFlags) {
            var flagAdvantage = opcion.ventajaConFlags.some(function(f) { return state.flags[f]; });
            if (flagAdvantage) hasAdvantage = true;
        }

        if (opcion.usaPistaExtra && state.flags.pistaExtra) {
            hasAdvantage = true;
        }

        var advCheck = document.getElementById('gm-advantage-check');
        if (advCheck) advCheck.checked = hasAdvantage;

        highlightSelectedOption(opcion);

        // Tell player to roll dice!
        var diff = (opcion.dificultad || 10) + window.Carrera.dice.getDifficultyBonus();
        window.Carrera.sync.send('roll_prompt', {
            texto: opcion.texto,
            emoji: opcion.emoji,
            dificultad: diff,
            ventaja: hasAdvantage
        });

        addLog('🎯 Seleccionada: ' + opcion.texto + (hasAdvantage ? ' (ventaja)' : '') + ' — Tira dado o resultado manual');
    }

    function highlightSelectedOption(opcion) {
        var container = document.getElementById('gm-options');
        if (!container) return;

        var existing = container.querySelector('.gm-selected-indicator');
        if (existing) existing.remove();

        var indicator = document.createElement('div');
        indicator.className = 'gm-selected-indicator';
        indicator.innerHTML = '🎯 <strong>' + opcion.emoji + ' ' + opcion.texto + '</strong><br><span style="font-size:0.75rem;opacity:0.7;">Usa 🎲 Tirar dado (o Espacio) • O elige resultado manual abajo</span>';
        container.insertBefore(indicator, container.firstChild);

        var cards = container.querySelectorAll('.gm-option-card');
        cards.forEach(function(card) {
            if (card.dataset.optionText === opcion.texto) {
                card.classList.add('gm-option-selected');
            } else {
                card.classList.add('gm-option-dimmed');
            }
        });
    }

    function resolveAutoSuccess(opcion, message) {
        var resultado = opcion.resultados.exito;
        if (resultado.flag) state.flags[resultado.flag] = true;

        window.Carrera.sync.send('outcome_show', {
            banner: message,
            bannerClass: 'auto-success-banner',
            text: resultado.texto
        });
        window.Carrera.sync.send('effect_play', { effect: 'success' });
        window.Carrera.audio.playSuccess();

        addLog('⚡ Auto-éxito: ' + message);
        showGMOutcome(message + '\n' + resultado.texto, opcion.siguienteEscena, 'exito');
    }

    // --- Dice ---

    // GM inputs the number the kids rolled on their physical dice
    function gmResolveRoll() {
        var opcion = state.currentOption;
        if (!opcion) {
            addLog('⚠️ Selecciona una opción primero (▶ Resolver)');
            return;
        }

        var input = document.getElementById('gm-roll-input');
        if (!input || !input.value) {
            addLog('⚠️ Ingresa el número que sacaron los niños');
            input && input.focus();
            return;
        }

        var rollValue = parseInt(input.value, 10);
        if (isNaN(rollValue) || rollValue < 1 || rollValue > 20) {
            addLog('⚠️ El número debe ser entre 1 y 20');
            return;
        }

        var advCheck = document.getElementById('gm-advantage-check');
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

        // Clear input
        input.value = '';

        // Result sound on GM
        setTimeout(function() {
            if (rollResult.tipo === 'critico') window.Carrera.audio.playCritical();
            else if (rollResult.tipo === 'exito') window.Carrera.audio.playSuccess();
            else if (rollResult.tipo === 'juerga') window.Carrera.audio.playHijinx();
            else window.Carrera.audio.playFailure();
        }, 1200);

        setTimeout(function() {
            resolveRollResult(opcion, rollResult);
        }, 2000);
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

        var label = window.Carrera.dice.getResultLabel(tipo);

        window.Carrera.sync.send('choices_hide', {});

        var effectMap = { critico: 'critical', exito: 'success', complicacion: 'failure', juerga: 'hijinx' };
        window.Carrera.sync.send('effect_play', { effect: effectMap[tipo] || 'success' });

        window.Carrera.sync.send('outcome_show', {
            banner: label.emoji + ' ' + label.texto,
            bannerClass: 'auto-success-banner',
            text: resultado.texto
        });

        // Play SFX on GM too
        if (tipo === 'critico') window.Carrera.audio.playCritical();
        else if (tipo === 'exito') window.Carrera.audio.playSuccess();
        else if (tipo === 'juerga') window.Carrera.audio.playHijinx();
        else window.Carrera.audio.playFailure();

        // Apply clock
        if (resultado.reloj && resultado.reloj > 0) {
            var clockResult = window.Carrera.clock.fill(resultado.reloj);
            sendStatusUpdate();
            updateGMStatus();

            if (clockResult.difficultyUp) {
                var bonus = window.Carrera.dice.getDifficultyBonus();
                window.Carrera.sync.send('outcome_show', {
                    text: resultado.texto,
                    clockWarning: '⏰ ¡El reloj se llenó! Dificultad +' + bonus
                });
            }
        }

        if (resultado.flag) state.flags[resultado.flag] = true;

        addLog('📝 Manual: ' + label.texto + ' → "' + opcion.texto + '"');
        showGMOutcome(label.emoji + ' ' + label.texto + '\n' + resultado.texto, opcion.siguienteEscena, tipo);

        state.currentOption = null;
    }

    function resolveRollResult(opcion, rollData) {
        var tipo = rollData.tipo;
        var resultado = opcion.resultados[tipo];
        if (!resultado) resultado = opcion.resultados.complicacion;

        var effectMap = { critico: 'critical', exito: 'success', complicacion: 'failure', juerga: 'hijinx' };
        window.Carrera.sync.send('effect_play', { effect: effectMap[tipo] || 'success' });

        var outcomeData = { text: resultado.texto };

        if (resultado.reloj && resultado.reloj > 0) {
            var clockResult = window.Carrera.clock.fill(resultado.reloj);
            sendStatusUpdate();
            updateGMStatus();

            if (clockResult.difficultyUp) {
                var bonus = window.Carrera.dice.getDifficultyBonus();
                outcomeData.clockWarning = '⏰ ¡El reloj se llenó! Dificultad +' + bonus;
            }

            window.Carrera.sync.send('effect_play', { effect: 'clock_tick' });
        }

        window.Carrera.sync.send('outcome_show', outcomeData);

        if (resultado.flag) state.flags[resultado.flag] = true;

        showGMOutcome(resultado.texto, opcion.siguienteEscena, tipo);
        state.currentOption = null;
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
            '<div style="color:rgba(255,255,255,0.9);font-size:0.85rem;margin-bottom:0.8rem;white-space:pre-wrap;line-height:1.5;">' + text + '</div>' +
            '<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">' +
            '<button class="btn-gm-action btn-resolve" id="btn-gm-continue" style="font-size:0.85rem;padding:0.4rem 1rem;">▶ Continuar → ' + nextLabel + '</button>' +
            '<button class="btn-gm-action btn-send-choices" id="btn-gm-resend-outcome" style="font-size:0.7rem;">📤 Reenviar resultado</button>' +
            '</div>' +
            '</div>';

        document.getElementById('btn-gm-continue').addEventListener('click', function() {
            loadScene(nextSceneId);
        });

        document.getElementById('btn-gm-resend-outcome').addEventListener('click', function() {
            window.Carrera.sync.send('outcome_show', { text: text });
            flashSendConfirmation(this);
        });
    }

    // --- Victory ---

    function handleVictory(scene) {
        var isExhausted = window.Carrera.clock.isExhausted();
        var narrativeText = isExhausted ? scene.narrativaAgotados : scene.narrativa;
        var team = window.Carrera.characters.getTeam();

        var narrativeEl = document.getElementById('gm-narrative');
        if (narrativeEl) narrativeEl.textContent = narrativeText;

        var optionsEl = document.getElementById('gm-options');
        if (optionsEl) {
            var teamHtml = team.map(function(p) { return p.emoji + ' ' + p.nombre; }).join(' · ');
            optionsEl.innerHTML =
                '<div class="gm-option-card" style="border-color: var(--gold); text-align: center; background: rgba(234,179,8,0.1);">' +
                '<div style="font-size:1.3rem;color:var(--gold);font-weight:800;margin-bottom:0.5rem;">🏆 ¡Victoria! 🏆</div>' +
                '<div style="color:white;margin-bottom:0.5rem;font-size:1rem;">' + teamHtml + '</div>' +
                '<div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-bottom:0.8rem;">' +
                '📍 Escenas: ' + state.sceneNumber +
                ' · 🎲 Dado: d' + window.Carrera.dice.getCurrentDie() +
                ' · ⏰ Reloj: ' + window.Carrera.clock.getTotal() +
                (isExhausted ? ' · 😴 Agotados' : '') +
                '</div>' +
                '<button class="btn-gm-action btn-resolve" id="btn-gm-replay" style="font-size:0.9rem;padding:0.5rem 1.5rem;">🏠 Volver al inicio</button>' +
                '</div>';

            document.getElementById('btn-gm-replay').addEventListener('click', function() {
                window.Carrera.audio.stopAmbient();
                window.Carrera.app.showScreen('title');
            });
        }

        // Send to player
        window.Carrera.sync.send('victory', {
            titulo: scene.titulo,
            emoji: scene.emoji,
            narrativa: narrativeText,
            team: team.map(function(p) { return { emoji: p.emoji, nombre: p.nombre }; }),
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
                addLog('🎪 Juerga: ' + j.substring(0, 50) + '...');
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
        addLog: addLog
    };
})();
