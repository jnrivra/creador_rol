// Motor de Loot - Generacion y gestion de items
window.Carrera = window.Carrera || {};

window.Carrera.loot = (function() {
    var MAX_INVENTORY = 3;
    var MAX_INVENTORY_LEVEL5 = 4;

    function getMaxInventory(player) {
        return (player.level || 1) >= 5 ? MAX_INVENTORY_LEVEL5 : MAX_INVENTORY;
    }

    // Generate loot drops for end of adventure
    function generateLoot(numItems) {
        numItems = numItems || 2;
        var items = window.Carrera.itemDefs || [];
        var drops = [];

        for (var i = 0; i < numItems; i++) {
            var item = weightedRandom(items);
            if (item) {
                drops.push(JSON.parse(JSON.stringify(item)));
            }
        }
        return drops;
    }

    function weightedRandom(items) {
        var totalWeight = 0;
        items.forEach(function(item) { totalWeight += (item.pesoLoot || 1); });
        var rand = Math.random() * totalWeight;
        var cumulative = 0;
        for (var i = 0; i < items.length; i++) {
            cumulative += (items[i].pesoLoot || 1);
            if (rand <= cumulative) return items[i];
        }
        return items[items.length - 1];
    }

    // Add item to player inventory, returns true if added
    function addItem(player, item) {
        if (!player.inventory) player.inventory = [];
        var max = getMaxInventory(player);
        if (player.inventory.length >= max) return false;
        player.inventory.push({
            id: item.id,
            nombre: item.nombre,
            emoji: item.emoji,
            tipo: item.tipo,
            rareza: item.rareza,
            descripcion: item.descripcion,
            efecto: item.efecto
        });
        return true;
    }

    // Remove item from player inventory by index
    function removeItem(player, index) {
        if (!player.inventory) return null;
        if (index < 0 || index >= player.inventory.length) return null;
        return player.inventory.splice(index, 1)[0];
    }

    // Use a consumible item, returns the item removed or null
    function useItem(player, itemId) {
        if (!player.inventory) return null;
        for (var i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].id === itemId && player.inventory[i].tipo === 'consumible') {
                return player.inventory.splice(i, 1)[0];
            }
        }
        return null;
    }

    // Check if player has a permanent item with a given effect
    function hasPermanentEffect(player, efecto) {
        if (!player.inventory) return false;
        return player.inventory.some(function(item) {
            return item.tipo === 'permanente' && item.efecto === efecto;
        });
    }

    // Get roll bonus from permanent items
    function getRollBonus(player) {
        var bonus = 0;
        if (!player.inventory) return bonus;
        player.inventory.forEach(function(item) {
            if (item.tipo === 'permanente' && item.efecto === 'roll_bonus_1') bonus += 1;
        });
        return bonus;
    }

    // Get difficulty reduction from permanent items
    function getDifficultyReduction(player) {
        var reduction = 0;
        if (!player.inventory) return reduction;
        player.inventory.forEach(function(item) {
            if (item.tipo === 'permanente' && item.efecto === 'difficulty_minus_1') reduction += 1;
        });
        return reduction;
    }

    function getItemDef(itemId) {
        var items = window.Carrera.itemDefs || [];
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === itemId) return items[i];
        }
        return null;
    }

    function getRarezaColor(rareza) {
        var colors = {
            comun: '#86efac',
            raro: '#93c5fd',
            legendario: '#fde047'
        };
        return colors[rareza] || '#fff';
    }

    function getRarezaLabel(rareza) {
        var labels = { comun: 'Común', raro: 'Raro', legendario: 'Legendario' };
        return labels[rareza] || rareza;
    }

    return {
        generateLoot: generateLoot,
        addItem: addItem,
        removeItem: removeItem,
        useItem: useItem,
        hasPermanentEffect: hasPermanentEffect,
        getRollBonus: getRollBonus,
        getDifficultyReduction: getDifficultyReduction,
        getItemDef: getItemDef,
        getMaxInventory: getMaxInventory,
        getRarezaColor: getRarezaColor,
        getRarezaLabel: getRarezaLabel
    };
})();
