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
                btnMute.innerHTML = muted ? '🔇 Sin sonido' : '🔊 Sonido';
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

        // Back to title from team
        var btnBackChars = document.getElementById('btn-back-characters');
        if (btnBackChars) {
            btnBackChars.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                showScreen('characters');
            });
        }

        showScreen('title');
    }

    function showScreen(screenId) {
        // Hide all screens
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
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        showScreen: showScreen
    };
})();
