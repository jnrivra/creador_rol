// Sistema de Dados - Dados físicos d4-d20
// Los niños tiran dados reales, el GM ingresa el resultado
window.Carrera = window.Carrera || {};

window.Carrera.dice = (function() {
    var state = {
        difficultyBonus: 0 // Increases when clock fills
    };

    function reset() {
        state.difficultyBonus = 0;
    }

    function addDifficultyBonus(amount) {
        state.difficultyBonus += amount;
    }

    function getDifficultyBonus() {
        return state.difficultyBonus;
    }

    // Resolve a roll number against a difficulty
    function resolve(rollValue, baseDifficulty, hasAdvantage) {
        var difficulty = baseDifficulty + state.difficultyBonus;

        var tipo;
        if (rollValue >= difficulty + 5) {
            tipo = 'critico';
        } else if (rollValue >= difficulty) {
            tipo = 'exito';
        } else if (rollValue >= difficulty - 4) {
            tipo = 'complicacion';
        } else {
            tipo = 'juerga';
        }

        return {
            valor: rollValue,
            dificultad: difficulty,
            dificultadBase: baseDifficulty,
            bonus: state.difficultyBonus,
            ventaja: hasAdvantage,
            tipo: tipo
        };
    }

    function getResultLabel(tipo) {
        var labels = {
            critico: { texto: '¡CRÍTICO!', emoji: '⭐', clase: 'result-critico' },
            exito: { texto: '¡ÉXITO!', emoji: '✅', clase: 'result-exito' },
            complicacion: { texto: 'COMPLICACIÓN', emoji: '⚠️', clase: 'result-complicacion' },
            juerga: { texto: '¡JUERGA!', emoji: '🎪', clase: 'result-juerga' }
        };
        return labels[tipo] || labels.complicacion;
    }

    function getDifficultyLabel(diff) {
        if (diff <= 6) return 'Fácil';
        if (diff <= 9) return 'Normal';
        if (diff <= 12) return 'Difícil';
        return 'Muy difícil';
    }

    // Show result on player (predetermined)
    function animateRollPredetermined(container, rollData, callback) {
        var label = getResultLabel(rollData.tipo);

        container.innerHTML = '';
        container.className = 'dice-area active';

        var dieEl = document.createElement('div');
        dieEl.className = 'die rolling';
        dieEl.innerHTML = '<span class="die-label">Tirada</span><span class="die-value">?</span>';
        container.appendChild(dieEl);

        if (rollData.ventaja) {
            var advEl = document.createElement('div');
            advEl.className = 'advantage-badge';
            advEl.textContent = '¡VENTAJA! (mejor de 2)';
            container.appendChild(advEl);
        }

        window.Carrera.audio.playDiceRoll();

        var count = 0;
        var interval = setInterval(function() {
            dieEl.querySelector('.die-value').textContent = Math.floor(Math.random() * 20) + 1;
            count++;
            if (count > 12) {
                clearInterval(interval);
                finishRoll();
            }
        }, 80);

        function finishRoll() {
            dieEl.classList.remove('rolling');
            dieEl.classList.add('settled', label.clase);
            dieEl.querySelector('.die-value').textContent = rollData.valor;

            // Difficulty bar
            var diffEl = document.createElement('div');
            diffEl.className = 'dice-detail';
            diffEl.textContent = 'Resultado: ' + rollData.valor + ' vs Dificultad: ' + rollData.dificultad;
            container.appendChild(diffEl);

            var resultEl = document.createElement('div');
            resultEl.className = 'dice-result ' + label.clase;
            resultEl.innerHTML = '<span class="result-emoji">' + label.emoji + '</span> <span class="result-text">' + label.texto + '</span>';
            container.appendChild(resultEl);

            setTimeout(function() {
                if (rollData.tipo === 'critico') window.Carrera.audio.playCritical();
                else if (rollData.tipo === 'exito') window.Carrera.audio.playSuccess();
                else if (rollData.tipo === 'juerga') window.Carrera.audio.playHijinx();
                else window.Carrera.audio.playFailure();
            }, 200);

            setTimeout(function() {
                if (callback) callback(rollData);
            }, 1500);
        }
    }

    return {
        reset: reset,
        resolve: resolve,
        getResultLabel: getResultLabel,
        getDifficultyLabel: getDifficultyLabel,
        getDifficultyBonus: getDifficultyBonus,
        addDifficultyBonus: addDifficultyBonus,
        animateRollPredetermined: animateRollPredetermined
    };
})();
