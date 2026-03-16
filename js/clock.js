// Sistema de Reloj - 4 segmentos
window.Carrera = window.Carrera || {};

window.Carrera.clock = (function() {
    var state = {
        segments: 4,
        filled: 0,
        totalFilled: 0  // Track total across all resets
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

        var dieShrunk = false;
        if (state.filled >= state.segments) {
            // Clock full - shrink die
            state.filled = 0;
            dieShrunk = window.Carrera.dice.shrinkDie();
            if (dieShrunk) {
                window.Carrera.audio.playClockAlarm();
            }
        }

        render();
        return { dieShrunk: dieShrunk, filled: state.filled, total: state.totalFilled };
    }

    function getFilled() {
        return state.filled;
    }

    function getTotal() {
        return state.totalFilled;
    }

    function isExhausted() {
        // After 3 full clock cycles (12 segments), beasts are exhausted
        return state.totalFilled >= 12;
    }

    function render() {
        var container = document.getElementById('clock-display');
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

        // Update die display
        var dieDisplay = document.getElementById('die-display');
        if (dieDisplay) {
            var die = window.Carrera.dice.getCurrentDie();
            dieDisplay.innerHTML = window.Carrera.dice.getDieEmoji(die) + ' <span>d' + die + '</span>';
            dieDisplay.className = 'die-indicator die-d' + die;
        }
    }

    // Manual GM controls
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
        manualEmpty: manualEmpty
    };
})();
