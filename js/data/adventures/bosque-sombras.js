// Aventura 2: "El Bosque de las Sombras"
window.Carrera = window.Carrera || {};

(function() {
    var adventure = {
        id: 'bosque-sombras',
        titulo: 'El Bosque de las Sombras',
        emoji: '🌑',
        descripcion: 'Una oscuridad misteriosa cubre el bosque. Las Bestias deben encontrar la fuente de luz antes de que la noche eterna caiga.',
        dificultad: 2,
        nivelRecomendado: 2,
        duracion: '30-45 min',
        totalEscenas: 5,
        scenes: {
            scene1: {
                id: 'scene1',
                titulo: 'La Oscuridad Repentina',
                emoji: '🌘',
                ambientPreset: 'tunnel',
                backgroundClass: 'bg-tunnel',
                narrativa: '¡Algo raro pasa en el Bosque de Bristley! El sol se ha escondido detrás de unas nubes oscuras y no quiere salir. Los animales del bosque están asustados. Una vieja tortuga se acerca: "Bestias valientes, la Piedra de Luz del claro central se ha apagado. Sin ella, ¡será noche eterna! Deben encontrar las tres Chispas Mágicas para encenderla de nuevo."',
                notasGM: '🎭 ESCENA: Bosque oscurecido, animales asustados, tortuga sabia\n\n• Habla con voz de tortuga vieja: leeento\n• Describe cómo todo se oscurece poco a poco\n• Las 3 Chispas están en: Río Helado, Cueva Cristal, Árbol Antiguo\n• Pregunta: "¿Por dónde quieren empezar?"',
                opciones: [
                    {
                        id: 'bs1a', texto: '¡Buscar la primera Chispa en el río!', emoji: '💧',
                        requiereTirada: false, siguienteEscena: 'scene2',
                        narrativaResultado: '¡Las Bestias corren hacia el Río Helado! Pueden oír el agua aunque casi no se ve nada en la oscuridad...'
                    },
                    {
                        id: 'bs1b', texto: 'Pedir más información a la tortuga', emoji: '🐢',
                        requiereTirada: true, dificultad: 8,
                        tagsRelevantes: ['Sabiduría Antigua', 'Ser Astuto', 'Orejas Giratorias'],
                        siguienteEscena: 'scene2',
                        resultados: {
                            critico: { texto: 'La tortuga sonríe: "Ah, bestias sabias. La Chispa del río está DENTRO del agua, protegida por remolinos. Pero si cantan una canción, el agua se calmará." ¡Qué pista tan valiosa!', reloj: 0, flag: 'pistaRio' },
                            exito: { texto: '"El río es peligroso de noche," dice la tortuga. "Tengan cuidado con las piedras resbaladizas. La Chispa brilla bajo el agua." Las Bestias agradecen y se van.', reloj: 0, flag: null },
                            complicacion: { texto: 'La tortuga se queda dormida a mitad de la explicación. "Zzz... ¿eh? Ah sí... el río... es por allá..." señala vagamente. Las Bestias tendrán que descubrirlo solas.', reloj: 1, flag: null },
                            juerga: { texto: '¡La tortuga intenta señalar el camino pero se cae de espaldas! "¡Ayuda! ¡No puedo voltearme!" Las Bestias la ayudan entre risas. "¡Gracias! El río está a la izquierda... creo... o a la derecha... ¡buena suerte!"', reloj: 1, flag: null }
                        }
                    },
                    {
                        id: 'bs1c', texto: 'Preparar antorchas con ramas', emoji: '🔥',
                        requiereTirada: true, dificultad: 9,
                        tagsRelevantes: ['Manos Ágiles', 'Cuerda de Enredadera', 'Bolsa de Bellotas', 'Resistencia'],
                        siguienteEscena: 'scene2',
                        resultados: {
                            critico: { texto: '¡Las Bestias crean unas antorchas perfectas! La luz ilumina el camino y pueden ver senderos secretos entre los árboles. ¡Esto les dará ventaja!', reloj: 0, flag: 'antorchas' },
                            exito: { texto: 'Logran hacer antorchas básicas con ramas secas. No brillan mucho, pero es mejor que nada. ¡Adelante!', reloj: 0, flag: null },
                            complicacion: { texto: 'Las ramas están húmedas y cuesta encenderlas. Pierden tiempo intentando hasta que una chispa prende. Pero las antorchas no durarán mucho...', reloj: 1, flag: null },
                            juerga: { texto: '¡Prenden la antorcha pero una polilla GIGANTE aparece atraída por la luz! "¡FUERA, POLILLA!" La persiguen en círculos hasta que se va. Al menos la antorcha sigue encendida...', reloj: 1, flag: null }
                        }
                    }
                ]
            },

            scene2: {
                id: 'scene2',
                titulo: 'El Río Helado',
                emoji: '🧊',
                ambientPreset: 'river',
                backgroundClass: 'bg-river',
                narrativa: '¡El río está diferente! El agua es oscura y fría, y hay remolinos pequeños que giran y giran. En el fondo, algo brilla con una luz azul tenue... ¡es la primera Chispa Mágica! Pero está atrapada bajo una roca en el fondo del río.',
                notasGM: '🎭 ESCENA: Río oscuro, agua fría, brillo azul en el fondo\n\n• Describe el frío: "Brrrrr, el agua está heladísima"\n• Si tienen pistaRio: "¿Recuerdan la canción?"\n• Si tienen antorchas: la luz ayuda a ver mejor\n• La Chispa es pequeña como una canica brillante',
                opciones: [
                    {
                        id: 'bs2a', texto: '¡Zambullirse a buscar la Chispa!', emoji: '🏊',
                        requiereTirada: true, dificultad: 11,
                        tagsRelevantes: ['Nadar como Pez', 'Aguantar la Respiración', 'Pelaje Impermeable', 'Resistencia'],
                        autoExitoFlags: ['pistaRio'],
                        siguienteEscena: 'scene3',
                        resultados: {
                            critico: { texto: '¡SPLASH! La Bestia se zambulle como un campeón olímpico. Encuentra la Chispa al instante, ¡y el agua se calienta al tocarla! Brilla con una luz azul preciosa. ¡Primera Chispa conseguida!', reloj: 0, flag: 'chispa1' },
                            exito: { texto: 'El agua está fría pero la Bestia es valiente. Baja, mueve la roca con esfuerzo y... ¡ahí está! La Chispa Mágica brilla en sus patas. ¡Una de tres!', reloj: 0, flag: 'chispa1' },
                            complicacion: { texto: '¡El agua está CONGELADA! La Bestia baja pero los remolinos la empujan. Al tercer intento, logra sacar la Chispa pero sale temblando de frío.', reloj: 1, flag: 'chispa1' },
                            juerga: { texto: '¡La Bestia se zambulle pero un pez le hace cosquillas en la barriga! "¡JA JA JA!" No puede parar de reír bajo el agua. ¡Burbujas por todas partes! El pez, divertido, le trae la Chispa en la boca. "¡Gracias, señor pez!"', reloj: 1, flag: 'chispa1' }
                        }
                    },
                    {
                        id: 'bs2b', texto: 'Desviar el agua con piedras', emoji: '🪨',
                        requiereTirada: true, dificultad: 10,
                        tagsRelevantes: ['Excavar Túneles', 'Pala de Piedra', 'Trepar a Toda Velocidad', 'Manos Ágiles'],
                        siguienteEscena: 'scene3',
                        resultados: {
                            critico: { texto: '¡Construyen una presa perfecta! El agua se desvía y la Chispa queda al descubierto en el lecho seco. ¡Fácil! La recogen brillando con luz azul.', reloj: 0, flag: 'chispa1' },
                            exito: { texto: 'Con mucho esfuerzo, logran mover suficientes piedras para reducir la corriente. La Chispa es visible ahora. ¡La atrapan con cuidado!', reloj: 0, flag: 'chispa1' },
                            complicacion: { texto: 'Las piedras se mueven con la corriente y hay que empezar dos veces. Al final logran un hueco para alcanzar la Chispa, pero ha costado tiempo.', reloj: 1, flag: 'chispa1' },
                            juerga: { texto: '¡La presa funciona pero DEMASIADO bien! El agua se acumula y de repente... ¡SPLASH! ¡Inundación! Todos quedan empapados pero la Chispa sale flotando directo a las patas de una Bestia. "¡La tengo!"', reloj: 1, flag: 'chispa1' }
                        }
                    },
                    {
                        id: 'bs2c', texto: 'Pescar la Chispa con herramientas', emoji: '🎣',
                        requiereTirada: true, dificultad: 10,
                        tagsRelevantes: ['Cuerda de Enredadera', 'Catalejo de Corteza', 'Visión de Águila', 'Ser Astuto'],
                        siguienteEscena: 'scene3',
                        resultados: {
                            critico: { texto: '¡Atan una cuerda con un gancho improvisado y... PESCA PERFECTA! La Chispa sale del agua brillando como una estrella. ¡Ni se mojaron!', reloj: 0, flag: 'chispa1' },
                            exito: { texto: 'Después de varios intentos, la cuerda engancha la roca que cubre la Chispa. Tiran fuerte y... ¡la Chispa sube a la superficie! ¡Conseguida!', reloj: 0, flag: 'chispa1' },
                            complicacion: { texto: 'La cuerda se rompe dos veces. Con la tercera, logran sacar la Chispa pero están agotados del esfuerzo.', reloj: 1, flag: 'chispa1' },
                            juerga: { texto: '¡Lanzan la cuerda pero pescan un ZAPATO viejo! Luego una bota. Luego un sombrero. "¿De dónde sale tanta ropa?" Al quinto intento, ¡por fin la Chispa! Pero ahora tienen un guardarropa nuevo.', reloj: 1, flag: 'chispa1' }
                        }
                    }
                ]
            },

            scene3: {
                id: 'scene3',
                titulo: 'La Cueva de Cristal',
                emoji: '💎',
                ambientPreset: 'tunnel',
                backgroundClass: 'bg-tunnel',
                narrativa: 'Más adentro del bosque oscuro, hay una cueva con paredes de cristal. La segunda Chispa Mágica flota en el centro, rodeada de espejos naturales que crean un laberinto de reflejos. Pero... ¡hay cientos de reflejos de la Chispa! ¿Cuál es la real?',
                notasGM: '🎭 ESCENA: Cueva de cristales, reflejos, laberinto óptico\n\n• Describe los reflejos: "¡Hay Chispas por TODAS partes!"\n• Solo una es real, las demás son reflejos\n• Si tienen antorchas: la luz crea más reflejos (divertido)\n• Pista: la real es la única que no se mueve cuando te mueves',
                opciones: [
                    {
                        id: 'bs3a', texto: 'Cerrar los ojos y sentir la Chispa', emoji: '🧘',
                        requiereTirada: true, dificultad: 10,
                        tagsRelevantes: ['Sabiduría Antigua', 'Olfato Rastreador', 'Orejas Giratorias', 'Cola Esponjosa'],
                        siguienteEscena: 'scene4',
                        resultados: {
                            critico: { texto: '¡La Bestia cierra los ojos y SIENTE el calor de la Chispa real! Camina directa hacia ella con los ojos cerrados y... ¡la atrapa al primer intento! Los cristales cantan una melodía mágica de celebración.', reloj: 0, flag: 'chispa2' },
                            exito: { texto: 'Concentrándose mucho, la Bestia logra sentir una brisa cálida que viene de una dirección. Sigue la brisa y... ¡encuentra la Chispa real! Brilla con luz verde.', reloj: 0, flag: 'chispa2' },
                            complicacion: { texto: 'Se concentran pero los reflejos los confunden. Tocan tres Chispas falsas que se rompen como burbujas antes de encontrar la real.', reloj: 1, flag: 'chispa2' },
                            juerga: { texto: '¡La Bestia cierra los ojos pero se choca con un cristal! "¡AY!" El golpe hace temblar toda la cueva y TODOS los reflejos caen menos uno: la Chispa real. "¡Ah, pues era por ahí!"', reloj: 1, flag: 'chispa2' }
                        }
                    },
                    {
                        id: 'bs3b', texto: 'Observar los reflejos con cuidado', emoji: '🔍',
                        requiereTirada: true, dificultad: 11,
                        tagsRelevantes: ['Visión de Águila', 'Ver en la Oscuridad', 'Catalejo de Corteza', 'Gema Brillante'],
                        siguienteEscena: 'scene4',
                        resultados: {
                            critico: { texto: '¡Ojo de águila! La Bestia nota que una sola Chispa NO se mueve cuando los demás reflejos cambian. "¡ESA!" La atrapa con precisión. Los cristales brillan aplaudiendo.', reloj: 0, flag: 'chispa2' },
                            exito: { texto: 'Después de observar con atención, notan que la Chispa real tiene un brillo ligeramente diferente. ¡La encuentran entre los reflejos!', reloj: 0, flag: 'chispa2' },
                            complicacion: { texto: 'Todos los reflejos parecen iguales... tarda un buen rato pero al final, moviendo la cabeza, encuentra la que se queda quieta.', reloj: 1, flag: 'chispa2' },
                            juerga: { texto: '¡La Bestia mira tan fijamente los reflejos que se queda BIZCA! "¡Veo doble... triple... cuádruple!" Los demás se ríen tanto que la risa rompe todos los reflejos falsos. Solo queda la real.', reloj: 1, flag: 'chispa2' }
                        }
                    },
                    {
                        id: 'bs3c', texto: 'Romper los cristales falsos', emoji: '💥',
                        requiereTirada: true, dificultad: 9,
                        tagsRelevantes: ['Hacerse una Bola', 'Púas Protectoras', 'Resistencia', 'Bolsa de Bellotas'],
                        siguienteEscena: 'scene4',
                        resultados: {
                            critico: { texto: '¡CRASH CRASH CRASH! La Bestia rompe los cristales falsos uno a uno con estilo. Cada uno suena como una campanita. Al final, solo queda la Chispa real flotando sola. ¡Fácil!', reloj: 0, flag: 'chispa2' },
                            exito: { texto: 'Rompen varios cristales y los reflejos desaparecen. Entre los fragmentos brillantes, encuentran la Chispa verdadera.', reloj: 0, flag: 'chispa2' },
                            complicacion: { texto: '¡Los cristales son más duros de lo esperado! Algunos rebotan las bellotas de vuelta. Pero con persistencia logran despejar el camino hasta la Chispa.', reloj: 1, flag: 'chispa2' },
                            juerga: { texto: '¡Lanzan una bellota que rebota en TODOS los cristales como una bola de pinball! ¡TING TING TING TING! Destruye cada reflejo uno por uno en una secuencia perfecta. "¡¿Cómo hice eso?!"', reloj: 1, flag: 'chispa2' }
                        }
                    }
                ]
            },

            scene4: {
                id: 'scene4',
                titulo: 'El Árbol Antiguo',
                emoji: '🌳',
                ambientPreset: 'forest',
                backgroundClass: 'bg-forest-clearing',
                narrativa: 'La tercera Chispa está en lo alto del árbol más viejo del bosque. Sus ramas llegan hasta las nubes oscuras. Pero el árbol está dormido y NO quiere que nadie suba. Sus ramas se mueven solas, bloqueando el camino. "¡Dejadme dormir!" gruñe con voz de madera.',
                notasGM: '🎭 ESCENA: Árbol gigante vivo, ramas que se mueven, gruñón\n\n• Voz de árbol: grave, lenta, crujiente\n• El árbol no es malo, solo tiene sueño\n• Si le cantan o cuentan un cuento, se calma\n• La Chispa está en un nido en la copa\n• Pregunta: "¿Cómo convencen al árbol?"',
                opciones: [
                    {
                        id: 'bs4a', texto: 'Cantarle una canción de cuna', emoji: '🎵',
                        requiereTirada: true, dificultad: 9,
                        tagsRelevantes: ['Sabiduría Antigua', 'Ser Astuto', 'Cola Esponjosa', 'Orejas Giratorias'],
                        siguienteEscena: 'scene5',
                        resultados: {
                            critico: { texto: '"🎵 Duérmete arboliiito, cierra tus ramiiitas... 🎵" ¡El árbol se EMOCIONA! "¡Nadie me había cantado desde hace 100 años!" Baja una rama suavemente y coloca la Chispa roja en las patas de las Bestias.', reloj: 0, flag: 'chispa3' },
                            exito: { texto: 'La canción funciona. El árbol relaja sus ramas: "Mmm... bonita melodía..." Las Bestias suben rápidamente y encuentran la Chispa brillando en un nido.', reloj: 0, flag: 'chispa3' },
                            complicacion: { texto: 'Cantan pero desafinan un poco. "¡Eso NO es una canción de cuna!" gruñe el árbol. Pero al segundo intento se calma lo suficiente para dejarlas pasar.', reloj: 1, flag: 'chispa3' },
                            juerga: { texto: '¡Las Bestias cantan pero cada una una canción DIFERENTE! "🎵 Duérmete... 🎵" "🎵 ¡ARRIBA EL BOSQUE! 🎵" El árbol se ríe tanto que sus ramas tiemblan y la Chispa cae solita. "¡Ja ja ja! ¡Sois un desastre musical!"', reloj: 1, flag: 'chispa3' }
                        }
                    },
                    {
                        id: 'bs4b', texto: 'Trepar rapidísimo antes de que reaccione', emoji: '🧗',
                        requiereTirada: true, dificultad: 12,
                        tagsRelevantes: ['Trepar a Toda Velocidad', 'Velocidad Relámpago', 'Moverse Como el Viento', 'Equilibrio Perfecto', 'Alas Silenciosas'],
                        siguienteEscena: 'scene5',
                        resultados: {
                            critico: { texto: '¡Como un rayo! La Bestia sube TAN rápido que el árbol no tiene tiempo de reaccionar. "¿Eh? ¿Qué? ¡Ya se fueron!" La Chispa roja brilla en sus patas. ¡Récord de velocidad!', reloj: 0, flag: 'chispa3' },
                            exito: { texto: 'Rápidas y sigilosas, las Bestias esquivan las ramas que intentan bloquearlas. Llegan al nido y agarran la Chispa antes de que el árbol pueda impedirlo.', reloj: 0, flag: 'chispa3' },
                            complicacion: { texto: 'El árbol es más rápido de lo que pensaban. ¡ZAS! Una rama las empuja hacia abajo. Al segundo intento, logran esquivarla y llegan a la Chispa.', reloj: 1, flag: 'chispa3' },
                            juerga: { texto: '¡La Bestia trepa pero una rama la agarra de la cola! "¡SUÉLTAME!" Se columpia como un mono hasta que la rama la lanza por los aires... ¡directa al nido con la Chispa! "¡La tengo! ...¡AUCH!"', reloj: 1, flag: 'chispa3' }
                        }
                    },
                    {
                        id: 'bs4c', texto: 'Negociar: "Te protegeremos del viento"', emoji: '🤝',
                        requiereTirada: true, dificultad: 10,
                        tagsRelevantes: ['Ser Astuto', 'Capa de Hojas', 'Cuerda de Enredadera', 'Bote de Corteza'],
                        siguienteEscena: 'scene5',
                        resultados: {
                            critico: { texto: '"¿De verdad haríais eso por mí?" El árbol se conmueve. "Hace siglos que nadie cuida de mí..." Baja la Chispa con cuidado y las Bestias le ponen hojas extras como bufanda. "¡Gracias, pequeñas amigas!"', reloj: 0, flag: 'chispa3' },
                            exito: { texto: '"Hmm... está bien." Las Bestias cubren una rama con hojas para protegerla del frío. El árbol, agradecido, les permite subir a buscar la Chispa.', reloj: 0, flag: 'chispa3' },
                            complicacion: { texto: '"¿Y cómo sé que cumplirán?" Las Bestias tienen que demostrar primero tapando un agujero en el tronco. Les cuesta pero al final el árbol las deja pasar.', reloj: 1, flag: 'chispa3' },
                            juerga: { texto: '"¡Os protegeré del viento!" dice una Bestia poniéndose delante del árbol. ¡WOOOOSH! Un viento fortísimo la hace volar hasta la copa. "¡AAAAH!" Aterriza justo al lado de la Chispa. "¡Eso... era parte del plan!"', reloj: 1, flag: 'chispa3' }
                        }
                    }
                ]
            },

            scene5: {
                id: 'scene5',
                titulo: 'La Piedra de Luz',
                emoji: '🌟',
                ambientPreset: 'treasure',
                backgroundClass: 'bg-treasure',
                narrativa: '¡Las Bestias tienen las tres Chispas Mágicas! Corren al claro central donde está la gran Piedra de Luz, una roca enorme con tres huecos en forma de estrella. La oscuridad es casi total ahora. Los animales del bosque las rodean, esperando. Es el momento de la verdad: ¡hay que colocar las Chispas!',
                notasGM: '🎭 ESCENA FINAL: Claro central, Piedra de Luz, todos los animales\n\n• ¡MOMENTO ÉPICO! Cuenta atrás: "3... 2... 1..."\n• Cada Chispa en su hueco = flash de luz\n• Cuando las 3 están: ¡EXPLOSIÓN DE LUZ!\n• Describe cómo vuelve el sol lentamente\n• Todos los animales celebran',
                esFinal: true,
                opciones: [
                    {
                        id: 'bs5a', texto: '¡Colocar las tres Chispas a la vez!', emoji: '✨',
                        requiereTirada: true, dificultad: 10,
                        tagsRelevantes: ['Equilibrio Perfecto', 'Manos Ágiles', 'Velocidad Relámpago', 'Moverse Como el Viento'],
                        siguienteEscena: 'victoria',
                        resultados: {
                            critico: { texto: '¡Las Bestias colocan las tres Chispas EXACTAMENTE al mismo tiempo! La Piedra de Luz EXPLOTA en un arcoíris de colores. ¡FLAAASH! La luz inunda todo el bosque de golpe. ¡Los animales gritan de alegría! El sol sale de detrás de las nubes y TODO brilla.', reloj: 0, flag: null },
                            exito: { texto: 'Una a una, las Chispas encajan en sus huecos. Azul... verde... roja... ¡BRIIIIILLA! La Piedra de Luz se enciende y la oscuridad se retira. ¡El bosque vuelve a la normalidad!', reloj: 0, flag: null },
                            complicacion: { texto: 'La primera Chispa entra fácil, la segunda también, pero la tercera no encaja bien. Las Bestias la giran y giran hasta que... ¡CLICK! ¡Encaja! La luz vuelve al bosque, aunque más lentamente.', reloj: 1, flag: null },
                            juerga: { texto: '¡Colocan las Chispas pero al revés! La Piedra hace un sonido raro: "¿BOING?" y lanza chispas de colores como un arcoíris loco. Los animales se ríen. "¡Al revés, al revés!" Las Bestias las recolocan y... ¡¡BOOM DE LUZ!! ¡Todo el bosque queda iluminado con purpurina mágica!', reloj: 0, flag: null }
                        }
                    },
                    {
                        id: 'bs5b', texto: 'Hacer una ceremonia con los animales', emoji: '🎭',
                        requiereTirada: true, dificultad: 9,
                        tagsRelevantes: ['Sabiduría Antigua', 'Ser Astuto', 'Cola Esponjosa', 'Orejas Giratorias'],
                        siguienteEscena: 'victoria',
                        resultados: {
                            critico: { texto: 'Las Bestias organizan una ceremonia mágica. Cada animal del bosque pone una pata en la Piedra. Cuando colocan la última Chispa, ¡TODO EL BOSQUE BRILLA! Una onda de luz se expande en todas direcciones. ¡Es el momento más mágico que jamás han vivido!', reloj: 0, flag: null },
                            exito: { texto: 'Los animales hacen un círculo alrededor de la Piedra. Las Bestias colocan las Chispas con solemnidad. La luz vuelve, suave y cálida. ¡El bosque está a salvo!', reloj: 0, flag: null },
                            complicacion: { texto: 'Organizan la ceremonia pero un conejo nervioso tropieza y casi tira una Chispa. La atrapan justo a tiempo y completan el ritual.', reloj: 1, flag: null },
                            juerga: { texto: '¡La ceremonia se convierte en una FIESTA! Los animales empiezan a bailar ANTES de colocar las Chispas. "¡Primero la luz, después la fiesta!" Pero cuando las Chispas encienden la Piedra, la fiesta se hace AÚN MÁS grande.', reloj: 0, flag: null }
                        }
                    },
                    {
                        id: 'bs5c', texto: 'Lanzar las Chispas desde lejos', emoji: '🎯',
                        requiereTirada: true, dificultad: 12,
                        tagsRelevantes: ['Visión de Águila', 'Bolsa de Bellotas', 'Pala de Piedra', 'Alas Silenciosas'],
                        siguienteEscena: 'victoria',
                        resultados: {
                            critico: { texto: '¡Tiro perfecto! Las tres Chispas vuelan por el aire dejando estelas de colores y encajan EXACTAMENTE en sus huecos. ¡Es como ver estrellas fugaces! La Piedra se enciende con una explosión de luz dorada.', reloj: 0, flag: null },
                            exito: { texto: 'Primera Chispa... ¡dentro! Segunda... ¡dentro! Tercera... ¡casi! La última rebota pero un pájaro la empuja al hueco. ¡La luz regresa!', reloj: 0, flag: null },
                            complicacion: { texto: 'Fallan los dos primeros lanzamientos. El tercero entra y las Bestias corren a colocar las otras dos a mano. ¡Funciona pero ha costado!', reloj: 1, flag: null },
                            juerga: { texto: '¡Lanzan la primera pero le dan a un búho! "¡EH!" La segunda rebota en un árbol. La tercera... ¡CANASTA! Pero las otras dos ruedan solas hasta la Piedra porque... ¡las Chispas QUERÍAN ir allí! "¡¿Magia?!" ¡BOOM, LUZ!', reloj: 0, flag: null }
                        }
                    }
                ]
            },

            victoria: {
                id: 'victoria',
                titulo: '¡VICTORIA!',
                emoji: '🌟',
                ambientPreset: 'victory',
                backgroundClass: 'bg-victory',
                narrativa: '¡¡LAS BESTIAS HAN DEVUELTO LA LUZ AL BOSQUE!! La Piedra de Luz brilla con más fuerza que nunca. El sol asoma entre las nubes y un arcoíris cruza todo el cielo. Los animales celebran con una gran fiesta: las ardillas tocan música con bellotas, los pájaros cantan a coro, y hasta Don Gruñón ha venido a bailar (bueno, a gruñir al ritmo). ¡Las Bestias son las HEROÍNAS del Bosque de Bristley!',
                narrativaAgotados: '¡¡LAS BESTIAS LO HAN CONSEGUIDO!! Están agotadísimas, con los ojos medio cerrados y las patitas temblando... pero la Piedra de Luz BRILLA. El sol vuelve poco a poco y un arcoíris débil pero precioso aparece en el cielo. Los animales las tapan con hojas suaves y las arropan mientras duermen. ¡Son las heroínas más valientes del bosque!',
                notasGM: '🎭 FINAL: ¡Celebración de la luz!\n\n• ¡CELEBRA! ¡La luz volvió!\n• Describe el arcoíris y la fiesta\n• Pregunta: "¿Qué quieren hacer en la fiesta?"',
                esFinal: true,
                opciones: []
            }
        },
        juergasGenericas: [
            '¡Una luciérnaga enorme se posa en la nariz de una Bestia! "¡Estoy ciega! ¡Ah no, es una luz!"',
            '¡Tropiezan con una seta que rebota como un trampolín! ¡BOING!',
            '¡Un búho sabio les dice un acertijo: "¿Qué tiene ojos pero no puede ver?" "¡Una papa!" "...era una aguja..."',
            '¡Encuentran un charco que refleja las estrellas aunque es de día! Es mágico... o solo está muy limpio.',
            '¡Una familia de topos sale del suelo y les hace una ola mexicana!',
            '¡Una araña teje "HOLA" en su telaraña! Las Bestias saludan educadamente.'
        ]
    };

    // Auto-register
    if (window.Carrera.adventureRegistry) {
        window.Carrera.adventureRegistry.register(adventure);
    }
})();
