// Motor de Audio Procedural - Zelda-inspired SFX + Ambient
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

    // === Helpers ===

    function createNoiseBuffer(type, duration) {
        if (!ctx) return null;
        var sr = ctx.sampleRate;
        var len = sr * (duration || 2);
        var buf = ctx.createBuffer(1, len, sr);
        var d = buf.getChannelData(0);
        var last = 0;
        for (var i = 0; i < len; i++) {
            var w = Math.random() * 2 - 1;
            if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
            else { d[i] = w; }
        }
        return buf;
    }

    function createNoiseSource(type, duration) {
        var buf = createNoiseBuffer(type, duration);
        if (!buf) return null;
        var s = ctx.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        return s;
    }

    // Play a note with triangle wave (retro/Zelda feel)
    function playNote(freq, startTime, duration, vol, waveType) {
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = waveType || 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol || 0.15, startTime + 0.015);
        gain.gain.linearRampToValueAtTime(vol * 0.6, startTime + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
    }

    // === AMBIENT PRESETS ===

    function stopAmbient() {
        currentAmbientNodes.forEach(function(n) {
            try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch(e) {}
        });
        currentAmbientNodes = [];
    }

    function playAmbient(preset) {
        if (!ctx) return;
        stopAmbient();
        var fn = {
            forest: createForestAmbient, river: createRiverAmbient,
            tunnel: createTunnelAmbient, den: createDenAmbient,
            treasure: createTreasureAmbient, victory: createVictoryAmbient
        }[preset];
        if (fn) fn();
    }

    function createForestAmbient() {
        // Wind
        var wind = createNoiseSource('brown', 3);
        var wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 300; wf.Q.value = 0.5;
        var wg = ctx.createGain(); wg.gain.value = 0.3;
        wind.connect(wf); wf.connect(wg); wg.connect(ambientGain); wind.start();
        currentAmbientNodes.push(wind, wf, wg);

        // Leaves rustling
        var leaves = createNoiseSource('white', 3);
        var lf = ctx.createBiquadFilter(); lf.type = 'bandpass'; lf.frequency.value = 2200; lf.Q.value = 2;
        var lg = ctx.createGain(); lg.gain.value = 0.025;
        var llfo = ctx.createOscillator(); llfo.frequency.value = 0.12;
        var llg = ctx.createGain(); llg.gain.value = 0.02;
        llfo.connect(llg); llg.connect(lg.gain);
        leaves.connect(lf); lf.connect(lg); lg.connect(ambientGain);
        leaves.start(); llfo.start();
        currentAmbientNodes.push(leaves, lf, lg, llfo, llg);

        scheduleBirdChirp(1500, 3500);
        scheduleRandomSound(playInsect, 2500, 5000);
    }

    function createRiverAmbient() {
        // Surface water
        var w = createNoiseSource('white', 3);
        var wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 900;
        var lfo = ctx.createOscillator(); lfo.frequency.value = 0.25;
        var lfg = ctx.createGain(); lfg.gain.value = 350;
        lfo.connect(lfg); lfg.connect(wf.frequency); lfo.start();
        var wg = ctx.createGain(); wg.gain.value = 0.4;
        w.connect(wf); wf.connect(wg); wg.connect(ambientGain); w.start();
        currentAmbientNodes.push(w, wf, lfo, lfg, wg);

        // Deep current
        var d = createNoiseSource('brown', 3);
        var df = ctx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 180;
        var dg = ctx.createGain(); dg.gain.value = 0.2;
        d.connect(df); df.connect(dg); dg.connect(ambientGain); d.start();
        currentAmbientNodes.push(d, df, dg);

        // Babbling
        var b = createNoiseSource('white', 2);
        var bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 3200; bf.Q.value = 3;
        var bg = ctx.createGain(); bg.gain.value = 0.035;
        b.connect(bf); bf.connect(bg); bg.connect(ambientGain); b.start();
        currentAmbientNodes.push(b, bf, bg);

        scheduleRandomSound(playSplash, 2500, 5000);
        scheduleBirdChirp(5000, 9000);
    }

    function createTunnelAmbient() {
        var wind = createNoiseSource('brown', 3);
        var wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 180;
        var wg = ctx.createGain(); wg.gain.value = 0.25;
        wind.connect(wf); wf.connect(wg); wg.connect(ambientGain); wind.start();
        currentAmbientNodes.push(wind, wf, wg);

        scheduleRandomSound(playDrip, 1500, 3500);

        // Eerie tone
        var eo = ctx.createOscillator(); eo.type = 'sine'; eo.frequency.value = 110;
        var eg = ctx.createGain(); eg.gain.value = 0.025;
        var el = ctx.createOscillator(); el.frequency.value = 0.08;
        var elg = ctx.createGain(); elg.gain.value = 0.015;
        el.connect(elg); elg.connect(eg.gain);
        eo.connect(eg); eg.connect(ambientGain); eo.start(); el.start();
        currentAmbientNodes.push(eo, eg, el, elg);
    }

    function createDenAmbient() {
        var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 40;
        var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 80;
        var g = ctx.createGain(); g.gain.value = 0.12;
        o.connect(f); f.connect(g); g.connect(ambientGain); o.start();
        currentAmbientNodes.push(o, f, g);
        scheduleRandomSound(playGrumble, 4000, 8000);
        scheduleRandomSound(playDrip, 6000, 12000);
    }

    function createTreasureAmbient() {
        // Shimmer chord
        [880, 1108.73, 1318.5].forEach(function(freq) {
            var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
            var g = ctx.createGain(); g.gain.value = 0.035;
            o.connect(g); g.connect(ambientGain); o.start();
            currentAmbientNodes.push(o, g);
        });
        var trem = ctx.createOscillator(); trem.frequency.value = 2.5;
        var tg = ctx.createGain(); tg.gain.value = 0.12;
        trem.connect(tg); tg.connect(ambientGain.gain); trem.start();
        currentAmbientNodes.push(trem, tg);

        var wind = createNoiseSource('brown', 3);
        var wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 400;
        var wg = ctx.createGain(); wg.gain.value = 0.1;
        wind.connect(wf); wf.connect(wg); wg.connect(ambientGain); wind.start();
        currentAmbientNodes.push(wind, wf, wg);

        scheduleRandomSound(playSparkle, 600, 2000);
    }

    function createVictoryAmbient() {
        createTreasureAmbient();
        scheduleBirdChirp(2000, 5000);
    }

    // === Ambient sound helpers ===

    function scheduleBirdChirp(min, max) {
        var active = true; var tid;
        function loop() { if (!active || !ctx || !currentAmbientNodes.length) return; playChirp(); tid = setTimeout(loop, min + Math.random() * (max - min)); }
        tid = setTimeout(loop, 300 + Math.random() * 1000);
        currentAmbientNodes.push({ stop: function() { active = false; clearTimeout(tid); }, disconnect: function() {} });
    }

    function scheduleRandomSound(fn, min, max) {
        var active = true; var tid;
        function loop() { if (!active || !ctx || !currentAmbientNodes.length) return; fn(); tid = setTimeout(loop, min + Math.random() * (max - min)); }
        tid = setTimeout(loop, min * 0.5 + Math.random() * min);
        currentAmbientNodes.push({ stop: function() { active = false; clearTimeout(tid); }, disconnect: function() {} });
    }

    function playChirp() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var base = 1800 + Math.random() * 1500;
        var n = 2 + Math.floor(Math.random() * 3);
        var osc = ctx.createOscillator(); var g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(base, now);
        var t = now;
        for (var i = 0; i < n; i++) { osc.frequency.exponentialRampToValueAtTime(base * (0.8 + Math.random() * 0.5), t + 0.04); t += 0.04; }
        var dur = n * 0.04 + 0.05;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.03, now + 0.015);
        g.gain.linearRampToValueAtTime(0, now + dur);
        osc.connect(g); g.connect(ambientGain); osc.start(now); osc.stop(now + dur + 0.01);
    }

    function playInsect() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator(); var g = ctx.createGain();
        osc.type = 'sine'; var freq = 4000 + Math.random() * 2000; osc.frequency.value = freq;
        var dur = 0.06 + Math.random() * 0.1;
        var bursts = 2 + Math.floor(Math.random() * 4);
        g.gain.setValueAtTime(0, now);
        for (var i = 0; i < bursts; i++) {
            var t = now + i * dur * 1.5;
            g.gain.linearRampToValueAtTime(0.015, t + 0.01);
            g.gain.linearRampToValueAtTime(0, t + dur);
        }
        osc.connect(g); g.connect(ambientGain); osc.start(now); osc.stop(now + bursts * dur * 1.5 + 0.1);
    }

    function playSplash() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var n = createNoiseSource('white', 0.5); if (!n) return;
        var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 1000; f.Q.value = 2;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.02); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        n.connect(f); f.connect(g); g.connect(ambientGain); n.start(now); n.stop(now + 0.35);
    }

    function playDrip() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator(); var g = ctx.createGain();
        osc.type = 'sine'; var sf = 2000 + Math.random() * 1000;
        osc.frequency.setValueAtTime(sf, now); osc.frequency.exponentialRampToValueAtTime(sf * 0.3, now + 0.12);
        g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(g); g.connect(ambientGain); osc.start(now); osc.stop(now + 0.2);
    }

    function playGrumble() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        var g = ctx.createGain(); var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 150;
        o.frequency.setValueAtTime(60, now); o.frequency.linearRampToValueAtTime(80, now + 0.1); o.frequency.linearRampToValueAtTime(50, now + 0.3);
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.05, now + 0.05); g.gain.linearRampToValueAtTime(0, now + 0.4);
        o.connect(f); f.connect(g); g.connect(ambientGain); o.start(now); o.stop(now + 0.45);
    }

    function playSparkle() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var o = ctx.createOscillator(); var g = ctx.createGain();
        o.type = 'sine'; var freq = 2000 + Math.random() * 3000;
        o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.05);
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.035, now + 0.01); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); g.connect(ambientGain); o.start(now); o.stop(now + 0.18);
    }

    // === ZELDA-STYLE SFX ===

    // Menu click - short, clean
    function playClick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        playNote(880, now, 0.06, 0.1, 'square');
    }

    // Dice roll - tabla de madera
    function playDiceRoll() {
        if (!ctx) return;
        var now = ctx.currentTime;
        for (var i = 0; i < 8; i++) {
            var t = now + i * 0.06;
            var o = ctx.createOscillator(); var g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(150 + Math.random() * 400, t);
            g.gain.setValueAtTime(0.1 - i * 0.01, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.06);
        }
        // Wooden thud at end
        var n = ctx.currentTime;
        var thud = ctx.createOscillator(); var tg = ctx.createGain();
        thud.type = 'sine'; thud.frequency.value = 100;
        tg.gain.setValueAtTime(0, n + 0.45); tg.gain.linearRampToValueAtTime(0.12, n + 0.46); tg.gain.exponentialRampToValueAtTime(0.001, n + 0.6);
        thud.connect(tg); tg.connect(sfxGain); thud.start(n + 0.45); thud.stop(n + 0.65);
    }

    // SUCCESS - Zelda "puzzle solved" (ascending C-E-G with harmony)
    function playSuccess() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Main melody: C5 → E5 → G5 (triangle, retro)
        playNote(523.25, now, 0.25, 0.18, 'triangle');
        playNote(659.25, now + 0.2, 0.25, 0.18, 'triangle');
        playNote(783.99, now + 0.4, 0.45, 0.2, 'triangle');
        // Harmony underneath
        playNote(261.63, now, 0.7, 0.06, 'sine'); // C4
        playNote(329.63, now + 0.2, 0.5, 0.06, 'sine'); // E4
    }

    // CRITICAL - Zelda "item get" (da-da-da-DAAA ascending fanfare)
    function playCritical() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Iconic ascending: G4 → C5 → E5 → G5 → C6
        playNote(392, now, 0.12, 0.16, 'triangle');
        playNote(523.25, now + 0.12, 0.12, 0.16, 'triangle');
        playNote(659.25, now + 0.24, 0.12, 0.16, 'triangle');
        playNote(783.99, now + 0.36, 0.5, 0.22, 'triangle');
        // Hold the high note with octave
        playNote(1046.5, now + 0.5, 0.8, 0.15, 'triangle');
        // Bass support
        playNote(261.63, now + 0.36, 0.9, 0.08, 'sine');
        playNote(392, now + 0.36, 0.9, 0.06, 'sine');
        // Sparkle finish
        setTimeout(function() { playSparkle(); }, 400);
        setTimeout(function() { playSparkle(); }, 600);
        setTimeout(function() { playSparkle(); }, 900);
    }

    // FAILURE - Zelda "wrong" (descending minor, short)
    function playFailure() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Descending: E5 → Eb5 → D5 → ... low
        playNote(659.25, now, 0.2, 0.14, 'triangle');
        playNote(554.37, now + 0.18, 0.2, 0.12, 'triangle'); // Db5
        playNote(440, now + 0.36, 0.4, 0.1, 'triangle'); // A4
        // Low ominous
        playNote(220, now + 0.36, 0.5, 0.06, 'sine');
    }

    // HIJINX - Zelda Tingle style (bouncy, goofy)
    function playHijinx() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Bouncy notes: up-down-up-down
        playNote(330, now, 0.1, 0.15, 'square');
        playNote(494, now + 0.1, 0.1, 0.15, 'square');
        playNote(330, now + 0.2, 0.1, 0.15, 'square');
        playNote(659, now + 0.3, 0.1, 0.18, 'square');
        playNote(330, now + 0.4, 0.1, 0.12, 'square');
        // Slide whistle
        var osc = ctx.createOscillator(); var g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now + 0.55);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.68);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.82);
        g.gain.setValueAtTime(0.1, now + 0.55);
        g.gain.linearRampToValueAtTime(0, now + 0.9);
        osc.connect(g); g.connect(sfxGain); osc.start(now + 0.55); osc.stop(now + 0.95);
        // Pop
        playNote(1200, now + 0.92, 0.05, 0.08, 'square');
    }

    // TRIUMPH - Zelda "dungeon clear" (full fanfare with brass feel)
    function playTriumph() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Fanfare motif (trumpet-like with triangle)
        var melody = [
            [523.25, 0, 0.15], [523.25, 0.15, 0.15], [523.25, 0.3, 0.15],
            [659.25, 0.45, 0.12], [783.99, 0.57, 0.12], [1046.5, 0.69, 0.5],
            [783.99, 1.2, 0.12], [1046.5, 1.32, 0.6]
        ];
        melody.forEach(function(n) { playNote(n[0], now + n[1], n[2], 0.2, 'triangle'); });

        // Bass
        playNote(261.63, now, 0.7, 0.08, 'triangle');
        playNote(392, now + 0.69, 0.5, 0.08, 'triangle');
        playNote(523.25, now + 1.2, 0.7, 0.08, 'triangle');

        // Cymbal crash
        var noise = createNoiseSource('white', 1);
        if (noise) {
            var nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 5000;
            var ng = ctx.createGain();
            ng.gain.setValueAtTime(0, now + 0.69); ng.gain.linearRampToValueAtTime(0.08, now + 0.72); ng.gain.linearRampToValueAtTime(0, now + 1.5);
            noise.connect(nf); nf.connect(ng); ng.connect(sfxGain);
            noise.start(now + 0.69); noise.stop(now + 1.6);
        }

        // Second fanfare (higher)
        setTimeout(function() {
            if (!ctx) return;
            var t = ctx.currentTime;
            playNote(1046.5, t, 0.1, 0.18, 'triangle');
            playNote(1318.5, t + 0.1, 0.1, 0.18, 'triangle');
            playNote(1568, t + 0.2, 0.1, 0.18, 'triangle');
            playNote(2093, t + 0.3, 0.7, 0.22, 'triangle');
            playNote(1046.5, t + 0.3, 0.7, 0.08, 'sine');
        }, 1500);
    }

    // SCENE TRANSITION - Zelda "secret discovered" jingle
    function playSceneTransition() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // The iconic ascending secret jingle
        playNote(784, now, 0.12, 0.12, 'triangle');
        playNote(880, now + 0.1, 0.12, 0.12, 'triangle');
        playNote(988, now + 0.2, 0.12, 0.12, 'triangle');
        playNote(1047, now + 0.3, 0.12, 0.12, 'triangle');
        playNote(1175, now + 0.4, 0.12, 0.14, 'triangle');
        playNote(1319, now + 0.5, 0.35, 0.16, 'triangle');
    }

    // SUSPENSE - Low tension build
    function playSuspense() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Low rumble build
        var o = ctx.createOscillator(); var g = ctx.createGain();
        o.type = 'sawtooth';
        var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
        o.frequency.setValueAtTime(80, now); o.frequency.linearRampToValueAtTime(160, now + 0.8);
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.08, now + 0.2); g.gain.linearRampToValueAtTime(0, now + 1.0);
        o.connect(f); f.connect(g); g.connect(sfxGain); o.start(now); o.stop(now + 1.1);
        // High stinger
        playNote(659, now + 0.7, 0.3, 0.1, 'triangle');
        playNote(622, now + 0.75, 0.25, 0.08, 'triangle'); // Eb5 dissonance
    }

    function playClockTick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Zelda-style ominous tick
        playNote(440, now, 0.08, 0.12, 'triangle');
        playNote(220, now + 0.02, 0.06, 0.06, 'sine');
    }

    function playClockAlarm() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Zelda low-health style urgent beeps
        for (var i = 0; i < 6; i++) {
            playNote(880, now + i * 0.12, 0.06, 0.1, 'square');
            playNote(440, now + i * 0.12 + 0.06, 0.04, 0.06, 'square');
        }
    }

    // Volume controls
    function setAmbientVolume(v) { if (ambientGain) ambientGain.gain.value = Math.max(0, Math.min(1, v)); }
    function setSfxVolume(v) { if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, v)); }
    function toggleMute() { muted = !muted; if (masterGain) masterGain.gain.value = muted ? 0 : 0.7; return muted; }
    function isMuted() { return muted; }

    return {
        init: init, resume: resume,
        playAmbient: playAmbient, stopAmbient: stopAmbient,
        playClick: playClick, playDiceRoll: playDiceRoll,
        playSuccess: playSuccess, playCritical: playCritical,
        playFailure: playFailure, playHijinx: playHijinx,
        playTriumph: playTriumph, playClockTick: playClockTick,
        playClockAlarm: playClockAlarm,
        playSceneTransition: playSceneTransition, playSuspense: playSuspense,
        setAmbientVolume: setAmbientVolume, setSfxVolume: setSfxVolume,
        toggleMute: toggleMute, isMuted: isMuted
    };
})();
