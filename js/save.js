// Sistema de Guardado - Persistencia de Campañas
window.Carrera = window.Carrera || {};

window.Carrera.save = (function() {
    var CAMPAIGNS_KEY = 'carrera-campaigns';
    var CAMPAIGN_PREFIX = 'carrera-campaign-';
    var MAX_CAMPAIGNS = 5;

    function generateId() {
        return 'camp_' + Date.now();
    }

    function listCampaigns() {
        try {
            var list = JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');
            return list.map(function(meta) {
                return meta;
            });
        } catch (e) {
            return [];
        }
    }

    function loadCampaign(id) {
        try {
            var data = JSON.parse(localStorage.getItem(CAMPAIGN_PREFIX + id));
            return data;
        } catch (e) {
            return null;
        }
    }

    function saveCampaign(data) {
        if (!data || !data.id) return false;
        try {
            // Save full campaign data
            localStorage.setItem(CAMPAIGN_PREFIX + data.id, JSON.stringify(data));

            // Update campaign list metadata
            var list = JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');
            var found = false;
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === data.id) {
                    list[i] = buildMeta(data);
                    found = true;
                    break;
                }
            }
            if (!found) {
                list.push(buildMeta(data));
            }
            localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
            return true;
        } catch (e) {
            return false;
        }
    }

    function deleteCampaign(id) {
        try {
            localStorage.removeItem(CAMPAIGN_PREFIX + id);
            var list = JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');
            list = list.filter(function(m) { return m.id !== id; });
            localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
            return true;
        } catch (e) {
            return false;
        }
    }

    function createCampaign(nombre, equipo) {
        var list = listCampaigns();
        if (list.length >= MAX_CAMPAIGNS) return null;

        var id = generateId();
        var team = equipo.map(function(p) {
            var clone = JSON.parse(JSON.stringify(p));
            clone.xp = 0;
            clone.level = 1;
            clone.badges = [];
            clone.inventory = [];
            return clone;
        });

        var campaign = {
            id: id,
            nombre: nombre,
            equipo: team,
            aventurasCompletadas: [],
            badgesGlobales: [],
            stats: {
                partidasJugadas: 0,
                escenasCompletadas: 0,
                criticosTotales: 0,
                exitosTotales: 0,
                complicacionesTotales: 0,
                juergasTotales: 0,
                tiradas: 0
            },
            fechaCreacion: new Date().toISOString(),
            fechaUltimaPartida: new Date().toISOString(),
            aventuraActual: null
        };

        saveCampaign(campaign);
        return campaign;
    }

    function buildMeta(data) {
        var avgLevel = 0;
        if (data.equipo && data.equipo.length > 0) {
            var sum = 0;
            data.equipo.forEach(function(p) { sum += (p.level || 1); });
            avgLevel = Math.round(sum / data.equipo.length);
        }
        return {
            id: data.id,
            nombre: data.nombre,
            equipo: data.equipo.map(function(p) {
                return { id: p.id, emoji: p.emoji, nombre: p.nombre, color: p.color, level: p.level || 1 };
            }),
            nivelPromedio: avgLevel,
            partidasJugadas: data.stats ? data.stats.partidasJugadas : 0,
            fechaUltimaPartida: data.fechaUltimaPartida || data.fechaCreacion
        };
    }

    function canCreateNew() {
        return listCampaigns().length < MAX_CAMPAIGNS;
    }

    return {
        listCampaigns: listCampaigns,
        loadCampaign: loadCampaign,
        saveCampaign: saveCampaign,
        deleteCampaign: deleteCampaign,
        createCampaign: createCampaign,
        canCreateNew: canCreateNew
    };
})();
