// Image Loader — preloads scene backgrounds & character portraits
// Falls back gracefully when images don't exist (file:// friendly)
window.Carrera = window.Carrera || {};

window.Carrera.images = (function() {
    var basePath = 'assets/';

    // Scene background mappings: CSS class → image file
    var sceneMap = {
        'bg-forest-clearing': 'scenes/forest.png',
        'bg-river':           'scenes/river.png',
        'bg-tunnel':          'scenes/tunnel.png',
        'bg-den':             'scenes/den.png',
        'bg-treasure':        'scenes/treasure.png',
        'bg-victory':         'scenes/victory.png'
    };

    // Character portrait mappings: id → image file
    var characterMap = {
        'guepardo': 'characters/guepardo.png',
        'pantera':  'characters/pantera.png',
        'zorro':    'characters/zorro.png',
        'buho':     'characters/buho.png',
        'conejo':   'characters/conejo.png',
        'nutria':   'characters/nutria.png',
        'erizo':    'characters/erizo.png',
        'ardilla':  'characters/ardilla.png'
    };

    // Cache: key → true (loaded) or false (failed/missing)
    var cache = {};

    function preloadImage(src) {
        return new Promise(function(resolve) {
            var img = new Image();
            img.onload = function() {
                cache[src] = true;
                resolve(true);
            };
            img.onerror = function() {
                cache[src] = false;
                resolve(false);
            };
            img.src = src;
        });
    }

    function preloadAll() {
        var promises = [];
        var key;
        for (key in sceneMap) {
            promises.push(preloadImage(basePath + sceneMap[key]));
        }
        for (key in characterMap) {
            promises.push(preloadImage(basePath + characterMap[key]));
        }
        return Promise.all(promises);
    }

    function getSceneSrc(bgClass) {
        var file = sceneMap[bgClass];
        if (!file) return null;
        var src = basePath + file;
        return cache[src] ? src : null;
    }

    function getCharacterSrc(id) {
        var file = characterMap[id];
        if (!file) return null;
        var src = basePath + file;
        return cache[src] ? src : null;
    }

    function isAvailable(key) {
        // Check both scene and character
        var src = null;
        if (sceneMap[key]) src = basePath + sceneMap[key];
        else if (characterMap[key]) src = basePath + characterMap[key];
        return src ? (cache[src] === true) : false;
    }

    return {
        preloadAll: preloadAll,
        getSceneSrc: getSceneSrc,
        getCharacterSrc: getCharacterSrc,
        isAvailable: isAvailable
    };
})();
