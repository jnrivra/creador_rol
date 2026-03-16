// Motor de Audio Procedural - Web Audio API
window.Carrera = window.Carrera || {};

window.Carrera.audio = (function() {
    var ctx = null;
    var masterGain = null;
    var ambientGain = null;
    var sfxGain = null;
    var currentAmbientNodes = [];
    var initialized = false;
    var muted = false;

    function init() {
        if (initialized) return;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.7;
            masterGain.connect(ctx.destination);

            ambientGain = ctx.createGain();
            ambientGain.gain.value = 0.3;
            ambientGain.connect(masterGain);

            sfxGain = ctx.createGain();
            sfxGain.gain.value = 0.5;
            sfxGain.connect(masterGain);

            initialized = true;
        } catch (e) {
            console.warn('Web Audio API no disponible:', e);
        }
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    // --- Noise Generators ---
    function createNoiseBuffer(type, duration) {
        if (!ctx) return null;
        var sampleRate = ctx.sampleRate;
        var length = sampleRate * (duration || 2);
        var buffer = ctx.createBuffer(1, length, sampleRate);
        var data = buffer.getChannelData(0);
        var lastOut = 0;

        for (var i = 0; i < length; i++) {
            var white = Math.random() * 2 - 1;
            if (type === 'brown') {
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                data[i] = lastOut * 3.5;
            } else {
                data[i] = white;
            }
        }
        return buffer;
    }

    function createNoiseSource(type, duration) {
        var buffer = createNoiseBuffer(type, duration);
        if (!buffer) return null;
        var source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    }

    // --- Ambient Presets ---
    function stopAmbient() {
        currentAmbientNodes.forEach(function(node) {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        currentAmbientNodes = [];
    }

    function playAmbient(preset) {
        if (!ctx) return;
        stopAmbient();

        var presets = {
            forest: createForestAmbient,
            river: createRiverAmbient,
            tunnel: createTunnelAmbient,
            den: createDenAmbient,
            treasure: createTreasureAmbient,
            victory: createVictoryAmbient
        };

        if (presets[preset]) presets[preset]();
    }

    function createForestAmbient() {
        // Wind - brown noise through bandpass
        var wind = createNoiseSource('brown', 3);
        var windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 300;
        windFilter.Q.value = 0.5;
        var windGain = ctx.createGain();
        windGain.gain.value = 0.4;
        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ambientGain);
        wind.start();
        currentAmbientNodes.push(wind, windFilter, windGain);

        // Birds - randomized chirps using recursive setTimeout
        scheduleBirdChirp(1500, 3500);
    }

    function scheduleBirdChirp(minDelay, maxDelay) {
        var active = true;
        var timeoutId = null;

        function chirpLoop() {
            if (!active || !ctx || currentAmbientNodes.length === 0) return;
            playChirp();
            var delay = minDelay + Math.random() * (maxDelay - minDelay);
            timeoutId = setTimeout(chirpLoop, delay);
        }

        // Start first chirp soon
        timeoutId = setTimeout(chirpLoop, 300 + Math.random() * 1000);

        // Store cleanup
        currentAmbientNodes.push({
            stop: function() { active = false; clearTimeout(timeoutId); },
            disconnect: function() {}
        });
    }

    function playChirp() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var baseFreq = 1800 + Math.random() * 1500;
        var numNotes = 2 + Math.floor(Math.random() * 3);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);

        // Create a more natural multi-note chirp
        var t = now;
        for (var i = 0; i < numNotes; i++) {
            var nextFreq = baseFreq * (0.8 + Math.random() * 0.5);
            osc.frequency.exponentialRampToValueAtTime(nextFreq, t + 0.04);
            t += 0.04;
        }

        var totalDur = numNotes * 0.04 + 0.05;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.04, now + 0.015);
        gain.gain.linearRampToValueAtTime(0.04, now + totalDur * 0.6);
        gain.gain.linearRampToValueAtTime(0, now + totalDur);

        osc.connect(gain);
        gain.connect(ambientGain);
        osc.start(now);
        osc.stop(now + totalDur + 0.01);
    }

    function createRiverAmbient() {
        // Water - white noise through lowpass with LFO
        var water = createNoiseSource('white', 3);
        var waterFilter = ctx.createBiquadFilter();
        waterFilter.type = 'lowpass';
        waterFilter.frequency.value = 800;

        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.3;
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(waterFilter.frequency);
        lfo.start();

        var waterGain = ctx.createGain();
        waterGain.gain.value = 0.5;
        water.connect(waterFilter);
        waterFilter.connect(waterGain);
        waterGain.connect(ambientGain);
        water.start();

        currentAmbientNodes.push(water, waterFilter, lfo, lfoGain, waterGain);

        // Occasional splash sounds
        scheduleRandomSound(playSplash, 3000, 6000);

        // Soft birds
        scheduleBirdChirp(4000, 8000);
    }

    function playSplash() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var noise = createNoiseSource('white', 0.5);
        if (!noise) return;
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500 + Math.random() * 1000;
        filter.Q.value = 2;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ambientGain);
        noise.start(now);
        noise.stop(now + 0.35);
    }

    function createTunnelAmbient() {
        // Low wind
        var wind = createNoiseSource('brown', 3);
        var windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 200;
        var windGain = ctx.createGain();
        windGain.gain.value = 0.3;
        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ambientGain);
        wind.start();
        currentAmbientNodes.push(wind, windFilter, windGain);

        // Dripping with delay (echo effect)
        scheduleRandomSound(playDrip, 1500, 4000);

        // Subtle eerie tone
        var eerieOsc = ctx.createOscillator();
        eerieOsc.type = 'sine';
        eerieOsc.frequency.value = 120;
        var eerieGain = ctx.createGain();
        eerieGain.gain.value = 0.03;
        var eereLfo = ctx.createOscillator();
        eereLfo.type = 'sine';
        eereLfo.frequency.value = 0.1;
        var eereLfoGain = ctx.createGain();
        eereLfoGain.gain.value = 0.02;
        eereLfo.connect(eereLfoGain);
        eereLfoGain.connect(eerieGain.gain);
        eerieOsc.connect(eerieGain);
        eerieGain.connect(ambientGain);
        eerieOsc.start();
        eereLfo.start();
        currentAmbientNodes.push(eerieOsc, eerieGain, eereLfo, eereLfoGain);
    }

    function playDrip() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        var startFreq = 2000 + Math.random() * 1000;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.3, now + 0.12);

        gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ambientGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    function createDenAmbient() {
        // Low rumble
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 40;
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 80;
        var gain = ctx.createGain();
        gain.gain.value = 0.15;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ambientGain);
        osc.start();
        currentAmbientNodes.push(osc, filter, gain);

        // Occasional grumble sounds
        scheduleRandomSound(playGrumble, 4000, 8000);

        // Rare drips
        scheduleRandomSound(playDrip, 5000, 10000);
    }

    function playGrumble() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        var gain = ctx.createGain();
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;

        osc.frequency.setValueAtTime(60, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.1);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ambientGain);
        osc.start(now);
        osc.stop(now + 0.45);
    }

    function createTreasureAmbient() {
        // Shimmer chord
        var freqs = [880, 1108.73, 1318.5]; // A5, C#6, E6
        freqs.forEach(function(freq) {
            var osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            var shimmerGain = ctx.createGain();
            shimmerGain.gain.value = 0.04;
            osc.connect(shimmerGain);
            shimmerGain.connect(ambientGain);
            osc.start();
            currentAmbientNodes.push(osc, shimmerGain);
        });

        // Tremolo LFO on the ambient gain
        var tremolo = ctx.createOscillator();
        var tremoloGain = ctx.createGain();
        tremolo.type = 'sine';
        tremolo.frequency.value = 3;
        tremoloGain.gain.value = 0.15;
        tremolo.connect(tremoloGain);
        tremoloGain.connect(ambientGain.gain);
        tremolo.start();
        currentAmbientNodes.push(tremolo, tremoloGain);

        // Gentle wind
        var wind = createNoiseSource('brown', 3);
        var windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 400;
        var windGain = ctx.createGain();
        windGain.gain.value = 0.12;
        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ambientGain);
        wind.start();
        currentAmbientNodes.push(wind, windFilter, windGain);

        // Sparkle sounds
        scheduleRandomSound(playSparkle, 800, 2500);
    }

    function playSparkle() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        var freq = 2000 + Math.random() * 3000;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.05);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ambientGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    function createVictoryAmbient() {
        createTreasureAmbient();
        scheduleBirdChirp(2000, 5000);
    }

    // Helper: schedule random recurring sounds
    function scheduleRandomSound(soundFn, minDelay, maxDelay) {
        var active = true;
        var timeoutId = null;

        function loop() {
            if (!active || !ctx || currentAmbientNodes.length === 0) return;
            soundFn();
            var delay = minDelay + Math.random() * (maxDelay - minDelay);
            timeoutId = setTimeout(loop, delay);
        }

        timeoutId = setTimeout(loop, minDelay * 0.5 + Math.random() * minDelay);

        currentAmbientNodes.push({
            stop: function() { active = false; clearTimeout(timeoutId); },
            disconnect: function() {}
        });
    }

    // --- Sound Effects ---
    function playClick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    function playDiceRoll() {
        if (!ctx) return;
        var now = ctx.currentTime;
        for (var i = 0; i < 10; i++) {
            var t = now + i * 0.05;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200 + Math.random() * 500, t);
            gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(t);
            osc.stop(t + 0.05);
        }
    }

    function playSuccess() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach(function(freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.05);
            gain.gain.linearRampToValueAtTime(0.08, now + i * 0.15 + 0.4);
            gain.gain.linearRampToValueAtTime(0, now + 0.9);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now + i * 0.15);
            osc.stop(now + 1.0);
        });
    }

    function playCritical() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach(function(freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.5);
            gain.gain.linearRampToValueAtTime(0, now + 1.3);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now + i * 0.12);
            osc.stop(now + 1.4);
        });

        // Add sparkle
        setTimeout(function() { playSparkle(); }, 300);
        setTimeout(function() { playSparkle(); }, 500);
    }

    function playFailure() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var notes = [392, 349.23]; // G4, F4
        notes.forEach(function(freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.2);
            gain.gain.linearRampToValueAtTime(0.12, now + i * 0.2 + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + 0.8);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now + i * 0.2);
            osc.stop(now + 0.9);
        });
    }

    function playHijinx() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Boing sound
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.5);

        // Slide whistle
        setTimeout(function() {
            if (!ctx) return;
            var osc2 = ctx.createOscillator();
            var gain2 = ctx.createGain();
            var t = ctx.currentTime;
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(300, t);
            osc2.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
            osc2.frequency.exponentialRampToValueAtTime(250, t + 0.28);
            gain2.gain.setValueAtTime(0.1, t);
            gain2.gain.linearRampToValueAtTime(0, t + 0.35);
            osc2.connect(gain2);
            gain2.connect(sfxGain);
            osc2.start(t);
            osc2.stop(t + 0.4);
        }, 200);

        // Funny pop
        setTimeout(function() {
            if (!ctx) return;
            var osc3 = ctx.createOscillator();
            var gain3 = ctx.createGain();
            var t = ctx.currentTime;
            osc3.type = 'square';
            osc3.frequency.setValueAtTime(1000, t);
            osc3.frequency.exponentialRampToValueAtTime(200, t + 0.08);
            gain3.gain.setValueAtTime(0.06, t);
            gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc3.connect(gain3);
            gain3.connect(sfxGain);
            osc3.start(t);
            osc3.stop(t + 0.12);
        }, 450);
    }

    function playTriumph() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Fanfare arpeggio
        var notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 1046.5];
        notes.forEach(function(freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            var t = now + i * 0.1;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.25);
            gain.gain.linearRampToValueAtTime(0, now + 1.8);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(t);
            osc.stop(now + 2.0);
        });

        // Cymbal crash
        var noise = createNoiseSource('white', 1);
        if (noise) {
            var nFilter = ctx.createBiquadFilter();
            nFilter.type = 'highpass';
            nFilter.frequency.value = 4000;
            var nGain = ctx.createGain();
            nGain.gain.setValueAtTime(0, now + 0.6);
            nGain.gain.linearRampToValueAtTime(0.1, now + 0.65);
            nGain.gain.linearRampToValueAtTime(0, now + 1.8);
            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(sfxGain);
            noise.start(now + 0.6);
            noise.stop(now + 2.0);
        }

        // Second fanfare after a beat
        setTimeout(function() {
            if (!ctx) return;
            var t = ctx.currentTime;
            [1046.5, 1318.5, 1568, 2093].forEach(function(freq, i) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                var st = t + i * 0.08;
                gain.gain.setValueAtTime(0, st);
                gain.gain.linearRampToValueAtTime(0.15, st + 0.03);
                gain.gain.linearRampToValueAtTime(0, t + 1.0);
                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(st);
                osc.stop(t + 1.2);
            });
        }, 1200);
    }

    function playClockTick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    function playClockAlarm() {
        if (!ctx) return;
        var now = ctx.currentTime;
        for (var i = 0; i < 4; i++) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 500 + i * 50;
            var t = now + i * 0.18;
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.13);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    // Volume controls
    function setAmbientVolume(v) {
        if (ambientGain) ambientGain.gain.value = Math.max(0, Math.min(1, v));
    }

    function setSfxVolume(v) {
        if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, v));
    }

    function toggleMute() {
        muted = !muted;
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
        return muted;
    }

    function isMuted() {
        return muted;
    }

    return {
        init: init,
        resume: resume,
        playAmbient: playAmbient,
        stopAmbient: stopAmbient,
        playClick: playClick,
        playDiceRoll: playDiceRoll,
        playSuccess: playSuccess,
        playCritical: playCritical,
        playFailure: playFailure,
        playHijinx: playHijinx,
        playTriumph: playTriumph,
        playClockTick: playClockTick,
        playClockAlarm: playClockAlarm,
        setAmbientVolume: setAmbientVolume,
        setSfxVolume: setSfxVolume,
        toggleMute: toggleMute,
        isMuted: isMuted
    };
})();
