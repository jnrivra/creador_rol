// Controlador Principal GM - ¡A la Carrera!
window.Carrera = window.Carrera || {};

window.Carrera.app = (function() {
    var currentScreen = 'title';

    function init() {
        // Init sync as GM
        window.Carrera.sync.init('gm');

        // Set clock render targets to GM IDs
        window.Carrera.clock.setRenderTargets('gm-clock-display', 'gm-die-display');

        // Title screen button
        var btnStart = document.getElementById('btn-start');
        if (btnStart) {
            btnStart.addEventListener('click', function() {
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
                initGMDashboard();
                window.Carrera.adventure.start();
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

        // Handle player reconnection (only resend ONCE per connection)
        var playerSynced = false;
        window.Carrera.sync.onMessage(function(msg) {
            if (msg.type === 'player_ready' && !playerSynced && window.Carrera.adventure.getState().currentSceneId) {
                playerSynced = true;
                setTimeout(function() {
                    window.Carrera.adventure.resendCurrentState();
                }, 300);
            }
        });

        // --- GM Dashboard Controls ---

        // Resend state
        var btnResend = document.getElementById('btn-resend-state');
        if (btnResend) {
            btnResend.addEventListener('click', function() {
                window.Carrera.adventure.resendCurrentState();
            });
        }

        // Open player view
        var btnOpenPlayer = document.getElementById('btn-open-player');
        if (btnOpenPlayer) {
            btnOpenPlayer.addEventListener('click', function() {
                var playerWin = window.open('player.html', 'carrera-player', 'width=1280,height=720');
                if (playerWin) {
                    // Store window reference for direct postMessage communication
                    window.Carrera.sync.setPlayerWindow(playerWin);
                }
                window.Carrera.adventure.addLog('Vista de jugadores abierta');
            });
        }

        // Send narrative
        var btnSendNarrative = document.getElementById('btn-send-narrative');
        if (btnSendNarrative) {
            btnSendNarrative.addEventListener('click', function() {
                window.Carrera.adventure.sendNarrativeToPlayer();
                // Flash confirmation
                var origText = btnSendNarrative.textContent;
                btnSendNarrative.textContent = '✅ Enviado';
                btnSendNarrative.style.background = 'rgba(34, 197, 94, 0.3)';
                setTimeout(function() {
                    btnSendNarrative.textContent = origText;
                    btnSendNarrative.style.background = '';
                }, 1200);
            });
        }

        // Send custom text
        var btnSendCustom = document.getElementById('btn-send-custom');
        if (btnSendCustom) {
            btnSendCustom.addEventListener('click', function() {
                var textarea = document.getElementById('gm-custom-text');
                if (textarea && textarea.value.trim()) {
                    window.Carrera.sync.send('custom_text', { text: textarea.value.trim() });
                    window.Carrera.adventure.addLog('✏️ Texto enviado: ' + textarea.value.trim().substring(0, 40));
                    textarea.value = '';
                    // Flash
                    var origText = btnSendCustom.textContent;
                    btnSendCustom.textContent = '✅ Enviado';
                    btnSendCustom.style.background = 'rgba(34, 197, 94, 0.3)';
                    setTimeout(function() {
                        btnSendCustom.textContent = origText;
                        btnSendCustom.style.background = '';
                    }, 1200);
                }
            });
        }

        // Clock controls
        var btnClockFill = document.getElementById('btn-clock-fill');
        if (btnClockFill) {
            btnClockFill.addEventListener('click', function() {
                window.Carrera.clock.manualFill();
                window.Carrera.adventure.updateGMStatus();
                window.Carrera.adventure.sendStatusUpdate();
                window.Carrera.adventure.addLog('Reloj +1 (manual)');
            });
        }

        var btnClockEmpty = document.getElementById('btn-clock-empty');
        if (btnClockEmpty) {
            btnClockEmpty.addEventListener('click', function() {
                window.Carrera.clock.manualEmpty();
                window.Carrera.adventure.updateGMStatus();
                window.Carrera.adventure.sendStatusUpdate();
                window.Carrera.adventure.addLog('Reloj -1 (manual)');
            });
        }

        var btnClockReset = document.getElementById('btn-clock-reset');
        if (btnClockReset) {
            btnClockReset.addEventListener('click', function() {
                window.Carrera.clock.reset();
                window.Carrera.dice.reset();
                window.Carrera.adventure.updateGMStatus();
                window.Carrera.adventure.sendStatusUpdate();
                window.Carrera.adventure.addLog('Reloj y dado reiniciados');
            });
        }

        // Resolve roll button (GM inputs number from kids' physical dice)
        var btnResolveRoll = document.getElementById('btn-resolve-roll');
        if (btnResolveRoll) {
            btnResolveRoll.addEventListener('click', function() {
                window.Carrera.adventure.gmResolveRoll();
            });
        }

        // Enter key on roll input also resolves
        var rollInput = document.getElementById('gm-roll-input');
        if (rollInput) {
            rollInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    window.Carrera.adventure.gmResolveRoll();
                }
            });
        }

        // Manual result buttons
        document.querySelectorAll('.btn-manual-result').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var result = this.dataset.result;
                window.Carrera.adventure.gmManualResolve(result);
            });
        });

        // Scene navigation
        var btnGoScene = document.getElementById('btn-go-scene');
        if (btnGoScene) {
            btnGoScene.addEventListener('click', function() {
                var select = document.getElementById('gm-scene-select');
                if (select) {
                    window.Carrera.adventure.loadScene(select.value);
                }
            });
        }

        // Quick actions
        var quickActions = {
            'btn-quick-confetti': function() {
                window.Carrera.sync.send('confetti', {});
                window.Carrera.adventure.addLog('🎉 Confetti enviado');
            },
            'btn-quick-triumph': function() {
                window.Carrera.sync.send('effect_play', { effect: 'triumph' });
                window.Carrera.adventure.addLog('🎺 Fanfarria enviada');
            },
            'btn-quick-success': function() {
                window.Carrera.sync.send('effect_play', { effect: 'success' });
                window.Carrera.adventure.addLog('✅ SFX éxito enviado');
            },
            'btn-quick-failure': function() {
                window.Carrera.sync.send('effect_play', { effect: 'failure' });
                window.Carrera.adventure.addLog('⚠️ SFX fallo enviado');
            },
            'btn-quick-hijinx': function() {
                window.Carrera.sync.send('effect_play', { effect: 'hijinx' });
                window.Carrera.adventure.addLog('🎪 SFX juerga enviado');
            },
            'btn-quick-critical': function() {
                window.Carrera.sync.send('effect_play', { effect: 'critical' });
                window.Carrera.adventure.addLog('⭐ SFX crítico enviado');
            },
            'btn-quick-transition': function() {
                window.Carrera.audio.playSceneTransition();
                window.Carrera.sync.send('effect_play', { effect: 'scene_transition' });
                window.Carrera.adventure.addLog('🎵 Transición enviada');
            },
            'btn-quick-suspense': function() {
                window.Carrera.audio.playSuspense();
                window.Carrera.sync.send('effect_play', { effect: 'suspense' });
                window.Carrera.adventure.addLog('😨 Suspenso enviado');
            }
        };

        Object.keys(quickActions).forEach(function(id) {
            var btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', quickActions[id]);
        });

        // Ambient buttons
        document.querySelectorAll('.btn-ambient').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var preset = this.dataset.ambient;
                window.Carrera.audio.playAmbient(preset);
                window.Carrera.sync.send('ambient_change', { preset: preset });
                window.Carrera.adventure.addLog('Ambiente cambiado: ' + preset);
            });
        });

        // Mute button
        var btnMute = document.getElementById('btn-mute');
        if (btnMute) {
            btnMute.addEventListener('click', function() {
                var muted = window.Carrera.audio.toggleMute();
                btnMute.textContent = muted ? '🔇' : '🔊';
                btnMute.title = muted ? 'Activar sonido' : 'Silenciar';
                window.Carrera.sync.send('volume_change', { muted: muted });
            });
        }

        // Volume sliders
        var ambientSlider = document.getElementById('ambient-volume');
        if (ambientSlider) {
            ambientSlider.addEventListener('input', function() {
                var val = this.value / 100;
                window.Carrera.audio.setAmbientVolume(val);
                window.Carrera.sync.send('volume_change', { ambient: val });
            });
        }

        var sfxSlider = document.getElementById('sfx-volume');
        if (sfxSlider) {
            sfxSlider.addEventListener('input', function() {
                var val = this.value / 100;
                window.Carrera.audio.setSfxVolume(val);
                window.Carrera.sync.send('volume_change', { sfx: val });
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (currentScreen !== 'scene') return;

            // Don't trigger shortcuts when typing in textarea
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            if (e.key === 'm' || e.key === 'M') {
                var muted = window.Carrera.audio.toggleMute();
                var muteBtn = document.getElementById('btn-mute');
                if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
                window.Carrera.sync.send('volume_change', { muted: muted });
            }

            if (e.key === ' ') {
                e.preventDefault();
                // Focus the roll input
                var ri = document.getElementById('gm-roll-input');
                if (ri) ri.focus();
            }

            if (e.key === 'n' || e.key === 'N') {
                window.Carrera.adventure.sendNarrativeToPlayer();
            }

            if (e.key === 'c' || e.key === 'C') {
                window.Carrera.adventure.sendChoicesToPlayer();
            }

            if (e.key === 'r' || e.key === 'R') {
                window.Carrera.adventure.resendCurrentState();
            }

            if (e.key >= '1' && e.key <= '5') {
                window.Carrera.adventure.loadScene('scene' + e.key);
            }
        });

        showScreen('title');
    }

    function initGMDashboard() {
        // Initialize juergas library
        window.Carrera.adventure.initJuergasLibrary();

        // Initialize clock render
        window.Carrera.adventure.updateGMStatus();
    }

    function showScreen(screenId) {
        if (screenId === 'title') {
            window.Carrera.audio.stopAmbient();
        }

        var screens = document.querySelectorAll('.screen');
        screens.forEach(function(s) {
            s.classList.remove('screen-active');
        });

        var target = document.getElementById('screen-' + screenId);
        if (target) {
            target.classList.add('screen-active');
        }

        currentScreen = screenId;

        if (screenId === 'characters') {
            window.Carrera.characters.renderGrid('character-grid');
            window.Carrera.characters.renderSlots();
        }

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
