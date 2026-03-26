// Definiciones de Items/Loot
window.Carrera = window.Carrera || {};

window.Carrera.itemDefs = [
    // === CONSUMIBLES ===
    { id: 'bellota_magica', nombre: 'Bellota Mágica', emoji: '🌰', tipo: 'consumible', rareza: 'comun',
      descripcion: 'Permite repetir una tirada de dado', efecto: 'reroll',
      pesoLoot: 20 },
    { id: 'miel_curativa', nombre: 'Miel Curativa', emoji: '🍯', tipo: 'consumible', rareza: 'comun',
      descripcion: 'Reduce el reloj en 1 segmento', efecto: 'clock_minus_1',
      pesoLoot: 20 },
    { id: 'pluma_viento', nombre: 'Pluma del Viento', emoji: '🪶', tipo: 'consumible', rareza: 'raro',
      descripcion: 'Otorga ventaja automática en la siguiente tirada', efecto: 'auto_advantage',
      pesoLoot: 10 },
    { id: 'polvo_estrellas', nombre: 'Polvo de Estrellas', emoji: '✨', tipo: 'consumible', rareza: 'raro',
      descripcion: 'Convierte una complicación en éxito', efecto: 'upgrade_result',
      pesoLoot: 8 },
    { id: 'fruta_titan', nombre: 'Fruta de Titán', emoji: '🍎', tipo: 'consumible', rareza: 'legendario',
      descripcion: 'Éxito automático en cualquier tirada', efecto: 'auto_success',
      pesoLoot: 2 },

    // === PERMANENTES ===
    { id: 'amuleto_suerte', nombre: 'Amuleto de Suerte', emoji: '🔮', tipo: 'permanente', rareza: 'raro',
      descripcion: '+1 a todas las tiradas', efecto: 'roll_bonus_1',
      pesoLoot: 6 },
    { id: 'mapa_secreto', nombre: 'Mapa Secreto', emoji: '🗺️', tipo: 'permanente', rareza: 'raro',
      descripcion: 'Revela opciones ocultas en las escenas', efecto: 'reveal_options',
      pesoLoot: 5 },
    { id: 'brujula_titan', nombre: 'Brújula de Titán', emoji: '🧭', tipo: 'permanente', rareza: 'legendario',
      descripcion: 'Reduce la dificultad base en 1', efecto: 'difficulty_minus_1',
      pesoLoot: 2 },

    // === COSMÉTICOS ===
    { id: 'corona_hojas', nombre: 'Corona de Hojas', emoji: '🌿', tipo: 'cosmetico', rareza: 'comun',
      descripcion: 'Una hermosa corona tejida con hojas del bosque', efecto: 'cosmetic_crown',
      pesoLoot: 15 },
    { id: 'capa_estrellas', nombre: 'Capa de Estrellas', emoji: '🌌', tipo: 'cosmetico', rareza: 'raro',
      descripcion: 'Una capa que brilla con la luz de las estrellas', efecto: 'cosmetic_cape',
      pesoLoot: 7 },
    { id: 'aura_dorada', nombre: 'Aura Dorada', emoji: '💫', tipo: 'cosmetico', rareza: 'legendario',
      descripcion: 'Un brillo dorado que rodea al personaje', efecto: 'cosmetic_aura',
      pesoLoot: 2 },
    { id: 'collar_flores', nombre: 'Collar de Flores', emoji: '🌸', tipo: 'cosmetico', rareza: 'comun',
      descripcion: 'Un collar colorido hecho con flores del prado', efecto: 'cosmetic_necklace',
      pesoLoot: 15 },
    { id: 'gafas_sabio', nombre: 'Gafas del Sabio', emoji: '🤓', tipo: 'cosmetico', rareza: 'raro',
      descripcion: 'Unas gafas que hacen ver todo más interesante', efecto: 'cosmetic_glasses',
      pesoLoot: 6 },
    { id: 'botas_rapidas', nombre: 'Botas Rápidas', emoji: '👟', tipo: 'cosmetico', rareza: 'comun',
      descripcion: 'Unas botas que hacen sentir más veloz', efecto: 'cosmetic_boots',
      pesoLoot: 12 }
];
