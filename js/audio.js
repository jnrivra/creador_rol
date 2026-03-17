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

    // Play a note with warm envelope + optional echo
    function playNote(freq, startTime, duration, vol, waveType) {
        if (!ctx) return;
        vol = vol || 0.15;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = waveType || 'triangle';
        osc.frequency.value = freq;

        // Warm ADSR: quick attack, sustain, smooth release
        var attack = Math.min(0.03, duration * 0.1);
        var release = Math.min(0.15, duration * 0.3);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + attack);
        gain.gain.setValueAtTime(vol * 0.85, startTime + duration - release);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    }

    // Play note with reverb echo (delayed quieter repeat)
    function playNoteEcho(freq, startTime, duration, vol, waveType) {
        playNote(freq, startTime, duration, vol, waveType);
        playNote(freq, startTime + 0.08, duration * 0.6, vol * 0.25, waveType); // echo
    }

    // Play a chord (multiple notes at once)
    function playChord(freqs, startTime, duration, vol, waveType) {
        var perNote = vol / Math.sqrt(freqs.length); // balance volume
        freqs.forEach(function(f) {
            playNote(f, startTime, duration, perNote, waveType);
        });
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

    // === SFX ===

    function playClick() {
        if (!ctx) return;
        playNote(1200, ctx.currentTime, 0.04, 0.08, 'sine');
        playNote(800, ctx.currentTime + 0.01, 0.03, 0.04, 'triangle');
    }

    function playDiceRoll() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Clacking dice sounds - noise bursts at different pitches
        for (var i = 0; i < 10; i++) {
            var t = now + i * 0.05 + Math.random() * 0.02;
            var n = createNoiseSource('white', 0.05);
            if (!n) continue;
            var f = ctx.createBiquadFilter(); f.type = 'bandpass';
            f.frequency.value = 800 + Math.random() * 2000; f.Q.value = 5;
            var g = ctx.createGain();
            var v = 0.08 * (1 - i * 0.07);
            g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            n.connect(f); f.connect(g); g.connect(sfxGain);
            n.start(t); n.stop(t + 0.05);
        }
        // Final landing thud
        playNote(120, now + 0.5, 0.12, 0.1, 'sine');
    }

    // SUCCESS - Warm major chord resolve (like opening a chest)
    function playSuccess() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Two-part: pickup note then major chord
        playNoteEcho(392, now, 0.15, 0.14, 'triangle');       // G4 pickup
        playNoteEcho(523.25, now + 0.15, 0.4, 0.18, 'triangle'); // C5
        playNoteEcho(659.25, now + 0.15, 0.4, 0.14, 'triangle'); // E5
        playNoteEcho(783.99, now + 0.15, 0.5, 0.16, 'triangle'); // G5
        // Warm bass
        playNote(130.81, now + 0.15, 0.6, 0.1, 'sine');  // C3
        playNote(261.63, now + 0.15, 0.5, 0.06, 'sine');  // C4
    }

    // CRITICAL - Grand fanfare (very different from success)
    function playCritical() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Trumpet call: da-da-da-DAAA
        playNoteEcho(523.25, now, 0.1, 0.16, 'triangle');       // C5
        playNoteEcho(523.25, now + 0.1, 0.1, 0.16, 'triangle');  // C5
        playNoteEcho(523.25, now + 0.2, 0.12, 0.18, 'triangle'); // C5
        playNoteEcho(783.99, now + 0.35, 0.6, 0.22, 'triangle'); // G5 (hold!)

        // Full chord underneath
        playChord([261.63, 329.63, 392], now + 0.35, 0.8, 0.18, 'triangle'); // C major
        playNote(130.81, now + 0.35, 0.9, 0.08, 'sine'); // C3 bass

        // Rising finish
        playNoteEcho(1046.5, now + 0.7, 0.5, 0.12, 'triangle'); // C6
        playNoteEcho(1318.5, now + 0.85, 0.4, 0.1, 'triangle'); // E6

        // Sparkle
        setTimeout(function() { playSparkle(); }, 500);
        setTimeout(function() { playSparkle(); }, 700);
        setTimeout(function() { playSparkle(); }, 1000);
    }

    // FAILURE - Descending "wah-wah" trombone
    function playFailure() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Wah-wah: descending with vibrato
        var o = ctx.createOscillator(); var g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, now);        // A4
        o.frequency.linearRampToValueAtTime(392, now + 0.25); // G4
        o.frequency.linearRampToValueAtTime(330, now + 0.5);  // E4
        o.frequency.linearRampToValueAtTime(262, now + 0.8);  // C4

        // Vibrato
        var vib = ctx.createOscillator(); vib.frequency.value = 5;
        var vibG = ctx.createGain(); vibG.gain.value = 8;
        vib.connect(vibG); vibG.connect(o.frequency); vib.start(now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.16, now + 0.04);
        g.gain.linearRampToValueAtTime(0.12, now + 0.4);
        g.gain.linearRampToValueAtTime(0, now + 0.9);

        o.connect(g); g.connect(sfxGain);
        o.start(now); o.stop(now + 1.0); vib.stop(now + 1.0);

        // Low thud
        playNote(130, now + 0.5, 0.3, 0.06, 'sine');
    }

    // HIJINX - Cartoon spring + slide whistle + pop
    function playHijinx() {
        if (!ctx) return;
        var now = ctx.currentTime;

        // Spring boing: rapid frequency wobble
        var boing = ctx.createOscillator(); var bg = ctx.createGain();
        boing.type = 'sine';
        boing.frequency.setValueAtTime(200, now);
        boing.frequency.exponentialRampToValueAtTime(800, now + 0.06);
        boing.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        boing.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        boing.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        bg.gain.setValueAtTime(0.14, now);
        bg.gain.linearRampToValueAtTime(0, now + 0.35);
        boing.connect(bg); bg.connect(sfxGain);
        boing.start(now); boing.stop(now + 0.4);

        // Silly melody: square wave staccato
        playNote(523, now + 0.35, 0.08, 0.12, 'square');
        playNote(659, now + 0.43, 0.08, 0.12, 'square');
        playNote(523, now + 0.51, 0.08, 0.1, 'square');
        playNote(784, now + 0.59, 0.12, 0.14, 'square');

        // Slide whistle up
        var sw = ctx.createOscillator(); var sg = ctx.createGain();
        sw.type = 'sine';
        sw.frequency.setValueAtTime(300, now + 0.75);
        sw.frequency.exponentialRampToValueAtTime(1500, now + 0.95);
        sg.gain.setValueAtTime(0.1, now + 0.75);
        sg.gain.linearRampToValueAtTime(0, now + 1.0);
        sw.connect(sg); sg.connect(sfxGain);
        sw.start(now + 0.75); sw.stop(now + 1.05);

        // Pop at end
        playNote(1500, now + 1.0, 0.04, 0.1, 'square');
    }

    // TRIUMPH - Full orchestral fanfare
    function playTriumph() {
        if (!ctx) return;
        var now = ctx.currentTime;

        // First phrase: ta-ta-ta-TAAA ta-TAAAA
        var mel = [
            [523, 0, 0.12], [523, 0.13, 0.12], [523, 0.26, 0.15],
            [784, 0.42, 0.25], [659, 0.7, 0.12], [1047, 0.85, 0.5]
        ];
        mel.forEach(function(n) { playNoteEcho(n[0], now + n[1], n[2], 0.2, 'triangle'); });

        // Harmony
        playChord([261, 330, 392], now + 0.42, 0.5, 0.15, 'triangle');
        playChord([262, 330, 523], now + 0.85, 0.6, 0.15, 'triangle');

        // Bass
        playNote(131, now, 0.85, 0.1, 'sine');
        playNote(262, now + 0.85, 0.6, 0.1, 'sine');

        // Cymbal
        var noise = createNoiseSource('white', 1);
        if (noise) {
            var nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 6000;
            var ng = ctx.createGain();
            ng.gain.setValueAtTime(0, now + 0.42); ng.gain.linearRampToValueAtTime(0.06, now + 0.44);
            ng.gain.linearRampToValueAtTime(0, now + 1.2);
            noise.connect(nf); nf.connect(ng); ng.connect(sfxGain);
            noise.start(now + 0.42); noise.stop(now + 1.3);
        }

        // Second phrase after pause
        setTimeout(function() {
            if (!ctx) return;
            var t = ctx.currentTime;
            playNoteEcho(1047, t, 0.12, 0.18, 'triangle');
            playNoteEcho(1319, t + 0.12, 0.12, 0.18, 'triangle');
            playNoteEcho(1568, t + 0.24, 0.12, 0.2, 'triangle');
            // Final chord
            playChord([1047, 1319, 1568, 2093], t + 0.38, 0.8, 0.25, 'triangle');
            playNote(523, t + 0.38, 0.9, 0.1, 'sine');
        }, 1400);
    }

    // SCENE TRANSITION - Gentle harp glissando
    function playSceneTransition() {
        if (!ctx) return;
        var now = ctx.currentTime;
        var notes = [523, 587, 659, 784, 880, 1047]; // C major scale
        notes.forEach(function(f, i) {
            playNote(f, now + i * 0.07, 0.25, 0.1, 'sine');
            playNote(f * 2, now + i * 0.07 + 0.02, 0.15, 0.04, 'sine'); // octave shimmer
        });
    }

    // SUSPENSE - Ominous low build with dissonance
    function playSuspense() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Low drone
        var o = ctx.createOscillator(); var g = ctx.createGain();
        o.type = 'sawtooth';
        var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 250;
        o.frequency.setValueAtTime(73.42, now); // D2
        o.frequency.linearRampToValueAtTime(98, now + 1.0); // G2
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.08, now + 0.3);
        g.gain.linearRampToValueAtTime(0.06, now + 0.8); g.gain.linearRampToValueAtTime(0, now + 1.2);
        o.connect(f); f.connect(g); g.connect(sfxGain); o.start(now); o.stop(now + 1.3);

        // Dissonant high notes
        playNote(466, now + 0.6, 0.4, 0.07, 'triangle'); // Bb4
        playNote(494, now + 0.65, 0.35, 0.06, 'triangle'); // B4 (clashes)
    }

    function playClockTick() {
        if (!ctx) return;
        var now = ctx.currentTime;
        playNote(660, now, 0.06, 0.1, 'triangle');
        playNote(330, now + 0.03, 0.08, 0.06, 'sine');
    }

    function playClockAlarm() {
        if (!ctx) return;
        var now = ctx.currentTime;
        // Urgent alternating beeps
        for (var i = 0; i < 5; i++) {
            var t = now + i * 0.15;
            playNote(880, t, 0.07, 0.12, 'square');
            playNote(660, t + 0.07, 0.06, 0.08, 'square');
        }
        // Final low warning
        playNote(220, now + 0.75, 0.3, 0.08, 'triangle');
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
