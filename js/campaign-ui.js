// Campaign UI - Pantallas de campana y seleccion de aventura
window.Carrera = window.Carrera || {};

window.Carrera.campaignUI = (function() {

    var activeCampaign = null;

    function getActiveCampaign() {
        return activeCampaign;
    }

    function setActiveCampaign(campaign) {
        activeCampaign = campaign;
    }

    // Render campaign list screen
    function renderCampaignList(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var campaigns = window.Carrera.save.listCampaigns();

        var html = '';

        if (campaigns.length === 0) {
            html += '<div class="campaign-empty">' +
                '<div style="font-size:3rem;margin-bottom:0.5rem;">🗺️</div>' +
                '<p>No hay campañas guardadas</p>' +
                '<p style="font-size:0.85rem;color:rgba(255,255,255,0.4);">Crea una nueva para empezar a jugar</p>' +
                '</div>';
        }

        campaigns.forEach(function(meta) {
            var portraits = meta.equipo.map(function(p) {
                var src = 'assets/characters/' + p.id + '.png';
                // Encode emoji as unicode escapes for safe JS string in onerror
                var safeEmoji = '';
                for (var ci = 0; ci < p.emoji.length; ci++) {
                    safeEmoji += '\\u' + ('0000' + p.emoji.charCodeAt(ci).toString(16)).slice(-4);
                }
                return '<img class="campaign-portrait" src="' + src + '" alt="' + esc(p.nombre) + '" ' +
                    'style="border-color:' + (p.color || '#f4a261') + ';" ' +
                    'onerror="this.replaceWith(document.createTextNode(\'' + safeEmoji + '\'))">';
            }).join('');

            var fecha = meta.fechaUltimaPartida ? new Date(meta.fechaUltimaPartida).toLocaleDateString('es') : '---';

            html += '<div class="campaign-card" data-id="' + meta.id + '">' +
                '<div class="campaign-card-top">' +
                '<div class="campaign-portraits">' + portraits + '</div>' +
                '<div class="campaign-info">' +
                '<div class="campaign-name">' + esc(meta.nombre) + '</div>' +
                '<div class="campaign-meta">' +
                '<span>Nivel ' + (meta.nivelPromedio || 1) + '</span>' +
                '<span>' + (meta.partidasJugadas || 0) + ' partidas</span>' +
                '<span>' + fecha + '</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="campaign-card-actions">' +
                '<button class="btn-campaign-continue" data-id="' + meta.id + '">▶ Continuar</button>' +
                '<button class="btn-campaign-delete" data-id="' + meta.id + '">🗑️</button>' +
                '</div>' +
                '</div>';
        });

        container.innerHTML = html;

        // Bind continue buttons
        container.querySelectorAll('.btn-campaign-continue').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.id;
                var campaign = window.Carrera.save.loadCampaign(id);
                if (campaign) {
                    activeCampaign = campaign;
                    window.Carrera.app.showScreen('adventure-select');
                }
            });
        });

        // Bind delete buttons
        container.querySelectorAll('.btn-campaign-delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.dataset.id;
                if (confirm('¿Borrar esta campaña? No se puede deshacer.')) {
                    window.Carrera.save.deleteCampaign(id);
                    renderCampaignList(containerId);
                }
            });
        });
    }

    // Render adventure selection screen
    function renderAdventureSelect(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!activeCampaign) return;

        var registry = window.Carrera.adventureRegistry;
        var adventures = registry ? registry.list() : [];
        var completed = activeCampaign.aventurasCompletadas || [];
        var avgLevel = 0;
        if (activeCampaign.equipo.length > 0) {
            var sum = 0;
            activeCampaign.equipo.forEach(function(p) { sum += (p.level || 1); });
            avgLevel = Math.round(sum / activeCampaign.equipo.length);
        }

        var html = '<div class="adventure-select-header">' +
            '<h3 style="color:var(--gold);margin-bottom:0.3rem;">' + esc(activeCampaign.nombre) + '</h3>' +
            '<div style="font-size:0.85rem;color:rgba(255,255,255,0.5);">Nivel promedio: ' + avgLevel + '</div>' +
            '</div>';

        adventures.forEach(function(adv) {
            var isCompleted = completed.some(function(c) { return c.adventureId === adv.id; });
            var isLocked = avgLevel < adv.nivelRecomendado;
            var stars = '';
            for (var i = 0; i < adv.dificultad; i++) stars += '⭐';

            var cardClass = 'adventure-card';
            if (isLocked) cardClass += ' adventure-locked';
            if (isCompleted) cardClass += ' adventure-completed';

            html += '<div class="' + cardClass + '" data-id="' + adv.id + '">' +
                '<div class="adventure-card-emoji">' + adv.emoji + '</div>' +
                '<div class="adventure-card-info">' +
                '<div class="adventure-card-title">' + esc(adv.titulo) + (isCompleted ? ' ✅' : '') + '</div>' +
                '<div class="adventure-card-desc">' + esc(adv.descripcion) + '</div>' +
                '<div class="adventure-card-meta">' +
                '<span>' + stars + ' Dificultad</span>' +
                '<span>Nivel ' + adv.nivelRecomendado + '+</span>' +
                '<span>' + adv.duracion + '</span>' +
                '<span>' + adv.totalEscenas + ' escenas</span>' +
                '</div>' +
                '</div>' +
                (isLocked ? '<div class="adventure-lock">🔒 Nivel ' + adv.nivelRecomendado + ' requerido</div>' : '') +
                '</div>';
        });

        // Badges gallery button
        html += '<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">' +
            '<button id="btn-show-badges" class="btn-secondary" style="font-size:0.85rem;">🏅 Badges (' +
            (activeCampaign.badgesGlobales || []).length + '/' + (window.Carrera.badgeDefs || []).length + ')</button>' +
            '<button id="btn-show-inventory" class="btn-secondary" style="font-size:0.85rem;">🎒 Inventario</button>' +
            '</div>';

        container.innerHTML = html;

        // Bind adventure cards
        container.querySelectorAll('.adventure-card:not(.adventure-locked)').forEach(function(card) {
            card.addEventListener('click', function() {
                var advId = this.dataset.id;
                startAdventure(advId);
            });
        });

        // Badges button
        var btnBadges = document.getElementById('btn-show-badges');
        if (btnBadges) {
            btnBadges.addEventListener('click', function() {
                showBadgesGallery(container);
            });
        }

        // Inventory button
        var btnInv = document.getElementById('btn-show-inventory');
        if (btnInv) {
            btnInv.addEventListener('click', function() {
                showInventory(container);
            });
        }
    }

    function startAdventure(adventureId) {
        if (!activeCampaign) return;

        var registry = window.Carrera.adventureRegistry;
        var adventure = registry ? registry.get(adventureId) : null;
        if (!adventure) return;

        // Store current adventure reference
        activeCampaign.aventuraActual = adventureId;
        activeCampaign.stats.partidasJugadas = (activeCampaign.stats.partidasJugadas || 0) + 1;
        activeCampaign.fechaUltimaPartida = new Date().toISOString();

        // Set scenes from this adventure
        window.Carrera.scenes = adventure.scenes;
        window.Carrera.juergasGenericas = adventure.juergasGenericas || [];

        // Load team into character system
        window.Carrera.characters.loadTeamFromCampaign(activeCampaign.equipo);

        // Save
        window.Carrera.save.saveCampaign(activeCampaign);

        // Init adventure tracking context
        window.Carrera.adventure.setAdventureContext({
            adventureId: adventureId,
            campaign: activeCampaign,
            criticosAventura: 0,
            complicacionesAventura: 0,
            exitosAventura: 0,
            juergasAventura: 0,
            habilidadesUsadas: 0,
            escenasCompletadas: 0,
            rachaExitos: 0,
            primeraTiradaCritico: false,
            tiradaNum: 0
        });

        // Switch to scene screen and start
        window.Carrera.app.showScreen('scene');
        window.Carrera.app.initGMDashboard();
        window.Carrera.adventure.start();
    }

    function showBadgesGallery(container) {
        if (!activeCampaign) return;
        var allBadges = window.Carrera.badgeDefs || [];
        var earned = activeCampaign.badgesGlobales || [];

        var html = '<div class="badges-gallery">' +
            '<h3 style="color:var(--gold);margin-bottom:1rem;">🏅 Badges</h3>' +
            '<div class="badges-grid">';

        allBadges.forEach(function(b) {
            var isEarned = earned.indexOf(b.id) !== -1;
            var displayName = isEarned ? b.nombre : (b.secreto ? '???' : b.nombre);
            var displayEmoji = isEarned ? b.emoji : '❓';
            var cls = isEarned ? 'badge-item badge-earned' : 'badge-item badge-locked';

            html += '<div class="' + cls + '" title="' + (isEarned ? esc(b.descripcion) : 'No desbloqueado') + '">' +
                '<span class="badge-emoji">' + displayEmoji + '</span>' +
                '<span class="badge-name">' + esc(displayName) + '</span>' +
                '</div>';
        });

        html += '</div>' +
            '<button class="btn-secondary" id="btn-back-badges" style="margin-top:1rem;">← Volver</button>' +
            '</div>';

        container.innerHTML = html;
        document.getElementById('btn-back-badges').addEventListener('click', function() {
            renderAdventureSelect(container.id);
        });
    }

    function showInventory(container) {
        if (!activeCampaign) return;

        var html = '<div class="inventory-view">' +
            '<h3 style="color:var(--gold);margin-bottom:1rem;">🎒 Inventario del Equipo</h3>';

        activeCampaign.equipo.forEach(function(p) {
            var lvlData = window.Carrera.progression.getLevelForXP(p.xp || 0);
            var xpProgress = window.Carrera.progression.getXPProgress(p.xp || 0);
            var maxSlots = window.Carrera.loot.getMaxInventory(p);

            html += '<div class="inv-player" style="border-color:' + (p.color || '#f4a261') + ';">' +
                '<div class="inv-player-header">' +
                '<span style="font-size:1.5rem;">' + p.emoji + '</span>' +
                '<div>' +
                '<div style="font-weight:700;color:white;">' + esc(p.nombre) + '</div>' +
                '<div style="font-size:0.75rem;color:rgba(255,255,255,0.5);">' +
                'Nivel ' + (p.level || 1) + ' · ' + esc(lvlData.titulo) + ' · XP: ' + (p.xp || 0) +
                '</div>';

            if (xpProgress.next) {
                var pct = Math.round(xpProgress.progress * 100);
                html += '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + pct + '%;"></div></div>' +
                    '<div style="font-size:0.65rem;color:rgba(255,255,255,0.3);">' +
                    xpProgress.xpInLevel + '/' + xpProgress.xpNeeded + ' XP para Nivel ' + xpProgress.next.level +
                    '</div>';
            }

            html += '</div></div>';

            // Items
            html += '<div class="inv-items">';
            var items = p.inventory || [];
            for (var i = 0; i < maxSlots; i++) {
                if (items[i]) {
                    var item = items[i];
                    var color = window.Carrera.loot.getRarezaColor(item.rareza);
                    html += '<div class="inv-item" style="border-color:' + color + ';" title="' + esc(item.descripcion) + '">' +
                        '<span class="inv-item-emoji">' + item.emoji + '</span>' +
                        '<span class="inv-item-name">' + esc(item.nombre) + '</span>' +
                        '<span class="inv-item-type" style="color:' + color + ';">' +
                        window.Carrera.loot.getRarezaLabel(item.rareza) + '</span>' +
                        '</div>';
                } else {
                    html += '<div class="inv-item inv-item-empty">Vacio</div>';
                }
            }
            html += '</div></div>';
        });

        html += '<button class="btn-secondary" id="btn-back-inv" style="margin-top:1rem;">← Volver</button></div>';

        container.innerHTML = html;
        document.getElementById('btn-back-inv').addEventListener('click', function() {
            renderAdventureSelect(container.id);
        });
    }

    // Auto-save campaign (called after scene resolution, victory, etc.)
    function autoSave() {
        if (activeCampaign) {
            var ok = window.Carrera.save.saveCampaign(activeCampaign);
            if (!ok && window.Carrera.adventure) {
                window.Carrera.adventure.addLog('⚠️ Error guardando campaña (almacenamiento lleno?)');
            }
        }
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return {
        getActiveCampaign: getActiveCampaign,
        setActiveCampaign: setActiveCampaign,
        renderCampaignList: renderCampaignList,
        renderAdventureSelect: renderAdventureSelect,
        startAdventure: startAdventure,
        autoSave: autoSave
    };
})();
