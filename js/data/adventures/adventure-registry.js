// Registro de Aventuras - Multi-aventura
window.Carrera = window.Carrera || {};

window.Carrera.adventureRegistry = (function() {
    var adventures = {};

    function register(adventure) {
        adventures[adventure.id] = adventure;
    }

    function get(id) {
        return adventures[id] || null;
    }

    function list() {
        return Object.keys(adventures).map(function(id) {
            var a = adventures[id];
            return {
                id: a.id,
                titulo: a.titulo,
                emoji: a.emoji,
                descripcion: a.descripcion,
                dificultad: a.dificultad,
                nivelRecomendado: a.nivelRecomendado,
                duracion: a.duracion,
                totalEscenas: a.totalEscenas
            };
        });
    }

    function getScenes(adventureId) {
        var adv = adventures[adventureId];
        return adv ? adv.scenes : null;
    }

    function getJuergas(adventureId) {
        var adv = adventures[adventureId];
        return adv ? (adv.juergasGenericas || []) : [];
    }

    return {
        register: register,
        get: get,
        list: list,
        getScenes: getScenes,
        getJuergas: getJuergas
    };
})();
