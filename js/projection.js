// Modo Proyección - Fullscreen para monitor/TV
window.Carrera = window.Carrera || {};

window.Carrera.projection = (function() {
    var isProjection = false;

    function toggle() {
        if (isProjection) {
            exit();
        } else {
            enter();
        }
    }

    function enter() {
        var el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
        document.body.classList.add('projection');
        isProjection = true;
        updateButton();
    }

    function exit() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        document.body.classList.remove('projection');
        isProjection = false;
        updateButton();
    }

    function updateButton() {
        var btn = document.getElementById('btn-projection');
        if (btn) {
            btn.innerHTML = isProjection ? '📺 Salir Proyección' : '📺 Modo Proyección';
        }
    }

    function init() {
        document.addEventListener('fullscreenchange', function() {
            if (!document.fullscreenElement) {
                document.body.classList.remove('projection');
                isProjection = false;
                updateButton();
            }
        });
    }

    function isActive() {
        return isProjection;
    }

    return {
        init: init,
        toggle: toggle,
        enter: enter,
        exit: exit,
        isActive: isActive
    };
})();
