// Definiciones de Badges/Logros - 30 badges
window.Carrera = window.Carrera || {};

window.Carrera.badgeDefs = [
    // === AVENTURA (5) ===
    { id: 'primera_aventura', nombre: 'Primera Aventura', emoji: '🌟', categoria: 'aventura',
      descripcion: 'Completa tu primera aventura', secreto: false },
    { id: 'tesoro_titanes', nombre: 'Buscador de Tesoros', emoji: '💎', categoria: 'aventura',
      descripcion: 'Completa "La Búsqueda del Tesoro de los Titanes"', secreto: false },
    { id: 'bosque_sombras', nombre: 'Valiente en la Oscuridad', emoji: '🌑', categoria: 'aventura',
      descripcion: 'Completa "El Bosque de las Sombras"', secreto: false },
    { id: 'veterano', nombre: 'Veterano del Bosque', emoji: '🏅', categoria: 'aventura',
      descripcion: 'Completa 5 aventuras', secreto: false },
    { id: 'todas_aventuras', nombre: 'Explorador Total', emoji: '🗺️', categoria: 'aventura',
      descripcion: 'Completa todas las aventuras disponibles', secreto: false },

    // === DADOS (7) ===
    { id: 'primer_critico', nombre: 'Primer Crítico', emoji: '⭐', categoria: 'dados',
      descripcion: 'Consigue tu primer crítico', secreto: false },
    { id: 'triple_estrella', nombre: 'Triple Estrella', emoji: '🌟', categoria: 'dados',
      descripcion: '3 críticos en una aventura', secreto: false },
    { id: 'sin_complicaciones', nombre: 'Perfeccionista', emoji: '✅', categoria: 'dados',
      descripcion: 'Completa una aventura sin ninguna complicación', secreto: false },
    { id: 'corona_oro', nombre: 'Corona de Oro', emoji: '👑', categoria: 'dados',
      descripcion: '10 críticos totales en la campaña', secreto: false },
    { id: 'racha_exitos', nombre: 'Racha Imparable', emoji: '🔥', categoria: 'dados',
      descripcion: '3 éxitos o críticos seguidos en una aventura', secreto: false },
    { id: 'suertudo', nombre: 'Suertudo', emoji: '🍀', categoria: 'dados',
      descripcion: 'Consigue crítico en tu primera tirada de una aventura', secreto: false },
    { id: 'dado_maestro', nombre: 'Maestro de Dados', emoji: '🎲', categoria: 'dados',
      descripcion: '50 tiradas totales en la campaña', secreto: false },

    // === EQUIPO (5) ===
    { id: 'manada_completa', nombre: 'Manada Completa', emoji: '🐾', categoria: 'equipo',
      descripcion: 'Juega con 4 o más personajes', secreto: false },
    { id: 'duo_dinamico', nombre: 'Dúo Dinámico', emoji: '🤝', categoria: 'equipo',
      descripcion: 'Completa una aventura con solo 2 personajes', secreto: false },
    { id: 'coleccionista', nombre: 'Coleccionista', emoji: '📖', categoria: 'equipo',
      descripcion: 'Juega con 6 personajes diferentes a lo largo de la campaña', secreto: false },
    { id: 'poderes_desatados', nombre: 'Poderes Desatados', emoji: '⚡', categoria: 'equipo',
      descripcion: 'Usa 3 habilidades en una sola aventura', secreto: false },
    { id: 'equipo_nivel5', nombre: 'Equipo de Élite', emoji: '🏆', categoria: 'equipo',
      descripcion: 'Todo el equipo alcanza nivel 5 o más', secreto: false },

    // === RELOJ (3) ===
    { id: 'reloj_congelado', nombre: 'Reloj Congelado', emoji: '❄️', categoria: 'reloj',
      descripcion: 'Completa una aventura con el reloj en 0', secreto: false },
    { id: 'victoria_agotada', nombre: 'Victoria Agotada', emoji: '😴', categoria: 'reloj',
      descripcion: 'Gana con el reloj completamente lleno', secreto: false },
    { id: 'resistencia', nombre: 'Resistencia', emoji: '💪', categoria: 'reloj',
      descripcion: 'El reloj se llenó 3 veces en una campaña', secreto: false },

    // === SECRETOS (10) ===
    { id: 'amigo_tejon', nombre: 'Amigo de Don Gruñón', emoji: '🦡', categoria: 'secretos',
      descripcion: 'Haz que Don Gruñón te ayude', secreto: true },
    { id: 'amiga_rana', nombre: 'La Rana Guía', emoji: '🐸', categoria: 'secretos',
      descripcion: 'Conoce a la rana del túnel', secreto: true },
    { id: 'detective', nombre: 'Detective del Bosque', emoji: '🔍', categoria: 'secretos',
      descripcion: 'Encuentra la pista extra en la escena 1', secreto: true },
    { id: 'primer_objeto', nombre: 'Primer Tesoro', emoji: '🎁', categoria: 'secretos',
      descripcion: 'Consigue tu primer objeto', secreto: true },
    { id: 'nivel_maximo', nombre: 'Titán Honorario', emoji: '👑', categoria: 'secretos',
      descripcion: 'Alcanza el nivel máximo con un personaje', secreto: true },
    { id: 'bellota_regalo', nombre: 'Regalo de la Ardilla', emoji: '🌰', categoria: 'secretos',
      descripcion: 'Recibe la bellota de regalo', secreto: true },
    { id: 'mapas_tunel', nombre: 'Cartógrafo Antiguo', emoji: '🗺️', categoria: 'secretos',
      descripcion: 'Descubre los mapas de los Titanes en el túnel', secreto: true },
    { id: 'juerga_coleccion', nombre: 'Rey del ¡Oh No!', emoji: '🎪', categoria: 'secretos',
      descripcion: 'Consigue 5 ¡Oh No! en una campaña', secreto: true },
    { id: 'inventario_lleno', nombre: 'Mochila Llena', emoji: '🎒', categoria: 'secretos',
      descripcion: 'Llena el inventario de un personaje', secreto: true },
    { id: 'replay_master', nombre: 'Una Vez Más', emoji: '🔄', categoria: 'secretos',
      descripcion: 'Rejuega una aventura ya completada', secreto: true }
];
