// Comunicación entre pestañas GM ↔ Player
// Estrategia: postMessage (directo) > BroadcastChannel > localStorage
window.Carrera = window.Carrera || {};

window.Carrera.sync = (function() {
    var role = null; // 'gm' or 'player'
    var listeners = [];
    var playerConnected = false;
    var pingInterval = null;

    // Communication channels
    var channel = null;          // BroadcastChannel (if available)
    var playerWindow = null;     // Reference to player window (GM side)
    var gmWindow = null;         // Reference to opener window (player side)
    var usePostMessage = false;
    var useBroadcastChannel = false;
    var msgCounter = 0;          // monotonic counter so rapid duplicate sends remain unique
    var seenMsgIds = {};         // dedupe ids across channels
    var lastConnectionTime = 0;  // when player last responded (heartbeat tracking)

    function init(r) {
        role = r;

        // Strategy 1: postMessage via window references
        if (role === 'player' && window.opener) {
            gmWindow = window.opener;
            usePostMessage = true;
        }

        // Strategy 2: BroadcastChannel (works on http/https, NOT file://)
        try {
            if (typeof BroadcastChannel !== 'undefined' && location.protocol !== 'file:') {
                channel = new BroadcastChannel('carrera-sync');
                channel.onmessage = function(e) {
                    handleMessage(e.data);
                };
                useBroadcastChannel = true;
            }
        } catch (e) {}

        // Strategy 3: localStorage events (fallback, always available)
        window.addEventListener('storage', function(e) {
            if (e.key === 'carrera-sync-msg' && e.newValue) {
                try {
                    var data = JSON.parse(e.newValue);
                    if (data && data.sender !== role) {
                        handleMessage(data);
                    }
                } catch (err) {}
            }
        });

        // Listen for postMessage from any source
        window.addEventListener('message', function(e) {
            if (e.data && e.data._carrera) {
                handleMessage(e.data);
                // If GM receives postMessage from player, store reference
                if (role === 'gm' && e.source) {
                    playerWindow = e.source;
                    usePostMessage = true;
                }
            }
        });

        if (role === 'gm') {
            // Ping every 3 seconds
            pingInterval = setInterval(function() {
                send('gm_ping', { time: Date.now() });
            }, 3000);
            send('gm_ping', { time: Date.now() });

            // Track disconnect — window.closed OR heartbeat silent for 8s
            setInterval(function() {
                if (!playerConnected) return;
                var windowClosed = playerWindow && playerWindow.closed;
                var heartbeatSilent = lastConnectionTime > 0 && (Date.now() - lastConnectionTime) > 8000;
                if (windowClosed || heartbeatSilent) {
                    playerConnected = false;
                    updateConnectionIndicator(false);
                }
            }, 2000);
        }

        if (role === 'player') {
            // Respond to pings
            onMessage(function(msg) {
                if (msg.type === 'gm_ping') {
                    send('player_ready', { time: Date.now() });
                }
            });
            // Announce immediately
            send('player_ready', { time: Date.now() });
            // And again after a small delay (in case GM isn't listening yet)
            setTimeout(function() {
                send('player_ready', { time: Date.now() });
            }, 500);
        }
    }

    function setPlayerWindow(win) {
        playerWindow = win;
        usePostMessage = true;
    }

    function send(type, data) {
        msgCounter++;
        var msg = {
            _carrera: true,
            type: type,
            data: data || {},
            sender: role,
            timestamp: Date.now(),
            seq: msgCounter,
            id: role + '-' + Date.now() + '-' + msgCounter
        };

        // 1. postMessage (most reliable for file://)
        if (usePostMessage) {
            try {
                if (role === 'gm' && playerWindow && !playerWindow.closed) {
                    playerWindow.postMessage(msg, '*');
                } else if (role === 'player' && gmWindow) {
                    gmWindow.postMessage(msg, '*');
                }
            } catch (e) {}
        }

        // 2. BroadcastChannel
        if (useBroadcastChannel && channel) {
            try { channel.postMessage(msg); } catch (e) {}
        }

        // 3. localStorage (always try as backup) — value must be unique each call so
        //    the storage event always fires even when consecutive sends carry identical
        //    payload. We embed the seq into the JSON itself (already done above).
        try {
            localStorage.setItem('carrera-sync-msg', JSON.stringify(msg));
            setTimeout(function() {
                // Only remove if our value is still there — avoid clobbering newer messages
                var cur = localStorage.getItem('carrera-sync-msg');
                if (cur && cur.indexOf('"id":"' + msg.id + '"') !== -1) {
                    localStorage.removeItem('carrera-sync-msg');
                }
            }, 200);
        } catch (e) {}
    }

    function handleMessage(msg) {
        if (!msg || !msg.type) return;
        if (msg.sender === role) return;

        // Dedupe across channels (postMessage + BroadcastChannel + storage may all fire)
        if (msg.id) {
            if (seenMsgIds[msg.id]) return;
            seenMsgIds[msg.id] = Date.now();
            // Keep seenMsgIds bounded
            var keys = Object.keys(seenMsgIds);
            if (keys.length > 200) {
                // Drop the oldest 50
                keys.sort(function(a, b) { return seenMsgIds[a] - seenMsgIds[b]; });
                for (var k = 0; k < 50; k++) delete seenMsgIds[keys[k]];
            }
        }

        // Track player connection
        if (role === 'gm' && msg.type === 'player_ready') {
            lastConnectionTime = Date.now();
            if (!playerConnected) {
                playerConnected = true;
                updateConnectionIndicator(true);
            }
        }

        // Notify listeners
        for (var i = 0; i < listeners.length; i++) {
            try { listeners[i](msg); } catch (e) {
                console.warn('sync listener error:', e);
            }
        }
    }

    function onMessage(callback) {
        listeners.push(callback);
    }

    function isPlayerConnected() {
        return playerConnected;
    }

    function updateConnectionIndicator(connected) {
        var indicator = document.getElementById('gm-connection-status');
        if (indicator) {
            indicator.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
            indicator.textContent = connected ? '🟢 Vista conectada' : '🔴 Sin conexión';
        }
    }

    function destroy() {
        if (pingInterval) clearInterval(pingInterval);
        if (channel) { try { channel.close(); } catch(e) {} }
        listeners = [];
    }

    return {
        init: init,
        send: send,
        onMessage: onMessage,
        isPlayerConnected: isPlayerConnected,
        setPlayerWindow: setPlayerWindow,
        destroy: destroy
    };
})();
