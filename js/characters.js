// Creador y Selector de Personajes
window.Carrera = window.Carrera || {};

window.Carrera.characters = (function() {
    var selectedPlayers = [null, null];
    var currentSlot = 0;

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

        // Check if already selected by the other player
        var otherSlot = currentSlot === 0 ? 1 : 0;
        if (selectedPlayers[otherSlot] && selectedPlayers[otherSlot].id === animalId) {
            // Deselect from other slot
            selectedPlayers[otherSlot] = null;
        }

        // Check if clicking already selected for this slot
        if (selectedPlayers[currentSlot] && selectedPlayers[currentSlot].id === animalId) {
            selectedPlayers[currentSlot] = null;
        } else {
            // Clone the animal to track skill usage independently
            selectedPlayers[currentSlot] = JSON.parse(JSON.stringify(animal));
        }

        window.Carrera.audio.playClick();
        renderSlots();
        renderGrid('character-grid');
        updateStartButton();

        // Auto advance to next slot
        if (selectedPlayers[currentSlot]) {
            currentSlot = selectedPlayers[0] ? (selectedPlayers[1] ? currentSlot : 1) : 0;
            updateSlotIndicator();
        }
    }

    function renderSlots() {
        for (var i = 0; i < 2; i++) {
            var slot = document.getElementById('player-slot-' + (i + 1));
            if (!slot) continue;

            if (selectedPlayers[i]) {
                var p = selectedPlayers[i];
                slot.innerHTML =
                    '<div class="slot-filled" style="--animal-color: ' + p.color + '">' +
                    '<div class="slot-emoji">' + p.emoji + '</div>' +
                    '<div class="slot-name">' + p.nombre + '</div>' +
                    '<div class="slot-species">' + p.especie + '</div>' +
                    '</div>';
                slot.classList.add('has-character');
            } else {
                slot.innerHTML =
                    '<div class="slot-empty">' +
                    '<div class="slot-number">Jugador ' + (i + 1) + '</div>' +
                    '<div class="slot-hint">Elige un personaje</div>' +
                    '</div>';
                slot.classList.remove('has-character');
            }

            slot.className = slot.className.replace(/active-slot/g, '').trim();
            if (i === currentSlot) slot.classList.add('active-slot');
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
        if (btn) {
            btn.disabled = !(selectedPlayers[0] && selectedPlayers[1]);
        }
    }

    function getTeam() {
        return selectedPlayers.filter(function(p) { return p !== null; });
    }

    function renderTeamSummary(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        selectedPlayers.forEach(function(player, index) {
            if (!player) return;

            var card = document.createElement('div');
            card.className = 'team-card';
            card.style.setProperty('--animal-color', player.color);
            card.style.setProperty('--animal-color-light', player.colorClaro);

            card.innerHTML =
                '<div class="team-card-header">' +
                '<span class="team-emoji">' + player.emoji + '</span>' +
                '<div><h3>' + player.nombre + ' el ' + player.especie + '</h3>' +
                '<p class="team-guild">' + player.gremio + '</p></div>' +
                '</div>' +
                '<div class="team-tags">' +
                '<div class="tag tag-skill"><span class="tag-icon">⚡</span><div><strong>Habilidad:</strong> ' + player.habilidad.nombre + '<br><small>' + player.habilidad.descripcion + '</small></div></div>' +
                '<div class="tag tag-tool"><span class="tag-icon">🔧</span><div><strong>Herramienta:</strong> ' + player.herramienta.nombre + '<br><small>' + player.herramienta.descripcion + '</small></div></div>' +
                '<div class="tag tag-talent"><span class="tag-icon">✨</span><div><strong>Talento:</strong> ' + player.talento.nombre + '<br><small>' + player.talento.descripcion + '</small></div></div>' +
                '<div class="tag tag-trait"><span class="tag-icon">🐾</span><div><strong>Rasgo:</strong> ' + player.rasgo.nombre + '<br><small>' + player.rasgo.descripcion + '</small></div></div>' +
                '</div>';

            container.appendChild(card);
        });
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

    function initSlotClickHandlers() {
        var slot1 = document.getElementById('player-slot-1');
        var slot2 = document.getElementById('player-slot-2');
        if (slot1) slot1.addEventListener('click', function() { setCurrentSlot(0); renderSlots(); });
        if (slot2) slot2.addEventListener('click', function() { setCurrentSlot(1); renderSlots(); });
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
        updateStartButton: updateStartButton
    };
})();
