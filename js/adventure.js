// Motor de Aventura - Escenas, opciones y resolución
window.Carrera = window.Carrera || {};

window.Carrera.adventure = (function() {
    var state = {
        currentSceneId: null,
        sceneNumber: 0,
        totalScenes: 5,
        flags: {},
        history: []
    };

    function reset() {
        state.currentSceneId = null;
        state.sceneNumber = 0;
        state.flags = {};
        state.history = [];
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
        if (sceneId !== 'victoria') state.sceneNumber++;

        // Update ambient audio
        window.Carrera.audio.playAmbient(scene.ambientPreset);

        // Render scene
        renderScene(scene);

        // Update status bar
        updateStatusBar();

        // Log
        state.history.push(sceneId);
    }

    function renderScene(scene) {
        var sceneScreen = document.getElementById('screen-scene');
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
        if (diceArea) diceArea.innerHTML = '';
        if (diceArea) diceArea.className = 'dice-area';
        if (outcomeArea) { outcomeArea.innerHTML = ''; outcomeArea.style.display = 'none'; }

        // Victory screen
        if (scene.id === 'victoria') {
            renderVictory(scene);
            return;
        }

        // Choices
        if (choicesEl) {
            choicesEl.innerHTML = '';
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
        }

        // GM Notes
        if (gmNotes) {
            gmNotes.textContent = scene.notasGM || '';
        }
    }

    function handleChoice(opcion) {
        var choicesEl = document.getElementById('scene-choices');
        var diceArea = document.getElementById('dice-area');
        var outcomeArea = document.getElementById('outcome-area');

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
                '⚡ ¡' + player.nombre + ' usa ' + player.habilidad.nombre + '!</div>' +
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
                var clockResult = window.Carrera.clock.fill(resultado.reloj);
                if (clockResult.dieShrunk) {
                    var newDie = window.Carrera.dice.getCurrentDie();
                    outcomeArea.innerHTML += '<div class="clock-warning">⏰ ¡El reloj se llenó! El dado baja a d' + newDie + '</div>';
                }
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
        }, 800);
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
                    '<button class="choice-btn victory-btn" onclick="window.Carrera.app.showScreen(\'title\')">🏠 Volver al inicio</button>';
            }
        }, 2000);
    }

    function launchConfetti() {
        var container = document.getElementById('confetti-container');
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'block';

        var colors = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#e63946', '#a855f7', '#3b82f6'];

        for (var i = 0; i < 60; i++) {
            var piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            container.appendChild(piece);
        }

        setTimeout(function() {
            container.style.display = 'none';
            container.innerHTML = '';
        }, 5000);
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

    function typeText(element, text, callback) {
        var i = 0;
        var speed = 25;
        element.textContent = '';

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }

        type();

        // Allow click to skip
        element.addEventListener('click', function skip() {
            i = text.length;
            element.textContent = text;
            element.removeEventListener('click', skip);
            if (callback) callback();
        }, { once: false });
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
