// Motor de Aventura - Escenas, opciones y resolución
window.Carrera = window.Carrera || {};

window.Carrera.adventure = (function() {
    var state = {
        currentSceneId: null,
        sceneNumber: 0,
        totalScenes: 5,
        flags: {},
        history: [],
        typeTimer: null
    };

    function reset() {
        state.currentSceneId = null;
        state.sceneNumber = 0;
        state.flags = {};
        state.history = [];
        cancelTyping();
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

        // Cancel any previous typing
        cancelTyping();

        state.currentSceneId = sceneId;
        if (sceneId !== 'victoria') state.sceneNumber++;

        // Transition effect
        var sceneContent = document.querySelector('.scene-content');
        if (sceneContent) {
            sceneContent.classList.add('scene-transitioning');
            setTimeout(function() {
                // Update ambient audio
                window.Carrera.audio.playAmbient(scene.ambientPreset);
                // Render scene
                renderScene(scene);
                // Update status bar
                updateStatusBar();
                // Remove transition
                sceneContent.classList.remove('scene-transitioning');
            }, 300);
        } else {
            window.Carrera.audio.playAmbient(scene.ambientPreset);
            renderScene(scene);
            updateStatusBar();
        }

        // Log
        state.history.push(sceneId);
    }

    function renderScene(scene) {
        var narrativeEl = document.getElementById('scene-narrative');
        var choicesEl = document.getElementById('scene-choices');
        var titleEl = document.getElementById('scene-title');
        var diceArea = document.getElementById('dice-area');
        var outcomeArea = document.getElementById('outcome-area');
        var gmNotes = document.getElementById('gm-notes');

        // Background
        var bgEl = document.getElementById('scene-background');
        if (bgEl) {
            bgEl.className = 'scene-background ' + (scene.backgroundClass || '');
            renderBackgroundExtras(bgEl, scene.backgroundClass);
        }

        // Title
        if (titleEl) {
            titleEl.innerHTML = scene.emoji + ' ' + scene.titulo;
        }

        // Narrative
        if (narrativeEl) {
            narrativeEl.textContent = '';
            narrativeEl.classList.add('typing');
            typeText(narrativeEl, scene.narrativa, function() {
                narrativeEl.classList.remove('typing');
            });
        }

        // Clear previous
        if (diceArea) { diceArea.innerHTML = ''; diceArea.className = 'dice-area'; }
        if (outcomeArea) { outcomeArea.innerHTML = ''; outcomeArea.style.display = 'none'; }

        // Victory screen
        if (scene.id === 'victoria') {
            renderVictory(scene);
            return;
        }

        // Choices
        if (choicesEl) {
            choicesEl.innerHTML = '';
            choicesEl.style.opacity = '0';

            scene.opciones.forEach(function(opcion) {
                var btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerHTML = '<span class="choice-emoji">' + opcion.emoji + '</span> <span class="choice-text">' + opcion.texto + '</span>';

                // Show advantage indicator
                if (opcion.requiereTirada) {
                    var hasAdv = window.Carrera.characters.checkAdvantage(opcion.tagsRelevantes);
                    var hasAutoSuccess = opcion.autoExitoTags && window.Carrera.characters.checkAutoSuccess(opcion.autoExitoTags);
                    var skillAuto = window.Carrera.characters.checkSkillAutoSuccess(opcion.tagsRelevantes);

                    if (hasAutoSuccess || skillAuto) {
                        btn.innerHTML += ' <span class="choice-badge auto-success">⚡ ¡Auto-éxito!</span>';
                    } else if (hasAdv) {
                        btn.innerHTML += ' <span class="choice-badge advantage">🎲🎲 ¡Ventaja!</span>';
                    } else {
                        btn.innerHTML += ' <span class="choice-badge roll">🎲 Tirada</span>';
                    }
                }

                // Flag-based auto success indicator
                if (opcion.autoExitoFlags) {
                    var hasFlag = opcion.autoExitoFlags.some(function(f) { return state.flags[f]; });
                    if (hasFlag) {
                        btn.innerHTML += ' <span class="choice-badge auto-success">🎁 ¡Regalo útil!</span>';
                    }
                }

                btn.addEventListener('click', function() {
                    handleChoice(opcion);
                });

                choicesEl.appendChild(btn);
            });

            // Fade in choices after a short delay
            setTimeout(function() {
                choicesEl.style.opacity = '1';
            }, 800);
        }

        // GM Notes
        if (gmNotes) {
            gmNotes.textContent = scene.notasGM || '';

            // Show which tags the team has that are relevant
            var teamNote = getTeamRelevanceNote(scene);
            if (teamNote) {
                gmNotes.textContent += '\n\n🎯 ' + teamNote;
            }
        }
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

    function renderBackgroundExtras(bgEl, bgClass) {
        // Remove old extras
        var oldExtras = bgEl.querySelectorAll('.bg-extra');
        oldExtras.forEach(function(el) { el.remove(); });

        if (bgClass === 'bg-forest-clearing') {
            // Floating leaves
            for (var i = 0; i < 8; i++) {
                var leaf = document.createElement('div');
                leaf.className = 'bg-extra floating-leaf';
                leaf.textContent = ['🍃', '🍂', '🌿'][Math.floor(Math.random() * 3)];
                leaf.style.left = Math.random() * 100 + '%';
                leaf.style.animationDelay = Math.random() * 8 + 's';
                leaf.style.animationDuration = (6 + Math.random() * 6) + 's';
                leaf.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
                bgEl.appendChild(leaf);
            }
        } else if (bgClass === 'bg-tunnel') {
            // Fireflies
            for (var j = 0; j < 12; j++) {
                var fly = document.createElement('div');
                fly.className = 'bg-extra bg-firefly';
                fly.style.left = (10 + Math.random() * 80) + '%';
                fly.style.top = (10 + Math.random() * 80) + '%';
                fly.style.animationDelay = Math.random() * 4 + 's';
                fly.style.animationDuration = (3 + Math.random() * 4) + 's';
                bgEl.appendChild(fly);
            }
        } else if (bgClass === 'bg-treasure') {
            // Sparkles
            for (var k = 0; k < 15; k++) {
                var sparkle = document.createElement('div');
                sparkle.className = 'bg-extra bg-sparkle';
                sparkle.textContent = ['✨', '💫', '⭐'][Math.floor(Math.random() * 3)];
                sparkle.style.left = (10 + Math.random() * 80) + '%';
                sparkle.style.top = (10 + Math.random() * 80) + '%';
                sparkle.style.animationDelay = Math.random() * 3 + 's';
                sparkle.style.animationDuration = (1.5 + Math.random() * 2) + 's';
                sparkle.style.fontSize = (0.8 + Math.random() * 1.5) + 'rem';
                bgEl.appendChild(sparkle);
            }
        } else if (bgClass === 'bg-river') {
            // Water splashes
            for (var m = 0; m < 5; m++) {
                var splash = document.createElement('div');
                splash.className = 'bg-extra bg-splash';
                splash.textContent = '💧';
                splash.style.left = (15 + Math.random() * 70) + '%';
                splash.style.top = (40 + Math.random() * 15) + '%';
                splash.style.animationDelay = Math.random() * 4 + 's';
                splash.style.animationDuration = (2 + Math.random() * 2) + 's';
                bgEl.appendChild(splash);
            }
        } else if (bgClass === 'bg-victory') {
            // Stars
            for (var n = 0; n < 20; n++) {
                var star = document.createElement('div');
                star.className = 'bg-extra bg-star';
                star.textContent = ['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)];
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                star.style.animationDuration = (1 + Math.random() * 2) + 's';
                star.style.fontSize = (0.8 + Math.random() * 2) + 'rem';
                bgEl.appendChild(star);
            }
        }
    }

    function handleChoice(opcion) {
        var choicesEl = document.getElementById('scene-choices');
        var diceArea = document.getElementById('dice-area');

        // Disable choices
        if (choicesEl) {
            var buttons = choicesEl.querySelectorAll('.choice-btn');
            buttons.forEach(function(b) { b.disabled = true; b.classList.add('disabled'); });
        }

        window.Carrera.audio.playClick();

        if (!opcion.requiereTirada) {
            // Direct progression
            showOutcome(opcion.narrativaResultado || '', opcion.siguienteEscena);
            return;
        }

        // Check for auto-success via tags
        if (opcion.autoExitoTags && window.Carrera.characters.checkAutoSuccess(opcion.autoExitoTags)) {
            showAutoSuccess(opcion, '¡La herramienta perfecta!');
            return;
        }

        // Check for auto-success via flags
        if (opcion.autoExitoFlags) {
            var hasFlag = opcion.autoExitoFlags.some(function(f) { return state.flags[f]; });
            if (hasFlag) {
                showAutoSuccess(opcion, '¡El regalo de antes les ayuda!');
                return;
            }
        }

        // Check for skill auto-success (first use)
        var skillPlayer = window.Carrera.characters.checkSkillAutoSuccess(opcion.tagsRelevantes);
        if (skillPlayer) {
            window.Carrera.characters.markSkillUsed(skillPlayer.id);
            showSkillAutoSuccess(opcion, skillPlayer);
            return;
        }

        // Check for advantage
        var hasAdvantage = window.Carrera.characters.checkAdvantage(opcion.tagsRelevantes);

        // Check for advantage from flags
        if (opcion.ventajaConFlags) {
            var flagAdvantage = opcion.ventajaConFlags.some(function(f) { return state.flags[f]; });
            if (flagAdvantage) hasAdvantage = true;
        }

        // Check for extra clue advantage
        if (opcion.usaPistaExtra && state.flags.pistaExtra) {
            hasAdvantage = true;
        }

        // Roll dice
        if (diceArea) {
            window.Carrera.dice.animateRoll(diceArea, hasAdvantage, function(result) {
                resolveRoll(opcion, result);
            });
        }
    }

    function showAutoSuccess(opcion, message) {
        var outcomeArea = document.getElementById('outcome-area');
        var resultado = opcion.resultados.exito;

        if (outcomeArea) {
            outcomeArea.style.display = 'block';
            outcomeArea.innerHTML =
                '<div class="auto-success-banner">⚡ ' + message + '</div>' +
                '<p class="outcome-text">' + resultado.texto + '</p>';

            if (resultado.flag) state.flags[resultado.flag] = true;

            window.Carrera.audio.playSuccess();
            addContinueButton(outcomeArea, opcion.siguienteEscena);
        }
    }

    function showSkillAutoSuccess(opcion, player) {
        var outcomeArea = document.getElementById('outcome-area');
        var resultado = opcion.resultados.exito;

        if (outcomeArea) {
            outcomeArea.style.display = 'block';
            outcomeArea.innerHTML =
                '<div class="auto-success-banner skill-banner">' +
                player.emoji + ' ¡' + player.nombre + ' usa ' + player.habilidad.nombre + '!</div>' +
                '<p class="outcome-text">' + resultado.texto + '</p>' +
                '<p class="skill-note">(' + player.habilidad.nombre + ' ahora dará ventaja en vez de auto-éxito)</p>';

            if (resultado.flag) state.flags[resultado.flag] = true;

            window.Carrera.audio.playCritical();
            addContinueButton(outcomeArea, opcion.siguienteEscena);
        }
    }

    function resolveRoll(opcion, rollResult) {
        var outcomeArea = document.getElementById('outcome-area');
        var resultado = opcion.resultados[rollResult.tipo];

        if (!resultado) resultado = opcion.resultados.complicacion;

        if (outcomeArea) {
            outcomeArea.style.display = 'block';
            outcomeArea.innerHTML = '<p class="outcome-text">' + resultado.texto + '</p>';

            // Apply clock fill
            if (resultado.reloj && resultado.reloj > 0) {
                setTimeout(function() {
                    var clockResult = window.Carrera.clock.fill(resultado.reloj);
                    if (clockResult.dieShrunk) {
                        var newDie = window.Carrera.dice.getCurrentDie();
                        var warningEl = document.createElement('div');
                        warningEl.className = 'clock-warning';
                        warningEl.innerHTML = '⏰ ¡El reloj se llenó! El dado baja a d' + newDie;
                        outcomeArea.appendChild(warningEl);
                    }
                }, 500);
            }

            // Apply flag
            if (resultado.flag) {
                state.flags[resultado.flag] = true;
            }

            addContinueButton(outcomeArea, opcion.siguienteEscena);
        }
    }

    function addContinueButton(container, nextSceneId) {
        var btn = document.createElement('button');
        btn.className = 'btn-continue';
        btn.innerHTML = '▶ Continuar la aventura';
        btn.addEventListener('click', function() {
            window.Carrera.audio.playClick();
            loadScene(nextSceneId);
        });

        setTimeout(function() {
            container.appendChild(btn);
            btn.classList.add('visible');
        }, 1000);
    }

    function showOutcome(text, nextSceneId) {
        var outcomeArea = document.getElementById('outcome-area');
        if (outcomeArea) {
            outcomeArea.style.display = 'block';
            outcomeArea.innerHTML = '<p class="outcome-text">' + text + '</p>';
            addContinueButton(outcomeArea, nextSceneId);
        }
    }

    function renderVictory(scene) {
        var narrativeEl = document.getElementById('scene-narrative');
        var choicesEl = document.getElementById('scene-choices');
        var diceArea = document.getElementById('dice-area');
        var outcomeArea = document.getElementById('outcome-area');

        var isExhausted = window.Carrera.clock.isExhausted();
        var narrativeText = isExhausted ? scene.narrativaAgotados : scene.narrativa;

        if (narrativeEl) {
            narrativeEl.textContent = '';
            typeText(narrativeEl, narrativeText, function() {});
        }

        if (choicesEl) choicesEl.innerHTML = '';
        if (diceArea) { diceArea.innerHTML = ''; diceArea.className = 'dice-area'; }
        if (outcomeArea) { outcomeArea.style.display = 'none'; outcomeArea.innerHTML = ''; }

        // Play triumph
        setTimeout(function() {
            window.Carrera.audio.playTriumph();
        }, 500);

        // Launch confetti
        setTimeout(function() {
            launchConfetti();
        }, 1000);

        // Launch more confetti waves
        setTimeout(function() { launchConfetti(); }, 3000);
        setTimeout(function() { launchConfetti(); }, 5000);

        // Show team summary and replay button
        setTimeout(function() {
            if (choicesEl) {
                var team = window.Carrera.characters.getTeam();
                var teamHtml = '<div class="victory-team">';
                team.forEach(function(p) {
                    teamHtml += '<div class="victory-character"><span class="victory-emoji">' + p.emoji + '</span><span>' + p.nombre + '</span></div>';
                });
                teamHtml += '</div>';

                choicesEl.innerHTML = teamHtml +
                    '<div class="victory-message">🏆 ¡Aventura completada! 🏆</div>' +
                    '<div class="victory-stats">' +
                    '<span>📍 Escenas: ' + (state.sceneNumber) + '</span> ' +
                    '<span>🎲 Dado final: d' + window.Carrera.dice.getCurrentDie() + '</span> ' +
                    '<span>⏰ Reloj total: ' + window.Carrera.clock.getTotal() + '</span>' +
                    '</div>' +
                    '<button class="choice-btn victory-btn" id="btn-replay">🏠 Volver al inicio</button>';

                var btnReplay = document.getElementById('btn-replay');
                if (btnReplay) {
                    btnReplay.addEventListener('click', function() {
                        window.Carrera.audio.stopAmbient();
                        window.Carrera.audio.playClick();
                        window.Carrera.app.showScreen('title');
                    });
                }
            }
        }, 2500);
    }

    function launchConfetti() {
        var container = document.getElementById('confetti-container');
        if (!container) return;

        container.style.display = 'block';

        var colors = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#e63946', '#a855f7', '#3b82f6', '#10b981', '#f43f5e'];
        var shapes = ['confetti-piece', 'confetti-piece confetti-circle', 'confetti-piece confetti-strip'];

        for (var i = 0; i < 50; i++) {
            var piece = document.createElement('div');
            piece.className = shapes[Math.floor(Math.random() * shapes.length)];
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 1.5 + 's';
            piece.style.animationDuration = (2 + Math.random() * 3) + 's';
            var size = 6 + Math.random() * 10;
            piece.style.width = size + 'px';
            piece.style.height = size + 'px';
            container.appendChild(piece);
        }

        setTimeout(function() {
            // Only remove this batch of confetti
            var pieces = container.querySelectorAll('.confetti-piece');
            pieces.forEach(function(p) {
                if (parseFloat(p.style.animationDelay) < 2) {
                    p.remove();
                }
            });
        }, 6000);
    }

    function updateStatusBar() {
        var sceneCounter = document.getElementById('scene-counter');
        if (sceneCounter && state.currentSceneId !== 'victoria') {
            sceneCounter.textContent = 'Escena ' + state.sceneNumber + '/' + state.totalScenes;
        } else if (sceneCounter) {
            sceneCounter.textContent = '🏆 ¡Victoria!';
        }

        window.Carrera.clock.render();
    }

    // Typing effect with cancellation support
    function cancelTyping() {
        if (state.typeTimer) {
            clearTimeout(state.typeTimer);
            state.typeTimer = null;
        }
    }

    function typeText(element, text, callback) {
        cancelTyping();
        var i = 0;
        var speed = 22;
        element.textContent = '';

        function skipToEnd() {
            cancelTyping();
            i = text.length;
            element.textContent = text;
            element.removeEventListener('click', skipToEnd);
            if (callback) callback();
        }

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                state.typeTimer = setTimeout(type, speed);
            } else {
                element.removeEventListener('click', skipToEnd);
                if (callback) callback();
            }
        }

        // Allow click to skip typing
        element.addEventListener('click', skipToEnd);
        type();
    }

    function getState() {
        return state;
    }

    return {
        reset: reset,
        start: start,
        loadScene: loadScene,
        getState: getState
    };
})();
