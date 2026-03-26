// Controlador Principal GM - ¡A la Carrera!
window.Carrera = window.Carrera || {};

window.Carrera.app = (function() {
    var currentScreen = 'title';
    var quickPlayMode = false; // true = no save, like the old flow

    function init() {
        // Init sync as GM
        window.Carrera.sync.init('gm');

        // Set clock render targets to GM IDs
        window.Carrera.clock.setRenderTargets('gm-clock-display', 'gm-die-display');

        // Title screen → Campaigns
        var btnStart = document.getElementById('btn-start');
        if (btnStart) {
            btnStart.addEventListener('click', function() {
                window.Carrera.audio.init();
                window.Carrera.audio.resume();
                window.Carrera.audio.playClick();
                showScreen('campaigns');
            });
        }

        // === Campaign Screen ===
        var btnNewCampaign = document.getElementById('btn-new-campaign');
        if (btnNewCampaign) {
            btnNewCampaign.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                quickPlayMode = false;
                showScreen('characters');
            });
        }

        var btnQuickPlay = document.getElementById('btn-quick-play');
        if (btnQuickPlay) {
            btnQuickPlay.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                quickPlayMode = true;
                showScreen('characters');
            });
        }

        // === Adventure Select Screen ===
        var btnBackCampaigns = document.getElementById('btn-back-campaigns');
        if (btnBackCampaigns) {
            btnBackCampaigns.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                showScreen('campaigns');
            });
        }

        // Character screen
        window.Carrera.characters.renderGrid('character-grid');
        window.Carrera.characters.renderSlots();
        window.Carrera.characters.initSlotClickHandlers();
        window.Carrera.characters.updateStartButton();

        // Start adventure button (from character screen → team review)
        var btnAdventure = document.getElementById('btn-start-adventure');
        if (btnAdventure) {
            btnAdventure.addEventListener('click', function() {
                window.Carrera.audio.playClick();
                window.Carrera.characters.renderTeamSummary('team-summary');
                // Send full team data to player view
                window.Carrera.characters.syncTeamConfirmed();
                showScreen('team');
            });
        }

        // Confirm team button
        var btnConfirm = document.getElementById('btn-confirm-team');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', function() {
                window.Carrera.audio.playClick();

                if (quickPlayMode) {
                    // Old flow: direct to scene with default adventure
                    showScreen('scene');
                    initGMDashboard();
                    window.Carrera.adventure.start();
                } else {
                    // Campaign flow: create campaign, then adventure select
                    var team = window.Carrera.characters.getTeam();
                    var nombre = team.map(function(p) { return p.nombre; }).join(' y ');
                    nombre = 'Aventura de ' + nombre;

                    var campaign = window.Carrera.save.createCampaign(nombre, team);
                    if (campaign) {
                        window.Carrera.campaignUI.setActiveCampaign(campaign);
                        showScreen('adventure-select');
                    } else {
                        alert('Maximo 5 campañas. Borra una primero.');
                    }
                }
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

        // Handle player reconnection (resend once per connection, reset on disconnect)
        var playerSynced = false;
        window.Carrera.sync.onMessage(function(msg) {
            if (msg.type === 'player_ready') {
                if (!playerSynced && window.Carrera.adventure.getState().currentSceneId) {
                    playerSynced = true;
                    setTimeout(function() {
                        window.Carrera.adventure.resendCurrentState();
                    }, 300);
                }
            }
        });
        // Reset flag when player disconnects so reconnection works
        setInterval(function() {
            if (playerSynced && !window.Carrera.sync.isPlayerConnected()) {
                playerSynced = false;
            }
        }, 3000);

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
                    window.Carrera.sync.setPlayerWindow(playerWin);
                }
                window.Carrera.adventure.addLog('Vista de jugadores abierta');
            });
        }

        // Show team on player screen
        var btnShowTeam = document.getElementById('btn-show-team-player');
        if (btnShowTeam) {
            btnShowTeam.addEventListener('click', function() {
                var team = window.Carrera.characters.getTeam();
                var campaign = window.Carrera.campaignUI.getActiveCampaign();
                var teamData = team.map(function(p) {
                    var cp = campaign ? findCampaignPlayer(campaign, p.id) : null;
                    return {
                        id: p.id, emoji: p.emoji, nombre: p.nombre, especie: p.especie,
                        habilidad: p.habilidad.nombre, herramienta: p.herramienta.nombre,
                        talento: p.talento.nombre, rasgo: p.rasgo.nombre, color: p.color,
                        level: cp ? cp.level : 1,
                        xp: cp ? cp.xp : 0,
                        titulo: cp ? window.Carrera.progression.getLevelForXP(cp.xp || 0).titulo : 'Explorador Novato',
                        inventory: cp ? (cp.inventory || []) : []
                    };
                });
                window.Carrera.sync.send('team_show', { team: teamData });
                window.Carrera.adventure.addLog('📺 Equipo mostrado en pantalla');
                var orig = btnShowTeam.textContent;
                btnShowTeam.textContent = '✅';
                setTimeout(function() { btnShowTeam.textContent = orig; }, 1000);
            });
        }

        // Send choices to player screen
        var btnSendChoices = document.getElementById('btn-send-choices-player');
        if (btnSendChoices) {
            btnSendChoices.addEventListener('click', function() {
                window.Carrera.adventure.sendChoicesToPlayer();
                var orig = btnSendChoices.textContent;
                btnSendChoices.textContent = '✅ Enviadas';
                setTimeout(function() { btnSendChoices.textContent = orig; }, 1500);
            });
        }

        // Send narrative
        var btnSendNarrative = document.getElementById('btn-send-narrative');
        if (btnSendNarrative) {
            btnSendNarrative.addEventListener('click', function() {
                window.Carrera.adventure.sendNarrativeToPlayer();
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

        // Quick actions — SFX toggle: click to play, click again to stop
        var sfxButtons = {
            'btn-quick-triumph':    { effect: 'triumph',          fn: window.Carrera.audio.playTriumph,          dur: 2800, log: '🎺 Fanfarria' },
            'btn-quick-success':    { effect: 'success',          fn: window.Carrera.audio.playSuccess,          dur: 1000, log: '✅ Éxito SFX' },
            'btn-quick-failure':    { effect: 'failure',          fn: window.Carrera.audio.playFailure,          dur: 1200, log: '⚠️ Fallo SFX' },
            'btn-quick-hijinx':     { effect: 'hijinx',           fn: window.Carrera.audio.playHijinx,           dur: 1200, log: '🎪 ¡Oh No! SFX' },
            'btn-quick-critical':   { effect: 'critical',         fn: window.Carrera.audio.playCritical,         dur: 1500, log: '⭐ Crítico SFX' },
            'btn-quick-transition': { effect: 'scene_transition', fn: window.Carrera.audio.playSceneTransition,  dur: 800,  log: '🎵 Transición' },
            'btn-quick-suspense':   { effect: 'suspense',         fn: window.Carrera.audio.playSuspense,         dur: 1500, log: '😨 Suspenso' }
        };

        Object.keys(sfxButtons).forEach(function(id) {
            var btn = document.getElementById(id);
            if (!btn) return;
            var cfg = sfxButtons[id];
            btn.addEventListener('click', function() {
                var playing = window.Carrera.audio.toggleSfx(cfg.effect, cfg.fn, cfg.dur);
                if (playing) {
                    window.Carrera.sync.send('effect_play', { effect: cfg.effect });
                    window.Carrera.adventure.addLog(cfg.log + ' enviado');
                    btn.classList.add('btn-sfx-active');
                    setTimeout(function() { btn.classList.remove('btn-sfx-active'); }, cfg.dur);
                } else {
                    window.Carrera.adventure.addLog(cfg.log + ' detenido');
                    btn.classList.remove('btn-sfx-active');
                }
            });
        });

        // Confetti (not toggleable, just fires)
        var btnConfetti = document.getElementById('btn-quick-confetti');
        if (btnConfetti) {
            btnConfetti.addEventListener('click', function() {
                window.Carrera.sync.send('confetti', {});
                window.Carrera.adventure.addLog('🎉 Confetti enviado');
            });
        }

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
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            if (e.key === 'm' || e.key === 'M') {
                var muted = window.Carrera.audio.toggleMute();
                var muteBtn = document.getElementById('btn-mute');
                if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
                window.Carrera.sync.send('volume_change', { muted: muted });
            }

            if (e.key === ' ') {
                e.preventDefault();
                var ri = document.getElementById('gm-inline-roll-input');
                if (ri) ri.focus();
            }

            if (e.key === 'n' || e.key === 'N') window.Carrera.adventure.sendNarrativeToPlayer();
            if (e.key === 'c' || e.key === 'C') window.Carrera.adventure.sendChoicesToPlayer();
            if (e.key === 'r' || e.key === 'R') window.Carrera.adventure.resendCurrentState();

            if (e.key >= '1' && e.key <= '5') {
                window.Carrera.adventure.loadScene('scene' + e.key);
            }
        });

        showScreen('title');
    }

    function initGMDashboard() {
        window.Carrera.adventure.initJuergasLibrary();
        window.Carrera.adventure.updateGMStatus();

        // Update scene navigator based on current adventure scenes
        updateSceneNavigator();
    }

    function updateSceneNavigator() {
        var select = document.getElementById('gm-scene-select');
        if (!select) return;
        var scenes = window.Carrera.scenes;
        if (!scenes) return;

        select.innerHTML = '';
        var keys = Object.keys(scenes);
        keys.forEach(function(key) {
            var scene = scenes[key];
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = (scene.emoji || '') + ' ' + (scene.titulo || key);
            select.appendChild(opt);
        });
    }

    function findCampaignPlayer(campaign, playerId) {
        if (!campaign || !campaign.equipo) return null;
        for (var i = 0; i < campaign.equipo.length; i++) {
            if (campaign.equipo[i].id === playerId) return campaign.equipo[i];
        }
        return null;
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

        if (screenId === 'campaigns') {
            window.Carrera.campaignUI.renderCampaignList('campaign-list');
        }

        if (screenId === 'adventure-select') {
            window.Carrera.campaignUI.renderAdventureSelect('adventure-select-list');
        }

        // Clean confetti
        var confetti = document.getElementById('confetti-container');
        if (confetti && screenId !== 'scene') {
            confetti.style.display = 'none';
            confetti.innerHTML = '';
        }
    }

    function isQuickPlay() {
        return quickPlayMode;
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        showScreen: showScreen,
        initGMDashboard: initGMDashboard,
        isQuickPlay: isQuickPlay
    };
})();
