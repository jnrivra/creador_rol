// Escenas de la aventura "La Búsqueda del Tesoro de los Titanes"
window.Carrera = window.Carrera || {};

window.Carrera.scenes = {
    scene1: {
        id: 'scene1',
        titulo: 'El Mapa Misterioso',
        emoji: '🗺️',
        ambientPreset: 'forest',
        backgroundClass: 'bg-forest-clearing',
        narrativa: '¡Una mañana soleada en el Bosque de Bristley! Dos valientes Bestias encuentran un trozo de papel antiguo de los Titanes entre las raíces de un gran roble. Tiene dibujos extraños... ¡una flecha apunta hacia el río y hay una marca con forma de estrella!',
        notasGM: '• Lee con emoción, haz voces\n• Dibuja un mapa rápido en papel real y dáselo\n• Pregunta: "¿Qué creen que significa la estrella?"\n• Si dudan: "¡Parece que señala un camino!"\n• Haz sonidos de pájaros y viento\n• Tip: deja que lo examinen 1 min antes de opciones',
        opciones: [
            {
                id: '1a',
                texto: '¡Seguir la flecha hacia el río!',
                emoji: '🏃',
                requiereTirada: false,
                siguienteEscena: 'scene2',
                narrativaResultado: '¡Las Bestias corren emocionadas siguiendo la flecha del mapa! El sonido del agua se hace cada vez más fuerte...'
            },
            {
                id: '1b',
                texto: 'Buscar más pistas en los arbustos',
                emoji: '🔍',
                requiereTirada: true,
                dificultad: 8,
                tagsRelevantes: ['Olfato Rastreador', 'Visión de Águila', 'Ser Astuto', 'Orejas Giratorias'],
                siguienteEscena: 'scene2',
                resultados: {
                    critico: {
                        texto: '¡Increíble! Entre las hojas encuentran OTRA pieza del mapa con un dibujo de una llave escondida bajo una piedra. ¡Esta pista será muy útil después!',
                        reloj: 0,
                        flag: 'pistaExtra'
                    },
                    exito: {
                        texto: '¡Bien hecho! Encuentran marcas en los árboles que confirman el camino. También ven un dibujo de una llave. ¡Esto les ayudará más adelante!',
                        reloj: 0,
                        flag: 'pistaExtra'
                    },
                    complicacion: {
                        texto: 'Buscan y buscan pero solo encuentran hojas y bellotas. Han perdido algo de tiempo, pero al menos saben que el camino correcto es hacia el río.',
                        reloj: 1,
                        flag: null
                    },
                    juerga: {
                        texto: '¡Una ardilla traviesa sale de los arbustos, agarra el mapa y sale corriendo! Las Bestias la persiguen entre risas hasta que la ardilla se lo devuelve... ¡junto con una bellota de regalo!',
                        reloj: 1,
                        flag: 'bellotaRegalo'
                    }
                }
            }
        ]
    },

    scene2: {
        id: 'scene2',
        titulo: 'El Río Rugiente',
        emoji: '🌊',
        ambientPreset: 'river',
        backgroundClass: 'bg-river',
        narrativa: '¡Las Bestias llegan al río! El agua corre rápido entre piedras cubiertas de musgo verde y resbaladizo. Al otro lado, los árboles forman un túnel oscuro y misterioso. Hay piedras grandes para cruzar saltando, pero... ¡están muy resbaladizas!',
        notasGM: '• Haz sonido de agua con la boca: "shhhhhh"\n• Mueve las manos como olas\n• Nutria → recuérdales: "¡tú sabes nadar!"\n• Pregunta: "¿Cómo quieren cruzar?"\n• Si inventan algo creativo (ej: vine), dificultad -2\n• Juerga idea: caen al agua pero es divertido, no peligroso',
        opciones: [
            {
                id: '2a',
                texto: '¡Saltar por las piedras!',
                emoji: '🦘',
                requiereTirada: true,
                dificultad: 10,
                tagsRelevantes: ['Nadar como Pez', 'Equilibrio Perfecto', 'Ser Pequeño', 'Moverse Como el Viento', 'Patas Silenciosas'],
                siguienteEscena: 'scene3',
                resultados: {
                    critico: { texto: '¡Saltan de piedra en piedra con una gracia increíble! ¡Parecen bailarines! Cruzan el río sin mojarse ni un pelo.', reloj: 0, flag: null },
                    exito: { texto: '¡Lo logran! Con cuidado y concentración, saltan de piedra en piedra y llegan al otro lado. Solo se mojan un poquito las patas.', reloj: 0, flag: null },
                    complicacion: { texto: '¡Resbalón! Una piedra se mueve y las Bestias se mojan hasta la barriga. Cruzan, pero tardan un poco más de lo esperado secándose.', reloj: 1, flag: null },
                    juerga: { texto: '¡SPLASH! ¡Se resbalan y caen al río! Pero... ¡la corriente los lleva como en un tobogán acuático! "¡WIIIIIII!" gritan mientras se deslizan río abajo. Terminan al otro lado, empapados pero muertos de risa.', reloj: 1, flag: null }
                }
            },
            {
                id: '2b',
                texto: 'Buscar un tronco para hacer un puente',
                emoji: '🪵',
                requiereTirada: true,
                dificultad: 9,
                tagsRelevantes: ['Resistencia', 'Excavar Túneles', 'Trepar a Toda Velocidad', 'Cuerda de Enredadera', 'Manos Ágiles'],
                siguienteEscena: 'scene3',
                resultados: {
                    critico: { texto: '¡Encuentran el tronco perfecto! Lo colocan sobre el río y cruzan tranquilamente. ¡Incluso construyen una barandilla con ramas!', reloj: 0, flag: null },
                    exito: { texto: 'Encuentran un tronco caído y lo empujan hasta el río. ¡Es un puente perfecto! Cruzan con cuidado pero seguros.', reloj: 0, flag: null },
                    complicacion: { texto: 'El tronco es más pesado de lo que pensaban. Lo logran mover, pero les cuesta trabajo y pierden algo de tiempo.', reloj: 1, flag: null },
                    juerga: { texto: '¡El tronco rueda cuando están encima! Las Bestias hacen equilibrio como en un circo, moviendo las patitas a toda velocidad. ¡Parecen payasos del bosque! Pero logran cruzar entre carcajadas.', reloj: 1, flag: null }
                }
            }
        ]
    },

    scene3: {
        id: 'scene3',
        titulo: 'El Túnel de los Susurros',
        emoji: '🌑',
        ambientPreset: 'tunnel',
        backgroundClass: 'bg-tunnel',
        narrativa: '¡Dentro del túnel de ramas, todo está oscuro! Las hojas tapan la luz del sol. Se oyen susurros misteriosos... ¿son solo hojas movidas por el viento? ¿O algo más? De repente, ven algo brillar en la pared: ¡otra marca de los Titanes! Una mano con una flecha que apunta... ¡hacia abajo!',
        notasGM: '• BAJA LA VOZ para crear misterio\n• Susurra: "ssshhhh... ¿qué es eso?"\n• Si tienen pistaExtra: "¿Recuerdan la llave bajo la piedra?"\n• Haz que se ASUSTEN un poco (pero divertido)\n• Pantera/Búho brillan aquí → recuérdales visión nocturna\n• Idea extra: pídeles que cierren los ojos 5 segundos\n• Flecha abajo = buscar bajo tierra',
        opciones: [
            {
                id: '3a',
                texto: 'Avanzar con cuidado en la oscuridad',
                emoji: '👀',
                requiereTirada: true,
                dificultad: 11,
                tagsRelevantes: ['Ver en la Oscuridad', 'Sigilo de las Sombras', 'Pelaje Oscuro como la Noche', 'Alas Silenciosas', 'Sabiduría Antigua'],
                siguienteEscena: 'scene4',
                usaPistaExtra: true,
                resultados: {
                    critico: { texto: '¡Las Bestias avanzan como auténticos exploradores! Encuentran el camino perfecto entre las raíces y descubren una puerta secreta hecha de piedras. ¡Al otro lado hay una cueva!', reloj: 0, flag: null },
                    exito: { texto: 'Con paso firme, las Bestias atraviesan el túnel oscuro. Sus ojos se acostumbran a la oscuridad y encuentran la salida: ¡una cueva acogedora!', reloj: 0, flag: null },
                    complicacion: { texto: '¡Ay! Se tropiezan con raíces y se chocan entre ellas. "¡Perdón!" "¡Mi cola!" Avanzan a tientas, pero les cuesta encontrar el camino.', reloj: 1, flag: null },
                    juerga: { texto: '¡CROAC! ¡Pisan una rana enorme que croa TAN fuerte que las Bestias saltan del susto! La rana se ríe y les dice: "¡La cueva está por allí, torpes!" señalando con su patita verde.', reloj: 1, flag: 'amigaRana' }
                }
            },
            {
                id: '3b',
                texto: 'Usar una herramienta para iluminar',
                emoji: '✨',
                requiereTirada: true,
                dificultad: 9,
                tagsRelevantes: ['Gema Brillante', 'Catalejo de Corteza', 'Bolsa de Bellotas', 'Pala de Piedra'],
                autoExitoTags: ['Gema Brillante'],
                siguienteEscena: 'scene4',
                resultados: {
                    critico: { texto: '¡La luz ilumina todo el túnel! Descubren dibujos antiguos en las paredes: son mapas de los Titanes que muestran el camino exacto al tesoro. ¡Qué descubrimiento!', reloj: 0, flag: 'mapasTunel' },
                    exito: { texto: '¡Funciona! La luz revela el camino entre las raíces. Las Bestias avanzan con confianza hasta encontrar la salida del túnel.', reloj: 0, flag: null },
                    complicacion: { texto: 'La luz parpadea y se apaga un momento. ¡Qué susto! Pero vuelve a encenderse justo a tiempo para ver el camino.', reloj: 1, flag: null },
                    juerga: { texto: '¡La luz atrae a CIENTOS de luciérnagas! El túnel se llena de puntitos brillantes que vuelan por todas partes. Las Bestias estornudan cuando las luciérnagas les hacen cosquillas en la nariz. ¡Achís! ¡Achís! Pero el túnel queda PRECIOSO.', reloj: 1, flag: null }
                }
            }
        ]
    },

    scene4: {
        id: 'scene4',
        titulo: 'La Guarida del Tejón Gruñón',
        emoji: '🦡',
        ambientPreset: 'den',
        backgroundClass: 'bg-den',
        narrativa: 'Al final del túnel hay una cueva pequeña y acogedora con una mesita, una tetera humeante y... ¡un tejón ENORME! Es Don Gruñón, y NO está contento de tener visitas. "¿¡QUIÉN ANDA AHÍ!? ¡FUERA DE MI CASA!" gruñe moviendo sus patitas.',
        notasGM: '• VOZ DE VIEJO GRUÑÓN (grave, enfadado pero cómico)\n• "¡GRRR! ¡FUERA!" → espera la reacción de los niños\n• Si tienen bellotaRegalo: "¿Queréis darle algo...?"\n• Secreto: Don Gruñón está SOLO, quiere compañía\n• Si le hablan bonito → se emociona y llora\n• SIEMPRE termina ayudándoles (incluso en complicación, les deja pasar)\n• Idea: haz que los niños actúen qué le dicen\n• Props: ofrece "galletas" reales si tienes',
        opciones: [
            {
                id: '4a',
                texto: 'Hablar amablemente con Don Gruñón',
                emoji: '💬',
                requiereTirada: true,
                dificultad: 10,
                tagsRelevantes: ['Ser Astuto', 'Sabiduría Antigua', 'Cola Esponjosa', 'Orejas Giratorias'],
                siguienteEscena: 'scene5',
                resultados: {
                    critico: { texto: '"Oh... ¿de verdad buscáis el tesoro de los Titanes?" Don Gruñón se emociona. "¡Yo conozco el camino! El tesoro está detrás del Gran Roble, en el muro antiguo. ¡Y la llave está escondida bajo la piedra con forma de corazón!" Les da té y galletas para el camino.', reloj: 0, flag: 'ayudaTejon' },
                    exito: { texto: 'Don Gruñón se calma un poco. "Bueno, bueno... está bien. El tesoro que buscáis está por el camino del Gran Roble. ¡Pero no toquéis mis bellotas!" Les señala la salida con una sonrisa escondida.', reloj: 0, flag: 'ayudaTejon' },
                    complicacion: { texto: '"¡Hmph! ¡Jóvenes maleducados!" gruñe Don Gruñón. Pero al final les deja pasar refunfuñando. "¡Que sea la última vez!" Las Bestias se van rápidamente.', reloj: 1, flag: null },
                    juerga: { texto: '¡Don Gruñón empieza a LLORAR! "¡Es que nadie me visita nunca! ¡Estoy tan solito!" Las Bestias lo abrazan y Don Gruñón se pone tan contento que les da galletas, té, y un abrazo de oso. "¡El tesoro está en el Gran Roble! ¡Buena suerte, amiguitos!"', reloj: 1, flag: 'ayudaTejon' }
                }
            },
            {
                id: '4b',
                texto: 'Ofrecerle algo a cambio de pasar',
                emoji: '🎁',
                requiereTirada: true,
                dificultad: 9,
                tagsRelevantes: ['Bolsa de Bellotas', 'Bote de Corteza', 'Cuerda de Enredadera'],
                autoExitoFlags: ['bellotaRegalo'],
                siguienteEscena: 'scene5',
                resultados: {
                    critico: { texto: '"¿¡Para MÍ!?" Don Gruñón no puede creerlo. Se pone tan feliz que les prepara un festín. "¡El tesoro está detrás del Gran Roble! ¡La llave está bajo la piedra con forma de corazón! ¡Tomad galletas para el camino!"', reloj: 0, flag: 'ayudaTejon' },
                    exito: { texto: '"Mmm... está bien, acepto." Don Gruñón toma el regalo y les indica el camino. "Por el sendero del Gran Roble. ¡Y no hagáis ruido al salir!"', reloj: 0, flag: 'ayudaTejon' },
                    complicacion: { texto: '"¿Esto es TODO?" Don Gruñón no está impresionado pero les deja pasar. Las Bestias pasan de puntitas mientras él examina el regalo.', reloj: 1, flag: null },
                    juerga: { texto: 'Don Gruñón huele el regalo y... ¡ESTORNUDA tan fuerte que la tetera sale volando! ¡CRASH! "¡Mi tetera favorita!" Pero luego se ríe. "¡Ja ja ja! Hacía años que no me reía así. ¡Pasad, pasad! El tesoro está en el Gran Roble."', reloj: 1, flag: 'ayudaTejon' }
                }
            },
            {
                id: '4c',
                texto: '¡Escabullirse sin que nos vea!',
                emoji: '🤫',
                requiereTirada: true,
                dificultad: 12,
                tagsRelevantes: ['Sigilo de las Sombras', 'Patas Silenciosas', 'Pelaje Oscuro como la Noche', 'Moverse Como el Viento', 'Ser Pequeño', 'Alas Silenciosas'],
                siguienteEscena: 'scene5',
                resultados: {
                    critico: { texto: '¡Las Bestias se mueven como ninjas! Pasan justo detrás de Don Gruñón mientras ronca en su sillón. ¡Ni se entera! Además, ven un cartel en la pared que dice "Gran Roble → Tesoro".', reloj: 0, flag: 'ayudaTejon' },
                    exito: { texto: 'Silencio total... las Bestias pasan de puntitas por la cueva. Don Gruñón mueve una oreja pero no las ve. ¡Lo lograron!', reloj: 0, flag: null },
                    complicacion: { texto: '"¡EH! ¡Os VEO!" grita Don Gruñón. Las Bestias salen corriendo a toda velocidad. "¡Y NO VOLVÁIS!" Se escapan, pero con el corazón a mil.', reloj: 1, flag: null },
                    juerga: { texto: '¡Todo va perfecto hasta que una Bestia pisa la cola de un gato dormido! "¡MIAAAUUU!" El gato salta, Don Gruñón salta, las Bestias saltan, ¡TODOS saltan! En la confusión, las Bestias escapan mientras Don Gruñón persigue al gato. "¡MALDITO GATO!"', reloj: 1, flag: null }
                }
            }
        ]
    },

    scene5: {
        id: 'scene5',
        titulo: 'El Tesoro de los Titanes',
        emoji: '💎',
        ambientPreset: 'treasure',
        backgroundClass: 'bg-treasure',
        narrativa: '¡Las Bestias llegan al Gran Roble! Es el árbol más grande que han visto nunca. Entre sus raíces enormes, hay un muro de piedra antiguo... ¡es una casa de los Titanes! Y ahí, en un hueco del muro, BRILLA algo... ¡UNA CAJA DE METAL! Pero tiene un candado viejo y oxidado. ¿Cómo la abrirán?',
        notasGM: '• ¡MOMENTO CULMINANTE! Sube la emoción\n• Describe el brillo: "oro, rubíes, zafiros..."\n• Si ayudaTejon: "¿Recuerdan? ¡Piedra con forma de corazón!"\n• Si pistaExtra: "¡El mapa mostraba una llave!"\n• SIEMPRE se abre el cofre (cualquier resultado)\n• Idea: ten canicas/piedras brillantes como "gemas" reales\n• Haz cuenta atrás: "3... 2... 1... ¡CLICK!"\n• Tira confetti real si tienes',
        esFinal: true,
        opciones: [
            {
                id: '5a',
                texto: '¡Forzar el candado con fuerza!',
                emoji: '💪',
                requiereTirada: true,
                dificultad: 11,
                tagsRelevantes: ['Resistencia', 'Púas Protectoras', 'Hacerse una Bola', 'Velocidad Relámpago', 'Manos Ágiles'],
                siguienteEscena: 'victoria',
                resultados: {
                    critico: { texto: '¡CRACK! ¡El candado se rompe como si fuera de papel! La caja se abre y... ¡¡WOOOOW!! ¡Gemas brillantes de todos los colores! ¡Rojas, azules, verdes, doradas! ¡Las Gemas de los Titanes!', reloj: 0, flag: null },
                    exito: { texto: 'Con mucho esfuerzo... ¡CRAC! El candado cede. La caja se abre lentamente y... ¡BRILLA! ¡Está llena de gemas de colores! ¡Las Gemas de los Titanes!', reloj: 0, flag: null },
                    complicacion: { texto: 'El candado es más duro de lo que parece. Las Bestias empujan y empujan... están agotadas pero... ¡CRAC! ¡POR FIN! La caja se abre y revela las brillantes Gemas de los Titanes.', reloj: 1, flag: null },
                    juerga: { texto: '¡Las Bestias empujan tan fuerte que el candado EXPLOTA en mil pedazos brillantes como fuegos artificiales! ¡BUM! ¡FIUUUU! ¡La caja se abre y las gemas salen volando por el aire como una lluvia de colores! ¡Es el momento más ESPECTACULAR del bosque!', reloj: 0, flag: null }
                }
            },
            {
                id: '5b',
                texto: 'Buscar la llave escondida',
                emoji: '🔑',
                requiereTirada: true,
                dificultad: 10,
                tagsRelevantes: ['Olfato Rastreador', 'Visión de Águila', 'Excavar Túneles', 'Pala de Piedra', 'Ser Astuto'],
                ventajaConFlags: ['ayudaTejon', 'pistaExtra', 'mapasTunel'],
                siguienteEscena: 'victoria',
                resultados: {
                    critico: { texto: '¡Ahí está! ¡La piedra con forma de corazón! Las Bestias la levantan y... ¡una llave dorada! La ponen en el candado, giran, y... ¡CLICK! La caja se abre revelando las Gemas de los Titanes más hermosas que jamás hayan visto.', reloj: 0, flag: null },
                    exito: { texto: 'Buscan entre las piedras y las raíces... ¡AHÍ! Una llave vieja pero funcional. La meten en el candado... ¡CLICK! La caja se abre mostrando gemas brillantes de todos los colores.', reloj: 0, flag: null },
                    complicacion: { texto: 'Buscan y buscan... ¡No la encuentran! Pero no se rinden. Después de excavar un poco más... ¡ENCONTRADA! La llave estaba más profunda de lo esperado. La caja se abre: ¡las Gemas de los Titanes!', reloj: 1, flag: null },
                    juerga: { texto: '¡Encuentran la llave pero es GIGANTE! Es una llave de Titán (humano). Las dos Bestias tienen que cargarla juntas haciendo equilibrio. "¡A la izquierda!" "¡No, a la derecha!" ¡CLONK! La meten en el candado y... ¡¡la caja se abre lanzando confeti de hojas!! ¡GEMAS BRILLANTES POR TODAS PARTES!', reloj: 0, flag: null }
                }
            }
        ]
    },

    victoria: {
        id: 'victoria',
        titulo: '¡VICTORIA!',
        emoji: '🏆',
        ambientPreset: 'victory',
        backgroundClass: 'bg-victory',
        narrativa: '¡¡LAS BESTIAS LO LOGRARON!! ¡Han encontrado el legendario Tesoro de los Titanes! La caja brilla con gemas de todos los colores: rubíes rojos, zafiros azules, esmeraldas verdes y diamantes que brillan como estrellas. ¡Son las aventureras más valientes de todo el Bosque de Bristley! Todos los animales del bosque vienen a celebrar su hazaña. ¡HURRA!',
        narrativaAgotados: '¡¡LAS BESTIAS LO LOGRARON!! Están cansadísimas, con las patitas temblando y los ojos medio cerrados... ¡pero lo consiguieron! El tesoro brilla ante ellas con gemas de todos los colores. Se acuestan sobre las hojas suaves junto al Gran Roble, abrazando las gemas, y se quedan dormiditas con una gran sonrisa. ¡Son las heroínas más valientes del Bosque de Bristley!',
        notasGM: '• ¡¡CELEBRA!! Aplaude, grita, ¡HURRA!\n• Pregunta: "¿Qué van a hacer con el tesoro?"\n• Idea: dale "gemas" reales (canicas, piedras pintadas)\n• Repasa lo que hicieron: "¿Recuerdan cuando...?"\n• Si están agotados: "duermen felices con el tesoro"\n• Foto grupal con los personajes si quieren',
        esFinal: true,
        opciones: []
    }
};

// Tabla de Juergas genéricas (fallback)
window.Carrera.juergasGenericas = [
    '¡Un pájaro les hace caca en la cabeza! ¡Puaj! Pero dicen que trae buena suerte...',
    '¡Se tropiezan con una raíz y hacen una voltereta perfecta! ¡10 puntos!',
    '¡Una mariposa enorme se posa en la nariz de una Bestia y le hace cosquillas! ¡ACHÍS!',
    '¡Encuentran un objeto extraño de los Titanes: un patito de goma amarillo! ¿Para qué servirá?',
    '¡Un coro de ranas empieza a cantar una canción! ¡CROAC CROAC CROAC! ¡Es pegadiza!',
    '¡El viento se lleva las hojas y les hace un peinado ridículo! ¡Ja ja ja!'
];
