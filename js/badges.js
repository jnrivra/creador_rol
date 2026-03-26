// Motor de Deteccion de Badges
window.Carrera = window.Carrera || {};

window.Carrera.badges = (function() {

    // Check all badges after an event, returns array of newly earned badges
    function checkBadges(campaign, context) {
        var newBadges = [];
        var defs = window.Carrera.badgeDefs || [];
        var earned = campaign.badgesGlobales || [];

        defs.forEach(function(badge) {
            if (earned.indexOf(badge.id) !== -1) return; // Already earned
            if (checkCondition(badge.id, campaign, context)) {
                earned.push(badge.id);
                newBadges.push(badge);
            }
        });

        campaign.badgesGlobales = earned;
        return newBadges;
    }

    function checkCondition(badgeId, campaign, ctx) {
        var stats = campaign.stats || {};
        var completed = campaign.aventurasCompletadas || [];
        var equipo = campaign.equipo || [];

        switch (badgeId) {
            // AVENTURA
            case 'primera_aventura':
                return completed.length >= 1;
            case 'tesoro_titanes':
                return completed.some(function(a) { return a.adventureId === 'tesoro-titanes'; });
            case 'bosque_sombras':
                return completed.some(function(a) { return a.adventureId === 'bosque-sombras'; });
            case 'veterano':
                return completed.length >= 5;
            case 'todas_aventuras': {
                var registry = window.Carrera.adventureRegistry;
                if (!registry) return false;
                var allIds = registry.list().map(function(a) { return a.id; });
                return allIds.every(function(id) {
                    return completed.some(function(c) { return c.adventureId === id; });
                });
            }

            // DADOS
            case 'primer_critico':
                return stats.criticosTotales >= 1;
            case 'triple_estrella':
                return ctx && ctx.criticosAventura >= 3;
            case 'sin_complicaciones':
                return ctx && ctx.adventureComplete && ctx.complicacionesAventura === 0;
            case 'corona_oro':
                return stats.criticosTotales >= 10;
            case 'racha_exitos':
                return ctx && ctx.rachaExitos >= 3;
            case 'suertudo':
                return ctx && ctx.primeraTiradaCritico;
            case 'dado_maestro':
                return stats.tiradas >= 50;

            // EQUIPO
            case 'manada_completa':
                return equipo.length >= 4;
            case 'duo_dinamico':
                return ctx && ctx.adventureComplete && equipo.length === 2;
            case 'coleccionista': {
                var uniqueIds = [];
                completed.forEach(function(a) {
                    if (a.equipoIds) {
                        a.equipoIds.forEach(function(id) {
                            if (uniqueIds.indexOf(id) === -1) uniqueIds.push(id);
                        });
                    }
                });
                // Also count current team
                equipo.forEach(function(p) {
                    if (uniqueIds.indexOf(p.id) === -1) uniqueIds.push(p.id);
                });
                return uniqueIds.length >= 6;
            }
            case 'poderes_desatados':
                return ctx && ctx.habilidadesUsadas >= 3;
            case 'equipo_nivel5':
                return equipo.length > 0 && equipo.every(function(p) { return (p.level || 1) >= 5; });

            // RELOJ
            case 'reloj_congelado':
                return ctx && ctx.adventureComplete && ctx.relojTotal === 0;
            case 'victoria_agotada':
                return ctx && ctx.adventureComplete && ctx.relojExhausted;
            case 'resistencia':
                return stats.vecesRelojLleno >= 3;

            // SECRETOS
            case 'amigo_tejon':
                return ctx && ctx.flags && ctx.flags.ayudaTejon;
            case 'amiga_rana':
                return ctx && ctx.flags && ctx.flags.amigaRana;
            case 'detective':
                return ctx && ctx.flags && ctx.flags.pistaExtra;
            case 'primer_objeto':
                return equipo.some(function(p) { return p.inventory && p.inventory.length > 0; });
            case 'nivel_maximo':
                return equipo.some(function(p) { return (p.level || 1) >= 7; });
            case 'bellota_regalo':
                return ctx && ctx.flags && ctx.flags.bellotaRegalo;
            case 'mapas_tunel':
                return ctx && ctx.flags && ctx.flags.mapasTunel;
            case 'juerga_coleccion':
                return stats.juergasTotales >= 5;
            case 'inventario_lleno':
                return equipo.some(function(p) {
                    var maxSlots = (p.level || 1) >= 5 ? 4 : 3;
                    return p.inventory && p.inventory.length >= maxSlots;
                });
            case 'replay_master': {
                var adventureCount = {};
                completed.forEach(function(a) {
                    adventureCount[a.adventureId] = (adventureCount[a.adventureId] || 0) + 1;
                });
                return Object.keys(adventureCount).some(function(k) { return adventureCount[k] >= 2; });
            }

            default:
                return false;
        }
    }

    function getBadgeDef(badgeId) {
        var defs = window.Carrera.badgeDefs || [];
        for (var i = 0; i < defs.length; i++) {
            if (defs[i].id === badgeId) return defs[i];
        }
        return null;
    }

    function getEarnedBadges(campaign) {
        var earned = campaign.badgesGlobales || [];
        return earned.map(function(id) { return getBadgeDef(id); }).filter(Boolean);
    }

    function getAllBadges() {
        return window.Carrera.badgeDefs || [];
    }

    return {
        checkBadges: checkBadges,
        getBadgeDef: getBadgeDef,
        getEarnedBadges: getEarnedBadges,
        getAllBadges: getAllBadges
    };
})();
