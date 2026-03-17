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

            // Track disconnect
            setInterval(function() {
                if (playerConnected && playerWindow && playerWindow.closed) {
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
        var msg = {
            _carrera: true,
            type: type,
            data: data || {},
            sender: role,
            timestamp: Date.now()
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

        // 3. localStorage (always try as backup)
        try {
            localStorage.setItem('carrera-sync-msg', JSON.stringify(msg));
            setTimeout(function() {
                localStorage.removeItem('carrera-sync-msg');
            }, 100);
        } catch (e) {}
    }

    function handleMessage(msg) {
        if (!msg || !msg.type) return;
        if (msg.sender === role) return;

        // Track player connection
        if (role === 'gm' && msg.type === 'player_ready') {
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
