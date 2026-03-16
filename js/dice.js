// Sistema de Dados - Dado decreciente de Scurry!
window.Carrera = window.Carrera || {};

window.Carrera.dice = (function() {
    var state = {
        currentDie: 8,
        dieChain: [8, 6, 4],
        chainIndex: 0
    };

    function reset() {
        state.currentDie = 8;
        state.chainIndex = 0;
    }

    function getCurrentDie() {
        return state.currentDie;
    }

    function shrinkDie() {
        if (state.chainIndex < state.dieChain.length - 1) {
            state.chainIndex++;
            state.currentDie = state.dieChain[state.chainIndex];
            return true;
        }
        return false; // Already at minimum
    }

    function roll(hasAdvantage) {
        var die = state.currentDie;
        var result1 = Math.floor(Math.random() * die) + 1;
        var result2 = hasAdvantage ? Math.floor(Math.random() * die) + 1 : 0;
        var finalResult = hasAdvantage ? Math.max(result1, result2) : result1;

        var tipo;
        if (finalResult >= die) {
            tipo = 'critico';
        } else if (finalResult >= 4) {
            tipo = 'exito';
        } else if (finalResult >= 2) {
            tipo = 'complicacion';
        } else {
            tipo = 'juerga';
        }

        return {
            dado: die,
            resultado1: result1,
            resultado2: result2,
            resultadoFinal: finalResult,
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

    function getDieEmoji(size) {
        var emojis = { 8: '🎲', 6: '🎲', 4: '🔺' };
        return emojis[size] || '🎲';
    }

    // Animate dice roll in a container element
    function animateRoll(container, hasAdvantage, callback) {
        var rollResult = roll(hasAdvantage);
        var label = getResultLabel(rollResult.tipo);

        container.innerHTML = '';
        container.className = 'dice-area active';

        // Die element
        var dieEl = document.createElement('div');
        dieEl.className = 'die rolling';
        dieEl.innerHTML = '<span class="die-label">d' + rollResult.dado + '</span><span class="die-value">?</span>';
        container.appendChild(dieEl);

        // Advantage indicator
        if (hasAdvantage) {
            var advEl = document.createElement('div');
            advEl.className = 'advantage-badge';
            advEl.textContent = '¡VENTAJA! (2 dados)';
            container.appendChild(advEl);
        }

        // Play dice sound
        window.Carrera.audio.playDiceRoll();

        // Animate random numbers
        var count = 0;
        var interval = setInterval(function() {
            dieEl.querySelector('.die-value').textContent = Math.floor(Math.random() * rollResult.dado) + 1;
            count++;
            if (count > 12) {
                clearInterval(interval);
                finishRoll();
            }
        }, 80);

        function finishRoll() {
            dieEl.classList.remove('rolling');
            dieEl.classList.add('settled', label.clase);
            dieEl.querySelector('.die-value').textContent = rollResult.resultadoFinal;

            // Show both dice if advantage
            if (hasAdvantage) {
                var diceDetail = document.createElement('div');
                diceDetail.className = 'dice-detail';
                diceDetail.textContent = 'Dado 1: ' + rollResult.resultado1 + ' | Dado 2: ' + rollResult.resultado2 + ' → Mejor: ' + rollResult.resultadoFinal;
                container.appendChild(diceDetail);
            }

            // Result banner
            var resultEl = document.createElement('div');
            resultEl.className = 'dice-result ' + label.clase;
            resultEl.innerHTML = '<span class="result-emoji">' + label.emoji + '</span> <span class="result-text">' + label.texto + '</span>';
            container.appendChild(resultEl);

            // Play result sound
            setTimeout(function() {
                if (rollResult.tipo === 'critico') window.Carrera.audio.playCritical();
                else if (rollResult.tipo === 'exito') window.Carrera.audio.playSuccess();
                else if (rollResult.tipo === 'juerga') window.Carrera.audio.playHijinx();
                else window.Carrera.audio.playFailure();
            }, 200);

            // Callback with result after a pause
            setTimeout(function() {
                if (callback) callback(rollResult);
            }, 1500);
        }
    }

    return {
        reset: reset,
        getCurrentDie: getCurrentDie,
        shrinkDie: shrinkDie,
        roll: roll,
        getResultLabel: getResultLabel,
        getDieEmoji: getDieEmoji,
        animateRoll: animateRoll
    };
})();
