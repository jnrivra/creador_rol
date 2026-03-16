// Motor de Audio Procedural - Web Audio API
window.Carrera = window.Carrera || {};

window.Carrera.audio = (function() {
    let ctx = null;
    let masterGain = null;
    let ambientGain = null;
    let sfxGain = null;
    let currentAmbientNodes = [];
    let initialized = false;
    let muted = false;

    function init() {
        if (initialized) return;
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
            } catch(e) {}
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

        // Birds - periodic chirps
        startBirdChirps();
    }

    function startBirdChirps() {
        var birdInterval = setInterval(function() {
            if (!ctx || currentAmbientNodes.length === 0) {
                clearInterval(birdInterval);
                return;
            }
            playChirp();
        }, 2000 + Math.random() * 3000);

        // Store interval ID for cleanup
        currentAmbientNodes.push({ stop: function() { clearInterval(birdInterval); }, disconnect: function() {} });
        playChirp();
    }

    function playChirp() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var baseFreq = 1800 + Math.random() * 1500;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.15);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);

        osc.connect(gain);
        gain.connect(ambientGain);
        osc.start(now);
        osc.stop(now + 0.25);
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

        // Soft birds
        var birdInterval = setInterval(function() {
            if (!ctx || currentAmbientNodes.length === 0) {
                clearInterval(birdInterval);
                return;
            }
            if (Math.random() > 0.5) playChirp();
        }, 4000 + Math.random() * 3000);
        currentAmbientNodes.push({ stop: function() { clearInterval(birdInterval); }, disconnect: function() {} });
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

        // Dripping
        var dripInterval = setInterval(function() {
            if (!ctx || currentAmbientNodes.length === 0) {
                clearInterval(dripInterval);
                return;
            }
            playDrip();
        }, 1500 + Math.random() * 3000);
        currentAmbientNodes.push({ stop: function() { clearInterval(dripInterval); }, disconnect: function() {} });
        setTimeout(playDrip, 500);
    }

    function playDrip() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 1000, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

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

        // Echo drips
        var dripInterval = setInterval(function() {
            if (!ctx || currentAmbientNodes.length === 0) {
                clearInterval(dripInterval);
                return;
            }
            if (Math.random() > 0.6) playDrip();
        }, 3000 + Math.random() * 3000);
        currentAmbientNodes.push({ stop: function() { clearInterval(dripInterval); }, disconnect: function() {} });
    }

    function createTreasureAmbient() {
        // Shimmer
        var osc1 = ctx.createOscillator();
        var osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 880;
        osc2.frequency.value = 1108.73; // C#6

        var tremolo = ctx.createOscillator();
        var tremoloGain = ctx.createGain();
        tremolo.type = 'sine';
        tremolo.frequency.value = 4;
        tremoloGain.gain.value = 0.05;
        tremolo.connect(tremoloGain);

        var shimmerGain = ctx.createGain();
        shimmerGain.gain.value = 0.06;
        osc1.connect(shimmerGain);
        osc2.connect(shimmerGain);
        tremoloGain.connect(shimmerGain.gain);
        shimmerGain.connect(ambientGain);

        osc1.start();
        osc2.start();
        tremolo.start();

        currentAmbientNodes.push(osc1, osc2, tremolo, tremoloGain, shimmerGain);

        // Gentle wind
        var wind = createNoiseSource('brown', 3);
        var windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 400;
        var windGain = ctx.createGain();
        windGain.gain.value = 0.15;
        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ambientGain);
        wind.start();
        currentAmbientNodes.push(wind, windFilter, windGain);
    }

    function createVictoryAmbient() {
        createTreasureAmbient();
    }

    // --- Sound Effects ---
    function playClick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    function playDiceRoll() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Rattle sound
        for (var i = 0; i < 8; i++) {
            var t = now + i * 0.06;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200 + Math.random() * 400, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(t);
            osc.stop(t + 0.06);
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
            gain.gain.linearRampToValueAtTime(0, now + 0.8);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now + i * 0.15);
            osc.stop(now + 0.9);
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
            gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.05);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.5);
            gain.gain.linearRampToValueAtTime(0, now + 1.2);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now + i * 0.12);
            osc.stop(now + 1.3);
        });
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
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.5);

        // Slide whistle
        setTimeout(function() {
            var osc2 = ctx.createOscillator();
            var gain2 = ctx.createGain();
            var t = ctx.currentTime;
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(300, t);
            osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
            osc2.frequency.exponentialRampToValueAtTime(300, t + 0.3);
            gain2.gain.setValueAtTime(0.1, t);
            gain2.gain.linearRampToValueAtTime(0, t + 0.35);
            osc2.connect(gain2);
            gain2.connect(sfxGain);
            osc2.start(t);
            osc2.stop(t + 0.4);
        }, 200);
    }

    function playTriumph() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Fanfare arpeggio
        var notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1046.5];
        notes.forEach(function(freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            var t = now + i * 0.12;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.3);
            gain.gain.linearRampToValueAtTime(0, now + 1.5);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(t);
            osc.stop(now + 1.6);
        });

        // Noise burst (cymbal-like)
        var noise = createNoiseSource('white', 1);
        if (noise) {
            var nFilter = ctx.createBiquadFilter();
            nFilter.type = 'highpass';
            nFilter.frequency.value = 4000;
            var nGain = ctx.createGain();
            nGain.gain.setValueAtTime(0, now + 0.5);
            nGain.gain.linearRampToValueAtTime(0.08, now + 0.55);
            nGain.gain.linearRampToValueAtTime(0, now + 1.5);
            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(sfxGain);
            noise.start(now + 0.5);
            noise.stop(now + 1.6);
        }
    }

    function playClockTick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    function playClockAlarm() {
        if (!ctx) return;
        var now = ctx.currentTime;
        for (var i = 0; i < 3; i++) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 600;
            var t = now + i * 0.2;
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.15);
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
