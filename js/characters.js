// Creador y Selector de Personajes - Dinámico (2-6 jugadores)
window.Carrera = window.Carrera || {};

window.Carrera.characters = (function() {
    var MIN_PLAYERS = 2;
    var MAX_PLAYERS = 6;
    var selectedPlayers = [null, null]; // Start with 2, can grow to 6
    var currentSlot = 0;

    function getPlayerCount() {
        return selectedPlayers.length;
    }

    function addPlayer() {
        if (selectedPlayers.length >= MAX_PLAYERS) return;
        selectedPlayers.push(null);
        renderSlots();
        renderGrid('character-grid');
        updateStartButton();
        updateAddRemoveButtons();
        // Set new slot as active
        currentSlot = selectedPlayers.length - 1;
        updateSlotIndicator();
        window.Carrera.audio.playClick();
    }

    function removePlayer() {
        if (selectedPlayers.length <= MIN_PLAYERS) return;
        // Remove last slot
        selectedPlayers.pop();
        if (currentSlot >= selectedPlayers.length) {
            currentSlot = selectedPlayers.length - 1;
        }
        renderSlots();
        renderGrid('character-grid');
        updateStartButton();
        updateAddRemoveButtons();
        updateSlotIndicator();
        window.Carrera.audio.playClick();
    }

    function updateAddRemoveButtons() {
        var btnAdd = document.getElementById('btn-add-player');
        var btnRemove = document.getElementById('btn-remove-player');
        var countEl = document.getElementById('player-count-label');

        if (btnAdd) btnAdd.disabled = selectedPlayers.length >= MAX_PLAYERS;
        if (btnRemove) btnRemove.disabled = selectedPlayers.length <= MIN_PLAYERS;
        if (countEl) countEl.textContent = selectedPlayers.length + ' jugadores';
    }

    function renderGrid(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        var bestiary = window.Carrera.bestiary;

        bestiary.forEach(function(animal) {
            var card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.id = animal.id;
            card.style.setProperty('--animal-color', animal.color);
            card.style.setProperty('--animal-color-light', animal.colorClaro);

            var isSelected = selectedPlayers.some(function(p) { return p && p.id === animal.id; });
            if (isSelected) card.classList.add('selected');

            card.innerHTML =
                '<div class="card-emoji">' + animal.emoji + '</div>' +
                '<div class="card-name">' + animal.nombre + '</div>' +
                '<div class="card-species">' + animal.especie + '</div>' +
                '<div class="card-desc">' + animal.descripcionCorta + '</div>' +
                (animal.recomendadoPara ? '<div class="card-badge">⭐ ' + animal.recomendadoPara + '</div>' : '');

            card.addEventListener('click', function() {
                selectCharacter(animal.id);
            });

            container.appendChild(card);
        });
    }

    function selectCharacter(animalId) {
        var animal = window.Carrera.bestiary.find(function(a) { return a.id === animalId; });
        if (!animal) return;

        // If this animal is already in another slot, remove it from there
        for (var i = 0; i < selectedPlayers.length; i++) {
            if (i !== currentSlot && selectedPlayers[i] && selectedPlayers[i].id === animalId) {
                selectedPlayers[i] = null;
            }
        }

        // Toggle selection for current slot
        if (selectedPlayers[currentSlot] && selectedPlayers[currentSlot].id === animalId) {
            selectedPlayers[currentSlot] = null;
        } else {
            selectedPlayers[currentSlot] = JSON.parse(JSON.stringify(animal));
        }

        window.Carrera.audio.playClick();
        renderSlots();
        renderGrid('character-grid');
        updateStartButton();

        // Auto advance to next empty slot
        if (selectedPlayers[currentSlot]) {
            var nextEmpty = findNextEmptySlot(currentSlot);
            if (nextEmpty !== -1) {
                currentSlot = nextEmpty;
            }
            updateSlotIndicator();
        }
    }

    function findNextEmptySlot(afterIndex) {
        // Search forward from current, wrapping around
        for (var i = 1; i <= selectedPlayers.length; i++) {
            var idx = (afterIndex + i) % selectedPlayers.length;
            if (!selectedPlayers[idx]) return idx;
        }
        return -1; // All full
    }

    function renderSlots() {
        var container = document.getElementById('player-slots-container');
        if (!container) return;

        container.innerHTML = '';

        for (var i = 0; i < selectedPlayers.length; i++) {
            var slot = document.createElement('div');
            slot.className = 'player-slot';
            slot.dataset.slotIndex = i;
            if (i === currentSlot) slot.classList.add('active-slot');

            if (selectedPlayers[i]) {
                var p = selectedPlayers[i];
                slot.classList.add('has-character');
                slot.innerHTML =
                    '<div class="slot-filled" style="--animal-color: ' + p.color + '">' +
                    '<div class="slot-emoji">' + p.emoji + '</div>' +
                    '<div class="slot-name">' + p.nombre + '</div>' +
                    '<div class="slot-species">' + p.especie + '</div>' +
                    '</div>';
            } else {
                slot.innerHTML =
                    '<div class="slot-empty">' +
                    '<div class="slot-number">Jugador ' + (i + 1) + '</div>' +
                    '<div class="slot-hint">Elige un personaje</div>' +
                    '</div>';
            }

            // Click to select this slot
            (function(index) {
                slot.addEventListener('click', function() {
                    setCurrentSlot(index);
                    renderSlots();
                });
            })(i);

            container.appendChild(slot);
        }
    }

    function updateSlotIndicator() {
        var slots = document.querySelectorAll('.player-slot');
        slots.forEach(function(s, i) {
            s.classList.remove('active-slot');
            if (i === currentSlot) s.classList.add('active-slot');
        });
    }

    function setCurrentSlot(slot) {
        currentSlot = slot;
        updateSlotIndicator();
    }

    function updateStartButton() {
        var btn = document.getElementById('btn-start-adventure');
        if (!btn) return;

        // Require at least 2 selected characters
        var filled = selectedPlayers.filter(function(p) { return p !== null; }).length;
        btn.disabled = filled < MIN_PLAYERS;

        // Update button text to show count
        if (filled < MIN_PLAYERS) {
            btn.textContent = '🏁 Elige al menos ' + MIN_PLAYERS + ' personajes';
        } else {
            btn.textContent = '🏁 ¡Formar equipo de ' + filled + '!';
        }
    }

    function getTeam() {
        return selectedPlayers.filter(function(p) { return p !== null; });
    }

    function renderTeamSummary(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        selectedPlayers.forEach(function(player, playerIndex) {
            if (!player) return;

            var card = document.createElement('div');
            card.className = 'team-card';
            card.style.setProperty('--animal-color', player.color);
            card.style.setProperty('--animal-color-light', player.colorClaro);

            var tagTypes = [
                { key: 'habilidad', label: 'Habilidad', icon: '⚡', cssClass: 'tag-skill' },
                { key: 'herramienta', label: 'Herramienta', icon: '🔧', cssClass: 'tag-tool' },
                { key: 'talento', label: 'Talento', icon: '✨', cssClass: 'tag-talent' },
                { key: 'rasgo', label: 'Rasgo', icon: '🐾', cssClass: 'tag-trait' }
            ];

            var tagsHtml = tagTypes.map(function(t) {
                var tag = player[t.key];
                return '<div class="tag ' + t.cssClass + '">' +
                    '<span class="tag-icon">' + t.icon + '</span>' +
                    '<div class="tag-content"><strong>' + t.label + ':</strong> ' + tag.nombre + '<br><small>' + tag.descripcion + '</small></div>' +
                    '<button class="btn-reroll" data-player="' + playerIndex + '" data-tag="' + t.key + '" title="Cambiar ' + t.label + '">🔄</button>' +
                    '</div>';
            }).join('');

            card.innerHTML =
                '<div class="team-card-header">' +
                '<span class="team-emoji">' + player.emoji + '</span>' +
                '<div><h3>' + player.nombre + ' el ' + player.especie + '</h3>' +
                '<p class="team-guild">' + player.gremio + '</p></div>' +
                '</div>' +
                '<div class="team-tags">' + tagsHtml + '</div>';

            container.appendChild(card);
        });

        // Bind reroll buttons
        container.querySelectorAll('.btn-reroll').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var pIdx = parseInt(this.dataset.player, 10);
                var tagKey = this.dataset.tag;
                rerollTag(pIdx, tagKey);
                renderTeamSummary(containerId);
                window.Carrera.audio.playClick();
            });
        });
    }

    function rerollTag(playerIndex, tagKey) {
        var player = selectedPlayers[playerIndex];
        if (!player) return;

        var bestiary = window.Carrera.bestiary;
        var currentName = player[tagKey].nombre;

        // Collect all possible tags of this type from other characters
        var pool = [];
        bestiary.forEach(function(animal) {
            if (animal.id === player.id) return; // Skip self's original
            var tag = animal[tagKey];
            if (tag && tag.nombre !== currentName) {
                pool.push(JSON.parse(JSON.stringify(tag)));
            }
        });

        if (pool.length === 0) return;

        // Pick random from pool
        var newTag = pool[Math.floor(Math.random() * pool.length)];

        // For habilidad, preserve the usada state
        if (tagKey === 'habilidad') {
            newTag.usada = false;
        }

        player[tagKey] = newTag;
    }

    function getTeamTags() {
        var tags = [];
        selectedPlayers.forEach(function(p) {
            if (!p) return;
            tags.push(p.habilidad.nombre);
            tags.push(p.herramienta.nombre);
            tags.push(p.talento.nombre);
            tags.push(p.rasgo.nombre);
        });
        return tags;
    }

    function hasTag(tagName) {
        return getTeamTags().indexOf(tagName) !== -1;
    }

    function checkAdvantage(relevantTags) {
        if (!relevantTags || relevantTags.length === 0) return false;
        var teamTags = getTeamTags();
        return relevantTags.some(function(tag) {
            return teamTags.indexOf(tag) !== -1;
        });
    }

    function checkAutoSuccess(autoExitoTags) {
        if (!autoExitoTags || autoExitoTags.length === 0) return false;
        return autoExitoTags.some(function(tag) { return hasTag(tag); });
    }

    function checkSkillAutoSuccess(relevantTags) {
        if (!relevantTags) return null;
        for (var i = 0; i < selectedPlayers.length; i++) {
            var p = selectedPlayers[i];
            if (!p) continue;
            if (!p.habilidad.usada && relevantTags.indexOf(p.habilidad.nombre) !== -1) {
                return p;
            }
        }
        return null;
    }

    function markSkillUsed(playerId) {
        selectedPlayers.forEach(function(p) {
            if (p && p.id === playerId) p.habilidad.usada = true;
        });
    }

    function resetSkills() {
        selectedPlayers.forEach(function(p) {
            if (p) p.habilidad.usada = false;
        });
    }

    // Init is now called from app.js after DOM is ready
    function initSlotClickHandlers() {
        // Handled dynamically in renderSlots() via event delegation
        // Just set up add/remove buttons
        var btnAdd = document.getElementById('btn-add-player');
        var btnRemove = document.getElementById('btn-remove-player');

        if (btnAdd) btnAdd.addEventListener('click', addPlayer);
        if (btnRemove) btnRemove.addEventListener('click', removePlayer);

        updateAddRemoveButtons();
    }

    return {
        renderGrid: renderGrid,
        renderSlots: renderSlots,
        renderTeamSummary: renderTeamSummary,
        getTeam: getTeam,
        getTeamTags: getTeamTags,
        hasTag: hasTag,
        checkAdvantage: checkAdvantage,
        checkAutoSuccess: checkAutoSuccess,
        checkSkillAutoSuccess: checkSkillAutoSuccess,
        markSkillUsed: markSkillUsed,
        resetSkills: resetSkills,
        initSlotClickHandlers: initSlotClickHandlers,
        updateStartButton: updateStartButton,
        addPlayer: addPlayer,
        removePlayer: removePlayer
    };
})();
