// Controlador Principal - ¡A la Carrera!
window.Carrera = window.Carrera || {};

window.Carrera.app = (function() {
    var currentScreen = 'title';

    function init() {
        // Init projection
        window.Carrera.projection.init();

        // Title screen button
        var btnStart = document.getElementById('btn-start');
        if (btnStart) {
            btnStart.addEventListener('click', function() {
                // Init audio on first user interaction
                window.Carrera.audio.init();
                window.Carrera.audio.resume();
                window.Carrera.audio.playClick();
                showScreen('characters');
            });
        }

        // Character screen
        window.Carrera.characters.renderGrid('character-grid');
        window.Carrera.characters.renderSlots();
        window.Carrera.characters.initSlotClickHandlers();
        window.Carrera.characters.updateStartButton();

        // Start adventure button
        var btnAdventure = document.getElementById('btn-start-adventure');
        if (btnAdventure) {
            btnAdventure.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                window.Carrera.characters.renderTeamSummary('team-summary');
                showScreen('team');
            });
        }

        // Confirm team button
        var btnConfirm = document.getElementById('btn-confirm-team');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                showScreen('scene');
                window.Carrera.adventure.start();
            });
        }

        // GM Panel toggle
        var btnGM = document.getElementById('btn-gm-panel');
        if (btnGM) {
            btnGM.addEventListener('click', function() {
                var panel = document.getElementById('gm-panel');
                if (panel) panel.classList.toggle('open');
            });
        }

        // GM Panel close
        var btnGMClose = document.getElementById('btn-gm-close');
        if (btnGMClose) {
            btnGMClose.addEventListener('click', function() {
                var panel = document.getElementById('gm-panel');
                if (panel) panel.classList.remove('open');
            });
        }

        // Projection button
        var btnProjection = document.getElementById('btn-projection');
        if (btnProjection) {
            btnProjection.addEventListener('click', function() {
                window.Carrera.projection.toggle();
            });
        }

        // Mute button
        var btnMute = document.getElementById('btn-mute');
        if (btnMute) {
            btnMute.addEventListener('click', function() {
                var muted = window.Carrera.audio.toggleMute();
                btnMute.textContent = muted ? '🔇' : '🔊';
                btnMute.title = muted ? 'Activar sonido' : 'Silenciar';
            });
        }

        // Volume sliders
        var ambientSlider = document.getElementById('ambient-volume');
        if (ambientSlider) {
            ambientSlider.addEventListener('input', function() {
                window.Carrera.audio.setAmbientVolume(this.value / 100);
            });
        }

        var sfxSlider = document.getElementById('sfx-volume');
        if (sfxSlider) {
            sfxSlider.addEventListener('input', function() {
                window.Carrera.audio.setSfxVolume(this.value / 100);
            });
        }

        // GM manual controls
        var btnClockFill = document.getElementById('btn-clock-fill');
        if (btnClockFill) {
            btnClockFill.addEventListener('click', function() {
                window.Carrera.clock.manualFill();
            });
        }

        var btnClockEmpty = document.getElementById('btn-clock-empty');
        if (btnClockEmpty) {
            btnClockEmpty.addEventListener('click', function() {
                window.Carrera.clock.manualEmpty();
            });
        }

        // Back to characters from team
        var btnBackChars = document.getElementById('btn-back-characters');
        if (btnBackChars) {
            btnBackChars.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                showScreen('characters');
            });
        }

        // Keyboard shortcuts for GM
        document.addEventListener('keydown', function(e) {
            if (currentScreen !== 'scene') return;
            if (e.key === 'g' || e.key === 'G') {
                var panel = document.getElementById('gm-panel');
                if (panel) panel.classList.toggle('open');
            }
            if (e.key === 'f' || e.key === 'F') {
                window.Carrera.projection.toggle();
            }
            if (e.key === 'm' || e.key === 'M') {
                var muted = window.Carrera.audio.toggleMute();
                var muteBtn = document.getElementById('btn-mute');
                if (muteBtn) {
                    muteBtn.textContent = muted ? '🔇' : '🔊';
                }
            }
        });

        showScreen('title');
    }

    function showScreen(screenId) {
        // Stop audio when going back to title
        if (screenId === 'title') {
            window.Carrera.audio.stopAmbient();
        }

        // Hide all screens with fade
        var screens = document.querySelectorAll('.screen');
        screens.forEach(function(s) {
            s.classList.remove('screen-active');
        });

        // Show target screen
        var target = document.getElementById('screen-' + screenId);
        if (target) {
            target.classList.add('screen-active');
        }

        currentScreen = screenId;

        // Handle specific screen logic
        if (screenId === 'characters') {
            window.Carrera.characters.renderGrid('character-grid');
            window.Carrera.characters.renderSlots();
        }

        // Close GM panel when switching screens
        var gmPanel = document.getElementById('gm-panel');
        if (gmPanel) gmPanel.classList.remove('open');

        // Clean confetti
        var confetti = document.getElementById('confetti-container');
        if (confetti && screenId !== 'scene') {
            confetti.style.display = 'none';
            confetti.innerHTML = '';
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        showScreen: showScreen
    };
})();
