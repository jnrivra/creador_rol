// Resolution Generator — produces 3 narrative resolution proposals per outcome type
// Each proposal is a short story beat that bridges the dice result to the next scene
window.Carrera = window.Carrera || {};

window.Carrera.resolutions = (function() {

    // Template pools per result type. {personajes} {opcion} {escena} are replaced at runtime.
    var templates = {
        critico: [
            '{personajes} lo logran de una forma ESPECTACULAR. {opcion} — ¡y el resultado supera todas las expectativas! El bosque entero parece celebrar con ellos.',
            '¡Increíble! {personajes} ejecutan su plan a la PERFECCIÓN. No solo consiguen {opcion}, sino que descubren algo extra que nadie esperaba.',
            'Con una habilidad asombrosa, {personajes} resuelven el desafío como verdaderos héroes. {opcion} — ¡y lo hacen parecer fácil!',
            '{personajes} trabajan en equipo de una forma BRILLANTE. El plan funciona incluso mejor de lo esperado: {opcion}. ¡Los animales del bosque los miran con admiración!',
            '¡MAGISTRAL! {personajes} no solo lo logran, sino que lo hacen con estilo. {opcion} — y dejan una marca que el bosque recordará.',
            'Como si el destino estuviera de su lado, {personajes} consiguen {opcion} sin un solo tropiezo. ¡Hasta las ardillas aplauden!',
            '{personajes} demuestran por qué son las mejores Bestias del bosque. {opcion} — el resultado es tan perfecto que parece magia.'
        ],
        exito: [
            '{personajes} lo consiguen. {opcion} — con esfuerzo, pero lo logran. Pueden continuar su camino con confianza.',
            'Después de un momento de tensión, {personajes} logran {opcion}. ¡Bien hecho! El camino sigue adelante.',
            '{personajes} encuentran la forma. No fue fácil, pero {opcion} — y eso es lo que importa.',
            'Con determinación, {personajes} superan el obstáculo. {opcion}. Un paso más cerca del tesoro.',
            '{personajes} respiran aliviados — ¡funcionó! {opcion}. El bosque les abre el siguiente camino.',
            'El plan funciona. {personajes} consiguen {opcion} y pueden seguir adelante con ánimo renovado.',
            'Paso a paso, {personajes} logran lo que se propusieron. {opcion} — ahora, a por lo siguiente.'
        ],
        complicacion: [
            '{personajes} lo consiguen... más o menos. {opcion}, pero algo sale mal en el proceso. El reloj avanza y la presión aumenta.',
            'Funciona, pero con un coste. {personajes} logran {opcion}, aunque no sin consecuencias. Algo cruje en el bosque...',
            '{personajes} avanzan, pero no sin problemas. {opcion} — sin embargo, el esfuerzo les ha costado tiempo precioso.',
            'Un éxito agridulce: {personajes} consiguen {opcion}, pero despiertan algo que hubieran preferido no molestar.',
            'Lo logran por los pelos. {personajes} consiguen {opcion}, pero el camino se ha vuelto un poco más difícil.',
            '{personajes} se las arreglan para {opcion}, pero la situación se complica. El reloj no perdona.',
            'Medio éxito, medio desastre. {personajes} logran {opcion}, pero el precio es más alto de lo esperado.'
        ],
        juerga: [
            '¡UPS! {personajes} intentan {opcion} pero todo sale al revés de una forma muy graciosa. Al menos, se ríen mucho.',
            '¡PLAF! El intento de {personajes} de {opcion} se convierte en un caos absoluto. ¡Pero qué divertido!',
            '¡Ay, ay, ay! {personajes} fallan estrepitosamente al intentar {opcion}. El bosque entero contiene la risa.',
            'Nada sale como estaba planeado. {personajes} intentan {opcion} pero acaban en un lío monumental. ¡Al menos es una historia para contar!',
            '¡Menudo desastre! {personajes} hacen exactamente lo contrario de lo que deberían. {opcion}? Más bien ¡{opcion} al revés!',
            '¡Catástrofe cómica! {personajes} se enredan intentando {opcion}. Todo sale mal, pero de una forma tan absurda que es imposible no reírse.',
            'El plan de {personajes} era brillante... en teoría. En la práctica, {opcion} se convierte en el momento más gracioso de la aventura.'
        ]
    };

    // Build a description of the team (names)
    function getPersonajes() {
        var team = window.Carrera.characters ? window.Carrera.characters.getTeam() : [];
        if (!team || team.length === 0) return 'Las Bestias';
        var names = team.map(function(p) { return p.nombre; });
        if (names.length === 1) return names[0];
        if (names.length === 2) return names[0] + ' y ' + names[1];
        return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
    }

    // Extract a short action description from the option text
    function getAccion(opcion) {
        var texto = opcion.texto || opcion.descripcion || '';
        // Lowercase first letter for natural embedding
        if (texto.length > 0) {
            texto = texto.charAt(0).toLowerCase() + texto.slice(1);
        }
        // Trim trailing period
        if (texto.endsWith('.')) texto = texto.slice(0, -1);
        return texto;
    }

    // Pick N random unique items from an array
    function pickRandom(arr, n) {
        var shuffled = arr.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = tmp;
        }
        return shuffled.slice(0, Math.min(n, shuffled.length));
    }

    /**
     * Generate 3 resolution proposals
     * @param {string} tipo - 'critico'|'exito'|'complicacion'|'juerga'
     * @param {object} opcion - the scene option object
     * @param {string} originalText - the hardcoded text from scenes.js (always included as option 1)
     * @returns {string[]} array of 3 narrative texts
     */
    function generate(tipo, opcion, originalText) {
        var pool = templates[tipo] || templates.exito;
        var personajes = getPersonajes();
        var accion = getAccion(opcion);

        var picked = pickRandom(pool, 2);
        var generated = picked.map(function(tpl) {
            return tpl
                .replace(/\{personajes\}/g, personajes)
                .replace(/\{opcion\}/g, accion)
                .replace(/\{escena\}/g, opcion.escenaTitulo || '');
        });

        // Original text from scenes.js is always the first option
        var results = [originalText];
        generated.forEach(function(g) { results.push(g); });

        return results;
    }

    /**
     * Regenerate — get 3 completely new proposals (including shuffled original position)
     */
    function regenerate(tipo, opcion, originalText) {
        var pool = templates[tipo] || templates.exito;
        var personajes = getPersonajes();
        var accion = getAccion(opcion);

        var picked = pickRandom(pool, 3);
        var results = picked.map(function(tpl) {
            return tpl
                .replace(/\{personajes\}/g, personajes)
                .replace(/\{opcion\}/g, accion)
                .replace(/\{escena\}/g, opcion.escenaTitulo || '');
        });

        return results;
    }

    return {
        generate: generate,
        regenerate: regenerate
    };
})();
