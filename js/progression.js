// Sistema de Progresion - XP y Niveles
window.Carrera = window.Carrera || {};

window.Carrera.progression = (function() {

    var XP_TABLE = {
        completar_escena: 10,
        critico: 5,
        exito: 2,
        complicacion: 0,
        juerga: 3,
        usar_habilidad: 3,
        completar_aventura: 20,
        reloj_nunca_lleno: 10
    };

    var LEVELS = [
        { level: 1, xpTotal: 0,   titulo: 'Explorador Novato',     desbloqueo: 'Estado inicial' },
        { level: 2, xpTotal: 50,  titulo: 'Rastreador',            desbloqueo: 'Badge cosmetico' },
        { level: 3, xpTotal: 120, titulo: 'Aventurero',            desbloqueo: 'Nueva herramienta' },
        { level: 4, xpTotal: 200, titulo: 'Guardian del Bosque',   desbloqueo: 'Habilidad se recarga' },
        { level: 5, xpTotal: 300, titulo: 'Heroe de Bristley',     desbloqueo: '+1 slot inventario' },
        { level: 6, xpTotal: 420, titulo: 'Campeon Legendario',    desbloqueo: 'Segunda habilidad' },
        { level: 7, xpTotal: 560, titulo: 'Titan Honorario',       desbloqueo: 'Marco dorado, particulas' }
    ];

    function getLevelForXP(xp) {
        var lvl = LEVELS[0];
        for (var i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].xpTotal) {
                lvl = LEVELS[i];
                break;
            }
        }
        return lvl;
    }

    function getNextLevel(currentLevel) {
        for (var i = 0; i < LEVELS.length; i++) {
            if (LEVELS[i].level === currentLevel + 1) return LEVELS[i];
        }
        return null;
    }

    function getXPProgress(xp) {
        var current = getLevelForXP(xp);
        var next = getNextLevel(current.level);
        if (!next) return { current: current, next: null, progress: 1, xpInLevel: 0, xpNeeded: 0 };

        var xpInLevel = xp - current.xpTotal;
        var xpNeeded = next.xpTotal - current.xpTotal;
        return {
            current: current,
            next: next,
            progress: xpInLevel / xpNeeded,
            xpInLevel: xpInLevel,
            xpNeeded: xpNeeded
        };
    }

    // Award XP to a specific player in campaign, returns { awarded, levelUp, newLevel }
    function awardXP(player, event) {
        var amount = XP_TABLE[event] || 0;
        if (amount === 0) return { awarded: 0, levelUp: false };

        var oldLevel = player.level || 1;
        player.xp = (player.xp || 0) + amount;
        var newLevelData = getLevelForXP(player.xp);
        player.level = newLevelData.level;

        return {
            awarded: amount,
            levelUp: newLevelData.level > oldLevel,
            newLevel: newLevelData,
            oldLevel: oldLevel
        };
    }

    // Award XP to all team members
    function awardTeamXP(campaign, event) {
        var results = [];
        campaign.equipo.forEach(function(player) {
            var result = awardXP(player, event);
            result.player = player;
            results.push(result);
        });
        return results;
    }

    // Award XP to a specific player by id
    function awardPlayerXP(campaign, playerId, event) {
        for (var i = 0; i < campaign.equipo.length; i++) {
            if (campaign.equipo[i].id === playerId) {
                var result = awardXP(campaign.equipo[i], event);
                result.player = campaign.equipo[i];
                return result;
            }
        }
        return null;
    }

    function getLevels() {
        return LEVELS;
    }

    function getXPTable() {
        return XP_TABLE;
    }

    return {
        awardXP: awardXP,
        awardTeamXP: awardTeamXP,
        awardPlayerXP: awardPlayerXP,
        getLevelForXP: getLevelForXP,
        getNextLevel: getNextLevel,
        getXPProgress: getXPProgress,
        getLevels: getLevels,
        getXPTable: getXPTable
    };
})();
