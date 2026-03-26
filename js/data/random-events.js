// Pool de Eventos Aleatorios (15 eventos)
window.Carrera = window.Carrera || {};

window.Carrera.randomEventDefs = [
    // === ENCUENTROS (narrativa + reward) ===
    { id: 'ardilla_mensajera', tipo: 'encuentro', emoji: '🐿️',
      titulo: 'La Ardilla Mensajera',
      narrativa: 'Una ardilla agitada aparece con un mensaje atado a la cola: "¡Las Bestias van por buen camino!" Deja caer algo brillante antes de irse.',
      rewardType: 'xp', rewardAmount: 5 },

    { id: 'huellas_titan', tipo: 'encuentro', emoji: '👣',
      titulo: 'Huellas de Titán',
      narrativa: 'En el suelo hay unas huellas ENORMES. ¡Son de un Titán! Siguiéndolas un poco encuentran una marca en un árbol con un símbolo brillante.',
      rewardType: 'xp', rewardAmount: 5 },

    { id: 'hongo_brillante', tipo: 'encuentro', emoji: '🍄',
      titulo: 'El Hongo Brillante',
      narrativa: '¡Un hongo gigante que brilla con todos los colores del arcoíris! Al tocarlo, las Bestias sienten una energía mágica que las revitaliza.',
      rewardType: 'clock', rewardAmount: -1 },

    { id: 'mariposa_guia', tipo: 'encuentro', emoji: '🦋',
      titulo: 'La Mariposa Guía',
      narrativa: 'Una mariposa dorada vuela en círculos alrededor de las Bestias. Parece querer guiarlas... ¡las lleva por un atajo!',
      rewardType: 'xp', rewardAmount: 3 },

    { id: 'piedra_suerte', tipo: 'encuentro', emoji: '💎',
      titulo: 'La Piedra de la Suerte',
      narrativa: 'Entre las hojas, algo brilla. ¡Es una piedra con forma de estrella! Las Bestias la recogen y sienten que les traerá suerte.',
      rewardType: 'item_chance', rewardAmount: 1 },

    // === MINI-DESAFÍOS (tirada rápida) ===
    { id: 'puente_roto', tipo: 'desafio', emoji: '🌉',
      titulo: 'Puente Roto',
      narrativa: 'Un pequeño puente de madera cruza un arroyo, pero tiene tablas rotas. ¿Pueden cruzar?',
      dificultad: 8,
      tagsRelevantes: ['Equilibrio Perfecto', 'Ser Pequeño', 'Alas Silenciosas'],
      exitoTexto: '¡Las Bestias cruzan el puente con habilidad! Encuentran una bellota dorada al otro lado.',
      falloTexto: '¡CRACK! Una tabla se rompe y las Bestias caen al arroyo. ¡SPLASH! Están bien, pero un poco mojadas.',
      exitoReward: 'xp', exitoAmount: 5,
      falloReward: 'clock', falloAmount: 1 },

    { id: 'abeja_gigante', tipo: 'desafio', emoji: '🐝',
      titulo: 'La Abeja Gigante',
      narrativa: '¡BZZZZZ! ¡Una abeja del tamaño de un gato vuela hacia las Bestias! No parece contenta...',
      dificultad: 9,
      tagsRelevantes: ['Velocidad Relámpago', 'Sigilo de las Sombras', 'Moverse Como el Viento'],
      exitoTexto: '¡Las Bestias esquivan a la abeja con estilo! La abeja se aleja zumbando.',
      falloTexto: '¡La abeja las persigue por todo el claro! Corren en círculos hasta que la abeja se aburre.',
      exitoReward: 'xp', exitoAmount: 5,
      falloReward: 'clock', falloAmount: 1 },

    { id: 'viento_fuerte', tipo: 'desafio', emoji: '💨',
      titulo: 'Viento Fuerte',
      narrativa: '¡WOOOOSH! Un viento increíblemente fuerte sopla entre los árboles. ¡Las hojas vuelan por todas partes!',
      dificultad: 8,
      tagsRelevantes: ['Resistencia', 'Hacerse una Bola', 'Excavar Túneles'],
      exitoTexto: '¡Las Bestias se agarran fuerte y resisten el viento! Cuando para, el camino está despejado.',
      falloTexto: 'El viento las arrastra unos metros hacia atrás. ¡Vaya! Tardan un poco en retomar el camino.',
      exitoReward: 'xp', exitoAmount: 5,
      falloReward: 'clock', falloAmount: 1 },

    { id: 'trampa_hojas', tipo: 'desafio', emoji: '🕳️',
      titulo: 'Trampa de Hojas',
      narrativa: '¡Cuidado! Las hojas del suelo esconden un hoyo. ¿Lo detectan a tiempo?',
      dificultad: 9,
      tagsRelevantes: ['Olfato Rastreador', 'Visión de Águila', 'Ser Astuto'],
      exitoTexto: '¡Detectado! Las Bestias rodean la trampa con cuidado. ¡Bien observado!',
      falloTexto: '¡UPS! Una Bestia cae en el hoyo. No es profundo, pero les cuesta salir.',
      exitoReward: 'xp', exitoAmount: 5,
      falloReward: 'clock', falloAmount: 1 },

    { id: 'roca_resbaladiza', tipo: 'desafio', emoji: '🪨',
      titulo: 'Roca Resbaladiza',
      narrativa: 'Una roca enorme bloquea parcialmente el camino. Está cubierta de musgo resbaladizo.',
      dificultad: 8,
      tagsRelevantes: ['Trepar a Toda Velocidad', 'Manos Ágiles', 'Púas Protectoras'],
      exitoTexto: '¡Trepan la roca sin problemas! Desde arriba ven que el camino sigue adelante.',
      falloTexto: '¡Resbalan en el musgo! Tienen que dar un rodeo por el bosque.',
      exitoReward: 'xp', exitoAmount: 5,
      falloReward: 'clock', falloAmount: 1 },

    // === SOCIALES (roleplay) ===
    { id: 'familia_ratones', tipo: 'social', emoji: '🐭',
      titulo: 'Familia de Ratones',
      narrativa: '¡Una familia de ratones está de pícnic! "¡Hola, viajeras! ¿Quieren un trocito de queso?" Los ratoncitos miran a las Bestias con curiosidad.',
      rewardType: 'xp', rewardAmount: 3 },

    { id: 'tortuga_sabia', tipo: 'social', emoji: '🐢',
      titulo: 'La Tortuga Sabia',
      narrativa: 'Una tortuga MUY vieja descansa en una piedra. "Hmm... las he estado observando. Van bien, pero recuerden: la paciencia es tan importante como la velocidad."',
      rewardType: 'xp', rewardAmount: 5 },

    { id: 'mercader_errante', tipo: 'social', emoji: '🦝',
      titulo: 'El Mapache Mercader',
      narrativa: '¡Un mapache con un sombrero elegante y una mochila llena de cosas! "¡Psst! ¡Bestias! ¿Les interesa un cambio? Tengo cositas buenas..."',
      rewardType: 'item_chance', rewardAmount: 1 },

    { id: 'coro_pajaros', tipo: 'social', emoji: '🐦',
      titulo: 'Coro de Pájaros',
      narrativa: 'Un grupo de pájaros canta una canción preciosa desde las ramas. La melodía llena de energía a las Bestias.',
      rewardType: 'xp', rewardAmount: 3 }
];
