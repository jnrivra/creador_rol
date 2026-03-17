// Sistema de Reloj - 4 segmentos
// Cuando se llena, la dificultad sube (+2)
window.Carrera = window.Carrera || {};

window.Carrera.clock = (function() {
    var state = {
        segments: 4,
        filled: 0,
        totalFilled: 0
    };

    var renderTargets = {
        clockId: 'clock-display',
        dieId: 'die-display'
    };

    function reset() {
        state.filled = 0;
        state.totalFilled = 0;
    }

    function fill(amount) {
        amount = amount || 1;
        state.filled += amount;
        state.totalFilled += amount;

        window.Carrera.audio.playClockTick();

        var difficultyUp = false;
        if (state.filled >= state.segments) {
            state.filled = 0;
            // Increase difficulty instead of shrinking die
            window.Carrera.dice.addDifficultyBonus(2);
            difficultyUp = true;
            window.Carrera.audio.playClockAlarm();
        }

        render();
        return { difficultyUp: difficultyUp, filled: state.filled, total: state.totalFilled };
    }

    function getFilled() { return state.filled; }
    function getTotal() { return state.totalFilled; }

    function isExhausted() {
        return state.totalFilled >= 12;
    }

    function setRenderTargets(clockId, dieId) {
        renderTargets.clockId = clockId || 'clock-display';
        renderTargets.dieId = dieId || 'die-display';
    }

    function getState() {
        return { filled: state.filled, totalFilled: state.totalFilled, segments: state.segments };
    }

    function render() {
        var container = document.getElementById(renderTargets.clockId);
        if (!container) return;

        container.innerHTML = '';
        for (var i = 0; i < state.segments; i++) {
            var seg = document.createElement('div');
            seg.className = 'clock-segment' + (i < state.filled ? ' filled' : '');
            if (i === state.filled - 1 && state.filled > 0) {
                seg.classList.add('just-filled');
            }
            container.appendChild(seg);
        }

        // Update difficulty display
        var dieDisplay = document.getElementById(renderTargets.dieId);
        if (dieDisplay) {
            var bonus = window.Carrera.dice.getDifficultyBonus();
            if (bonus > 0) {
                dieDisplay.innerHTML = '📈 <span>+' + bonus + '</span>';
                dieDisplay.className = 'die-indicator diff-up';
            } else {
                dieDisplay.innerHTML = '⚖️ <span>Normal</span>';
                dieDisplay.className = 'die-indicator';
            }
        }
    }

    function manualFill() {
        if (state.filled < state.segments) {
            return fill(1);
        }
        return null;
    }

    function manualEmpty() {
        if (state.filled > 0) {
            state.filled--;
            render();
        }
    }

    return {
        reset: reset,
        fill: fill,
        getFilled: getFilled,
        getTotal: getTotal,
        isExhausted: isExhausted,
        render: render,
        manualFill: manualFill,
        manualEmpty: manualEmpty,
        setRenderTargets: setRenderTargets,
        getState: getState
    };
})();
