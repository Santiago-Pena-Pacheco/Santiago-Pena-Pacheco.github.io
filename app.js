/*
================================================================================
  app.js  —  safeXP | Aprende Ciberseguridad
================================================================================
  Lógica completa de la aplicación. Organizada en módulos:

  1.  CONSTANTES Y CONFIG        — claves de localStorage, listas de avatares
  2.  ESTADO DEL JUEGO (gs)      — objeto principal con todo el progreso
  3.  DATOS DEL JUEGO            — UNITS, COSMETICS, ACHIEVEMENTS_DEF, etc.
  4.  HELPER $()                 — atajo para getElementById
  5.  SAVE / LOAD                — persistencia en localStorage
  6.  GESTIÓN DE PANTALLAS       — showScreen, showTab, goHome
  7.  SISTEMA DE AUTH            — login, registro, sesión, logout
  8.  SISTEMA DE LECCIÓN         — preguntas, respuestas, feedback, progreso
  9.  PANEL DE TEORÍA            — drawer lateral con teoría por pregunta
  10. SISTEMA SOCIAL             — feed, mensajes, compartir progreso
  11. COSMÉTICOS                 — picker de marcos y títulos
  12. AMIGOS                     — búsqueda, solicitudes, historial de duelos
  13. RANKING / COMPETITIVO      — rango, duelos, tabla de posiciones
  14. ACCESIBILIDAD              — temas, fuente, movimiento, voz
  15. PERFIL / LOGROS            — pestaña de perfil y sistema de achievements
  16. RETO DIARIO                — pregunta del día con recompensa de XP
  17. TEST DE NIVEL              — test inicial para nuevos usuarios
  18. MINIJUEGOS                 — pares, pong, constructor de contraseñas, trivia
  19. EXPOSICIÓN GLOBAL          — window.* para funciones en HTML dinámico
  20. INIT                       — DOMContentLoaded y authInit()
================================================================================
*/


/* ── Question generators for activities beyond the hand-crafted ones ── */
const POOL_PASSWORDS=[
  [{type:'choice',char:'💪',q:'¿Cuál es más difícil de hackear con fuerza bruta?',choices:[{e:'🔢',t:'4 dígitos numéricos'},{e:'📝',t:'Palabra del diccionario'},{e:'🎲',t:'16 caracteres aleatorios',ok:true},{e:'📅',t:'Fecha de cumpleaños'}],theory:'Longitud > complejidad. Una frase de 4 palabras aleatorias tiene más entropía que una contraseña corta con símbolos porque la longitud multiplica exponencialmente las combinaciones posibles.',explain:'Cada carácter adicional multiplica exponencialmente las combinaciones posibles.'},
   {type:'tf',char:'💻',q:'Los ataques de diccionario prueban palabras comunes y sus variaciones para adivinar contraseñas.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:true,explain:'Exacto. Por eso "Pr1mavera!" es débil: es una palabra común con sustituciones predecibles.'},
   {type:'choice',char:'🔄',q:'¿Cada cuánto deberías cambiar contraseñas de servicios importantes?',choices:[{e:'📅',t:'Cada semana'},{e:'🗓️',t:'Solo cuando te lo pidan'},{e:'✅',t:'Cada 3-6 meses o si sospechas algo',ok:true},{e:'🙅',t:'Nunca si son fuertes'}],theory:'El NIST ya no recomienda cambios periódicos obligatorios. Solo cambia si: hubo una brecha confirmada, sospechas compromiso, o alguien más la conoce. Los cambios forzados frecuentes llevan paradójicamente a contraseñas más débiles y predecibles.',explain:'Las buenas prácticas recomiendan rotación periódica, especialmente si hubo brechas de datos en el servicio.'},
   {type:'pair',char:'🔗',q:'¿Técnica de ataque o técnica de defensa?',left:['Fuerza bruta','Gestor de contraseñas','Diccionario','Autenticación 2FA'],right:['⚔️ Prueba millones de claves','🛡️ Almacena contraseñas seguras','⚔️ Usa lista de palabras comunes','🛡️ Requiere segundo factor'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'Red Team (ataque) usa fuerza bruta, diccionarios y credential stuffing. Blue Team (defensa) usa contraseñas largas, 2FA y gestores. Entender los ataques es fundamental para construir defensas efectivas.',explain:'Conocer los ataques te ayuda a entender por qué las defensas son necesarias.'},
   {type:'tf',char:'🌐',q:'Las preguntas de seguridad (nombre de mascota, ciudad natal) son tan seguras como una contraseña fuerte.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'Las respuestas a preguntas de seguridad son fácilmente investigables en redes sociales. Usa respuestas falsas y guárdalas en tu gestor.'},
   {type:'choice',char:'📊',q:'¿Qué es una "brecha de datos"?',choices:[{e:'🔧',t:'Error técnico en una app'},{e:'🚨',t:'Filtración de datos de usuarios de un servicio',ok:true},{e:'📉',t:'Caída del servidor'},{e:'🌐',t:'Corte de internet'}],theory:'Las afirmaciones en ciberseguridad requieren conocimiento técnico. Piensa en las consecuencias reales antes de responder verdadero o falso.',explain:'En brechas, millones de contraseñas quedan expuestas. Usa haveibeenpwned.com para verificar si tu email fue comprometido.'}],
  [{type:'choice',char:'🔐',q:'¿Cuál es el mayor riesgo de reutilizar contraseñas?',choices:[{e:'😴',t:'Es más difícil recordarlas'},{e:'⚡',t:'Un hackeo expone TODAS tus cuentas',ok:true},{e:'📶',t:'Reduce la velocidad de conexión'},{e:'🎨',t:'Las páginas se ven diferente'}],theory:'Con credential stuffing automatizado, los bots prueban millones de combinaciones robadas en miles de sitios por hora. Si una de tus contraseñas reutilizadas aparece en una brecha, todas las cuentas donde la usas quedan expuestas simultáneamente.',explain:'El "credential stuffing" usa una contraseña robada para acceder automáticamente a decenas de servicios.'},
   {type:'tf',char:'📱',q:'Una contraseña de 8 caracteres con mayúsculas, números y símbolos es suficientemente segura hoy en día.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'Con hardware moderno, una contraseña de 8 caracteres puede romperse en horas. Usa mínimo 12-16 caracteres.'},
   {type:'choice',char:'🎭',q:'¿Qué es el "credential stuffing"?',choices:[{e:'📦',t:'Rellenar formularios web'},{e:'🤖',t:'Probar contraseñas robadas en múltiples sitios',ok:true},{e:'🔑',t:'Crear contraseñas automáticamente'},{e:'📧',t:'Spam de correos con links'}],theory:'Las afirmaciones en ciberseguridad requieren conocimiento técnico. Piensa en las consecuencias reales antes de responder verdadero o falso.',explain:'Atacantes compran bases de datos de contraseñas robadas y las prueban automáticamente en cientos de servicios.'},
   {type:'pair',char:'🔗',q:'Relaciona la longitud con el tiempo estimado para romper (fuerza bruta):',left:['6 caracteres','10 caracteres','14 caracteres','20 caracteres'],right:['⚡ Segundos','🕐 Horas','📅 Años','♾️ Siglos'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'Cada carácter adicional multiplica las posibilidades por 95. 8 chars: horas con GPU. 12 chars: siglos. 16 chars: más que la edad del universo. La longitud es el factor más impactante en la seguridad de una contraseña.',explain:'Cada carácter adicional multiplica el tiempo de ataque exponencialmente.'},
   {type:'tf',char:'🔒',q:'Activar la verificación en dos pasos es más importante que tener una contraseña perfecta.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:true,explain:'El 2FA neutraliza contraseñas robadas. Incluso con una contraseña débil, el 2FA bloquea el acceso no autorizado.'},
   {type:'choice',char:'🌐',q:'¿Qué sitio te permite saber si tu email apareció en una brecha de datos?',choices:[{e:'🔍',t:'google.com'},{e:'🔐',t:'haveibeenpwned.com',ok:true},{e:'🛡️',t:'antivirus.com'},{e:'📧',t:'gmail.com/security'}],theory:'HaveIBeenPwned.com (HIBP) contiene más de 12 mil millones de cuentas de cientos de brechas. Creado por Troy Hunt, experto de Microsoft. Verifica tu email regularmente y activa alertas para ser notificado en nuevas brechas.',explain:'HaveIBeenPwned recopila brechas y te alerta si tu email o contraseña fue expuesta. ¡Verifica tu email ahora!'}],
];
const POOL_PHISHING=[
  [{type:'choice',char:'🎯',q:'¿Qué es el "spear phishing"?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'🎣',t:'Phishing masivo a millones de personas'},{e:'🎯',t:'Ataque personalizado con info tuya',ok:true},{e:'📧',t:'Spam publicitario'},{e:'🦠',t:'Tipo de virus'}],explain:'El spear phishing usa información de tus redes sociales para crear mensajes convincentes y personalizados.'},
   {type:'tf',char:'🌐',q:'Un sitio con el candado verde (HTTPS) es completamente seguro y confiable.',ans:false,theory:'Spear phishing es phishing personalizado: el atacante investiga a la víctima en LinkedIn y redes sociales. Crea emails con nombre, empresa y cargo reales. Tiene tasa de éxito 3 veces mayor que el phishing masivo.',explain:'HTTPS solo cifra la conexión. El sitio puede seguir siendo fraudulento. Verifica siempre el dominio completo.'},
   {type:'choice',char:'🔗',q:'¿Cuál de estos dominios parece el sitio real de PayPal?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'❌',t:'paypal-secure.com'},{e:'❌',t:'paypal.account-verify.net'},{e:'✅',t:'paypal.com/login',ok:true},{e:'❌',t:'secure-paypal.co'}],explain:'El dominio real es siempre la parte ANTES del primer "/". Solo "paypal.com" es el real.'},
   {type:'pair',char:'🔗',q:'Relaciona la táctica con el tipo de phishing:',left:['Email masivo genérico','SMS con link urgente','Llamada de "soporte técnico"','Perfil falso en LinkedIn'],right:['📧 Phishing','📱 Smishing','📞 Vishing','🤝 Social engineering'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'Cada canal de phishing explota una confianza distinta: Email (familiaridad), SMS/Smishing (inmediatez), Voz/Vishing (autoridad), QR codes (curiosidad), Redes sociales (confianza social). El pretexto se adapta al canal usado.',explain:'Los atacantes usan múltiples canales. Mantén el mismo nivel de sospecha en todos.'},
   {type:'tf',char:'📞',q:'Si alguien te llama diciendo ser de Microsoft y que tu PC tiene un virus, es una estafa casi segura.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:true,explain:'Microsoft, Google, Apple NUNCA te llaman por iniciativa propia. Cuelga y reporta el número.'},
   {type:'choice',char:'🚨',q:'¿Cómo reportas un intento de phishing?',choices:[{e:'😤',t:'Lo ignoro y sigo con mi vida'},{e:'📧',t:'Lo reenvío al correo real de la empresa + reporto como spam',ok:true},{e:'↩️',t:'Respondo diciéndoles que sé que es phishing'},{e:'🗑️',t:'Solo lo elimino'}],theory:'En Colombia reporta al CAI Virtual de la Policía Nacional (caivirtual.policia.gov.co). También reporta a tu proveedor de email, a la organización suplantada y a PhishTank.com. Reportar protege a otros usuarios de caer en el mismo ataque.',explain:'Reenvía el correo a phishing@[empresa].com y usa el botón "Reportar spam/phishing" de tu gestor de correo.'}],
  [{type:'choice',char:'🌐',q:'¿Qué hace que un sitio web sea claramente falso?',choices:[{e:'🎨',t:'Tiene muchos colores'},{e:'🔗',t:'El dominio no coincide con la empresa real',ok:true},{e:'⚡',t:'Carga muy rápido'},{e:'📱',t:'No tiene versión móvil'}],theory:'Indicadores de sitio falso: dominio incorrecto, certificado SSL de dominio diferente, errores tipográficos, formularios que piden más datos de lo normal, URL con IP numérica y redirecciones inesperadas al navegar por el sitio.',explain:'Siempre verifica que el dominio sea exactamente el oficial. "faceb00k.com" no es Facebook.'},
   {type:'tf',char:'📱',q:'Los atacantes pueden falsificar el nombre del remitente en un correo electrónico para que parezca legítimo.',ans:true,theory:'VERDADERO. El email spoofing permite poner cualquier nombre en el campo visible \'De\'. Solo el dominio técnico en los encabezados del mensaje es verificable. Por eso el nombre visible NO es garantía de autenticidad.',explain:'El "email spoofing" permite mostrar cualquier nombre de remitente. Por eso debes verificar el dominio real, no solo el nombre mostrado.'},
   {type:'choice',char:'🎁',q:'Un correo dice "Ganaste $500 — confirma tus datos bancarios para recibir tu premio". ¿Qué es?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'🎉',t:'Un concurso real que gané'},{e:'🎣',t:'Phishing clásico de "premio falso"',ok:true},{e:'📊',t:'Una encuesta de marketing'},{e:'🏦',t:'Mi banco verificando mi cuenta'}],explain:'Los "premios falsos" son uno de los vectores más comunes. Nunca ganaste nada que no pediste.'},
   {type:'pair',char:'🔗',q:'¿Señal de ALERTA o señal de que es LEGÍTIMO?',left:['Link que no coincide al pasar mouse','Lleva años siendo tu contacto','Pide datos urgentes por email','Tiene tu nombre completo correcto'],right:['🚨 URL destino oculta o falsa','✅ Relación de confianza establecida','🚨 Urgencia para que no pienses','✅ Señal de personalización real'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'Relacionar conceptos de ataque y defensa construye un mapa mental claro del ecosistema de seguridad digital.',explain:'Ninguna señal aislada garantiza legitimidad. Evalúa múltiples factores y ante la duda, verifica por canal oficial.'},
   {type:'tf',char:'🔑',q:'Si recibes un código 2FA por SMS que no pediste, alguien está intentando entrar a tu cuenta.',ans:true,theory:'Si recibes un código 2FA sin solicitarlo, alguien tiene tu contraseña y está intentando entrar AHORA. Acciones inmediatas: NO compartes el código, cambia tu contraseña y activa autenticación con app en lugar de SMS.',explain:'Un código 2FA no solicitado significa que alguien tiene tu contraseña y está intentando el segundo factor. Cambia tu contraseña inmediatamente.'},
   {type:'choice',char:'👤',q:'¿Qué es el "pretexting" en ingeniería social?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'📝',t:'Escribir textos falsos'},{e:'🎭',t:'Inventar un escenario para manipularte',ok:true},{e:'💻',t:'Tipo de malware'},{e:'📧',t:'Correo con texto largo'}],explain:'En el pretexting, el atacante inventa una historia creíble ("soy de IT, necesito tu acceso para una actualización urgente") para manipularte.'}]
];
const POOL_MALWARE=[
  [{type:'choice',char:'💾',q:'¿Por qué es peligroso descargar software "crackeado" o pirata?',choices:[{e:'⚖️',t:'Solo porque es ilegal'},{e:'🦠',t:'Frecuentemente viene con malware incluido',ok:true},{e:'🐌',t:'Funciona más lento'},{e:'💔',t:'No tiene soporte técnico'}],theory:'Pretexting crea un escenario falso para extraer información: el atacante finge ser técnico de TI o auditor. Kevin Mitnick, el hacker más famoso, obtenía más acceso con pretexting que con exploits técnicos.',explain:'Los cracks y keygens son los vectores más comunes de troyanos y ransomware. El precio de "gratis" puede ser tu información bancaria.'},
   {type:'tf',char:'🔄',q:'Actualizar el sistema operativo regularmente reduce significativamente el riesgo de infección.',ans:true,theory:'Las CVE (Common Vulnerabilities and Exposures) son fallos de seguridad documentados publicamente. Cuando un fabricante publica un parche, tambien revela el fallo — los hackers usan esa info para atacar sistemas sin actualizar.',explain:'Las actualizaciones corrigen vulnerabilidades (CVEs) que el malware explota. Un sistema desactualizado es una puerta abierta.'},
   {type:'choice',char:'📎',q:'Recibes un email con adjunto "Factura_2024.pdf.exe". ¿Qué es?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'📄',t:'Un PDF normal con doble extensión'},{e:'🦠',t:'Un ejecutable malicioso disfrazado de PDF',ok:true},{e:'🔒',t:'Un PDF protegido con contraseña'},{e:'📝',t:'Un documento de Office'}],explain:'Los archivos .exe disfrazados de PDFs son un truco clásico. Windows oculta extensiones por defecto — activa mostrarlas siempre.'},
   {type:'pair',char:'🔗',q:'¿Software legítimo o posible malware?',left:['App descargada de la App Store','Crack de Photoshop en foro','Antivirus de marca conocida','Plugin de sitio web sospechoso'],right:['✅ Revisado por App Store/Play Store','🚨 Muy probable que incluya malware','✅ Protección activa y verificada','🚨 Puede robar datos del navegador'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'La extensión doble oculta que el archivo es ejecutable. Windows muestra \'Factura_2024.pdf\' ocultando el \'.exe\'. Al ejecutarlo, corre código malicioso con tus permisos. Nunca abras adjuntos no solicitados independientemente de la extensión visible.',explain:'Las tiendas oficiales tienen procesos de revisión. Las fuentes no oficiales no tienen ningún control de seguridad.'},
   {type:'tf',char:'🛡️',q:'Un antivirus es suficiente para protegerte completamente de todas las amenazas de malware.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'Los antivirus no detectan el 100% de amenazas, especialmente malware nuevo (zero-day). Son una capa de defensa, no la única.'},
   {type:'choice',char:'💥',q:'Tu empresa fue atacada por ransomware. ¿Cuál es el primer paso correcto?',choices:[{e:'💰',t:'Pagar el rescate inmediatamente'},{e:'🔌',t:'Desconectar los equipos de la red',ok:true},{e:'🔄',t:'Reiniciar los equipos'},{e:'🗑️',t:'Borrar todos los archivos cifrados'}],theory:'El ransomware cifra tus archivos y se propaga por la red local infectando otros equipos. Cada segundo conectado puede significar mas archivos cifrados. La desconexion inmediata limita el dano.',explain:'Desconectar de la red evita que el ransomware siga cifrando y propagándose. Luego contacta a expertos en ciberseguridad.'}],
  [{type:'choice',char:'📱',q:'¿Qué debes hacer antes de instalar una app en tu teléfono?',choices:[{e:'⬇️',t:'Instalarla y ver qué pasa'},{e:'🔍',t:'Revisar permisos, reseñas y desarrollador',ok:true},{e:'💰',t:'Comprarla siempre que sea posible'},{e:'📧',t:'Enviarte el link por email'}],theory:'Checklist: descarga solo de tiendas oficiales, revisa permisos vs función declarada (¿por qué una linterna pide acceso a contactos?), lee reseñas recientes, verifica el desarrollador es quien dice ser y revisa la fecha de actualización.',explain:'Una app de linterna no necesita acceso a tus contactos. Los permisos excesivos son señal de app maliciosa.'},
   {type:'tf',char:'📧',q:'Solo los archivos .exe pueden infectar tu computador con malware.',ans:false,theory:'FALSO. El malware se esconde en: documentos Office con macros (.doc, .xls), PDFs con JavaScript, scripts (.js, .ps1, .bat), archivos comprimidos y hasta fuentes (.ttf). La extensión no determina la seguridad de un archivo.',explain:'Documentos Word, PDFs, scripts y hasta imágenes pueden contener malware. Desconfía de cualquier archivo de fuente desconocida.'},
   {type:'choice',char:'🔒',q:'¿Qué es el "ransomware-as-a-service" (RaaS)?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'🛡️',t:'Servicio de protección contra ransomware'},{e:'😈',t:'Alquiler de ransomware a otros atacantes',ok:true},{e:'💾',t:'Software de recuperación de datos'},{e:'🔧',t:'Herramienta de backup'}],explain:'En el RaaS, hackers alquilan su ransomware a otros criminales por un porcentaje del rescate. Es un "negocio" criminal organizado.'},
   {type:'pair',char:'🔗',q:'¿Cuál es el mejor método de defensa?',left:['Ransomware','Spyware','Troyano','Adware'],right:['💾 Backups regulares','🔒 Antivirus + VPN','🛡️ Solo instalar apps oficiales','🔍 Bloqueador de anuncios'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'RaaS democratizó el cibercrimen: grupos como LockBit crean el ransomware y lo alquilan a afiliados sin conocimientos técnicos a cambio del 20-30% del rescate. Esto explica el crecimiento explosivo de ataques desde 2018.',explain:'Cada tipo de malware tiene su mejor contramedida. Los backups son tu salvavidas contra ransomware.'},
   {type:'tf',char:'☁️',q:'Los archivos almacenados en la nube (Google Drive, Dropbox) están completamente protegidos del ransomware.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'El ransomware puede cifrar archivos sincronizados en la nube. Mantén versiones antiguas habilitadas en tu servicio de nube.'},
   {type:'choice',char:'🧹',q:'Tu PC está infectado con malware. ¿Cuál es el proceso correcto?',choices:[{e:'🔄',t:'Reiniciar y esperar'},{e:'🛡️',t:'Desconectar de internet, ejecutar antivirus, restaurar desde backup',ok:true},{e:'💰',t:'Pagar al hacker'},{e:'🗑️',t:'Borrar todo y reinstalar sin backup'}],theory:'Las afirmaciones en ciberseguridad requieren conocimiento técnico. Piensa en las consecuencias reales antes de responder verdadero o falso.',explain:'Desconectar evita propagación. El antivirus limpia. El backup restaura. En ese orden.'}]
];
const POOL_NETWORKS=[
  [{type:'choice',char:'☕',q:'Estás en un café con WiFi gratuito. ¿Qué actividad es la más segura?',choices:[{e:'🏦',t:'Revisar tu cuenta bancaria'},{e:'📰',t:'Leer noticias en sitios con HTTPS',ok:true},{e:'💳',t:'Hacer una compra online'},{e:'📧',t:'Acceder a tu email de trabajo'}],theory:'En una red WiFi publica, otros usuarios pueden capturar tu trafico con herramientas gratuitas como Wireshark. Sin cifrado, tus contrasenas y datos viajan en texto plano, visibles para cualquiera en la red.',explain:'En WiFi público, limítate a navegación de bajo riesgo. Para acciones sensibles, usa datos móviles o VPN.'},
   {type:'tf',char:'🔐',q:'Una VPN hace que tu conexión sea completamente anónima e imposible de rastrear.',ans:false,theory:'Una VPN (Red Privada Virtual) crea un tunel cifrado entre tu dispositivo y un servidor VPN. Todo tu trafico pasa por ese tunel cifrado, haciendo imposible que alguien en la misma red WiFi lo intercepte.',explain:'La VPN cifra tu tráfico y oculta tu IP al proveedor de internet, pero la VPN misma puede ver tu actividad. No es anonimato total.'},
   {type:'choice',char:'🏠',q:'¿Cuál es la configuración de seguridad recomendada para tu router doméstico?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'🔓',t:'Sin contraseña para mayor comodidad'},{e:'🔑',t:'WPA3 o WPA2 con contraseña fuerte',ok:true},{e:'📡',t:'WEP, es el más antiguo y probado'},{e:'🌐',t:'Red abierta con portal de login'}],explain:'WEP es obsoleto y rompible en minutos. WPA3 es el estándar actual. Cambia siempre la contraseña del router por defecto.'},
   {type:'pair',char:'🔗',q:'¿Qué protocolo es más seguro?',left:['HTTP','HTTPS','FTP','SFTP'],right:['⚠️ Datos en texto plano (web)','✅ Cifrado TLS — candado en browser','⚠️ Archivos sin ningún cifrado','✅ Cifrado SSH — transferencia segura'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'SFTP usa SSH para cifrar toda la sesión. FTP transmite en claro. La regla: si el protocolo empieza o termina con \'S\' (SFTP, FTPS, HTTPS, SSH) generalmente indica cifrado. FTP, HTTP y Telnet son legados inseguros.',explain:'Siempre prefiere protocolos con cifrado. La "S" al final generalmente indica una versión segura del protocolo.'},
   {type:'tf',char:'🕵️',q:'En un ataque "Man in the Middle", el atacante puede leer y modificar tus datos en tiempo real.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:true,explain:'En redes no cifradas, el atacante se posiciona entre tú y el servidor, pudiendo leer credenciales y modificar contenido.'},
   {type:'choice',char:'📡',q:'¿Cómo sabes si la red WiFi a la que te conectas es segura?',choices:[{e:'📶',t:'Si tiene buena señal'},{e:'🔒',t:'Verificando el nombre con el establecimiento + usando HTTPS/VPN',ok:true},{e:'🌐',t:'Si carga páginas rápido'},{e:'📋',t:'Si aparece en la lista de redes conocidas'}],theory:'Red segura: usa WPA2/WPA3, tiene contraseña única no predeterminada, el nombre no imita redes conocidas y está en lugar donde confías en el administrador. En redes públicas siempre asume que alguien podría monitorear el tráfico.',explain:'Los atacantes crean redes falsas con nombres similares ("CafeLucia_Free" vs "CafeLucia"). Confirma el nombre exacto.'}],
  [{type:'choice',char:'🔵',q:'¿Cuál es el riesgo principal del Bluetooth activado en público?',choices:[{e:'🔋',t:'Consume más batería'},{e:'🦷',t:'Ataques "Bluejacking" o "Bluesnarfing"',ok:true},{e:'📶',t:'Interfiere con el WiFi'},{e:'🌡️',t:'Calienta el teléfono'}],theory:'Con Bluetooth activo eres vulnerable a Bluejacking (mensajes no solicitados), Bluesnarfing (robo de datos) y Bluebugging (control remoto del dispositivo) hasta 100 metros de distancia. Activa Bluetooth solo cuando lo uses activamente.',explain:'Con Bluetooth activo en público, atacantes cercanos pueden enviar datos no solicitados o robar información de tu dispositivo.'},
   {type:'tf',char:'🔒',q:'El modo "incógnito" del navegador te protege de ser rastreado por sitios web y hackers.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'El modo incógnito solo evita que el historial se guarde LOCALMENTE. Sitios web, tu ISP y hackers en la red aún pueden verte.'},
   {type:'choice',char:'🌐',q:'¿Qué es el "DNS poisoning" o envenenamiento DNS?',choices:[{e:'🍕',t:'Un virus que daña tu disco duro'},{e:'🔀',t:'Redirigir dominios legítimos a sitios maliciosos',ok:true},{e:'📧',t:'Spam de correos masivos'},{e:'🔑',t:'Robo de contraseñas WiFi'}],theory:'Las afirmaciones en ciberseguridad requieren conocimiento técnico. Piensa en las consecuencias reales antes de responder verdadero o falso.',explain:'El envenenamiento DNS hace que "banco.com" te lleve a un sitio falso. Por eso usar DNS seguros (como 1.1.1.1 de Cloudflare) es importante.'},
   {type:'pair',char:'🔗',q:'Relaciona la práctica con el nivel de riesgo en WiFi público:',theory:'Relacionar ataques con sus defensas construye un mapa mental del ecosistema de seguridad digital. Cada par refuerza tu capacidad de respuesta.',left:['Usar VPN activa','Banca online sin protección','Solo leer noticias HTTPS','Descargar archivos desconocidos'],right:['🛡️ Bajo riesgo','🚨 Alto riesgo','✅ Riesgo mínimo','🚨 Muy alto riesgo'],pairs:[[0,0],[1,1],[2,2],[3,3]],explain:'La VPN es el escudo principal en WiFi público. Sin ella, cualquier actividad sensible es arriesgada.'},
   {type:'tf',char:'🏠',q:'Cambiar la contraseña predeterminada de tu router es una de las medidas de seguridad más importantes.',ans:true,theory:'VERDADERO. Los routers vienen con contraseñas públicamente conocidas (admin/admin). Un atacante en tu red puede acceder al router con estas credenciales y redirigir todo tu tráfico (DNS hijacking). Cambiarla toma 2 minutos.',explain:'Las contraseñas por defecto de routers son públicamente conocidas. Un router con contraseña por defecto es un acceso abierto a tu red doméstica.'},
   {type:'choice',char:'🔍',q:'¿Qué significa cuando un sitio muestra "Conexión no segura" en el navegador?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'😴',t:'El servidor está lento'},{e:'⚠️',t:'Los datos que envíes podrían ser interceptados',ok:true},{e:'🎨',t:'El diseño del sitio está desactualizado'},{e:'📱',t:'No es compatible con móviles'}],explain:'Sin HTTPS, cualquier dato que envíes (contraseñas, datos personales) viaja en texto plano y puede ser leído por quien intercepte la conexión.'}]
];
const POOL_ACCOUNTS=[
  [{type:'choice',char:'🔐',q:'¿Cuál es la app de 2FA más segura?',choices:[{e:'📱',t:'Código por SMS'},{e:'✅',t:'Google Authenticator o Authy',ok:true},{e:'📧',t:'Código por email'},{e:'📞',t:'Llamada de voz'}],theory:'Las apps TOTP (Authy, Google Authenticator, Microsoft Authenticator) generan códigos de 6 dígitos que cambian cada 30 segundos. Authy tiene backup cifrado en la nube, protegiendo contra pérdida del teléfono. Todas son superiores al SMS.',explain:'Las apps de autenticación generan códigos localmente y no dependen de la red telefónica, haciéndolos más seguros que el SMS.'},
   {type:'tf',char:'📲',q:'El 2FA por SMS puede ser vulnerado mediante ataques de "SIM swapping".',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:true,explain:'En el SIM swapping, el atacante convence a tu operador de transferir tu número a su SIM. Por eso las apps de autenticación son más seguras.'},
   {type:'choice',char:'🌐',q:'¿Qué información personal NO deberías publicar en redes sociales?',choices:[{e:'📸',t:'Fotos de viajes ya pasados'},{e:'🏠',t:'Tu dirección exacta y horarios',ok:true},{e:'🎂',t:'Que celebraste tu cumpleaños'},{e:'🍕',t:'Tu restaurante favorito'}],theory:'SIM swapping: el atacante convence al operador de portar tu número a su SIM. Desde ese momento recibe todos tus SMS, incluyendo códigos 2FA bancarios. Protección: usar apps de autenticación (TOTP) en lugar de SMS para el 2FA.',explain:'Tu dirección + horarios permite a ladrones saber cuándo no estás. Los datos personales alimentan el spear phishing.'},
   {type:'pair',char:'🔗',q:'Relaciona la acción con su impacto en seguridad:',left:['Activar 2FA en email','Usar mismo usuario/contraseña en todo','Revisar apps con acceso a tu cuenta','Publicar tu teléfono en redes sociales'],right:['🛡️ Muy bueno','🚨 Muy malo','🛡️ Bueno','⚠️ Riesgo'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'Cada acción tiene un perfil de riesgo: WiFi público sin VPN (alto), HTTPS activo (protegido), HTTP con contraseña (crítico), VPN en red pública (protegido), compartir contraseña WiFi (riesgo controlado si confías en quien la recibe).',explain:'El email es la llave maestra de todas tus cuentas. Protegerlo con 2FA es la medida más importante que puedes tomar.'},
   {type:'tf',char:'📊',q:'Si descubres que una de tus cuentas fue hackeada, solo necesitas cambiar la contraseña de esa cuenta.',ans:false,theory:'FALSO. Si reutilizabas esa contraseña, cámbiala en TODOS los servicios donde la usabas. Además: activa 2FA, revisa sesiones activas, verifica que no cambiaron el email de recuperación y monitorea actividad inusual.',explain:'Si reutilizabas contraseñas, cambia TODAS las afectadas. Activa 2FA, revisa sesiones activas y busca posibles daños.'},
   {type:'choice',char:'🔍',q:'¿Dónde puedes verificar si tu email fue expuesto en una brecha de datos?',choices:[{e:'🌐',t:'haveibeenpwned.com',ok:true},{e:'📧',t:'Preguntando a tu proveedor de email'},{e:'🔒',t:'Intentando iniciar sesión en todos lados'},{e:'📱',t:'Revisando la app de tu banco'}],theory:'HaveIBeenPwned.com contiene más de 12 mil millones de cuentas de cientos de brechas. Creado por Troy Hunt. Verifica regularmente y activa alertas para ser notificado en nuevas brechas que incluyan tu email.',explain:'HaveIBeenPwned.com es una base de datos de brechas de seguridad. Verifica tu email regularmente y activa alertas.'}],
  [{type:'choice',char:'🔑',q:'¿Qué debes hacer PRIMERO si crees que te hackearon el email?',choices:[{e:'📧',t:'Enviar un email a todos tus contactos'},{e:'🔐',t:'Cambiar contraseña + activar 2FA desde dispositivo seguro',ok:true},{e:'😴',t:'Esperar a que el hacker salga solo'},{e:'🗑️',t:'Borrar la cuenta y crear una nueva'}],theory:'Primer paso: cambiar la contraseña INMEDIATAMENTE desde un dispositivo diferente al posiblemente comprometido. Luego: cerrar todas las sesiones activas, verificar email de recuperación y teléfono, activar 2FA y revisar reglas de reenvío creadas.',explain:'Desde un dispositivo limpio (no el comprometido), cambia la contraseña inmediatamente y activa 2FA. Luego revisa qué accedieron.'},
   {type:'tf',char:'📱',q:'Dar permisos de "acceso total" a una app de juegos es inofensivo si la app es popular.',theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'Apps populares también pueden ser vectores de robo de datos. Solo otorga permisos mínimos necesarios para la función de la app.'},
   {type:'choice',char:'🌐',q:'¿Cuál es el riesgo de conectar tu cuenta de Facebook a otras aplicaciones?',choices:[{e:'📶',t:'Ninguno, es una función oficial'},{e:'🔐',t:'La app puede acceder a tus datos de Facebook',ok:true},{e:'📧',t:'Te llega más spam'},{e:'🐌',t:'Facebook se vuelve más lento'}],theory:'Cada app conectada recibe un token de acceso OAuth. Si esa app es hackeada o maliciosa, expone tu cuenta. Revisa y revoca periódicamente en Configuración → Apps y sitios web. Muchos usuarios tienen decenas de apps conectadas que olvidaron.',explain:'Al conectar apps con Facebook/Google, les das acceso a tu perfil, contactos y a veces a publicar en tu nombre. Revisa y revoca accesos no usados.'},
   {type:'pair',char:'🔗',q:'Relaciona el tipo de ataque con cómo protegerte:',left:['Hackeo de contraseña','SIM swapping','Sesión robada','App maliciosa'],right:['🔑 Contraseña fuerte + 2FA por app','📞 Bloqueo de portabilidad con operador','🚪 Cerrar sesión en todos lados','🏪 Solo instalar desde tiendas oficiales'],pairs:[[0,0],[1,1],[2,2],[3,3]],theory:'Contramedidas específicas: Phishing → verificar dominio y links, Fuerza bruta → contraseña larga + 2FA, SIM swapping → 2FA con app no SMS, Robo de sesión → cerrar sesión en dispositivos públicos, Credential stuffing → contraseñas únicas por servicio.',explain:'Cada vector de ataque tiene su contramedida específica. La defensa en capas es la estrategia más efectiva.'},
   {type:'tf',char:'👁️',q:'Los empleados de redes sociales pueden leer tus mensajes privados.',ans:true,theory:'VERDADERO en la mayoría. Solo las apps con cifrado E2E real (Signal, WhatsApp para chats individuales, Telegram en chats secretos) garantizan que nadie más puede leer los mensajes. Facebook Messenger sin \'modo secreto\' no tiene E2E por defecto.',explain:'Los mensajes en plataformas como Instagram o Twitter NO están cifrados de extremo a extremo. Para mensajes privados realmente seguros, usa Signal o WhatsApp con cifrado E2E.'},
   {type:'choice',char:'🔒',q:'¿Qué es el "principle of least privilege" aplicado a tu vida digital?',theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'💰',t:'Pagar lo mínimo por servicios online'},{e:'🔑',t:'Dar a cada app solo los permisos mínimos necesarios',ok:true},{e:'📱',t:'Tener el menor número de apps posible'},{e:'🌐',t:'Usar internet lo menos posible'}],explain:'El principio de mínimo privilegio limita el daño si una app es comprometida. Una app que no tiene acceso a tus fotos, no puede robarlas.'}]
];

/* ── Escenarios visuales para phishing (email, SMS, WhatsApp, browser) ── */
const VISUAL_PHISHING_SCENARIOS=[
  {type:'scenario',char:'🌐',q:'Recibes este link por email. ¿El sitio es legítimo o falso?',
   scenario:{type:'browser',url:'bancolombia-verificacion-segura.net/login',urlSafe:false,
     siteName:'Bancolombia — Área Segura',tagline:'Verifica tu identidad para continuar',
     brandEmoji:'🏦',brandColor:'#ffd100',field1:'Número de cédula',field2:'••••••••••',
     btnLabel:'Verificar identidad',btnColor:'red',showWarning:false},
   choices:[{e:'✅',t:'Es legítimo, tiene el diseño oficial'},{e:'🎣',t:'Falso — dominio sospechoso, no es bancolombia.com',ok:true}],
   theory:'Para verificar un dominio: identifica el dominio raíz. En \'seguro.bancolombia-verify.com\', el dominio real es \'bancolombia-verify.com\', no \'bancolombia\'. Los subdominios no cambian el dominio real.',explain:'El dominio real de Bancolombia es bancolombia.com. Cualquier variación como "bancolombia-verificacion-segura.net" es una copia. Los atacantes compran dominios similares para engañar.'},

  {type:'scenario',char:'🌐',q:'¿Esta página de Google para iniciar sesión es real?',
   scenario:{type:'browser',url:'google-accounts-security.com/signin',urlSafe:false,
     siteName:'Google — Acceso a tu cuenta',tagline:'Un mismo acceso. Todo Google.',
     brandEmoji:'🔵',brandColor:'#4285f4',field1:'Correo electrónico o teléfono',field2:'••••••••',
     btnLabel:'Siguiente',btnColor:'',showWarning:false},
   choices:[{e:'✅',t:'Sí, tiene el logo y diseño de Google'},{e:'🎣',t:'Falso — el dominio no es accounts.google.com',ok:true}],
   theory:'La única forma de verificar: mirar la barra de dirección del navegador. \'accounts.google.com\' es legítimo. \'accounts.google.com.phishing.net\' NO es de Google. El dominio real siempre está antes del primer slash.',explain:'Google siempre usa accounts.google.com. El logo y diseño se copian en minutos. Solo el dominio revela la trampa.'},

  {type:'scenario',char:'💬',q:'Recibes este WhatsApp de un número no guardado. ¿Qué haces?',
   scenario:{type:'whatsapp',from:'+57 318 000 4567',contactSaved:false,avatar:'🏦',
     body:'🚨 ALERTA DE SEGURIDAD — Bancolombia: Detectamos acceso no autorizado a tu cuenta. Para protegerla AHORA debes confirmar tu clave dinámica. ¿Cuál es el código SMS que recibiste hace 2 minutos?',
     time:'15:47'},
   choices:[{e:'📱',t:'Doy el código para proteger mi cuenta'},{e:'🚫',t:'No comparto el código — es ingeniería social',ok:true}],
   theory:'WhatsApp phishing aumentó 300% desde 2020. Los atacantes compran números locales para mayor credibilidad. Señales: número no guardado, urgencia, link externo, solicitud de datos. Nunca interactúes sin verificar.',explain:'Ningún banco pedirá tu clave dinámica por WhatsApp. Usan urgencia para que entregues el código 2FA antes de pensar. Cuelga y llama al número oficial del banco.'},

  {type:'scenario',char:'💬',q:'Tu "amigo" te escribe por WhatsApp pidiendo dinero urgente. ¿Qué haces?',
   scenario:{type:'whatsapp',from:'Carlos Gómez (amigo)',contactSaved:true,avatar:'👤',
     body:'Hola! Estoy en una emergencia, me robaron el celular y la billetera en el transporte. Necesito que me hagas una transferencia de $200.000 urgente a esta cuenta Nequi: 3001234567. Te devuelvo mañana al 100%, por favor es muy urgente 🙏🙏',
     time:'22:13'},
   choices:[{e:'💸',t:'Transfiero de inmediato, es mi amigo'},{e:'📞',t:'Llamo a su número antes de transferir',ok:true}],
   theory:'Los escenarios reales te entrenan para detectar amenazas en contexto. Analiza cada detalle antes de actuar.',explain:'Los estafadores hackean o clonan cuentas de WhatsApp de tus contactos. SIEMPRE llama por voz antes de transferir. Si no contesta, busca otro medio de contacto.'},
];

function generatePasswordQuestions(seed){return POOL_PASSWORDS[seed%POOL_PASSWORDS.length]}
function generatePhishingQuestions(seed){
  const pool=POOL_PHISHING[seed%POOL_PHISHING.length];
  /* Inyecta 1 escenario visual rotando por el pool visual */
  const vis=VISUAL_PHISHING_SCENARIOS[seed%VISUAL_PHISHING_SCENARIOS.length];
  return [vis,...pool.slice(0,5)];
}
function generateMalwareQuestions(seed){return POOL_MALWARE[seed%POOL_MALWARE.length]}
function generateNetworkQuestions(seed){return POOL_NETWORKS[seed%POOL_NETWORKS.length]}
function generateAccountQuestions(seed){return POOL_ACCOUNTS[seed%POOL_ACCOUNTS.length]}


/* ═══════════════════════════════════════════════════════
   DATA — 5 UNITS × 10 ACTIVITIES × 6 QUESTIONS
═══════════════════════════════════════════════════════ */
const UNITS = [
{
  id:'passwords', icon:'🔑', label:'Contraseñas', color:'#58cc02', colorD:'#46a302',
  section:'SECCIÓN 1',
  desc:'Aprende a crear y gestionar contraseñas seguras que protejan tus cuentas.',
  activities:[
    {
      title:'¿Qué es una contraseña fuerte?',
      difficulty:'bajo',
      questions:[
        {type:'choice',char:'🔑',q:'¿Cuál de estas contraseñas es la MÁS segura?',
         choices:[{e:'😸',t:'gatito123'},{e:'🏠',t:'casa2024'},{e:'🔐',t:'Tr0mb0n@#9!',ok:true},{e:'👶',t:'juan1990'}],
         theory:'Las contrasenas se atacan con fuerza bruta (probando todas las combinaciones). Cada caracter extra multiplica exponencialmente las combinaciones: 6 chars = 1 millon, 12 chars = 1 billon. La longitud es tu mejor defensa.',explain:'Una contraseña fuerte tiene +12 caracteres, mezcla mayúsculas, números y símbolos especiales.'},
        {type:'tf',char:'🤔',q:'Usar la misma contraseña en todos tus servicios web es seguro porque es difícil de adivinar.',
         ans:false,theory:'El credential stuffing es un ataque automatizado donde bots prueban contrasenas robadas de un sitio en cientos de otros servicios. Cada ano se filtran miles de millones de credenciales en la dark web.',explain:'Si un solo sitio es hackeado, tendrán acceso a TODAS tus cuentas. Usa contraseñas únicas.'},
        {type:'choice',char:'📏',q:'¿Cuál es la longitud mínima recomendada para una contraseña segura?',
         choices:[{e:'4️⃣',t:'4 caracteres'},{e:'6️⃣',t:'6 caracteres'},{e:'🔢',t:'8 caracteres'},{e:'✅',t:'12+ caracteres',ok:true}],
         theory:'Tiempo estimado para romper por fuerza bruta con hardware moderno: 6 chars = segundos, 8 chars = horas, 10 chars = semanas, 12 chars = siglos. Cada caracter multiplica el tiempo de ataque.',explain:'Contraseñas de 12+ caracteres son exponencialmente más difíciles de descifrar con ataques de fuerza bruta.'},
        {type:'pair',char:'🔗',q:'Relaciona cada contraseña con su nivel de seguridad:',
         theory:'Relacionar ataques con sus defensas construye un mapa mental del ecosistema de seguridad digital. Cada par refuerza tu capacidad de respuesta.',left:['123456','P@ssw0rd!23','perro','X#9mK!qRt2z'],right:['❌ Muy débil','✅ Fuerte','⚠️ Débil','✅ Muy fuerte'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         explain:'La fortaleza combina longitud + variedad de caracteres + ausencia de palabras comunes.'},
        {type:'sort',char:'📋',q:'Ordena estos pasos para crear una contraseña segura (del 1 al 4):',
         items:['Añade símbolos especiales (!@#)','Piensa en una frase de 4+ palabras','Mezcla mayúsculas y minúsculas','Verifica que sea de 12+ caracteres'],
         correct:[1,0,2,3],
         theory:'La fortaleza de una contraseña se mide por entropía (bits de aleatoriedad). Factores: longitud (cada carácter multiplica x95 las combinaciones), variedad de caracteres, aleatoriedad y ausencia en diccionarios conocidos.',explain:'Una buena contraseña parte de una frase memorable y luego se enriquece con variedad de caracteres.'},
        {type:'choice',char:'💡',q:'¿Cuál es un método fácil para crear contraseñas fuertes Y recordables?',
         choices:[{e:'📅',t:'Usar tu fecha de nacimiento'},{e:'📖',t:'Frase de 4 palabras aleatorias',ok:true},{e:'🐕',t:'Nombre de tu mascota + año'},{e:'🔢',t:'Números del 1 al 10'}],
         theory:'Las passphrases usan 4 palabras aleatorias sin relación: \'correcto-caballo-batería-grapadora\'. Son largas, fáciles de recordar y tienen alta entropía. Mucho mejor que una palabra corta con sustituciones predecibles (@=a, 3=e).',explain:'"CaballoPastelLunaRío" es fácil de recordar y muy difícil de hackear. ¡El método de la frase funciona!'},
      ]
    },
    {
      title:'Gestores de contraseñas',
      difficulty:'medio',
      questions:[
        {type:'choice',char:'🗄️',q:'¿Qué es un gestor de contraseñas?',
         choices:[{e:'📝',t:'Un cuaderno donde anoto mis claves'},{e:'🔐',t:'App que guarda tus claves cifradas',ok:true},{e:'📧',t:'Servicio que envía tus claves por email'},{e:'🧠',t:'Técnica para memorizar contraseñas'}],
         theory:'Un gestor de contrasenas usa cifrado AES-256 (el mismo que usa el ejercito). Genera contrasenas unicas y complejas por ti, y las recuerda todas. Solo necesitas recordar una contrasena maestra fuerte.',explain:'Los gestores cifran todas tus contraseñas y solo tú puedes acceder con una contraseña maestra.'},
        {type:'tf',char:'🔒',q:'Los gestores de contraseñas son peligrosos porque "ponen todos los huevos en la misma canasta".',
         theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'Los gestores usan cifrado de grado militar. Es mucho más seguro que reutilizar contraseñas débiles.'},
        {type:'choice',char:'⭐',q:'¿Cuál de estos es un gestor de contraseñas confiable?',
         choices:[{e:'📋',t:'Un archivo de texto en el escritorio'},{e:'🔑',t:'Bitwarden o 1Password',ok:true},{e:'📸',t:'Foto de las contraseñas en el celular'},{e:'🌐',t:'Guardarlas en Google Docs'}],
         theory:'Los gestores de confianza usan cifrado de conocimiento cero: ni la propia empresa puede ver tus contraseñas. Bitwarden (código abierto, gratuito), 1Password y Dashlane son los más recomendados. Evita guardar contraseñas en el navegador sin clave maestra dedicada.',explain:'Bitwarden (gratis), 1Password y LastPass son gestores reconocidos con cifrado fuerte. ¡Úsalos!'},
        {type:'tf',char:'🌐',q:'Guardar contraseñas en el navegador (Chrome, Firefox) es completamente seguro en cualquier computador.',
         theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'En computadores compartidos o comprometidos, alguien podría exportar las contraseñas del navegador fácilmente.'},
        {type:'pair',char:'🔗',q:'¿Ventaja o desventaja del gestor de contraseñas?',
         left:['Genera contraseñas únicas','Un solo punto de fallo','Relleno automático','Debes recordar 1 sola clave maestra'],
         right:['✅ Cada cuenta protegida diferente','⚠️ Si lo hackean pierdes todo','✅ Ahorra tiempo y evita errores','✅ Mucho más fácil que memorizar 50'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Los gestores son el estándar recomendado por expertos. Ventaja principal: contraseñas únicas y fuertes para cada sitio. Único riesgo: si olvidas la clave maestra. Mitígalo con una frase larga memorable y activa 2FA en el gestor mismo.',explain:'La conveniencia y la seguridad se equilibran muy bien con un gestor. El riesgo del "punto único" se mitiga con 2FA.'},
        {type:'choice',char:'🚨',q:'¿Qué debes hacer si sospechas que tu contraseña maestra fue comprometida?',
         choices:[{e:'😴',t:'Esperar a ver qué pasa'},{e:'⚡',t:'Cambiarla inmediatamente y revisar accesos',ok:true},{e:'🗑️',t:'Borrar el gestor y empezar de cero'},{e:'📞',t:'Llamar a la empresa del gestor'}],
         theory:'Protocolo: 1) Cambia la contraseña maestra desde un dispositivo confiable, 2) Revoca todas las sesiones activas del gestor, 3) Cambia las contraseñas más críticas (email, banco), 4) Revisa el historial de accesos del gestor en busca de entradas no autorizadas.',explain:'Cambia la contraseña maestra de inmediato, activa 2FA si no lo tienes y revisa el historial de accesos.'},
      ]
    },
    {
      title:'Contraseñas en el trabajo',
      difficulty:'medio',
      questions:[
        {type:'choice',char:'💼',q:'Tu jefe te pide tu contraseña de empresa por WhatsApp. ¿Qué haces?',
         theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'✅',t:'La envío, confío en mi jefe'},{e:'📞',t:'Verifico llamándolo directamente',ok:true},{e:'📧',t:'La envío por email en su lugar'},{e:'😤',t:'Me niego sin explicación'}],
         explain:'Nunca compartas contraseñas por mensajes. Primero verifica la identidad por otro canal. Podría ser suplantación.'},
        {type:'tf',char:'📝',q:'Anotar tu contraseña de trabajo en un post-it bajo el teclado es una práctica aceptable.',
         ans:false,theory:'FALSO. Nadie puede garantizar que \'nadie la ve\'. Compañeros, visitas, personal de limpieza o cualquier persona con acceso físico puede fotografiarla sin ser notada. Las contraseñas solo deben existir en gestores cifrados.',explain:'Cualquier colega, visitante o técnico de limpieza podría encontrarlo. Usa un gestor de contraseñas.'},
        {type:'sort',char:'🔄',q:'¿Cuándo debes cambiar tu contraseña de trabajo? Ordena por urgencia:',
         theory:'El orden correcto en ciberseguridad es tan crítico como las acciones mismas. Contener antes de erradicar, erradicar antes de recuperar.',items:['Sospecha de acceso no autorizado','Al terminar tu contrato','Cada 3-6 meses como rutina','Después de usar una PC compartida'],
         correct:[0,3,2,1],
         explain:'La sospecha de compromiso es siempre lo más urgente. Luego el uso en PC ajena, la rutina y finalmente al salir.'},
        {type:'choice',char:'👁️',q:'¿Qué es el "shoulder surfing"?',
         choices:[{e:'🏄',t:'Técnica de surf en hombros'},{e:'👀',t:'Espiar mientras escribes tu contraseña',ok:true},{e:'💻',t:'Hackear por WiFi'},{e:'🦠',t:'Tipo de malware'}],
         theory:'Urgencia de cambio: 1) Inmediatamente si sospechas compromiso, 2) Tras brecha confirmada, 3) Al descubrir que alguien más la conoce. Los cambios periódicos forzados sin causa llevan paradójicamente a contraseñas más débiles.',explain:'El shoulder surfing es mirar por encima del hombro. Cúbrete al escribir PINs y contraseñas en público.'},
        {type:'pair',char:'🔗',q:'¿Práctica segura o insegura?',
         left:['Contraseña única por sistema','Compartir acceso al email','2FA activado en cuentas críticas','Contraseña en un Excel sin cifrar'],
         right:['🛡️ Limita el daño si hackean una cuenta','⚠️ Pierdes control de tu identidad digital','🛡️ Bloquea acceso aunque roben tu clave','⚠️ Cualquiera con acceso al archivo te hackea'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Evaluar prácticas de seguridad requiere pensar como atacante: ¿qué información expongo? ¿qué acceso facilito? Si una práctica hace el trabajo más fácil a un atacante hipotético, es insegura independientemente de cuán conveniente sea.',explain:'Cada cuenta debe tener su propia contraseña y el 2FA añade una capa adicional vital.'},
        {type:'tf',char:'🔐',q:'El 2FA (doble autenticación) protege tu cuenta incluso si alguien conoce tu contraseña.',
         theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:true,explain:'¡Exacto! El 2FA requiere algo que SABES (contraseña) + algo que TIENES (teléfono). Sin ambos, no hay acceso.'},
      ]
    },
    ...Array(7).fill(null).map((_,i)=>({
      title:['Ataques de fuerza bruta','Phishing de contraseñas','Contraseñas en redes sociales','Contraseña maestra perfecta','Recuperación segura de cuentas','Autenticación biométrica','Contraseñas en aplicaciones móviles'][i],
      questions:generatePasswordQuestions(i+3)
    }))
  ]
},
{
  id:'phishing', icon:'🎣', label:'Phishing', color:'#1cb0f6', colorD:'#0a90d4',
  section:'SECCIÓN 2',
  desc:'Identifica correos, mensajes y sitios fraudulentos antes de que te engañen.',
  activities:[
    {
      title:'Reconoce un email de phishing',
      difficulty:'bajo',
      questions:[
        {type:'scenario',char:'📧',q:'Analiza este correo. ¿Es legítimo o phishing?',
         scenario:{type:'email',
           from:'soporte@bancol0mbia-seguro.net',
           subject:'⚠️ URGENTE: Su cuenta será bloqueada en 24h',
           body:'Estimado cliente, hemos detectado <strong>actividad sospechosa</strong> en su cuenta. Haga clic AHORA para verificar sus datos y evitar el bloqueo permanente de su cuenta.',
           link:'http://bancol0mbia-login.xyz/verificar',
           linkLabel:'🔓 Verificar cuenta ahora →',
           brandEmoji:'🏦', brandName:'Bancolombia', brandColor:'#ffd100', ctaColor:'#e53935',
           isSuspicious:true},
         choices:[{e:'✅',t:'Es legítimo, el banco me avisa'},{e:'🎣',t:'Es phishing — dominio falso y urgencia',ok:true}],
         theory:'Para analizar emails aplica SLAM: Sender (dominio real), Links (URL al hover), Attachments (adjuntos inesperados), Message (urgencia/amenazas). Un solo indicador sospechoso es suficiente para desconfiar de todo el mensaje.',explain:'El dominio "bancol0mbia-seguro.net" usa una "0" (cero) en lugar de "o". Los bancos nunca piden datos por email urgente.'},
        {type:'choice',char:'🔍',q:'¿Cuál es la primera señal de alerta en un correo sospechoso?',
         choices:[{e:'✉️',t:'El asunto del correo'},{e:'🌐',t:'El dominio del remitente',ok:true},{e:'🎨',t:'El diseño del correo'},{e:'📎',t:'Los adjuntos'}],
         theory:'El phishing funciona porque los atacantes copian exactamente el diseño visual de bancos, redes sociales y empresas conocidas. El unico elemento que NO pueden falsificar perfectamente es el dominio del remitente.',explain:'El dominio del remitente (lo que va después del @) es la señal más reveladora. Siempre verifica que sea el real.'},
        {type:'tf',char:'🏦',q:'Si el logo del correo es idéntico al del banco real, el correo es seguro.',
         ans:false,theory:'Con herramientas modernas, cualquiera puede copiar el diseno exacto de cualquier sitio web en minutos. Incluso el certificado HTTPS puede obtenerse gratis. Solo el dominio real distingue lo autentico de lo falso.',explain:'Los atacantes copian logos y diseños perfectamente. El logo NO garantiza autenticidad. Verifica el dominio.'},
        {type:'sort',char:'🔎',q:'Ordena los pasos para verificar un email sospechoso:',
         theory:'El orden correcto en ciberseguridad es tan crítico como las acciones mismas. Contener antes de erradicar, erradicar antes de recuperar.',items:['Verificar el dominio del remitente','Buscar errores de ortografía','Llamar a la entidad por número oficial','No hacer clic en ningún enlace aún'],
         correct:[3,0,1,2],
         explain:'Primero no hagas clic. Luego analiza el remitente, busca errores y finalmente verifica por canal oficial.'},
        {type:'pair',char:'📨',q:'¿Señal de email LEGÍTIMO o PHISHING?',
         left:['Tu nombre completo en el saludo','Dominio: @microbanco.xyz','Logo oficial perfecto','Solicita contraseña urgente'],
         right:['✅ Personalización real del remitente','🎣 Dominio falso — no es el banco real','⚠️ Logo se copia en segundos','🎣 Ningún banco pide clave por email'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Los emails legítimos tienen: dominio exacto de la empresa, nombre personalizado real, no piden datos sensibles, información de contacto verificable y no crean urgencia artificial. El phishing falla típicamente en uno o más de estos.',explain:'Los atacantes personalizan correos. Tu nombre no garantiza legitimidad, pero el dominio y solicitar contraseña sí son señales claras.'},
        {type:'choice',char:'🔗',q:'¿Cómo verificas si un enlace en un correo es seguro SIN hacer clic?',
         choices:[{e:'👆',t:'Hago clic y veo si es seguro'},{e:'🖱️',t:'Paso el mouse por encima para ver la URL real',ok:true},{e:'📧',t:'Reenvío el correo a un amigo'},{e:'📱',t:'Lo abro en el celular'}],
         theory:'Sin hacer clic: hover con el mouse (ver URL real en barra inferior), copiar URL y analizarla en VirusTotal.com, o usar URLScan.io para ver el sitio de forma segura. Nunca hagas clic antes de verificar el destino real.',explain:'Al pasar el cursor sobre el enlace (sin clic), el navegador muestra la URL real destino en la barra inferior.'},
      ]
    },
    {
      title:'Phishing por SMS y WhatsApp',
      difficulty:'medio',
      questions:[
        {type:'scenario',char:'📱',q:'¿Este SMS es legítimo o smishing?',
         scenario:{type:'sms',
           from:'+57 300 456 7890',
           subject:'Bancolombia',
           body:'🚨 Tu tarjeta de crédito fue BLOQUEADA por seguridad. Para desbloquearla AHORA debes verificar tu identidad:',
           link:'http://bit.ly/col-banco-seguro',
           time:'14:32'},
         choices:[{e:'✅',t:'Legítimo, es de mi banco'},{e:'🎣',t:'Smishing — link acortado sospechoso',ok:true}],
         theory:'Señales de smishing: número desconocido, urgencia extrema, link acortado (bit.ly), solicitud de datos o pago, errores ortográficos. Los bancos legítimos NUNCA envían links por SMS. Ante la duda, llama al número oficial de tu banco.',explain:'Los bancos no envían links por SMS para "desbloquear" cuentas. El link acortado (bit.ly) oculta la URL real.'},
        {type:'tf',char:'📲',q:'Si recibes un mensaje de WhatsApp de un número desconocido con un link "increíble", es probablemente spam o estafa.',
         ans:true,theory:'Regla: nunca hagas clic en links de números desconocidos. El smishing por WhatsApp creció 300% desde 2020. Los atacantes usan links acortados para ocultar la URL real. Si parece importante, verifica por otro canal.',explain:'Los links de "premios", "ofertas increíbles" o "urgencias" por WhatsApp de desconocidos son casi siempre estafas.'},
        {type:'choice',char:'🎁',q:'Te llega: "¡Felicidades! Ganaste un iPhone. Haz clic para reclamar en 10 minutos." ¿Qué haces?',
         theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'🎉',t:'Hago clic rápido antes de que expire'},{e:'🗑️',t:'Lo ignoro y elimino — es estafa',ok:true},{e:'👥',t:'Lo reenvío a amigos para que ganen también'},{e:'📞',t:'Llamo al número del mensaje'}],
         explain:'Premios falsos son la táctica más común. La urgencia ("10 minutos") es para que no pienses. ¡Siempre es estafa!'},
        {type:'pair',char:'📲',q:'Relaciona la señal con el tipo de alerta:',
         left:['Link acortado (bit.ly)','Logo oficial en el mensaje','Urgencia extrema de tiempo','Número de teléfono desconocido'],
         right:['🚨 Muy sospechoso','⚠️ No garantiza nada','🚨 Táctica de presión','⚠️ Puede ser normal'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Clasificar señales: Urgencia extrema → presión psicológica, Dominio incorrecto → spoofing, Link no coincide → redirect malicioso, Solicita código 2FA → man-in-the-middle activo, Logo perfecto con dominio raro → phishing sofisticado.',explain:'Los links acortados ocultan la URL real. La urgencia te impide pensar. Siempre verifica por canales oficiales.'},
        {type:'choice',char:'🔒',q:'Tu "banco" te envía un código por SMS para "verificar tu identidad". ¿Cuándo debes compartirlo?',
         theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'📞',t:'Cuando alguien te lo pide por teléfono'},{e:'💬',t:'Nunca compartirlo con nadie',ok:true},{e:'📧',t:'Por email si lo piden'},{e:'👤',t:'Solo con empleados del banco'}],
         explain:'Los códigos de verificación por SMS son SOLO para ti. Ningún banco, soporte o persona legítima te pedirá ese código.'},
        {type:'tf',char:'👨‍💻',q:'Si recibes un WhatsApp de un amigo pidiéndote dinero urgente, debes transferírselo inmediatamente.',
         ans:false,theory:'FALSO. La cuenta de tu amigo puede estar comprometida. Siempre llama directamente al número telefónico real de tu amigo para confirmar antes de enviar dinero. Los atacantes crean urgencia artificial para evitar que verificques.',explain:'Los estafadores hackean o clonan cuentas de WhatsApp. Siempre llama a tu amigo por voz antes de transferir dinero.'},
      ]
    },
    ...Array(8).fill(null).map((_,i)=>({
      title:['Phishing en redes sociales','Spear phishing personalizado','Sitios web falsos','Phishing de credenciales de trabajo','Vishing: estafas telefónicas','Phishing en plataformas de pago','Reconoce URLs sospechosas','Cómo reportar phishing'][i],
      questions:generatePhishingQuestions(i+2)
    }))
  ]
},
{
  id:'malware', icon:'🦠', label:'Malware', color:'#ff9500', colorD:'#cc7700',
  section:'SECCIÓN 3',
  desc:'Conoce los tipos de software malicioso y cómo proteger tus dispositivos.',
  activities:[
    {
      title:'¿Qué es el malware?',
      difficulty:'medio',
      questions:[
        {type:'choice',char:'🦠',q:'¿Qué significa "malware"?',
         choices:[{e:'💻',t:'Software de bajo rendimiento'},{e:'😈',t:'Software malicioso diseñado para dañar',ok:true},{e:'📱',t:'App de gestión de archivos'},{e:'🔧',t:'Herramienta de mantenimiento'}],
         theory:'En ciberseguridad, cada decisión importa. Analiza las opciones pensando como atacante: ¿cuál protege mejor tus datos y sistemas?',explain:'Malware = "malicious software". Es cualquier programa diseñado para dañar, espiar o robar sin tu consentimiento.'},
        {type:'pair',char:'🗂️',q:'Relaciona el tipo de malware con lo que hace:',
         theory:'Relacionar ataques con sus defensas construye un mapa mental del ecosistema de seguridad digital. Cada par refuerza tu capacidad de respuesta.',left:['Ransomware','Spyware','Troyano','Adware'],
         right:['🔒 Cifra archivos y pide rescate','👁️ Espía tu actividad silenciosamente','🐴 Se disfraza de programa legítimo','📢 Muestra anuncios no deseados'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         explain:'Cada tipo de malware tiene un objetivo específico. Conocerlos te ayuda a identificar señales de infección.'},
        {type:'tf',char:'📱',q:'Los teléfonos inteligentes (smartphones) no pueden infectarse con malware.',
         ans:false,theory:'Cada tipo de malware tiene objetivo específico: Ransomware (extorsión), Keylogger (credenciales), Rootkit (persistencia oculta), Spyware (espionaje), Botnet (ataques coordinados), Troyano (acceso remoto), Adware (publicidad forzada).',explain:'Los celulares son igual de vulnerables. Malware en Android/iOS roba datos, espía llamadas y vacía cuentas bancarias.'},
        {type:'choice',char:'🔍',q:'¿Cuál de estas señales indica que tu dispositivo podría estar infectado?',
         theory:'En ciberseguridad, cada decisión importa. La respuesta correcta siempre minimiza el riesgo y maximiza la protección de tus datos personales.',choices:[{e:'🐌',t:'Se volvió muy lento de repente',ok:true},{e:'🔋',t:'La batería dura más tiempo'},{e:'📶',t:'Mejor conexión WiFi'},{e:'💾',t:'Más espacio de almacenamiento'}],
         explain:'Lentitud súbita, calentamiento excesivo, apps desconocidas y mayor uso de datos son señales de alerta de malware.'},
        {type:'sort',char:'🛡️',q:'Ordena estas acciones de la MÁS a la MENOS recomendable contra malware:',
         items:['Descargar antivirus reconocido','Actualizar el sistema operativo','Descargar apps solo de tiendas oficiales','Abrir adjuntos de emails desconocidos'],
         correct:[2,1,0,3],
         theory:'Jerarquía de defensa: 1) Backups offline regulares (recuperación garantizada), 2) SO actualizado (parchea CVEs), 3) Antivirus/EDR activo (detección), 4) Solo descargar de fuentes oficiales (prevención), 5) No abrir adjuntos inesperados (vector principal).',explain:'Fuentes oficiales primero, luego actualizaciones, luego antivirus. Nunca abras adjuntos desconocidos.'},
        {type:'tf',char:'💰',q:'Si tu PC tiene ransomware, pagar el rescate es la mejor manera de recuperar tus archivos.',
         theory:'Las afirmaciones de ciberseguridad requieren conocimiento técnico para evaluarse correctamente. Muchas creencias populares son mitos que aumentan el riesgo.',ans:false,explain:'Pagar NO garantiza recuperar los archivos. Financia a los atacantes y te convierte en objetivo futuro. Reporta y restaura desde backup.'},
      ]
    },
    ...Array(9).fill(null).map((_,i)=>({
      title:['Virus y gusanos','Ransomware en profundidad','Cómo se propaga el malware','Protege tu teléfono','Antivirus: qué hacen y no hacen','Descargas seguras','Señales de infección','Qué hacer si te infectaron','Backups: tu mejor defensa'][i],
      questions:generateMalwareQuestions(i+1)
    }))
  ]
},
{
  id:'networks', icon:'📡', label:'Redes Seguras', color:'#9c27ff', colorD:'#7a00e6',
  section:'SECCIÓN 4',
  desc:'Navega de forma segura en WiFi público, en casa y en el trabajo.',
  activities: Array(10).fill(null).map((_,i)=>({
    title:['WiFi público: riesgos reales','¿Para qué sirve una VPN?','HTTPS vs HTTP','Tu router en casa','Man in the Middle','Redes en el trabajo','DNS y privacidad','Bluetooth: ataques invisibles','Firewall básico','Navegación privada: mitos y verdades'][i],
    questions:generateNetworkQuestions(i)
  }))
},
{
  id:'accounts', icon:'🔐', label:'Cuentas y 2FA', color:'#00cba1', colorD:'#00a080',
  section:'SECCIÓN 5',
  desc:'Asegura tus cuentas digitales con autenticación fuerte y buenas prácticas.',
  activities: Array(10).fill(null).map((_,i)=>({
    title:['Qué es el 2FA','Apps de autenticación','Estafas de soporte técnico','Privacidad en redes sociales','Permisos de aplicaciones','Tu huella digital','Qué hacer si te hackean','Monitoreo de cuentas','Datos personales en internet','Plan de emergencia digital'][i],
    questions:generateAccountQuestions(i)
  }))
}
,
{
  id:'ai_security', icon:'🤖', label:'IA y Seguridad', color:'#7c3aed', colorD:'#5b21b6',
  section:'SECCIÓN 6',
  desc:'Aprende a protegerte de los riesgos de la Inteligencia Artificial: deepfakes, phishing con IA, manipulación y más.',
  activities:[
    {
      title:'¿Qué riesgos trae la IA?',
      difficulty:'bajo',
      questions:[
        {type:'choice',char:'🤖',
         q:'¿Cuál de estos es un riesgo real de la Inteligencia Artificial para usuarios comunes?',
         choices:[
           {e:'🎭',t:'Deepfakes que suplantan tu identidad',ok:true},
           {e:'🤝',t:'Que la IA te ayude con tareas'},
           {e:'📚',t:'Que la IA aprenda más rápido que tú'},
           {e:'🎮',t:'Que los videojuegos mejoren con IA'},
         ],
         theory:'La IA no es solo una herramienta útil — también es un arma poderosa para los ciberdelincuentes. Los deepfakes, el phishing generado por IA y la clonación de voz son amenazas reales que ya afectan a millones de personas.',
         explain:'Los deepfakes pueden usar tu cara o voz para engañar a tus contactos, pedir dinero o crear contenido falso en tu nombre.'},

        {type:'tf',char:'🧠',
         q:'La IA puede generar correos de phishing perfectos, sin errores gramaticales ni ortográficos.',
         ans:true,
         theory:'Antes, los errores de redacción eran una señal clave para detectar phishing. Hoy, con IA como ChatGPT o Claude, cualquier atacante puede generar emails impecables en cualquier idioma en segundos. Los filtros tradicionales ya no son suficientes.',
         explain:'VERDADERO. Herramientas de IA generan textos perfectos en segundos. Ya no puedes confiar en los errores para detectar phishing.'},

        {type:'choice',char:'📧',
         q:'Un atacante usa IA para enviarte 1.000 emails de phishing personalizados con tu nombre y empresa. ¿Cómo se llama esto?',
         choices:[
           {e:'📬',t:'Spam masivo'},
           {e:'🎯',t:'Spear phishing generado por IA',ok:true},
           {e:'📱',t:'Smishing con bots'},
           {e:'🤖',t:'Ataque de fuerza bruta'},
         ],
         theory:'El spear phishing con IA combina lo peor de dos mundos: la personalización del spear phishing tradicional con la escala del phishing masivo. La IA raspa datos de LinkedIn, redes sociales y webs públicas para crear emails creíbles para miles de víctimas simultáneamente.',
         explain:'La IA permite personalizar ataques a escala masiva. Un solo atacante puede ahora crear miles de mensajes únicos y creíbles automáticamente.'},

        {type:'pair',char:'🔗',
         q:'Relaciona cada amenaza de IA con su descripción:',
         left:['Deepfake de video','Clonación de voz','Chatbot malicioso','Phishing con IA'],
         right:['Video falso con tu cara para engañar','Replica tu voz con 3 segundos de audio','Bot que finge ser soporte técnico','Email perfecto generado automáticamente'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Las amenazas de IA se dividen en: visuales (deepfakes de video/foto), auditivas (clonación de voz), conversacionales (chatbots maliciosos) y textuales (phishing generado). Cada una explota un canal diferente de confianza humana.',
         explain:'Cada tipo de amenaza IA ataca un sentido diferente: vista, oído o lectura. Ninguno es 100% detectable a simple vista.'},

        {type:'sort',char:'🔍',
         q:'Ordena los pasos para verificar si un video es un deepfake:',
         items:['Buscar inconsistencias en el fondo','Analizar el parpadeo y movimientos faciales','Verificar la fuente original del video','Usar herramienta de detección como Deepware'],
         correct:[2,1,0,3],
         theory:'La detección de deepfakes requiere un proceso sistemático. Los modelos actuales de IA tienen artefactos detectables: parpadeo antinatural, bordes del cabello difusos, inconsistencias en joyas y fondo. Pero los modelos más nuevos son casi imperceptibles a simple vista.',
         explain:'El orden correcto: verificar fuente → analizar movimientos → buscar artefactos visuales → confirmar con herramientas especializadas.'},
      ]
    },
    {
      title:'Deepfakes: ver no es creer',
      difficulty:'medio',
      questions:[
        {type:'choice',char:'🎭',
         q:'¿Cuántos segundos de audio de tu voz necesita una IA para clonarla de forma convincente?',
         choices:[
           {e:'⏱️',t:'Menos de 3 segundos',ok:true},
           {e:'🕐',t:'Al menos 10 minutos'},
           {e:'📅',t:'Varias horas de grabación'},
           {e:'🎙️',t:'Es imposible clonar una voz'},
         ],
         theory:'Herramientas como ElevenLabs o Microsoft VALL-E pueden clonar una voz con 3 segundos de audio. Esto significa que cualquier video tuyo en redes sociales, una llamada grabada o un video de WhatsApp ya contiene suficiente audio para clonarte.',
         explain:'¡Solo 3 segundos! Esto significa que cualquier video público tuyo en redes sociales puede ser suficiente para que alguien clone tu voz.'},

        {type:'tf',char:'🎬',
         q:'Si recibes una videollamada de alguien conocido, puedes estar 100% seguro de que es esa persona.',
         ans:false,
         theory:'Las videollamadas deepfake en tiempo real ya son posibles con herramientas comerciales. Un atacante puede superponer el rostro de tu jefe o familiar en tiempo real durante una videollamada. El FBI ya ha reportado casos de fraudes corporativos usando esta técnica.',
         explain:'FALSO. Los deepfakes en tiempo real ya existen. Para verificar, pide que hagan un gesto específico o realiza una pregunta cuya respuesta solo esa persona conocería.'},

        {type:'choice',char:'👁️',
         q:'Tu "jefe" te llama por video pidiéndote transferir dinero urgente. ¿Qué haces?',
         choices:[
           {e:'💸',t:'Transfiero inmediatamente — es urgente'},
           {e:'📞',t:'Cuelgo y llamo al número real de mi jefe para confirmar',ok:true},
           {e:'📧',t:'Le pido que me mande un email'},
           {e:'🤷',t:'Pregunto el monto y lo transfiero'},
         ],
         theory:'El fraude del CEO (Business Email/Video Compromise) usa deepfakes de video para suplantar ejecutivos y ordenar transferencias. En 2024, una empresa en Hong Kong perdió $25 millones de dólares en una videollamada deepfake. El protocolo: siempre verificar por un canal alternativo.',
         explain:'Siempre verifica por un canal distinto. Los deepfakes pueden suplantar visualmente a cualquier persona, pero no pueden controlar su teléfono real.'},

        {type:'choice',char:'🛡️',
         q:'¿Cuál es la mejor defensa personal contra los deepfakes de voz en llamadas?',
         choices:[
           {e:'🔇',t:'No contestar llamadas desconocidas'},
           {e:'🗝️',t:'Establecer una palabra clave secreta con tus contactos cercanos',ok:true},
           {e:'📵',t:'Desactivar el micrófono del teléfono'},
           {e:'🤖',t:'Usar un detector de IA en cada llamada'},
         ],
         theory:'La palabra clave secreta (safe word) es la defensa más práctica contra la clonación de voz. Es una palabra acordada previamente con familiares y colegas cercanos. Si alguien que dice ser tu familiar no sabe la palabra clave, es una señal de alarma inmediata.',
         explain:'Una palabra clave secreta acordada con familia y amigos cercanos es imposible de conocer para un atacante que clona la voz.'},

        {type:'sort',char:'📋',
         q:'Ordena estas señales de deepfake de MÁS a MENOS confiable para detectarlo:',
         items:['Bordes del cabello o piel difusos','Parpadeo antinatural o ausente','Herramienta de detección especializada','Joyas o dientes que cambian entre frames'],
         correct:[2,1,3,0],
         theory:'Las herramientas de detección como Deepware Scanner o Microsoft Video Authenticator usan IA para analizar patrones imperceptibles al ojo humano. Son más confiables que la inspección visual, especialmente con deepfakes generados por modelos nuevos de alta calidad.',
         explain:'Las herramientas especializadas son más confiables que el ojo humano. Los deepfakes modernos son casi imperceptibles visualmente.'},
      ]
    },
    {
      title:'Chatbots maliciosos y manipulación',
      difficulty:'alto',
      questions:[
        {type:'choice',char:'💬',
         q:'Chateas con el "soporte técnico" de tu banco en WhatsApp. Te piden tu clave. ¿Qué sospechas?',
         choices:[
           {e:'🤖',t:'Podría ser un chatbot malicioso de IA',ok:true},
           {e:'✅',t:'Es normal, es para verificar mi identidad'},
           {e:'📞',t:'Es el banco, tienen mi número de contacto'},
           {e:'🔐',t:'Si es HTTPS es seguro'},
         ],
         theory:'Los chatbots maliciosos de IA imitan perfectamente el tono y lenguaje del soporte técnico legítimo. Pueden mantener conversaciones coherentes durante minutos, construir confianza gradualmente y luego solicitar información sensible. Los bancos legítimos NUNCA piden contraseñas por ningún canal.',
         explain:'Los bancos nunca piden contraseñas por chat. Si un "soporte" las pide, es un ataque — probablemente automatizado con IA.'},

        {type:'tf',char:'🎭',
         q:'La IA puede crear perfiles falsos completos en redes sociales con fotos, historial y publicaciones convincentes.',
         ans:true,
         theory:'Las GANs (Generative Adversarial Networks) generan fotos de personas que no existen (thispersondoesnotexist.com). Combinadas con ChatGPT para el texto y automatización, permiten crear "personas" falsas completas en minutos. Se usan para romance scams, desinformación y phishing social.',
         explain:'VERDADERO. Servicios como ThisPersonDoesNotExist.com generan fotos realistas de personas inexistentes en segundos. Los scammers los usan para crear identidades falsas.'},

        {type:'choice',char:'❤️',
         q:'Una persona que conociste online (sin veros en persona) te pide dinero urgente. ¿Qué es probablemente?',
         choices:[
           {e:'😢',t:'Una persona en apuros reales'},
           {e:'🤖',t:'Un romance scam posiblemente con IA',ok:true},
           {e:'💝',t:'Alguien que confía mucho en ti'},
           {e:'📱',t:'Un problema técnico de su banco'},
         ],
         theory:'El romance scam con IA es la estafa de mayor crecimiento. Los atacantes usan fotos de IA, chatbots para las conversaciones y deep voice para las llamadas. Construyen una relación emocional durante semanas o meses antes de pedir dinero. En 2023 causó pérdidas de $1.3 billones en EEUU.',
         explain:'El romance scam con IA puede mantener conversaciones convincentes durante semanas. Nunca envíes dinero a alguien que no has conocido en persona.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la táctica de IA con su objetivo:',
         left:['Romance scam IA','Chatbot de soporte falso','Perfil falso LinkedIn','Generador de noticias falsas'],
         right:['Robar dinero mediante relación emocional','Obtener credenciales bancarias','Phishing laboral y spear phishing','Manipular opinión pública o reputación'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Cada táctica de IA social explota un tipo diferente de confianza: emocional (romance), institucional (soporte técnico), profesional (LinkedIn) o informativa (noticias). La IA permite escalar estos ataques a miles de víctimas simultáneamente con mínimo esfuerzo humano.',
         explain:'La IA permite personalizar y escalar ataques sociales. Cada táctica explota un tipo distinto de confianza humana.'},

        {type:'tf',char:'🗳️',
         q:'La IA puede generar videos falsos de políticos o figuras públicas diciendo cosas que nunca dijeron.',
         ans:true,
         theory:'Los deepfakes políticos son una amenaza para la democracia. En las elecciones de 2024 se detectaron múltiples videos deepfake de candidatos. La regla: ante un video impactante o polémico de una figura pública, siempre verifica en medios de comunicación confiables antes de compartirlo.',
         explain:'VERDADERO. Los deepfakes políticos son reales y se han usado en campañas electorales. Verifica siempre en fuentes confiables antes de compartir videos impactantes.'},
      ]
    },
    {
      title:'Phishing y estafas potenciadas por IA',
      difficulty:'alto',
      questions:[
        {type:'choice',char:'🎣',
         q:'¿Qué hace que el phishing generado por IA sea más peligroso que el phishing tradicional?',
         choices:[
           {e:'📧',t:'Llega más rápido al correo'},
           {e:'🎯',t:'Es personalizado, sin errores y a escala masiva',ok:true},
           {e:'🔴',t:'Tiene un asunto más llamativo'},
           {e:'📎',t:'Los adjuntos son más grandes'},
         ],
         theory:'El phishing tradicional era detectable por errores gramaticales, falta de personalización y redacción torpe. La IA elimina todas esas señales: genera textos perfectos, personalizados con datos reales de la víctima, a escala de millones de emails, con costo casi cero para el atacante.',
         explain:'La IA elimina los indicadores clásicos de phishing. Un email perfecto en tu idioma, con tu nombre y datos reales, generado automáticamente para miles de víctimas.'},

        {type:'choice',char:'🔍',
         q:'Recibes un email perfecto de tu "banco" con tu nombre, número de cuenta parcial y firma correcta. ¿Qué verificas primero?',
         choices:[
           {e:'📝',t:'La ortografía del email'},
           {e:'🌐',t:'El dominio exacto del remitente',ok:true},
           {e:'🎨',t:'El diseño y los colores del logo'},
           {e:'📅',t:'La fecha de envío'},
         ],
         theory:'Con IA, los atacantes pueden generar emails con diseño perfecto, ortografía impecable, tu nombre real e incluso datos parciales de cuenta. El ÚNICO elemento que no pueden falsificar es el dominio del remitente. "banco@bancolombia-alerta.net" no es Bancolombia, sin importar qué tan perfecto sea el resto.',
         explain:'El dominio del remitente es el único indicador fiable cuando el phishing usa IA. Todo lo demás puede ser falsificado perfectamente.'},

        {type:'tf',char:'📞',
         q:'Si recibes una llamada y reconoces perfectamente la voz de un familiar pidiéndote dinero urgente, debes confiar en que es esa persona.',
         ans:false,
         theory:'La clonación de voz con IA requiere solo 3 segundos de audio. Cualquier video de redes sociales, mensaje de voz o llamada grabada es suficiente para crear una réplica convincente. El FBI ha documentado casos donde personas transfirieron miles de dólares a "familiares" que eran IA.',
         explain:'FALSO. La voz se puede clonar con solo 3 segundos de audio. Ante peticiones urgentes de dinero por llamada, siempre llama de vuelta al número guardado de esa persona.'},

        {type:'sort',char:'📋',
         q:'Ante un email sospechoso muy bien escrito, ordena los pasos de verificación:',
         items:['Hacer clic para ver si el sitio parece real','Verificar el dominio exacto del remitente','Llamar a la empresa por su número oficial','Buscar el sitio web oficial directamente en el navegador'],
         correct:[1,3,2,0],
         theory:'El proceso correcto elimina el factor sorpresa del phishing con IA: 1) El dominio revela al atacante aunque el texto sea perfecto. 2) Buscar manualmente elimina el riesgo del link. 3) Llamar por número oficial verifica sin depender del email. NUNCA hacer clic en el link del email sospechoso.',
         explain:'Nunca hagas clic en el link del email sospechoso. El dominio real y el número oficial son tus dos verificadores seguros.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la señal con lo que indica en un email con IA:',
         left:['Email perfecto sin errores','Tu nombre y datos reales','Link que parece legítimo','Urgencia extrema'],
         right:['Puede ser generado por IA — no es garantía','La IA raspa datos públicos de LinkedIn/redes','Verifica el dominio real al pasar el mouse','Táctica psicológica para que no pienses'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'La IA invierte el juego del phishing: antes detectabas por lo que faltaba (errores, falta de personalización). Ahora debes buscar activamente señales técnicas. El dominio del remitente y la URL real del link son las únicas señales técnicas verificables.',
         explain:'Con phishing IA no puedes confiar en la calidad del texto ni en los datos personalizados. Solo el dominio del remitente y la URL real son verificables.'},
      ]
    },
    {
      title:'Desinformación y manipulación con IA',
      difficulty:'alto',
      questions:[
        {type:'choice',char:'📰',
         q:'Ves un video viral de un presidente declarando la guerra. ¿Cuál es tu primera acción?',
         choices:[
           {e:'📤',t:'Lo comparto — es urgente que todos lo sepan'},
           {e:'🔍',t:'Verifico en medios confiables antes de compartir',ok:true},
           {e:'😱',t:'Lo creo — el video es muy real'},
           {e:'💬',t:'Lo comento en redes para pedir opiniones'},
         ],
         theory:'El protocolo SIFT para verificar contenido: Stop (para antes de compartir), Investigate (investiga la fuente), Find (busca mejor cobertura), Trace (rastrea el origen). Los deepfakes se detectan más fácilmente buscando la fuente original que analizando el video en sí.',
         explain:'Antes de compartir contenido impactante: para, investiga la fuente, busca cobertura en medios confiables y rastrea el origen. El método SIFT.'},

        {type:'tf',char:'🖼️',
         q:'Una foto realista generada por IA de un evento que no ocurrió puede influir en la opinión pública.',
         ans:true,
         theory:'Las imágenes falsas generadas por IA de eventos inexistentes han circulado viralmente en contextos de conflictos, desastres naturales y campañas políticas. Modelos como DALL-E, Midjourney o Stable Diffusion generan imágenes fotorrealistas en segundos. La desinformación visual es más persuasiva que el texto.',
         explain:'VERDADERO. Las imágenes falsas de IA son más persuasivas que el texto falso. Usa Google Reverse Image Search o TinEye para verificar el origen de imágenes impactantes.'},

        {type:'choice',char:'🧩',
         q:'¿Qué herramienta puedes usar para verificar si una imagen es real o fue generada por IA?',
         choices:[
           {e:'👁️',t:'Mirarla muy detenidamente'},
           {e:'🔍',t:'Google Reverse Image Search o TinEye',ok:true},
           {e:'📱',t:'Ampliarla en el teléfono'},
           {e:'🤷',t:'No hay forma de verificarlo'},
         ],
         theory:'Google Reverse Image Search sube la imagen y busca dónde más aparece en internet. Si la imagen "del evento de hoy" aparece en un contexto completamente diferente de hace 3 años, es falsa. TinEye hace lo mismo con más detalle. Para detectar IA generativa específicamente: Hive Moderation o AI Image Detector.',
         explain:'Google Reverse Image Search y TinEye buscan el origen de cualquier imagen. Si aparece en otro contexto o fecha diferente, es manipulada o sacada de contexto.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la herramienta con su uso para combatir desinformación:',
         left:['Google Reverse Image','Deepware Scanner','Snopes / AFP Verificado','SIFT Method'],
         right:['Verificar origen de imágenes','Detectar deepfakes de video','Verificar noticias falsas','Protocolo para no compartir desinformación'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'El ecosistema de verificación de contenido incluye herramientas técnicas (búsqueda inversa, detectores de deepfake) y humanas (fact-checkers profesionales). Ninguna herramienta es 100% efectiva sola. La combinación de herramientas técnicas + pensamiento crítico + fuentes confiables es la defensa más robusta.',
         explain:'Combinar herramientas técnicas con fact-checkers profesionales y pensamiento crítico es la defensa más efectiva contra la desinformación con IA.'},

        {type:'tf',char:'🗳️',
         q:'Los "bots" de IA en redes sociales pueden simular una opinión pública masiva que no existe realmente.',
         ans:true,
         theory:'Las granjas de bots de IA crean la ilusión de consenso social: trending topics falsos, miles de comentarios coordinados, millones de likes artificiales. Este fenómeno se llama "astroturfing" y se usa para manipular elecciones, reputaciones y mercados financieros. Es extremadamente difícil de detectar para el usuario promedio.',
         explain:'VERDADERO. Los bots de IA crean opinión pública artificial. Un topic que parece viral puede ser artificialmente amplificado. Evalúa críticamente las "tendencias" en redes sociales.'},
      ]
    },
    {
      title:'Privacidad frente a la IA',
      difficulty:'medio',
      questions:[
        {type:'choice',char:'🔒',
         q:'Subes fotos tuyas regularmente a redes sociales. ¿Cuál es el riesgo de seguridad con IA?',
         choices:[
           {e:'📷',t:'Que alguien guarde tus fotos'},
           {e:'🎭',t:'Que se usen para crear deepfakes de ti',ok:true},
           {e:'🌐',t:'Que ocupen espacio en servidores'},
           {e:'👁️',t:'Que las vean muchas personas'},
         ],
         theory:'Cada foto que publicas en redes sociales es potencialmente material de entrenamiento para deepfakes. Con suficientes imágenes tuyas desde diferentes ángulos, una IA puede generar video realista de ti haciendo o diciendo cualquier cosa. El concepto de "surface de ataque visual" — cuantas más fotos públicas, mayor el riesgo.',
         explain:'Cada foto pública tuya es potencialmente material para entrenar un deepfake. Considera limitar las fotos de alta resolución de tu rostro en redes sociales públicas.'},

        {type:'tf',char:'🎤',
         q:'Usar el asistente de voz de tu teléfono (Siri, Google, Alexa) implica que tu voz es grabada y procesada.',
         ans:true,
         theory:'Los asistentes de voz escuchan continuamente en búsqueda de la palabra de activación. Las grabaciones se envían a servidores de Apple, Google o Amazon para procesamiento. Aunque las empresas anonomizan los datos, existen casos documentados de empleados que escucharon conversaciones privadas de usuarios.',
         explain:'VERDADERO. Los asistentes de voz procesan tu voz en la nube. Revisa la configuración de privacidad y elimina el historial de voz regularmente.'},

        {type:'choice',char:'📊',
         q:'¿Qué tipo de datos recopila la IA de tus redes sociales sin que lo notes?',
         choices:[
           {e:'📝',t:'Solo lo que publicas conscientemente'},
           {e:'🔍',t:'Comportamiento, tiempo de lectura, reacciones y patrones de scroll',ok:true},
           {e:'📸',t:'Solo tus fotos y videos'},
           {e:'💬',t:'Solo los mensajes que envías'},
         ],
         theory:'Los algoritmos de IA recopilan microdatos de comportamiento: cuánto tiempo miras cada post antes de scrollear, en qué parte de la pantalla haces clic, con qué frecuencia revisas ciertas cuentas, tus patrones de like/unlike. Estos datos revelan tus emociones, creencias y vulnerabilidades psicológicas mejor que cualquier encuesta.',
         explain:'Los algoritmos recopilan comportamiento invisible: tiempo de lectura, patrones de scroll, microracciones. Esto crea un perfil psicológico tuyo más preciso que lo que conscientemente compartes.'},

        {type:'sort',char:'🛡️',
         q:'Ordena estas acciones para proteger tu privacidad frente a la IA (de más a menos importante):',
         items:['Revisar y limitar permisos de apps regularmente','Desactivar el micrófono cuando no usas asistentes de voz','Usar configuración de privacidad estricta en redes sociales','Leer los términos de uso antes de aceptar'],
         correct:[0,2,1,3],
         theory:'La privacidad frente a IA requiere control activo de los datos que alimentan los modelos. Los permisos de apps son el punto de entrada más crítico: una app con acceso a micrófono, cámara y contactos puede recopilar enormes cantidades de datos. Las configuraciones de privacidad en redes sociales limitan quién puede ver y usar tus datos.',
         explain:'Controlar los permisos de apps es lo más impactante. Una app con acceso a micrófono y cámara puede recopilar enormes cantidades de datos sobre ti constantemente.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la práctica con su impacto en privacidad frente a IA:',
         left:['Publicar muchas fotos tuyas','Usar apps con todos los permisos','Revisar privacidad en redes sociales','Desactivar micrófono de asistentes'],
         right:['Aumenta el riesgo de deepfakes','Alimenta modelos de IA con tus datos','Limita quién puede acceder a tu información','Reduce la recopilación de tu voz'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Tu huella digital alimenta directamente los modelos de IA. Cada foto, grabación de voz y patrón de comportamiento se convierte en datos de entrenamiento o en vectores de ataque. La privacidad digital ya no es solo sobre proteger tu identidad — es sobre controlar qué datos pueden usar los modelos de IA en tu contra.',
         explain:'Tu huella digital es la materia prima de los ataques con IA. Reducir la cantidad y calidad de datos públicos sobre ti reduce directamente tu riesgo.'},
      ]
    },
    {
      title:'IA en contraseñas y autenticación',
      difficulty:'alto',
      questions:[
        {type:'choice',char:'🔑',
         q:'La IA puede analizar millones de contraseñas filtradas para predecir patrones. ¿Cómo te afecta esto?',
         choices:[
           {e:'😐',t:'No me afecta si tengo buena contraseña'},
           {e:'🎯',t:'La IA adivina contraseñas creadas por humanos mucho más rápido',ok:true},
           {e:'🔐',t:'Solo afecta a contraseñas cortas'},
           {e:'🤖',t:'Los gestores de contraseñas ya lo resuelven todo'},
         ],
         theory:'Los modelos de IA entrenados en contraseñas filtradas aprenden los patrones humanos: sustituciones comunes (@=a, 3=e), palabras con números al final, patrones de teclado (qwerty, 1234abcd). Esto reduce drásticamente el espacio efectivo de búsqueda. Una contraseña "creativa" que siga patrones humanos es vulnerable. La solución: aleatoriedad real generada por un gestor.',
         explain:'La IA aprende los patrones de cómo los humanos crean contraseñas "creativas". La única defensa es aleatoriedad real — usar un gestor que genere contraseñas verdaderamente aleatorias.'},

        {type:'tf',char:'👤',
         q:'El reconocimiento facial de IA puede ser engañado con una foto de alta resolución de tu cara.',
         ans:true,
         theory:'Los sistemas de reconocimiento facial 2D pueden ser engañados con fotos impresas o en pantalla. Por eso los sistemas más seguros usan "liveness detection" — detectan si la cara está viva buscando parpadeo, movimiento 3D o respuesta a instrucciones. Sin liveness detection, tu foto de redes sociales puede desbloquear dispositivos.',
         explain:'VERDADERO. Los sistemas de reconocimiento facial sin detección de vida (liveness detection) pueden ser engañados con fotos. Prefiere sistemas que pidan parpadeo o movimiento.'},

        {type:'choice',char:'🛡️',
         q:'¿Qué tipo de autenticación es más resistente a ataques de IA?',
         choices:[
           {e:'😊',t:'Reconocimiento facial simple'},
           {e:'🔑',t:'Llave de seguridad física (YubiKey)',ok:true},
           {e:'🔢',t:'PIN de 4 dígitos'},
           {e:'🗣️',t:'Reconocimiento de voz'},
         ],
         theory:'Las llaves de seguridad física (FIDO2) son inmunes a ataques de IA porque usan criptografía de clave pública. Requieren presencia física del dispositivo y verifican el dominio del sitio, protegiéndote también del phishing. La IA no puede clonar una llave física ni adivinar su clave privada con ninguna cantidad de poder computacional.',
         explain:'Las llaves de seguridad física son inmunes a deepfakes, clonación de voz y phishing de IA porque se basan en criptografía, no en biometría ni texto.'},

        {type:'pair',char:'🔗',
         q:'Relaciona el método de autenticación con su resistencia a ataques de IA:',
         left:['Reconocimiento facial sin liveness','Contraseña con patrones humanos','Llave física FIDO2/YubiKey','App TOTP (Google Authenticator)'],
         right:['Vulnerable a fotos de IA','Vulnerable a IA que predice patrones','Inmune a IA — requiere dispositivo físico','Resistente si el código no se comparte'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'La jerarquía de resistencia a IA en autenticación: Llave física FIDO2 (inmune) > App TOTP (muy resistente) > Biometría con liveness (resistente) > SMS (vulnerable a SIM swap) > Reconocimiento facial simple (vulnerable a deepfakes) > Contraseña humana (vulnerable a predicción IA).',
         explain:'No toda autenticación es igual ante la IA. Las llaves físicas son la mejor defensa porque no dependen de datos que la IA pueda falsificar o predecir.'},

        {type:'tf',char:'🧠',
         q:'Los gestores de contraseñas que generan contraseñas aleatorias protegen mejor contra ataques de IA que las contraseñas inventadas por humanos.',
         ans:true,
         theory:'La aleatoriedad criptográfica es la diferencia clave. Un gestor genera "xK#9mP!2qL@vN" usando un generador de números verdaderamente aleatorio. Un humano genera "M1perro@2024" siguiendo patrones predecibles que la IA ha aprendido de millones de contraseñas filtradas. La entropía real vs. la entropía aparente.',
         explain:'VERDADERO. La aleatoriedad real de un gestor produce contraseñas que la IA no puede predecir. Las contraseñas "creativas" humanas siguen patrones que los modelos de IA han aprendido.'},
      ]
    },
    {
      title:'Redes sociales e IA',
      difficulty:'medio',
      questions:[
        {type:'choice',char:'📱',
         q:'¿Qué hace el algoritmo de IA de las redes sociales con tu comportamiento de scroll?',
         choices:[
           {e:'📊',t:'Crea un perfil psicológico para mostrarte contenido adictivo',ok:true},
           {e:'📈',t:'Solo mide cuánto usas la app'},
           {e:'🎯',t:'Mejora los anuncios que ves'},
           {e:'🔒',t:'Protege tu privacidad adaptando el feed'},
         ],
         theory:'Los algoritmos de recomendación usan modelos de IA para maximizar el tiempo en la plataforma, no para mostrarte contenido útil. Aprenden que el contenido que genera miedo, rabia o sorpresa mantiene más tiempo a los usuarios. Este diseño "adictivo" tiene consecuencias documentadas en salud mental y polarización política.',
         explain:'Los algoritmos de IA optimizan para mantenerte en la plataforma, no para tu bienestar. El contenido que genera emociones fuertes (miedo, rabia) es amplificado porque genera más engagement.'},

        {type:'tf',char:'🎯',
         q:'Los anuncios en redes sociales pueden apuntar a ti basándose en conversaciones que tuviste cerca de tu teléfono.',
         ans:false,
         theory:'Aunque se debate mucho, las investigaciones técnicas no han encontrado evidencia de que las apps graben audio para publicidad. Lo que SÍ ocurre es que la IA predice tus intereses con tanta precisión usando tus datos de comportamiento, que parece que te están escuchando. Esta ilusión es evidencia del poder predictivo de los modelos de IA con datos de comportamiento.',
         explain:'FALSO (mayoritariamente). La IA predice tus intereses con tanta precisión usando datos de comportamiento que parece escucharte. No necesitan audio cuando tienen tus patrones de navegación.'},

        {type:'choice',char:'🤝',
         q:'Recibes una solicitud de amistad de alguien con perfil muy atractivo, pocas fotos y que se declaró inmediatamente. ¿Qué es probablemente?',
         choices:[
           {e:'💕',t:'Una persona tímida que le gustas'},
           {e:'🤖',t:'Un perfil de IA para un romance scam',ok:true},
           {e:'📱',t:'Alguien nuevo en redes sociales'},
           {e:'🌟',t:'Un influencer buscando contactos'},
         ],
         theory:'Las señales clásicas de perfil IA/falso: foto de perfil perfecta (generada por IA), pocas fotos sin contexto social real, declaración rápida de interés romántico, historia de vida vaga o contradictoria, siempre disponible para chatear, nunca puede hacer videollamada o siempre tiene excusas. El objetivo final: dinero.',
         explain:'Señales de alerta: foto perfecta sin contexto social, interés romántico muy rápido, nunca disponible para videollamada verificable. Son señales clásicas de romance scam con IA.'},

        {type:'sort',char:'🛡️',
         q:'Ordena estas acciones para proteger tu privacidad en redes sociales (de más a menos prioritaria):',
         items:['Configurar perfil como privado','Revisar qué apps tienen acceso a tu cuenta','No publicar ubicación en tiempo real','Usar contraseña fuerte y 2FA en la cuenta'],
         correct:[1,0,3,2],
         theory:'La seguridad de una cuenta de red social es tan fuerte como su punto más débil. Si la contraseña es débil, todo lo demás no importa. Si una app tiene acceso total pero la contraseña es fuerte, esa app puede comprometer todo. La cadena de seguridad: autenticación sólida → control de apps → privacidad de datos → comportamiento digital.',
         explain:'La contraseña fuerte + 2FA es la base. Sin eso, las configuraciones de privacidad no sirven de mucho si alguien puede entrar a tu cuenta.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la acción en redes sociales con su riesgo de IA:',
         left:['Publicar tu ubicación en tiempo real','Usar la misma foto en todos los perfiles','Aceptar solicitudes de desconocidos','Responder a encuestas virales'],
         right:['Facilita ataques físicos y stalking','Permite rastreo cross-plataforma con IA','Aumenta riesgo de romance scam IA','Recopila datos personales para IA'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Cada comportamiento en redes sociales genera datos que los sistemas de IA pueden explotar. La ubicación en tiempo real es explotada por sistemas de análisis de movimiento. La misma foto permite correlación entre plataformas. Las encuestas virales (favorito de infancia, primera mascota) recopilan respuestas a preguntas de seguridad.',
         explain:'Las encuestas virales del tipo "¿cuál fue tu primera mascota?" recopilan respuestas a preguntas de seguridad bancaria. Son ingeniería social empaquetada como entretenimiento.'},
      ]
    },
    {
      title:'Herramientas para protegerte de la IA',
      difficulty:'alto',
      questions:[
        {type:'choice',char:'🛠️',
         q:'¿Cuál de estas herramientas te ayuda a detectar si una imagen fue generada por IA?',
         choices:[
           {e:'🔎',t:'Google Reverse Image + Hive Moderation',ok:true},
           {e:'📸',t:'El filtro de Instagram'},
           {e:'🖥️',t:'El antivirus de tu PC'},
           {e:'📱',t:'La configuración de privacidad del teléfono'},
         ],
         theory:'El ecosistema de herramientas anti-IA incluye: detectores de imágenes IA (Hive Moderation, AI Image Detector), verificación de origen (Google Reverse Image, TinEye), detectores de deepfake de video (Deepware Scanner, Microsoft Video Authenticator), fact-checkers (Snopes, AFP Verificado, Colombia Check) y detectores de texto IA (GPTZero).',
         explain:'Hive Moderation y AI Image Detector analizan patrones invisibles para el ojo humano. Combinados con Google Reverse Image para verificar el origen, forman una defensa efectiva.'},

        {type:'tf',char:'🔐',
         q:'Activar la autenticación en dos pasos (2FA) con app protege tu cuenta incluso si un deepfake engaña el reconocimiento facial.',
         ans:true,
         theory:'El 2FA con app (TOTP) actúa como segunda barrera independiente del método biométrico. Incluso si un deepfake pasa el reconocimiento facial de una app, el atacante también necesita el código temporal de tu teléfono físico. Esta capa adicional es efectiva contra la mayoría de ataques de IA actuales.',
         explain:'VERDADERO. El 2FA con app es una segunda barrera que un deepfake no puede superar — requiere acceso físico a tu teléfono.'},

        {type:'choice',char:'🌐',
         q:'¿Qué navegador o extensión te ayuda a identificar contenido generado por IA mientras navegas?',
         choices:[
           {e:'🦊',t:'Firefox con extensión NewsGuard o SurfSafe',ok:true},
           {e:'🌐',t:'Internet Explorer actualizado'},
           {e:'🔵',t:'Microsoft Edge sin extensiones'},
           {e:'📱',t:'El navegador de Samsung'},
         ],
         theory:'Extensiones como NewsGuard califican la confiabilidad de sitios de noticias. SurfSafe detecta imágenes manipuladas. La extensión "AI Content Detector" marca texto generado por IA. Estas herramientas actúan como un copiloto de verificación mientras navegas, reduciendo el esfuerzo cognitivo de evaluar cada contenido manualmente.',
         explain:'NewsGuard y SurfSafe actúan como copiloto de verificación en tiempo real mientras navegas. Son extensiones gratuitas que señalan contenido potencialmente falso o generado por IA.'},

        {type:'sort',char:'🛡️',
         q:'Ordena estas herramientas de verificación de contenido IA de la más específica a la más general:',
         items:['Deepware Scanner (detecta deepfakes)','Google Reverse Image (origen de imágenes)','Snopes (fact-checking general)','NewsGuard (credibilidad de sitios)'],
         correct:[0,1,3,2],
         theory:'La jerarquía de herramientas va de lo específico (un deepfake en particular) a lo general (credibilidad de una fuente). Para un contenido concreto usas herramientas específicas. Para evaluar una fuente de información recurrente, usas herramientas de credibilidad. La estrategia de verificación combina ambos niveles.',
         explain:'Usa herramientas específicas para contenido concreto y herramientas generales para evaluar fuentes. La verificación efectiva combina ambos niveles.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la herramienta con lo que detecta:',
         left:['Deepware Scanner','Hive Moderation','Colombia Check / AFP','GPTZero'],
         right:['Deepfakes de video','Imágenes generadas por IA','Noticias falsas verificadas','Texto generado por IA'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Cada herramienta del ecosistema anti-desinformación se especializa en un tipo de contenido. El error común es buscar una sola herramienta que lo verifique todo. La realidad: necesitas la herramienta correcta para cada tipo de contenido (video, imagen, texto, fuente). La combinación de herramientas con pensamiento crítico es insustituible.',
         explain:'No existe una sola herramienta para todo. Usa la herramienta correcta para cada tipo de contenido: Deepware para video, Hive para imágenes, fact-checkers para noticias, GPTZero para texto.'},
      ]
    },
    {
      title:'Quiz final: IA y Seguridad',
      difficulty:'alto',
      questions:[
        {type:'choice',char:'🎓',
         q:'Tu empresa recibe una videollamada de tu "CEO" pidiendo una transferencia urgente de $50,000. ¿Cuál es el protocolo correcto?',
         choices:[
           {e:'💸',t:'Transferir — el CEO tiene autoridad'},
           {e:'🔐',t:'Colgar y verificar con el CEO por su teléfono personal registrado',ok:true},
           {e:'📧',t:'Pedir que lo confirme por email'},
           {e:'⏰',t:'Esperar a que lo pida dos veces'},
         ],
         theory:'El CEO fraud con deepfake es el ataque de mayor crecimiento en entornos corporativos. En 2024, una empresa en Hong Kong perdió $25 millones en una sola videollamada deepfake con múltiples ejecutivos falsos. El protocolo anti-fraude debe incluir: verificación por canal separado (teléfono personal registrado), doble autorización para transferencias grandes y código verbal de confirmación.',
         explain:'Protocolo anti-CEO fraud: colgar, llamar al número personal del CEO registrado previamente, obtener confirmación verbal con código de seguridad acordado. Nunca transferir basado en una sola comunicación digital.'},

        {type:'tf',char:'🎭',
         q:'Los deepfakes solo afectan a figuras públicas y celebridades, no a personas comunes.',
         ans:false,
         theory:'FALSO. Los deepfakes de personas comunes son cada vez más frecuentes: sextortion (deepfakes íntimos para extorsión), fraude familiar (clonar voz de hijo/padre para pedir dinero), fraude laboral y daño reputacional. El 96% de los deepfakes en internet son de naturaleza íntima no consensual, y la mayoría de víctimas son personas comunes.',
         explain:'FALSO. El 96% de los deepfakes en internet son de personas comunes, principalmente de naturaleza íntima para extorsión. Cualquier persona con fotos públicas es potencialmente víctima.'},

        {type:'choice',char:'🔍',
         q:'¿Cuál de estos comportamientos reduce MÁS tu vulnerabilidad a ataques de IA?',
         choices:[
           {e:'📵',t:'No usar internet'},
           {e:'🛡️',t:'Combinar 2FA + gestores de contraseñas + pensamiento crítico ante contenido digital',ok:true},
           {e:'🤖',t:'Usar solo apps con IA para detectar IA'},
           {e:'🔇',t:'No publicar nada en redes sociales'},
         ],
         theory:'La defensa más efectiva contra amenazas de IA no es una sola herramienta sino una combinación de: autenticación robusta (2FA con app o llave física), contraseñas aleatorias (gestor), pensamiento crítico (verificar antes de actuar/compartir), higiene digital (limitar datos públicos) y herramientas de verificación. La IA ataca en múltiples vectores simultáneamente.',
         explain:'No existe una bala de plata. La defensa efectiva combina autenticación robusta + contraseñas aleatorias + pensamiento crítico + verificación de contenido. Cada capa protege contra diferentes vectores de ataque.'},

        {type:'sort',char:'🏆',
         q:'Ordena estas amenazas de IA de la MÁS a MENOS frecuente en Colombia actualmente:',
         items:['Romance scam con perfiles IA','Deepfake de figuras políticas','Phishing con texto generado por IA','Clonación de voz para fraude familiar'],
         correct:[2,0,3,1],
         theory:'En Colombia, el phishing potenciado por IA es la amenaza más frecuente por su bajo costo y alta escala. Le siguen los romance scams con perfiles IA, que han aumentado significativamente. La clonación de voz para fraude familiar es emergente pero creciente. Los deepfakes políticos son menos frecuentes pero de alto impacto social.',
         explain:'El phishing con IA es la amenaza más frecuente porque escala fácilmente. Los romance scams con IA van en aumento en Latinoamérica. Conocer las amenazas más probables ayuda a priorizar tu defensa.'},

        {type:'pair',char:'🔗',
         q:'Relaciona la amenaza de IA con su mejor defensa:',
         left:['Phishing perfecto con IA','Deepfake de voz familiar','Perfil falso en redes','Desinformación con imágenes IA'],
         right:['Verificar dominio del remitente siempre','Palabra clave secreta con familia','Videollamada para verificar identidad','Google Reverse Image antes de compartir'],
         pairs:[[0,0],[1,1],[2,2],[3,3]],
         theory:'Cada amenaza de IA tiene su contramedida específica. El dominio del remitente es verificable incluso con texto perfecto de IA. La palabra clave secreta es imposible de adivinar para quien clona una voz. La videollamada con preguntas específicas desenmascara perfiles falsos. La búsqueda inversa revela imágenes manipuladas o sacadas de contexto.',
         explain:'Para cada amenaza de IA existe una defensa específica y práctica. Memoriza estos pares: phishing→dominio, voz clonada→palabra clave, perfil falso→videollamada, imagen falsa→búsqueda inversa.'},
      ]
    },
  ]
}];

/* ═══════════════════════════════════════════════════════
   MINI-GAME DATA
═══════════════════════════════════════════════════════ */
const MG_ROUNDS = [
  {label:'🔑 Contraseña',safe:true,icon:'🔐'},
  {label:'password123',safe:false,icon:'❌'},
  {label:'Enlace HTTPS',safe:true,icon:'🔒'},
  {label:'bit.ly/pr3mio',safe:false,icon:'⚠️'},
  {label:'Antivirus actualizado',safe:true,icon:'🛡️'},
  {label:'crack_office.exe',safe:false,icon:'💀'},
  {label:'2FA activado',safe:true,icon:'✅'},
  {label:'wifi_gratis_aeropuerto',safe:false,icon:'📡'},
  {label:'Backup en nube',safe:true,icon:'☁️'},
  {label:'adjunto_factura.exe',safe:false,icon:'🦠'},
  {label:'Gestor de contraseñas',safe:true,icon:'🗄️'},
  {label:'Tu_contraseña_aqui.txt',safe:false,icon:'📝'},
];

/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */
// Clave de localStorage donde se guarda el estado del juego (gs) de forma persistente
const LS='safexp_v1';

/* ─── PLACEMENT TEST ─── */
const PLACEMENT_QS = [
  {q:'¿Qué es el phishing?',choices:[
    {e:'🎣',t:'Engaño para robar datos personales',ok:true},
    {e:'🐟',t:'Un tipo de pesca deportiva'},
    {e:'🔐',t:'Un método de cifrado'},
    {e:'📧',t:'Un protocolo de email'}
  ]},
  {q:'¿Cuál es una contraseña segura?',choices:[
    {e:'😬',t:'123456'},
    {e:'🏠',t:'MiCasa2023'},
    {e:'💪',t:'xK#9mP!2qL@vN',ok:true},
    {e:'📅',t:'Fechadenacimiento'}
  ]},
  {q:'¿Qué significa HTTPS?',choices:[
    {e:'🔒',t:'Conexión cifrada y segura',ok:true},
    {e:'🌐',t:'Página web normal'},
    {e:'⚡',t:'Página de alta velocidad'},
    {e:'📶',t:'Señal WiFi fuerte'}
  ]},
  {q:'¿Qué es un malware?',choices:[
    {e:'🦠',t:'Software malicioso que daña sistemas',ok:true},
    {e:'💊',t:'Un medicamento digital'},
    {e:'🛡️',t:'Un antivirus'},
    {e:'📱',t:'Una app legítima'}
  ]},
  {q:'¿Qué es la autenticación de dos factores (2FA)?',choices:[
    {e:'🔑',t:'Usar dos contraseñas iguales'},
    {e:'📱',t:'Verificación con contraseña + segundo código',ok:true},
    {e:'👤',t:'Dos cuentas de usuario'},
    {e:'🔄',t:'Cambiar contraseña dos veces'}
  ]},
  {q:'¿Cuál de estas redes WiFi es más segura para conectarte?',choices:[
    {e:'☕',t:'WiFi gratis del café sin contraseña'},
    {e:'🏠',t:'Red de tu casa con WPA2',ok:true},
    {e:'📡',t:'WiFi público del aeropuerto'},
    {e:'🛒',t:'Red del centro comercial'}
  ]},
];
/* ─── DAILY CHALLENGES ─── */
const DAILY_CHALLENGES = [
  {id:'d1',title:'Detecta el phishing',
      emoji:'🎣',xp:50,gems:10,
   q:'Un correo de "tu banco" dice: Su cuenta será bloqueada. Haga clic aquí para verificar. ¿Qué haces?',
   choices:[
     {e:'🖱️',t:'Hago clic inmediatamente'},
     {e:'📞',t:'Llamo al banco directamente para verificar',ok:true},
     {e:'📧',t:'Reenvío el correo a amigos'},
     {e:'🤷',t:'Lo ignoro sin más'}
   ]},
  {id:'d2',title:'Contraseña segura',
      emoji:'🔑',xp:40,gems:8,
   q:'Necesitas crear una contraseña para tu email. ¿Cuál eliges?',
   choices:[
     {e:'😴',t:'password123'},
     {e:'🎂',t:'MiCumple1990'},
     {e:'🔐',t:'T#8kL!mQ2@pZ',ok:true},
     {e:'🐕',t:'NombreDeMiPerro'}
   ]},
  {id:'d3',title:'Red segura',
      emoji:'📡',xp:45,gems:9,
   q:'Vas a hacer una transferencia bancaria. ¿Desde qué red la haces?',
   choices:[
     {e:'☕',t:'WiFi público del café'},
     {e:'🏠',t:'Red de tu casa protegida con WPA2',ok:true},
     {e:'🛒',t:'WiFi del supermercado'},
     {e:'📱',t:'Red desconocida que encontré'}
   ]},
  {id:'d4',title:'Actualización de software',
      emoji:'💻',xp:35,gems:7,
   q:'Tu sistema operativo pide una actualización de seguridad urgente. ¿Qué haces?',
   choices:[
     {e:'⏰',t:'Lo pospongo indefinidamente'},
     {e:'⚡',t:'Instalo la actualización cuanto antes',ok:true},
     {e:'🗑️',t:'Desinstalo el sistema operativo'},
     {e:'🤔',t:'Busco el archivo en sitios no oficiales'}
   ]},
  {id:'d5',title:'USB desconocido',
      emoji:'💾',xp:55,gems:12,
   q:'Encuentras un USB en el suelo de la oficina. ¿Qué haces?',
   choices:[
     {e:'🔌',t:'Lo conecto a mi PC para ver qué tiene'},
     {e:'🗑️',t:'Lo tiro a la basura directamente'},
     {e:'🛡️',t:'Lo entrego a TI sin conectarlo',ok:true},
     {e:'💼',t:'Me lo quedo por si acaso'}
   ]},
  {id:'d6',title:'Permiso de app',
      emoji:'📱',xp:40,gems:8,
   q:'Una app de linterna pide acceso a tus contactos, cámara y micrófono. ¿Qué haces?',
   choices:[
     {e:'✅',t:'Acepto todos los permisos'},
     {e:'❌',t:'Rechazo los permisos innecesarios y la desinstalo',ok:true},
     {e:'🤷',t:'Acepto sin leer'},
     {e:'😴',t:'Dejo la pantalla y no hago nada'}
   ]},
  {id:'d7',title:'Enlace sospechoso',
      emoji:'🔗',xp:50,gems:10,
   q:'Tu amigo te envía: "gana-iphone-gratis.xyz/click-aqui". ¿Qué haces?',
   choices:[
     {e:'🖱️',t:'Hago clic, puede ser real'},
     {e:'📲',t:'Le pregunto a tu amigo si él lo envió realmente',ok:true},
     {e:'📤',t:'Lo reenvío a todos mis contactos'},
     {e:'🎁',t:'Relleno el formulario para ganar el premio'}
   ]},
];
function getTodayChallenge(){
  const d=new Date();
  const idx=(d.getFullYear()*366+d.getMonth()*31+d.getDate())%DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}
// Estado global del juego: persiste en localStorage; contiene todo el progreso del usuario
let gs={
  // xp: puntos de experiencia | streak: días consecutivos de práctica | gems: moneda del juego
  xp:0,streak:0,gems:0,hearts:5,completedActs:{},lastHeartRefill:Date.now(),
  // Si el test de nivel inicial ya fue completado | placementLevel: resultado del test
  placementDone:false,placementLevel:'básico',
  // Si el reto diario de hoy ya fue completado | dailyDate: fecha del último reto | dailyStreak: racha de retos
  dailyDone:false,dailyDate:'',dailyStreak:0,
  // Datos del perfil: nombre visible, emoji avatar, biografía y cosméticos equipados
  profile:{name:'Aprendiz',avatar:'🧑‍💻',bio:'',cosmetics:{frame:'frame_none',title:'title_none'}},
  // Array de IDs de logros desbloqueados por el usuario
  badges:[],
  // Nombre de fantasía elegido para el ranking competitivo
  rankingName:''
};
// Intenta cargar el estado guardado de localStorage al iniciar; si falla silencia el error
try{const s=localStorage.getItem(LS);if(s)gs={...gs,...JSON.parse(s)}}catch(e){}
// Ensure cosmetics object always exists
if(!gs.profile) gs.profile={name:'Aprendiz',avatar:'🧑‍💻',bio:'',cosmetics:{frame:'frame_none',title:'title_none'}};
if(!gs.profile.cosmetics) gs.profile.cosmetics={frame:'frame_none',title:'title_none'};
if(!gs.badges) gs.badges=[];
// Guarda el estado del juego en localStorage bajo la clave genérica LS y también bajo la clave del usuario
const save=()=>{
  // Save to generic key (always)
  // Persiste el estado global gs como JSON en la clave genérica del juego
  localStorage.setItem(LS,JSON.stringify(gs));
  // Also save to user-specific key so multiple accounts don't share progress
  try{
    const _sess=JSON.parse(localStorage.getItem(AUTH_SESSION)||'null');
    if(_sess&&!_sess.guest&&_sess.id){
      // También guarda bajo una clave específica del usuario (safexp_v1_+id) para soportar múltiples cuentas
      localStorage.setItem('safexp_v1_'+_sess.id, JSON.stringify(gs));
    }
  }catch(e){}
};

// Lesson state
let curUnit=null,curActIdx=0,curQIdx=0,answered=false,lesCorrect=0,lesTotalQ=6,lesStartTime=0;
let pairSelLeft=null,pairMatched=new Set();
let mgRound=[],mgIdx=0,mgScore=0,mgTimer=null,mgTimerVal=30;

/* ═══════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════ */
// Atajo para document.getElementById(): $(id) en lugar del nombre completo
const $=id=>document.getElementById(id);
// Muestra una pantalla y oculta todas las demás quitando/añadiendo clase 'active'
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
}
// Muestra una notificación temporal tipo toast en la parte inferior de la pantalla
function showToast(msg,dur=2200){
  const t=$('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}
function spawnXP(amount,x,y){
  const el=document.createElement('div');
  el.className='xp-pop';
  el.textContent='+'+amount+' XP';
  el.style.cssText=`left:${x}px;top:${y}px;position:fixed;z-index:500`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1300);
}
// Sincroniza los valores visuales de la barra superior con el estado actual del gs
function updateTopBar(){
  $('tb-streak').textContent=gs.streak;
  $('tb-gems').textContent=gs.gems;
  $('tb-xp').textContent=gs.xp;
  const hr=$('hearts-row');hr.innerHTML='';
  const _ic=TOPBAR_ICONS[a11yState?.theme]||TOPBAR_ICONS.light;
  for(let i=0;i<5;i++){
    const s=document.createElement('span');
    s.className='h-icon'+(i>=gs.hearts?' lost':'');
    s.textContent=i>=gs.hearts?_ic.heartLost:_ic.heart;
    hr.appendChild(s);
  }
}
function getUnitProgress(uid){
  const acts=gs.completedActs[uid]||[];
  const unit=UNITS.find(u=>u.id===uid);
  return unit?Math.round((acts.length/unit.activities.length)*100):0;
}
function isActDone(uid,idx){return (gs.completedActs[uid]||[]).includes(idx)}
function isActUnlocked(uid,idx){
  if(idx===0)return true;
  return isActDone(uid,idx-1);
}
function isUnitUnlocked(uid){
  const i=UNITS.findIndex(u=>u.id===uid);
  if(i===0)return true;
  return getUnitProgress(UNITS[i-1].id)>=100;
}

/* ═══════════════════════════════════════════════════════
   RENDER HOME MAP
═══════════════════════════════════════════════════════ */
// Renderiza el mapa de unidades de aprendizaje con el estado de progreso de cada una
function renderHome(){
  updateTopBar();
  const area=$('map-area');area.innerHTML='';
  const posOrder=['right','center','left','center','right','center','left','center','right','center'];
  /* Pixel art side decorations — injected as SVG emoji characters */
  const PIXEL_CHARS=['🧙','🛡️','🤖','👾','🎮','🧩'];
  ['left','right'].forEach((side,si)=>{
    const d=document.createElement('div');
    d.style.cssText=`position:fixed;${side}:6px;bottom:100px;font-size:clamp(2.2rem,5vw,3.2rem);
      opacity:.18;pointer-events:none;z-index:0;
      animation:charFloat 3s ease-in-out ${si*1.5}s infinite;line-height:1;
      filter:grayscale(.2);image-rendering:pixelated;`;
    d.textContent=PIXEL_CHARS[si*3%PIXEL_CHARS.length];
    area.appendChild(d);
  });
  const inner=document.createElement('div');inner.className='map-inner';area.appendChild(inner);
  const _area=inner;
  // Daily challenge button
  checkDailyReset();
  const dailyBtn=document.createElement('button');
  dailyBtn.className='daily-challenge-btn'+(gs.dailyDone?' done':'');
  dailyBtn.onclick=openDailyChallenge;
  const ch=getTodayChallenge();
  dailyBtn.innerHTML=`<span style="font-size:1.6rem">${ch.emoji}</span>
    <div style="text-align:left;flex:1">
      <div style="font-size:.72rem;opacity:.8;text-transform:uppercase;letter-spacing:.5px">Reto del día</div>
      <div style="font-size:.95rem;font-weight:900">${ch.title}</div>
    </div>
    <span class="daily-badge">${gs.dailyDone?'✅ Hecho':'⚡+'+ch.xp+' XP'}</span>`;
  _area.appendChild(dailyBtn);

  UNITS.forEach((unit,ui)=>{
    const unlocked=isUnitUnlocked(unit.id);
    const prog=getUnitProgress(unit.id);

    /* ── Banner de unidad ── */
    const bannerWrap=document.createElement('div');
    bannerWrap.className='unit-banner-wrap';
    const banner=document.createElement('button');
    banner.className='unit-banner';
    banner.style.background=`linear-gradient(135deg,${unit.color},${unit.colorD})`;
    banner.style.setProperty('--unit-color',unit.color);
    /* Icon sits outside overflow:hidden banner, inside wrapper */
    const ubIcon=document.createElement('div');
    ubIcon.className='ub-icon';
    ubIcon.textContent=unit.icon;
    if(unlocked){
      banner.innerHTML=`
        <div class="ub-text">
          <div class="ub-sec">${unit.section}</div>
          <div class="ub-title">${unit.label}</div>
          <div class="ub-prog-bar"><div class="ub-prog-fill" style="width:${prog}%"></div></div>
        </div>`;
      banner.onclick=()=>openUnitDetail(unit.id);
    } else {
      /* Banner bloqueado: mostrar botón de quiz de desbloqueo */
      banner.classList.add('locked-banner');
      banner.innerHTML=`
        <div class="ub-text">
          <div class="ub-sec">${unit.section}</div>
          <div class="ub-title">🔒 ${unit.label}</div>
          <div style="font-size:.72rem;opacity:.85;margin-top:.3rem">Completa la sección anterior para desbloquear</div>
        </div>
        <button class="ub-unlock-btn" onclick="event.stopPropagation();showUnlockQuiz(${ui})">🎯 Desbloquear</button>`;
      banner.onclick=()=>showToast('🔒 Completa la sección anterior o usa el quiz de desbloqueo');
    }
    bannerWrap.appendChild(banner);
    bannerWrap.appendChild(ubIcon);
    /* Tiny pixel char accent next to each banner */
    const pixelAccents=['👾','🕹️','⚔️','📡','🔐'];
    const px=document.createElement('span');
    px.style.cssText='position:absolute;left:-2.2rem;top:50%;transform:translateY(-50%);font-size:1.6rem;opacity:.55;pointer-events:none;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))';
    px.textContent=pixelAccents[ui%pixelAccents.length];
    bannerWrap.style.position='relative';
    bannerWrap.appendChild(px);
    _area.appendChild(bannerWrap);

    /* ── Columna de nodos ── */
    const pathCol=document.createElement('div');
    pathCol.className='path-col';
    pathCol.style.setProperty('--unit-color',unit.color);

    unit.activities.forEach((act,ai)=>{
      const done=isActDone(unit.id,ai);
      const current=!done&&isActUnlocked(unit.id,ai)&&unlocked;
      const locked=!unlocked||(!done&&!isActUnlocked(unit.id,ai));
      const pos=posOrder[ai]||'center';

      /* Punto central entre nodos */
      if(ai>0){
        const prevDone=isActDone(unit.id,ai-1);
        const dot=document.createElement('div');
        dot.className='path-dot'+(prevDone&&done?' done':'');
        if(prevDone||done) dot.style.background=unit.color;
        pathCol.appendChild(dot);
      }

      const row=document.createElement('div');
      row.className=`path-row ${pos}${done?' done-row':''}`;
      row.style.setProperty('--unit-color',unit.color);

      const wrap=document.createElement('div');
      wrap.className='node-wrap';

      const btn=document.createElement('button');
      btn.className='node-btn '+(done?'done':current?'current':'locked');
      btn.style.background=done?unit.color:current?'#ffc800':'#e8e8e8';
      if(done) btn.style.boxShadow=`0 5px 0 ${unit.colorD}`;
      btn.dataset.num=String(ai+1);
      const _dm={'bajo':'🟢 Bajo','medio':'🟡 Medio','alto':'🔴 Alto'};
      btn.innerHTML=`
        ${done?'<span class="nc">✨</span>':''}
        <span class="ni">${done?'✅':current?unit.icon:'🔒'}</span>
        <span class="nl">${ai+1}. ${act.title.split(' ').slice(0,2).join(' ')}</span>
        <span class="ndiff ndiff-${act.difficulty||'medio'}">${_dm[act.difficulty||'medio']}</span>
        ${done?'<div class="nst"><span>⭐</span><span>⭐</span><span>⭐</span></div>':''}` ;

      if(!locked) btn.onclick=()=>openUnitDetail(unit.id,ai);
      else btn.onclick=()=>showToast('🔒 Completa la actividad anterior');

      wrap.appendChild(btn);
      row.appendChild(wrap);
      pathCol.appendChild(row);
    });

    _area.appendChild(pathCol);
  });
}

/* ─── Unit Detail Panel ─── */
function openUnitDetail(uid,targetActIdx){
  const unit=UNITS.find(u=>u.id===uid);
  const panel=$('unit-detail');
  panel.innerHTML='';panel.classList.add('open');
  const prog=getUnitProgress(uid);
  const unlocked=isUnitUnlocked(uid);
  // Find current activity
  let currentIdx=targetActIdx!==undefined?targetActIdx:unit.activities.findIndex((_,i)=>!isActDone(uid,i)&&isActUnlocked(uid,i));
  if(currentIdx<0)currentIdx=unit.activities.length-1;
  panel.innerHTML=`
    <div class="ud-header" style="background:linear-gradient(135deg,${unit.color},${unit.colorD})" data-icon="${unit.icon}">
      <button class="ud-close-btn" onclick="closeUnitDetail()" aria-label="Cerrar panel">✕</button>
      <div class="ud-title">${unit.icon} ${unit.label}</div>
      <div class="ud-sub">${unit.desc}</div>
    </div>
    <div class="ud-progress">
      <div class="ud-prog-label"><span>Progreso</span><span>${prog}%</span></div>
      <div class="ud-prog-bar"><div class="ud-prog-fill" style="width:${prog}%;background:${unit.color}"></div></div>
    </div>
    <div class="activity-list" id="act-list"></div>
    <button class="ud-start-btn" id="ud-start-btn" ${!unlocked?'disabled':''}>
      ${unlocked?'▶ Comenzar actividad':'🔒 Completa la sección anterior'}
    </button>`;
  const list=$('act-list');
  unit.activities.forEach((act,i)=>{
    const done=isActDone(uid,i);
    const cur=i===currentIdx&&!done;
    const locked=!isActUnlocked(uid,i)||!unlocked;
    const item=document.createElement('div');
    item.className='act-item'+(done?' done':cur?' current-act':locked?' locked-act':'');
    item.innerHTML=`<div class="ai-num">${done?'✓':i+1}</div><span>${act.title}</span>`;
    if(!locked)item.onclick=()=>{currentIdx=i;$('ud-start-btn').onclick=()=>startLesson(uid,i);};
    list.appendChild(item);
  });
  $('ud-start-btn').onclick=()=>startLesson(uid,currentIdx);
}
function closeUnitDetail(){
  const panel=document.getElementById('unit-detail');
  if(panel){ panel.classList.remove('open'); panel.style.display=''; }
}
/* ═══════════════════════════════════
   TABS
═══════════════════════════════════ */
// Muestra un tab del menú de navegación inferior y activa su panel correspondiente
function showTab(t){
  // Hide all tabs
  ['map-area','unit-detail','tab-profile','tab-friends','tab-competitive','tab-ranking','tab-achievements'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  // Update nav
  document.querySelectorAll('.nav-icon-btn').forEach(b=>b.classList.remove('active'));
  const nb=document.getElementById('nav-'+t);
  if(nb) nb.classList.add('active');
  // Show target
  if(t==='map'){
    $('map-area').style.display='flex';
    const ud=$('unit-detail');if(ud)ud.style.display='';
  } else {
    const tab=$('tab-'+t);
    if(tab){ tab.style.display='block'; tab.style.flex='1'; tab.style.overflowY='auto'; }
    if(t==='profile') renderProfileTab();
    if(t==='ranking') renderRankingTab();
    if(t==='achievements') renderAchievementsTab();
    if(t==='friends') renderFriendsTab();
    if(t==='competitive') renderCompetitiveTab();
  }
}

/* ═══════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════ */

/* ════════════════════════════════════════════════
   RANKS — Definidos por XP acumulado
════════════════════════════════════════════════ */
const RANKS = [
  {id:'r0', min:0,    max:49,   icon:'🥚', name:'Huevo Digital',    color:'#afafaf', colorDark:'#888',     bg:'#f0f0f0', desc:'Acabas de comenzar tu viaje en ciberseguridad'},
  {id:'r1', min:50,   max:149,  icon:'🐣', name:'Aprendiz',          color:'#78c840', colorDark:'#46a302',  bg:'#d7f5b1', desc:'Dando los primeros pasos en el mundo digital seguro'},
  {id:'r2', min:150,  max:299,  icon:'🛡️', name:'Guardián Novato',  color:'#1cb0f6', colorDark:'#0086c9',  bg:'#ddf4ff', desc:'Empiezas a entender cómo protegerte en línea'},
  {id:'r3', min:300,  max:499,  icon:'⚔️', name:'Explorador Cyber', color:'#ff9600', colorDark:'#cc7000',  bg:'#fff0cc', desc:'Exploras los riesgos y defensas del ciberespacio'},
  {id:'r4', min:500,  max:749,  icon:'🔐', name:'Analista de Datos', color:'#ce82ff', colorDark:'#9c27b0',  bg:'#f3e0ff', desc:'Comprendes amenazas reales y cómo mitigarlas'},
  {id:'r5', min:750,  max:999,  icon:'🕵️', name:'Detective Digital', color:'#00cba1', colorDark:'#00956e',  bg:'#ccf5ed', desc:'Detectas patrones de ataque y te anticipas a ellos'},
  {id:'r6', min:1000, max:1499, icon:'🧙', name:'Mago de la Seguridad', color:'#f5576c', colorDark:'#c2185b', bg:'#ffd9e0', desc:'Dominas las técnicas avanzadas de ciberseguridad'},
  {id:'r7', min:1500, max:2199, icon:'🦅', name:'Halcón Cibernético', color:'#ffc800', colorDark:'#cc9800',  bg:'#fff7d6', desc:'Vuelas alto con conocimiento experto en seguridad'},
  {id:'r8', min:2200, max:2999, icon:'💎', name:'Mente de Cristal',   color:'#1cb0f6', colorDark:'#0086c9',  bg:'#ddf4ff', desc:'Tu mente es clara y afilada como un diamante digital'},
  {id:'r9', min:3000, max:Infinity, icon:'👑', name:'CyberLeyenda',   color:'#ffd700', colorDark:'#cc9800',  bg:'#fffbe0', desc:'Eres una leyenda de la ciberseguridad. Pocos llegan aquí.'},
];

// Retorna el objeto de rango actual del usuario basándose en su XP total
function getCurrentRank(xp){
  return RANKS.find(r=>xp>=r.min&&xp<=r.max)||RANKS[0];
}
function getNextRank(xp){
  const idx=RANKS.findIndex(r=>xp>=r.min&&xp<=r.max);
  return idx<RANKS.length-1?RANKS[idx+1]:null;
}
function getRankProgress(xp){
  const r=getCurrentRank(xp);
  if(r.max===Infinity)return 100;
  return Math.round(((xp-r.min)/(r.max-r.min))*100);
}

/* ════════════════════════════════════════════════
   ACHIEVEMENTS — 30 logros en 5 categorías
════════════════════════════════════════════════ */
const ACHIEVEMENTS_DEF = [
  /* ── PRIMEROS PASOS (6) ── */
  {id:'first_lesson',   cat:'inicio',   rarity:'common',    icon:'🎓', name:'Primera Lección',      xpBonus:10,  desc:'Completa tu primera actividad',                      check:()=>Object.values(gs.completedActs).some(a=>a.length>0)},
  {id:'placement',      cat:'inicio',   rarity:'common',    icon:'🎯', name:'Evaluado',              xpBonus:30,  desc:'Completa la prueba de posicionamiento inicial',       check:()=>gs.placementDone},
  {id:'first_daily',    cat:'inicio',   rarity:'common',    icon:'📅', name:'Primer Reto Diario',    xpBonus:15,  desc:'Completa tu primer reto del día',                     check:()=>gs.dailyStreak>=1},
  {id:'gem_collector',  cat:'inicio',   rarity:'common',    icon:'💎', name:'Coleccionista',         xpBonus:10,  desc:'Acumula 20 gemas',                                    check:()=>gs.gems>=20},
  {id:'no_errors',      cat:'inicio',   rarity:'uncommon',  icon:'✨', name:'Sin Errores',           xpBonus:20,  desc:'Completa una actividad sin perder ningún corazón',    check:()=>gs.hearts===5&&Object.values(gs.completedActs).some(a=>a.length>0)},
  {id:'profile_done',   cat:'inicio',   rarity:'common',    icon:'👤', name:'Identidad Digital',     xpBonus:10,  desc:'Personaliza tu perfil con nombre y avatar',           check:()=>gs.profile.name!=='Aprendiz'&&gs.profile.avatar!=='🧑‍💻'},

  /* ── RACHAS (5) ── */
  {id:'streak3',        cat:'racha',    rarity:'common',    icon:'🔥', name:'Racha de 3 días',       xpBonus:15,  desc:'Mantén una racha de 3 días consecutivos',            check:()=>gs.streak>=3},
  {id:'streak7',        cat:'racha',    rarity:'uncommon',  icon:'🌟', name:'Semana de Fuego',       xpBonus:30,  desc:'7 días de racha sin parar',                           check:()=>gs.streak>=7},
  {id:'streak14',       cat:'racha',    rarity:'rare',      icon:'🔥🔥', name:'Quinceañero Digital',  xpBonus:60,  desc:'14 días de racha seguidos',                           check:()=>gs.streak>=14},
  {id:'streak30',       cat:'racha',    rarity:'epic',      icon:'🌋', name:'Mes Imparable',         xpBonus:100, desc:'30 días consecutivos de aprendizaje',                 check:()=>gs.streak>=30},
  {id:'daily_streak7',  cat:'racha',    rarity:'uncommon',  icon:'🗓️', name:'Reto Semanal',         xpBonus:40,  desc:'Completa 7 retos diarios en total',                   check:()=>gs.dailyStreak>=7},

  /* ── XP Y RANGOS (7) ── */
  {id:'xp50',           cat:'xp',       rarity:'common',    icon:'⚡', name:'Primera Chispa',        xpBonus:0,   desc:'Acumula tus primeros 50 XP',                          check:()=>gs.xp>=50},
  {id:'xp150',          cat:'xp',       rarity:'common',    icon:'⚡⚡', name:'En Marcha',            xpBonus:0,   desc:'Acumula 150 XP',                                      check:()=>gs.xp>=150},
  {id:'xp300',          cat:'xp',       rarity:'uncommon',  icon:'💡', name:'Mente Brillante',       xpBonus:0,   desc:'Acumula 300 XP',                                      check:()=>gs.xp>=300},
  {id:'xp500',          cat:'xp',       rarity:'uncommon',  icon:'💎', name:'Diamante en Bruto',     xpBonus:0,   desc:'Acumula 500 XP',                                      check:()=>gs.xp>=500},
  {id:'xp1000',         cat:'xp',       rarity:'rare',      icon:'🏆', name:'Maestro XP',            xpBonus:0,   desc:'Acumula 1000 XP — Rango Mago desbloqueado',           check:()=>gs.xp>=1000},
  {id:'xp2200',         cat:'xp',       rarity:'epic',      icon:'💫', name:'Mente de Cristal',      xpBonus:0,   desc:'Acumula 2200 XP — Rango élite alcanzado',             check:()=>gs.xp>=2200},
  {id:'xp3000',         cat:'xp',       rarity:'legendary', icon:'👑', name:'CyberLeyenda',          xpBonus:50,  desc:'3000 XP — Leyenda de la ciberseguridad',              check:()=>gs.xp>=3000},

  /* ── SECCIONES (6) ── */
  {id:'unit_passwords', cat:'seccion',  rarity:'uncommon',  icon:'🔑', name:'Maestro de Contraseñas', xpBonus:50, desc:'Completa toda la sección de Contraseñas',             check:()=>getUnitProgress('passwords')===100},
  {id:'unit_phishing',  cat:'seccion',  rarity:'uncommon',  icon:'🎣', name:'Anti-Phishing Pro',      xpBonus:50, desc:'Completa toda la sección de Phishing',                check:()=>getUnitProgress('phishing')===100},
  {id:'unit_malware',   cat:'seccion',  rarity:'uncommon',  icon:'🦠', name:'Cazador de Malware',     xpBonus:50, desc:'Completa toda la sección de Malware',                 check:()=>getUnitProgress('malware')===100},
  {id:'unit_networks',  cat:'seccion',  rarity:'uncommon',  icon:'📡', name:'Arquitecto de Redes',    xpBonus:50, desc:'Completa toda la sección de Redes Seguras',           check:()=>getUnitProgress('networks')===100},
  {id:'unit_accounts',  cat:'seccion',  rarity:'uncommon',  icon:'🔐', name:'Guardián de Cuentas',    xpBonus:50, desc:'Completa toda la sección de Cuentas y 2FA',           check:()=>getUnitProgress('accounts')===100},
  {id:'unit_ai',      cat:'seccion',  rarity:'rare',      icon:'🤖', name:'Guardián Anti-IA',       xpBonus:80, desc:'Completa la sección de IA y Seguridad',              check:()=>getUnitProgress('ai_security')===100},
  {id:'all_units',      cat:'seccion',  rarity:'epic',      icon:'🌐', name:'Ciberseguridad Total',   xpBonus:200, desc:'Completa TODAS las secciones del programa',          check:()=>['passwords','phishing','malware','networks','accounts','ai_security'].every(u=>getUnitProgress(u)===100)},

  /* ── LEGENDARIOS (6) ── */
  {id:'perfect_week',   cat:'legendario', rarity:'epic',    icon:'🦅', name:'Semana Perfecta',       xpBonus:75,  desc:'Completa al menos 1 actividad cada día durante 7 días',  check:()=>gs.streak>=7&&gs.dailyStreak>=7},
  {id:'gem_rich',       cat:'legendario', rarity:'rare',    icon:'💰', name:'Tesoro Digital',        xpBonus:40,  desc:'Acumula 100 gemas',                                   check:()=>gs.gems>=100},
  {id:'speed_learner',  cat:'legendario', rarity:'rare',    icon:'⚡', name:'Aprendiz Veloz',        xpBonus:50,  desc:'Completa 5 actividades en un solo día',               check:()=>{const today=new Date().toDateString();return(gs.todayActs||0)>=5}},
  {id:'all_badges',     cat:'legendario', rarity:'legendary',icon:'🌟', name:'Coleccionista Total',   xpBonus:100, desc:'Desbloquea 20 logros',                                check:()=>gs.badges.length>=20},
  {id:'comeback',       cat:'legendario', rarity:'rare',    icon:'🔄', name:'El Regreso',            xpBonus:30,  desc:'Vuelve a aprender después de perder tu racha',        check:()=>gs.streak>=1&&gs.xp>=100},
  {id:'cyber_master',   cat:'legendario', rarity:'legendary',icon:'👑', name:'Gran Maestro Cyber',   xpBonus:150, desc:'Logra todos los demás logros épicos',                 check:()=>['all_units','perfect_week','xp3000'].every(id=>gs.badges.includes(id))},
];

function checkAndGrantBadges(){
  let newBadge=false;
  const prevRank=getCurrentRank(gs.xp);
  ACHIEVEMENTS_DEF?.forEach(a=>{
    if(!gs.badges.includes(a.id) && a.check()){
      gs.badges.push(a.id);
      newBadge=true;
      // Grant XP bonus for the achievement
      if(a.xpBonus>0){ gs.xp+=a.xpBonus; }
      const rarityLabel={common:'',uncommon:'🔵 ',rare:'🟣 Raro: ',epic:'🟠 Épico: ',legendary:'⭐ LEGENDARIO: '}[a.rarity]||'';
      setTimeout(()=>showBadgeToast(a),300+Math.random()*400);
    }
  });
  // Check rank up
  const newRank=getCurrentRank(gs.xp);
  if(newRank.id!==prevRank.id){
    setTimeout(()=>showRankUpToast(newRank),800);
  }
  if(newBadge) save();
}

function showBadgeToast(a){
  const rarityColors={common:'var(--green)',uncommon:'var(--blue)',rare:'var(--purple)',epic:'var(--orange)',legendary:'#ffd700'};
  const col=rarityColors[a.rarity]||'var(--green)';
  const t=document.getElementById('toast');
  if(!t)return;
  t.innerHTML=`<span style="font-size:1.3rem">${a.icon}</span>
    <div style="line-height:1.3">
      <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:${col}">¡Logro desbloqueado!</div>
      <div style="font-size:.85rem;font-weight:900">${a.name}</div>
      ${a.xpBonus>0?`<div style="font-size:.65rem;color:var(--gd)">+${a.xpBonus} XP bonus</div>`:''}
    </div>`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),3200);
}

function showRankUpToast(rank){
  const t=document.getElementById('toast');
  if(!t)return;
  t.innerHTML=`<span style="font-size:1.5rem">${rank.icon}</span>
    <div style="line-height:1.3">
      <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:${rank.color}">¡Subiste de Rango!</div>
      <div style="font-size:.9rem;font-weight:900;color:${rank.color}">${rank.name}</div>
      <div style="font-size:.65rem;color:var(--muted)">${rank.desc}</div>
    </div>`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),4000);
}
// Renderiza la pestaña de logros: muestra todos los badges con estado bloqueado/desbloqueado
function renderAchievementsTab(){
  const el=$('tab-achievements');
  const total=ACHIEVEMENTS_DEF.length;
  const earned=gs.badges.length;
  const rank=getCurrentRank(gs.xp);
  const nextRank=getNextRank(gs.xp);
  const pct=getRankProgress(gs.xp);

  // Group achievements by category
  const cats={
    inicio:    {label:'🌱 Primeros Pasos', items:[]},
    racha:     {label:'🔥 Rachas',         items:[]},
    xp:        {label:'⚡ XP y Rangos',    items:[]},
    seccion:   {label:'📚 Secciones',      items:[]},
    legendario:{label:'👑 Legendarios',    items:[]},
  };
  ACHIEVEMENTS_DEF?.forEach(a=>{
    if(cats[a.cat]) cats[a.cat].items.push(a);
  });

  const rarityLabel={common:'',uncommon:'🔵',rare:'🟣',epic:'🟠',legendary:'⭐'};
  const rarityColors={common:'var(--green)',uncommon:'var(--blue)',rare:'var(--purple)',epic:'var(--orange)',legendary:'#ffd700'};

  el.innerHTML=`<div class="achieve-wrap">

    <!-- RANK SECTION -->
    <div style="background:var(--bg);border-radius:16px;padding:1rem;margin-bottom:1rem;border:2.5px solid ${rank.color}">
      <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:.6rem">
        <div style="font-size:2.6rem;line-height:1">${rank.icon}</div>
        <div style="flex:1">
          <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:var(--muted)">Tu Rango Actual</div>
          <div style="font-size:1.1rem;font-weight:900;color:${rank.color}">${rank.name}</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:1px">${rank.desc}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1rem;font-weight:900;color:var(--text)">⚡${gs.xp}</div>
          <div style="font-size:.65rem;color:var(--muted)">XP total</div>
        </div>
      </div>
      ${nextRank?`
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:.3rem;display:flex;justify-content:space-between">
          <span>Próximo: <strong style="color:${nextRank.color}">${nextRank.icon} ${nextRank.name}</strong></span>
          <span>${nextRank.min-gs.xp} XP restantes</span>
        </div>
        <div class="xp-progress-bar" style="--fill-start:${rank.color};--fill-end:${nextRank.color}">
          <div class="xp-progress-fill" style="width:${pct}%"></div>
        </div>
      `:`<div style="text-align:center;font-size:.8rem;font-weight:900;color:var(--yellow);margin-top:.2rem">👑 ¡Has alcanzado el rango máximo!</div>`}
    </div>

    <!-- TODOS LOS RANGOS -->
    <div class="achieve-section-title">🏅 Tabla de Rangos</div>
    <div class="ranks-showcase">
      ${RANKS.map((r,i)=>{
        const isCurrent=r.id===rank.id;
        const isPast=gs.xp>r.max;
        return `<div class="rank-row ${isCurrent?'current-rank':''}" style="${isCurrent?'border-color:'+r.color+';background:'+r.bg:''}${isPast?';opacity:.6':''}">
          <div class="rank-row-icon">${r.icon}</div>
          <div class="rank-row-info">
            <div class="rank-row-name" style="${isCurrent?'color:'+r.color:''}">${r.name}${isCurrent?' ← tú':''}</div>
            <div class="rank-row-xp">${r.max===Infinity?r.min+'+':r.min+'–'+r.max} XP</div>
          </div>
          <div class="rank-row-badge" style="color:${r.color};border-color:${r.color};background:${r.bg}">${isPast?'✓ Superado':isCurrent?'Actual':'Bloqueado'}</div>
        </div>`;
      }).join('')}
    </div>

    <!-- LOGROS POR CATEGORÍA -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
      <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:var(--muted)">Logros: ${earned}/${total}</div>
      <div style="background:var(--border);border-radius:99px;height:6px;width:60%;overflow:hidden">
        <div style="height:100%;background:var(--yellow);border-radius:99px;width:${Math.round(earned/total*100)}%;transition:width .5s"></div>
      </div>
    </div>

    ${Object.entries(cats).map(([catKey,cat])=>`
      <div class="achieve-section-title">${cat.label}</div>
      <div class="achieve-grid">
        ${cat.items.map(a=>{
          const unlocked=gs.badges.includes(a.id);
          const rc=rarityColors[a.rarity]||'var(--green)';
          const rl=rarityLabel[a.rarity]||'';
          return `<div class="achieve-card ${unlocked?'unlocked':''} ${a.rarity==='legendary'?'legendary':''}" style="${unlocked?'border-color:'+rc:''}">
            <span class="achieve-icon">${a.icon}</span>
            <div class="achieve-name">${a.name}</div>
            <div class="achieve-desc">${a.desc}</div>
            ${rl?`<div style="font-size:.58rem;color:${rc};font-weight:900;margin-top:.2rem">${rl} ${a.rarity}</div>`:''}
            ${a.xpBonus>0?`<div class="achieve-xp-reward">+${a.xpBonus} XP</div>`:''}
          </div>`;
        }).join('')}
      </div>
    `).join('')}
  </div>`;
}

/* ═══════════════════════════════════
   PROFILE TAB
═══════════════════════════════════ */
const AVATARS=['🧑‍💻','👩‍💻','🧙','🦸','🤖','👾','🧑‍🚀','👩‍🚀','🧑‍🎓','👩‍🎓','🦊','🐺','🐱','🦁','🐸','🐧'];

/* ════════════════════════════════════════════════
   COSMETICS — Insignias que personalizan el perfil
   Se desbloquean con logros, rangos y XP
════════════════════════════════════════════════ */
const COSMETICS = {

  /* ── MARCOS DE AVATAR ── */
  frames: [
    {id:'frame_none',    preview:'⬜', name:'Sin marco',       css:'av-frame-none',   color:'#afafaf', unlockReq:null,             unlockDesc:'Disponible desde el inicio'},
    {id:'frame_cyber',   preview:'🔵', name:'Cyber Azul',      css:'av-frame-cyber',  color:'#1cb0f6', unlockReq:'xp50',           unlockDesc:'Logro: Primera Chispa (50 XP)'},
    {id:'frame_hacker',  preview:'🟢', name:'Hacker Verde',    css:'av-frame-hacker', color:'#58cc02', unlockReq:'unit_passwords', unlockDesc:'Completa: Sección Contraseñas'},
    {id:'frame_fire',    preview:'🔴', name:'Llama Roja',      css:'av-frame-fire',   color:'#ff4b4b', unlockReq:'streak7',        unlockDesc:'Logro: Semana de Fuego'},
    {id:'frame_shield',  preview:'🩵', name:'Escudo Teal',     css:'av-frame-shield', color:'#00cba1', unlockReq:'unit_accounts',  unlockDesc:'Completa: Sección Cuentas y 2FA'},
    {id:'frame_gold',    preview:'🟡', name:'Dorado',          css:'av-frame-gold',   color:'#ffd700', unlockReq:'xp500',          unlockDesc:'Logro: Diamante en Bruto (500 XP)'},
    {id:'frame_neon',    preview:'🟣', name:'Neon Morado',     css:'av-frame-neon',   color:'#ce82ff', unlockReq:'xp1000',         unlockDesc:'Logro: Maestro XP (1000 XP)'},
    {id:'frame_legend',  preview:'⭐', name:'Legendario',      css:'av-frame-legend', color:'#ffd700', unlockReq:'xp3000',         unlockDesc:'Logro: CyberLeyenda (3000 XP)'},
    {id:'frame_rainbow', preview:'🌈', name:'Arcoíris',        css:'av-frame-rainbow',color:'#ff4b4b', unlockReq:'all_units',      unlockDesc:'Logro: Ciberseguridad Total'},
  ],

  /* ── TÍTULOS ── */
  titles: [
    {id:'title_none',      preview:'—',  name:'Sin título',          color:'#afafaf', bg:'#f0f0f0',   border:'#ddd',     unlockReq:null,             unlockDesc:'Disponible desde el inicio'},
    {id:'title_learner',   preview:'📚', name:'Aprendiz Curioso',  color:'#46a302', bg:'#d7f5b1',   border:'#58cc02',  unlockReq:'first_lesson',   unlockDesc:'Logro: Primera Lección'},
    {id:'title_vigilant',  preview:'👁️', name:'Vigilante Digital',  color:'#0086c9', bg:'#ddf4ff',   border:'#1cb0f6',  unlockReq:'unit_phishing',  unlockDesc:'Completa: Sección Phishing'},
    {id:'title_hunter',    preview:'🎯', name:'Cazador de Amenazas', color:'#cc7000', bg:'#fff0cc',   border:'#ff9600',  unlockReq:'unit_malware',   unlockDesc:'Completa: Sección Malware'},
    {id:'title_guardian',  preview:'🛡️', name:'Guardián de Redes',  color:'#9c27b0', bg:'#f3e0ff',   border:'#ce82ff',  unlockReq:'unit_networks',  unlockDesc:'Completa: Sección Redes'},
    {id:'title_detective', preview:'🕵️', name:'Detective Cyber',    color:'#00956e', bg:'#ccf5ed',   border:'#00cba1',  unlockReq:'streak14',       unlockDesc:'Logro: Quinceañero Digital'},
    {id:'title_master',    preview:'🧙', name:'Maestro de Seguridad',color:'#c2185b', bg:'#ffd9e0',   border:'#f5576c',  unlockReq:'xp1000',         unlockDesc:'Logro: Maestro XP (1000 XP)'},
    {id:'title_shadow',    preview:'🐺', name:'Compañero de Shadow', color:'#3c3c3c', bg:'#e8e8e8',   border:'#888',     unlockReq:'daily_streak7',  unlockDesc:'Logro: Reto Semanal (7 retos)'},
    {id:'title_legend',    preview:'👑', name:'CyberLeyenda',        color:'#cc9800', bg:'#fffbe0',   border:'#ffd700',  unlockReq:'xp3000',         unlockDesc:'Logro: CyberLeyenda (3000 XP)'},
    {id:'title_total',     preview:'🌐', name:'Héroe de la Red',     color:'#1cb0f6', bg:'#ddf4ff',   border:'#0086c9',  unlockReq:'all_units',      unlockDesc:'Logro: Ciberseguridad Total'},
    {id:'title_ai',        preview:'🤖', name:'Guardián Anti-IA',    color:'#7c3aed', bg:'#ede9fe',   border:'#7c3aed',  unlockReq:'unit_ai',        unlockDesc:'Completa: Sección IA y Seguridad'},
  ],

  /* ── AVATARES DESBLOQUEABLES ── */
  special: [
    {id:'av_ninja',    preview:'🥷', name:'Ninja Cyber',     unlockReq:'streak7',        unlockDesc:'Logro: Semana de Fuego'},
    {id:'av_hacker',   preview:'💻', name:'El Hacker',       unlockReq:'unit_passwords', unlockDesc:'Completa: Contraseñas'},
    {id:'av_shield',   preview:'🦸', name:'Superhéroe',      unlockReq:'unit_malware',   unlockDesc:'Completa: Malware'},
    {id:'av_detective',preview:'🔍', name:'Detective',       unlockReq:'unit_phishing',  unlockDesc:'Completa: Phishing'},
    {id:'av_astronaut',preview:'👨‍🚀', name:'Astronauta',     unlockReq:'xp300',          unlockDesc:'300 XP alcanzados'},
    {id:'av_wizard',   preview:'🧝', name:'Elfo Mágico',     unlockReq:'xp500',          unlockDesc:'500 XP alcanzados'},
    {id:'av_robot',    preview:'🦾', name:'CyberRobot',      unlockReq:'xp1000',         unlockDesc:'1000 XP alcanzados'},
    {id:'av_crown',    preview:'🫅', name:'Rey Cyber',       unlockReq:'xp3000',         unlockDesc:'3000 XP — Leyenda'},
  ],
};

/* Equipar cosméticos */
// Verifica si un cosmético está desbloqueado: sin requisito (siempre) o con badge específico en gs
function isCosmeticUnlocked(item){
  if(!item.unlockReq) return true;
  return gs.badges.includes(item.unlockReq);
}
// Equipa un cosmético (marco o título) actualizando gs.profile.cosmetics y guardando
function equipCosmetic(type, id){
  if(!gs.profile.cosmetics) gs.profile.cosmetics={frame:'frame_none',title:'title_none'};
  // Map picker type to storage key
  const storageKey={frames:'frame',titles:'title'}[type]||type;
  gs.profile.cosmetics[storageKey]=id;
  save();
  // Re-render the full profile tab so changes are visible immediately
  renderProfileTab();
  // Re-open cosmetic picker on same tab after re-render
  const z=document.getElementById('cosmetic-picker-zone');
  if(z){ z.style.display='block'; const firstBtn=z.querySelector('.cosmetic-tab'); showCosmeticTab(type||'frames', firstBtn); }
  showToast('✨ ¡'+( type==='frames'?'Marco':'Título')+' equipado!');
}
function getEquippedFrame(){
  const id=gs.profile.cosmetics?.frame||'frame_none';
  return COSMETICS.frames.find(f=>f.id===id)||COSMETICS.frames[0];
}
function getEquippedTitle(){
  const id=gs.profile.cosmetics?.title||'title_none';
  return COSMETICS.titles.find(t=>t.id===id)||COSMETICS.titles[0];
}

// Renderiza la pestaña de perfil: avatar, nombre, bio, stats, cosméticos y opciones
function renderProfileTab(){
  const el=$('tab-profile');if(!el)return;
  const doneActs=Object.values(gs.completedActs).reduce((s,a)=>s+a.length,0);
  const _rank=getCurrentRank(gs.xp);
  const nextRank=getNextRank(gs.xp);
  const frame=getEquippedFrame();
  const title=getEquippedTitle();
  const unlockedFrames=COSMETICS.frames.filter(f=>isCosmeticUnlocked(f)).length;
  const unlockedTitles=COSMETICS.titles.filter(t=>isCosmeticUnlocked(t)).length;

  // Frame inline styles map (guarantees override of .profile-avatar base style)
  const FRAME_INLINE={
    'av-frame-none':   'border:3px solid var(--border)',
    'av-frame-cyber':  'border:4px solid #1cb0f6;box-shadow:0 0 14px rgba(28,176,246,.6)',
    'av-frame-hacker': 'border:4px solid #58cc02;box-shadow:0 0 14px rgba(88,204,2,.6)',
    'av-frame-fire':   'border:4px solid #ff4b4b;box-shadow:0 0 14px rgba(255,75,75,.6)',
    'av-frame-shield': 'border:4px solid #00cba1;box-shadow:0 0 14px rgba(0,203,161,.6)',
    'av-frame-gold':   'border:4px solid #ffd700;box-shadow:0 0 18px rgba(255,215,0,.7)',
    'av-frame-neon':   'border:4px solid #ce82ff;box-shadow:0 0 18px rgba(206,130,255,.7)',
    'av-frame-legend': 'border:4px solid #ffd700;box-shadow:0 0 24px rgba(255,215,0,.8),0 0 48px rgba(255,215,0,.3)',
    'av-frame-rainbow':'border:4px solid #ff4b4b;animation:rainbowBorder 3s linear infinite',
  };
  const frameStyle = FRAME_INLINE[frame.css] || FRAME_INLINE['av-frame-none'];

  el.innerHTML='';
  const wrap=document.createElement('div');wrap.className='profile-wrap';

  // ── Profile card ──
  const card=document.createElement('div');
  card.style.cssText='background:linear-gradient(135deg,'+_rank.color+'22,'+_rank.bg+');border:2.5px solid '+_rank.color+';border-radius:20px;padding:1.2rem;text-align:center;margin-bottom:1rem;position:relative;overflow:hidden';

  const deco=document.createElement('div');
  deco.style.cssText='position:absolute;right:-20px;top:-20px;font-size:5rem;opacity:.08;pointer-events:none';
  deco.textContent=_rank.icon;
  card.appendChild(deco);

  // Avatar with frame
  const avWrap=document.createElement('div');avWrap.className='profile-avatar-wrap';
  const avDiv=document.createElement('div');
  avDiv.className='profile-avatar';
  avDiv.style.cssText=frameStyle; // inline style always wins over class
  avDiv.title='Toca para personalizar';
  avDiv.setAttribute('onclick','showCosmeticPicker()');
  avDiv.textContent=gs.profile.avatar;
  const avEdit=document.createElement('div');avEdit.className='profile-avatar-edit';avEdit.textContent='🎨';
  avDiv.appendChild(avEdit);
  avWrap.appendChild(avDiv);
  card.appendChild(avWrap);

  // Name
  const nameEl=document.createElement('div');
  nameEl.className='profile-name';nameEl.style.marginTop='.5rem';
  nameEl.textContent=gs.profile.name;
  card.appendChild(nameEl);

  // Title badge
  if(title && title.id!=='title_none'){
    const tBadge=document.createElement('div');
    tBadge.className='profile-title-badge';
    tBadge.style.cssText='color:'+title.color+';background:'+title.bg+';border-color:'+title.border+';display:inline-block;margin-top:.3rem';
    tBadge.textContent=title.preview+' '+title.name;
    card.appendChild(tBadge);
  } else {
    const sp=document.createElement('div');sp.style.height='.3rem';card.appendChild(sp);
  }

  // Rank badge
  const rankBadge=document.createElement('div');
  rankBadge.style.cssText='display:inline-flex;align-items:center;gap:.4rem;padding:.3rem .9rem;border-radius:99px;background:'+_rank.bg+';border:1.5px solid '+_rank.color+';margin-top:.5rem';
  const rankSpan=document.createElement('span');rankSpan.textContent=_rank.icon+' '+_rank.name+' · ⚡'+gs.xp+' XP';
  rankSpan.style.cssText='font-size:.78rem;font-weight:900;color:'+_rank.colorDark;
  rankBadge.appendChild(rankSpan);
  card.appendChild(rankBadge);

  // XP progress bar
  if(nextRank){
    const pct=getRankProgress(gs.xp);
    const barWrap=document.createElement('div');
    barWrap.style.cssText='margin:.7rem auto 0;max-width:200px';
    barWrap.innerHTML='<div style="font-size:.65rem;color:'+_rank.colorDark+';font-weight:800;margin-bottom:3px">'+
      (nextRank.min-gs.xp)+' XP para '+nextRank.icon+' '+nextRank.name+'</div>'+
      '<div style="background:rgba(0,0,0,.1);border-radius:99px;height:6px;overflow:hidden">'+
      '<div style="height:100%;background:'+_rank.color+';border-radius:99px;width:'+pct+'%;transition:width .6s"></div></div>';
    card.appendChild(barWrap);
  }
  wrap.appendChild(card);

  // ── Stats ──
  const statsGrid=document.createElement('div');statsGrid.className='profile-stats-grid';
  [
    {val:'⚡'+gs.xp,        lbl:'XP Total'},
    {val:'🔥'+gs.streak,     lbl:'Racha'},
    {val:'💎'+gs.gems,       lbl:'Gemas'},
    {val:'📚'+doneActs,      lbl:'Actividades'},
    {val:'🎖️'+gs.badges.length,lbl:'Logros'},
    {val:'🎨'+(unlockedFrames+unlockedTitles),lbl:'Cosméticos'},
  ].forEach(s=>{
    const st=document.createElement('div');st.className='profile-stat';
    st.innerHTML='<div class="profile-stat-val">'+s.val+'</div><div class="profile-stat-lbl">'+s.lbl+'</div>';
    statsGrid.appendChild(st);
  });
  wrap.appendChild(statsGrid);

  // ── Edit form ──
  const editForm=document.createElement('div');editForm.className='profile-edit-form';
  const editTitle=document.createElement('div');
  editTitle.style.cssText='font-size:.75rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.6rem';
  editTitle.textContent='✏️ Editar perfil';
  editForm.appendChild(editTitle);
  const nameInput=document.createElement('input');
  nameInput.className='profile-input';nameInput.id='prof-name';
  nameInput.placeholder='Tu nombre';nameInput.value=gs.profile.name;nameInput.maxLength=24;
  editForm.appendChild(nameInput);
  const bioArea=document.createElement('textarea');
  bioArea.className='profile-input';bioArea.id='prof-bio';
  bioArea.placeholder='Describe tus intereses, aficiones...';
  bioArea.rows=2;bioArea.maxLength=120;bioArea.style.resize='none';
  bioArea.value=gs.profile.bio||'';
  editForm.appendChild(bioArea);

  // Avatar selector
  const avLabel=document.createElement('div');
  avLabel.style.cssText='font-size:.72rem;color:var(--muted);font-weight:800;margin-bottom:.35rem';
  avLabel.textContent='Avatar base:';
  editForm.appendChild(avLabel);

  const avPicker=document.createElement('div');avPicker.className='avatar-picker';avPicker.style.marginBottom='.6rem';
  const allAvatars=[...AVATARS,...COSMETICS.special.filter(s=>isCosmeticUnlocked(s)).map(s=>s.preview)];
  allAvatars.forEach(av=>{
    const opt=document.createElement('div');opt.className='avatar-opt'+(av===gs.profile.avatar?' sel':'');
    opt.textContent=av;opt.setAttribute('onclick','selectAvatar("'+av+'")');
    avPicker.appendChild(opt);
  });
  COSMETICS.special.filter(s=>!isCosmeticUnlocked(s)).forEach(s=>{
    const opt=document.createElement('div');opt.className='avatar-opt';
    opt.style.cssText='opacity:.35;cursor:not-allowed';opt.title=s.unlockDesc;opt.textContent='🔒';
    avPicker.appendChild(opt);
  });
  editForm.appendChild(avPicker);

  const saveBtn=document.createElement('button');saveBtn.className='profile-save-btn';
  saveBtn.textContent='Guardar cambios';saveBtn.setAttribute('onclick','saveProfile()');

  // ── Notifications toggle ──
  const notifRow=document.createElement('div');notifRow.className='notif-toggle-row';
  const notifEnabled=gs.notificationsEnabled!==false; // default ON
  notifRow.innerHTML=`
    <label style="display:flex;align-items:flex-start;gap:.5rem;flex:1;cursor:pointer" for="notif-sw">
      <div>
        <div class="notif-toggle-label"><span>🔔</span> Notificaciones</div>
        <div class="notif-toggle-desc">Recibe recordatorios de racha y retos diarios</div>
      </div>
    </label>
    <label class="notif-switch" aria-label="Activar o desactivar notificaciones">
      <input type="checkbox" id="notif-sw" ${notifEnabled?'checked':''} onchange="toggleNotifications(this.checked)">
      <div class="notif-track"></div>
      <div class="notif-thumb"></div>
    </label>`;
  editForm.appendChild(notifRow);
  editForm.appendChild(saveBtn);
  wrap.appendChild(editForm);

  // ── Cosmetic picker ──
  const cosmeticZone=document.createElement('div');
  cosmeticZone.id='cosmetic-picker-zone';cosmeticZone.style.display='none';
  cosmeticZone.style.marginTop='.8rem';
  cosmeticZone.innerHTML='<div style="font-size:.82rem;font-weight:900;color:var(--text);margin-bottom:.5rem">🎨 Personalizar perfil</div>'+
    '<div class="cosmetic-tabs">'+
    '<button class="cosmetic-tab active" onclick="showCosmeticTab(\'frames\',this)">🖼️ Marcos</button>'+
    '<button class="cosmetic-tab" onclick="showCosmeticTab(\'titles\',this)">🏷️ Títulos</button>'+
    '</div>'+
    '<div id="cosmetic-content"></div>';
  wrap.appendChild(cosmeticZone);

  // ── Change password section ──
  const pwSection=document.createElement('div');pwSection.className='profile-edit-form';pwSection.style.marginTop='.8rem';
  pwSection.innerHTML=`
    <div style="font-size:.75rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.7rem">🔑 Cambiar contraseña</div>
    <div class="pw-change-fields" id="pw-change-fields" style="display:none">
      <div class="auth-field-wrap" style="margin-bottom:.45rem">
        <span class="auth-field-icon" style="top:50%;transform:translateY(-50%)">🔒</span>
        <input class="auth-input profile-input" id="pw-current" type="password" placeholder="Contraseña actual" autocomplete="current-password" style="padding-left:2.4rem">
        <div class="auth-field-error" id="pw-current-err"></div>
      </div>
      <div class="auth-field-wrap" style="margin-bottom:.45rem">
        <span class="auth-field-icon" style="top:50%;transform:translateY(-50%)">🆕</span>
        <input class="auth-input profile-input" id="pw-new" type="password" placeholder="Nueva contraseña (mín. 8 caracteres)" autocomplete="new-password" oninput="pwCheckStrength(this.value)" style="padding-left:2.4rem">
        <div class="auth-field-error" id="pw-new-err"></div>
      </div>
      <div id="pw-strength-wrap-profile" style="display:none;margin-bottom:.45rem">
        <div style="background:var(--border);border-radius:99px;height:5px;overflow:hidden;margin-bottom:3px">
          <div id="pw-strength-bar-profile" style="height:100%;border-radius:99px;width:0;transition:width .3s,background .3s"></div>
        </div>
        <div id="pw-strength-label-profile" style="font-size:.65rem;font-weight:900"></div>
      </div>
      <div class="auth-field-wrap" style="margin-bottom:.6rem">
        <span class="auth-field-icon" style="top:50%;transform:translateY(-50%)">✅</span>
        <input class="auth-input profile-input" id="pw-new2" type="password" placeholder="Confirmar nueva contraseña" autocomplete="new-password" style="padding-left:2.4rem">
        <div class="auth-field-error" id="pw-new2-err"></div>
      </div>
      <div style="display:flex;gap:.5rem">
        <button onclick="doChangePassword()" style="flex:1;padding:.65rem;border-radius:12px;border:none;background:var(--blue);color:#fff;font-family:Nunito;font-weight:900;font-size:.88rem;cursor:pointer">Actualizar contraseña</button>
        <button onclick="togglePwChangeForm(false)" style="padding:.65rem 1rem;border-radius:12px;border:2px solid var(--border);background:transparent;color:var(--muted);font-family:Nunito;font-weight:900;font-size:.85rem;cursor:pointer">Cancelar</button>
      </div>
    </div>
    <button id="pw-change-toggle-btn" onclick="togglePwChangeForm(true)" style="width:100%;padding:.6rem;border-radius:12px;border:2px solid var(--border);background:transparent;color:var(--text);font-family:Nunito;font-weight:900;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.4rem">
      🔑 Cambiar contraseña
    </button>`;
  wrap.appendChild(pwSection);

  // Placement info
  const placeDiv=document.createElement('div');
  placeDiv.style.cssText='margin-top:.8rem;padding:.7rem;background:var(--bg);border-radius:12px;border:2px solid var(--border);font-size:.75rem;color:var(--muted);font-weight:700;text-align:center';
  placeDiv.innerHTML='🎯 Nivel: <strong style="color:var(--text)">'+gs.placementLevel+'</strong>';
  if(!gs.placementDone){
    const pb=document.createElement('button');
    pb.style.cssText='display:inline-block;margin-left:.5rem;padding:.3rem .8rem;border-radius:8px;border:none;background:var(--purple);color:#fff;font-family:Nunito;font-weight:900;cursor:pointer;font-size:.72rem';
    pb.textContent='Evaluarme';pb.onclick=openPlacement;
    placeDiv.appendChild(pb);
  }
  wrap.appendChild(placeDiv);

  el.appendChild(wrap);
}
function openAvatarPicker(){
  const z=document.getElementById('avatar-picker-zone');
  if(z) z.style.display=z.style.display==='none'?'block':'none';
}
function selectAvatar(av){
  gs.profile.avatar=av;
  document.querySelectorAll('.avatar-opt').forEach(el=>el.classList.toggle('sel',el.textContent===av));
  updateTopbarIcons(a11yState?.theme);
}
function saveProfile(){
  const n=document.getElementById('prof-name')?.value?.trim();
  const b=document.getElementById('prof-bio')?.value?.trim();
  if(n) gs.profile.name=n;
  gs.profile.bio=b||'';
  save();
  checkAndGrantBadges();
  showToast('✅ Perfil guardado');
  renderProfileTab();
}

// Activa o desactiva las notificaciones del usuario y persiste la preferencia
function toggleNotifications(enabled){
  gs.notificationsEnabled=enabled;
  save();
  if(enabled){
    // Solicitar permiso del navegador si está disponible
    if('Notification' in window && Notification.permission==='default'){
      Notification.requestPermission().then(perm=>{
        if(perm==='granted'){
          showToast('🔔 Notificaciones activadas');
        } else {
          showToast('⚠️ Permiso denegado por el navegador');
          gs.notificationsEnabled=false;save();
          const sw=document.getElementById('notif-sw');
          if(sw) sw.checked=false;
        }
      });
    } else {
      showToast('🔔 Notificaciones activadas');
    }
  } else {
    showToast('🔕 Notificaciones desactivadas');
  }
}
window.toggleNotifications=toggleNotifications;

/* ── Cambio de contraseña desde perfil ── */
// Muestra u oculta el formulario de cambio de contraseña y alterna el botón disparador
function togglePwChangeForm(show){
  const fields=document.getElementById('pw-change-fields');
  const btn=document.getElementById('pw-change-toggle-btn');
  if(!fields||!btn) return;
  fields.style.display=show?'block':'none';
  btn.style.display=show?'none':'flex';
  if(show){
    // Limpiar errores y valores previos
    ['pw-current','pw-new','pw-new2'].forEach(id=>{
      const el=document.getElementById(id);if(el) el.value='';
      const err=document.getElementById(id+'-err');if(err){err.textContent='';err.classList.remove('show');}
    });
    const sw=document.getElementById('pw-strength-wrap-profile');
    if(sw) sw.style.display='none';
    setTimeout(()=>document.getElementById('pw-current')?.focus(),80);
  }
}
window.togglePwChangeForm=togglePwChangeForm;

// Evalúa la fortaleza de la nueva contraseña y actualiza la barra visual del perfil
function pwCheckStrength(pw){
  const wrap=document.getElementById('pw-strength-wrap-profile');
  const bar=document.getElementById('pw-strength-bar-profile');
  const lbl=document.getElementById('pw-strength-label-profile');
  if(!wrap||!bar||!lbl) return;
  if(!pw){wrap.style.display='none';return;}
  wrap.style.display='block';
  let score=0;
  if(pw.length>=8) score++;
  if(pw.length>=12) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  const levels=[
    {w:'15%',bg:'var(--red)',   label:'Muy débil 🔴'},
    {w:'30%',bg:'var(--orange)',label:'Débil 🟠'},
    {w:'55%',bg:'var(--yellow)',label:'Regular 🟡'},
    {w:'78%',bg:'var(--teal)', label:'Buena 🟢'},
    {w:'100%',bg:'var(--green)',label:'Excelente 💚'},
  ];
  const lvl=levels[Math.min(score,4)];
  bar.style.width=lvl.w; bar.style.background=lvl.bg;
  lbl.textContent=lvl.label; lbl.style.color=lvl.bg;
}
window.pwCheckStrength=pwCheckStrength;

// Valida y aplica el cambio de contraseña en la DB local del usuario autenticado
function doChangePassword(){
  // Limpiar errores previos
  ['pw-current','pw-new','pw-new2'].forEach(id=>{
    const err=document.getElementById(id+'-err');
    if(err){err.textContent='';err.classList.remove('show');}
    const inp=document.getElementById(id);
    if(inp) inp.classList.remove('error');
  });

  const showFieldErr=(id,msg)=>{
    const err=document.getElementById(id+'-err');const inp=document.getElementById(id);
    if(err){err.textContent=msg;err.classList.add('show');}
    if(inp) inp.classList.add('error');
  };

  const session=_authGetSession();
  if(!session||session.guest){showToast('⚠️ Solo disponible con cuenta registrada');return;}

  const current=document.getElementById('pw-current')?.value||'';
  const newPw=document.getElementById('pw-new')?.value||'';
  const newPw2=document.getElementById('pw-new2')?.value||'';

  let ok=true;
  if(!current){showFieldErr('pw-current','Ingresa tu contraseña actual');ok=false;}
  if(newPw.length<8){showFieldErr('pw-new','La nueva contraseña debe tener al menos 8 caracteres');ok=false;}
  if(newPw&&newPw!==newPw2){showFieldErr('pw-new2','Las contraseñas no coinciden');ok=false;}
  if(!ok) return;

  const db=_authGetDB();
  const user=(db.users||[]).find(u=>u.email===session.email);
  if(!user||user.password!==_hashSimple(current)){
    showFieldErr('pw-current','Contraseña actual incorrecta');
    document.getElementById('pw-current').value='';
    return;
  }
  if(_hashSimple(newPw)===user.password){
    showFieldErr('pw-new','La nueva contraseña debe ser diferente a la actual');
    return;
  }

  user.password=_hashSimple(newPw);
  _authSaveDB(db);
  showToast('✅ Contraseña actualizada correctamente');
  togglePwChangeForm(false);
}
window.doChangePassword=doChangePassword;

/* ═══════════════════════════════════
   RANKING
═══════════════════════════════════ */

/* ════════════════════════════════════════════════
   FRIENDS SYSTEM
════════════════════════════════════════════════ */
// Simulated friend data (in production comes from backend)
const MOCK_FRIENDS = [
  {id:'f1', name:'CyberNinja',   avatar:'🥷', xp:1240, online:true,  status:'friend',      streak:14, lastAct:'Completó Phishing avanzado', lastActTime:'hace 5 min',  wins:8, losses:2, mutual:true},
  {id:'f2', name:'SecureHawk',   avatar:'🦅', xp:980,  online:false, status:'friend',      streak:7,  lastAct:'Completó Red Segura',         lastActTime:'hace 2 h',    wins:5, losses:4, mutual:true},
  {id:'f3', name:'CipherFox',    avatar:'🦊', xp:620,  online:true,  status:'friend',      streak:3,  lastAct:'Ganó un duelo rápido',         lastActTime:'hace 12 min', wins:3, losses:6, mutual:true},
  {id:'f4', name:'DataShield',   avatar:'🛡️', xp:310,  online:false, status:'friend',      streak:1,  lastAct:'Completó Contraseñas',        lastActTime:'hace 1 día',  wins:1, losses:3, mutual:true},
  {id:'f5', name:'NetGuard',     avatar:'🤖', xp:180,  online:true,  status:'pending_in',  streak:2,  lastAct:'Se unió a safeXP',             lastActTime:'hace 1 h',    wins:0, losses:0, mutual:false},
  {id:'f6', name:'ByteWolf',     avatar:'🐺', xp:290,  online:false, status:'pending_out', streak:5,  lastAct:'Completó Malware',             lastActTime:'hace 3 h',    wins:2, losses:2, mutual:false},
];

// Duel history per friend
let duelHistory = {
  f1:[{result:'win',score:'4-2',date:'Ayer'},{result:'loss',score:'1-4',date:'Hace 3 días'}],
  f2:[{result:'win',score:'3-2',date:'Hace 1 día'}],
  f3:[{result:'loss',score:'2-3',date:'Hoy'}],
  f4:[],
};

let friendsData = [...MOCK_FRIENDS];
let friendSearchResults = [];
let activeFriendProfile = null; // for profile drawer

/* [renderFriendsTab original removed — replaced by social version below] */

let _searchTimeout=null;
function debouncedSearch(){
  clearTimeout(_searchTimeout);
  _searchTimeout=setTimeout(searchFriend,350);
}

// Construye la tarjeta visual de un amigo en la lista: avatar, nombre, rango, XP y acciones
function buildFriendCard(f, status){
  const card=document.createElement('div');card.className='friend-card';
  const rank=getCurrentRank(f.xp);

  // Avatar
  const av=document.createElement('div');av.className='friend-avatar';av.textContent=f.avatar;
  if(f.online){const dot=document.createElement('div');dot.className='friend-online-dot';av.appendChild(dot);}
  card.appendChild(av);

  // Info
  const info=document.createElement('div');info.className='friend-info';
  const nameDiv=document.createElement('div');nameDiv.className='friend-name';nameDiv.textContent=f.name;
  const rankDiv=document.createElement('div');rankDiv.className='friend-rank';
  rankDiv.textContent=rank.icon+' '+rank.name;
  const xpDiv=document.createElement('div');xpDiv.className='friend-xp';xpDiv.textContent='⚡'+f.xp+' XP';
  info.appendChild(nameDiv);info.appendChild(rankDiv);info.appendChild(xpDiv);

  if(f.lastAct){
    const actDiv=document.createElement('div');actDiv.className='friend-last-act';
    actDiv.textContent='↳ '+f.lastAct+' · '+f.lastActTime;
    info.appendChild(actDiv);
  }
  if(status==='friend'&&(f.streak||0)>0){
    const stk=document.createElement('span');stk.className='friend-streak-badge';
    stk.textContent='🔥 '+f.streak+' días';info.appendChild(stk);
  }
  if(status==='friend'&&(f.wins+f.losses)>0){
    const row=document.createElement('div');row.className='friend-stats-row';
    const w=document.createElement('span');w.className='friend-stat-pill wins';w.textContent='✓ '+f.wins+' victorias';
    const l=document.createElement('span');l.className='friend-stat-pill losses';l.textContent='✗ '+f.losses+' derrotas';
    row.appendChild(w);row.appendChild(l);info.appendChild(row);
  }
  card.appendChild(info);

  // Actions
  const actions=document.createElement('div');actions.className='friend-actions';
  if(status==='friend'){
    const chalBtn=document.createElement('button');chalBtn.className='friend-btn challenge';
    chalBtn.innerHTML='⚔️';chalBtn.title='Retar a duelo';
    chalBtn.onclick=(e)=>{e.stopPropagation();startDuelWith(f);};
    actions.appendChild(chalBtn);
  } else if(status==='pending_in'){
    const accBtn=document.createElement('button');accBtn.className='friend-btn accept';
    accBtn.textContent='✓';accBtn.title='Aceptar';
    accBtn.onclick=(e)=>{e.stopPropagation();acceptFriend(f.id);};
    const decBtn=document.createElement('button');decBtn.className='friend-btn decline';
    decBtn.textContent='✕';decBtn.title='Rechazar';
    decBtn.onclick=(e)=>{e.stopPropagation();declineFriend(f.id);};
    actions.appendChild(accBtn);actions.appendChild(decBtn);
  } else if(status==='pending_out'){
    const cancBtn=document.createElement('button');cancBtn.className='friend-btn decline';
    cancBtn.textContent='Cancelar';
    cancBtn.onclick=(e)=>{e.stopPropagation();cancelRequest(f.id);};
    actions.appendChild(cancBtn);
  }
  card.appendChild(actions);

  // Open drawer on card click (friends only)
  if(status==='friend') card.onclick=()=>openFriendDrawer(f);
  return card;
}

/* ── Friend profile drawer ── */
// Abre el drawer inferior con el perfil completo del amigo seleccionado
function openFriendDrawer(f){
  closeFriendDrawer();
  const rank=getCurrentRank(f.xp);
  const history=duelHistory[f.id]||[];
  const totalW=history.filter(h=>h.result==='win').length;
  const totalL=history.filter(h=>h.result==='loss').length;

  const backdrop=document.createElement('div');backdrop.className='friend-drawer-backdrop';
  backdrop.onclick=closeFriendDrawer;

  const drawer=document.createElement('div');drawer.className='friend-drawer';drawer.id='friend-drawer';
  drawer.innerHTML=`
    <div class="drawer-handle"></div>
    <div class="drawer-profile-head">
      <div class="drawer-avatar">${f.avatar}${f.online?'<div class="friend-online-dot" style="width:12px;height:12px"></div>':''}</div>
      <div style="flex:1">
        <div class="drawer-name">${f.name}</div>
        <div class="drawer-rank" style="color:${rank.color}">${rank.icon} ${rank.name}</div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:2px">${f.online?'🟢 En línea ahora':'⚫ Desconectado · visto '+f.lastActTime}</div>
      </div>
    </div>
    <div style="background:var(--bg);border-radius:12px;padding:.7rem;margin-bottom:.8rem;font-size:.75rem;color:var(--muted);font-weight:700">
      <span style="color:var(--text);font-weight:900">Última actividad:</span> ${f.lastAct} · ${f.lastActTime}
    </div>
    <div class="drawer-stats">
      <div class="drawer-stat"><div class="drawer-stat-val">⚡${f.xp}</div><div class="drawer-stat-lbl">XP Total</div></div>
      <div class="drawer-stat"><div class="drawer-stat-val">🔥${f.streak||0}</div><div class="drawer-stat-lbl">Racha</div></div>
      <div class="drawer-stat"><div class="drawer-stat-val">🏆${totalW}</div><div class="drawer-stat-lbl">Victorias</div></div>
    </div>`;

  // Duel history
  if(history.length>0){
    const histDiv=document.createElement('div');histDiv.className='drawer-history';
    histDiv.innerHTML='<div class="drawer-history-title">⚔️ Historial de duelos</div>';
    history.forEach(h=>{
      const row=document.createElement('div');row.className='duel-history-row '+h.result;
      const icons={win:'🏆',loss:'💪',draw:'🤝'};
      const labels={win:'Victoria',loss:'Derrota',draw:'Empate'};
      row.innerHTML=`<span>${icons[h.result]}</span><span style="flex:1">${labels[h.result]}</span><span style="font-size:.85rem;font-weight:900">${h.score}</span><span style="opacity:.6;font-size:.68rem;margin-left:.4rem">${h.date}</span>`;
      histDiv.appendChild(row);
    });
    drawer.appendChild(histDiv);
  } else {
    drawer.innerHTML+=`<div style="text-align:center;padding:.5rem;color:var(--muted);font-size:.8rem;margin-bottom:.8rem">No hay duelos contra este jugador todavía</div>`;
  }

  // Actions
  const actionsDiv=document.createElement('div');actionsDiv.className='drawer-actions';
  if(f.online){
    const duelBtn=document.createElement('button');duelBtn.className='drawer-action-btn';
    duelBtn.style.cssText='background:linear-gradient(135deg,#ff4b4b,#ce82ff);color:#fff';
    duelBtn.innerHTML='⚔️ Retar a duelo ahora';
    duelBtn.onclick=()=>{closeFriendDrawer();startDuelWith(f);};
    actionsDiv.appendChild(duelBtn);
  }
  const removeBtn=document.createElement('button');removeBtn.className='drawer-action-btn';
  removeBtn.style.cssText='background:var(--rs);color:var(--rd)';
  removeBtn.innerHTML='✕ Eliminar amigo';
  removeBtn.onclick=()=>{closeFriendDrawer();removeFriend(f.id);};
  actionsDiv.appendChild(removeBtn);
  drawer.appendChild(actionsDiv);

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

// Cierra el drawer de perfil de amigo
function closeFriendDrawer(){
  document.getElementById('friend-drawer')?.remove();
  document.querySelector('.friend-drawer-backdrop')?.remove();
}

function shareViaOther(code){
  if(navigator.share){
    navigator.share({
      title:'¡Únete a safeXP!',
      text:'Aprende ciberseguridad conmigo. Mi código de amigo: '+code,
      url:'https://safexp.app'
    });
  } else {
    copyFriendCode(code);
  }
}

// Busca jugadores por nombre o código SAFE-XXX-0000 y muestra los resultados
function searchFriend(){
  const query=(document.getElementById('friend-search-input')?.value||'').trim().toLowerCase();
  const res=document.getElementById('friend-search-results');
  if(!res) return;
  if(!query){res.innerHTML='';return;}

  // Simulate search — in prod calls /api/users/search
  const ALL_PLAYERS=[
    {id:'p1',name:'CyberNinja',avatar:'🥷',xp:1240},{id:'p2',name:'PixelHero',avatar:'🦸',xp:380},
    {id:'p3',name:'DataPunk',avatar:'🤘',xp:520},{id:'p4',name:'SafeStar',avatar:'⭐',xp:140},
    {id:'p5',name:'CodeMaster',avatar:'👨‍💻',xp:250},{id:'p6',name:'NightOwl',avatar:'🦉',xp:680},
  ];
  const matches=ALL_PLAYERS.filter(p=>p.name.toLowerCase().includes(query)||('safe-'+p.name.substring(0,3)+'-'+String(p.xp).padStart(4,'0')).toLowerCase().includes(query));

  if(matches.length===0){
    res.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.8rem;padding:.7rem">No se encontraron jugadores con ese nombre</div>';
    return;
  }
  res.innerHTML='';
  const list=document.createElement('div');list.className='friends-list';
  list.style.marginTop='.4rem';
  matches.forEach(p=>{
    const isFriend=friendsData.some(f=>f.id===p.id&&f.status==='friend');
    const isPending=friendsData.some(f=>f.id===p.id);
    const card=document.createElement('div');card.className='friend-card';
    const rank=getCurrentRank(p.xp);
    card.innerHTML=`
      <div class="friend-avatar">${p.avatar}</div>
      <div class="friend-info">
        <div class="friend-name">${p.name}</div>
        <div class="friend-rank">${rank.icon} ${rank.name} · ⚡${p.xp} XP</div>
      </div>`;
    if(!isFriend && !isPending){
      const addBtn=document.createElement('button');addBtn.className='friend-btn add';
      addBtn.textContent='+ Agregar';
      addBtn.onclick=()=>sendFriendRequest(p);
      const actions=document.createElement('div');actions.className='friend-actions';
      actions.appendChild(addBtn);card.appendChild(actions);
    } else {
      const lbl=document.createElement('div');lbl.style.cssText='font-size:.7rem;color:var(--muted);font-weight:800;padding:.3rem .5rem';
      lbl.textContent=isFriend?'✓ Amigos':'Pendiente';
      card.appendChild(lbl);
    }
    list.appendChild(card);
  });
  res.appendChild(list);
}

function sendFriendRequest(player){
  friendsData.push({...player,online:false,mutual:false,status:'pending_out'});
  showToast('📩 Solicitud enviada a '+player.name);
  renderFriendsTab();
}
// Acepta una solicitud de amistad entrante (cambia status a 'friend')
function acceptFriend(id){
  const f=friendsData.find(x=>x.id===id);if(!f)return;
  f.status='friend';f.mutual=true;
  showToast('👥 ¡Ahora son amigos con '+f.name+'!');
  checkAndGrantBadges&&checkAndGrantBadges();
  renderFriendsTab();
}
function declineFriend(id){
  friendsData=friendsData.filter(f=>f.id!==id);
  showToast('Solicitud rechazada');
  renderFriendsTab();
}
function cancelRequest(id){
  friendsData=friendsData.filter(f=>f.id!==id);
  showToast('Solicitud cancelada');
  renderFriendsTab();
}
// Elimina un amigo de la lista después de pedir confirmación
function removeFriend(id){
  const f=friendsData.find(x=>x.id===id);
  if(!confirm('¿Eliminar a '+(f?f.name:'este amigo')+' de tu lista?'))return;
  friendsData=friendsData.filter(x=>x.id!==id);
  showToast('Amigo eliminado');
  renderFriendsTab();
}
// Copia el código de amigo al portapapeles y muestra toast de confirmación
function copyFriendCode(code){
  navigator.clipboard?.writeText(code).then(()=>showToast('📋 Código copiado: '+code)).catch(()=>showToast('Código: '+code));
}
function shareViaWhatsApp(code){
  const msg=encodeURIComponent('¡Únete a safeXP y aprende ciberseguridad conmigo! 🛡️ Mi código: '+code+' — descarga en safeXP.app');
  window.open('https://wa.me/?text='+msg,'_blank');
}
/* [startDuelWith stub removed — full version below] */


/* ════════════════════════════════════════════════
   COMPETITIVE MODE
════════════════════════════════════════════════ */
let duelActive=false, duelScore={me:0,opp:0}, duelQIdx=0, duelTimer=null;

const DUEL_QUESTIONS=[
  {q:'¿Qué hace un firewall?',choices:[
    {e:'🛡️',t:'Filtra el tráfico de red según reglas',ok:true},
    {e:'💾',t:'Almacena contraseñas cifradas'},
    {e:'📧',t:'Gestiona el correo electrónico'},
    {e:'🔋',t:'Optimiza el consumo de batería'},
  ]},
  {q:'¿Cuál es la extensión de archivo más peligrosa en un email?',choices:[
    {e:'📄',t:'.pdf'},
    {e:'🖼️',t:'.jpg'},
    {e:'⚙️',t:'.exe',ok:true},
    {e:'📝',t:'.txt'},
  ]},
  {q:'¿Qué significa "cifrado de extremo a extremo"?',choices:[
    {e:'🔒',t:'Solo el remitente y receptor pueden leer el mensaje',ok:true},
    {e:'🌐',t:'El mensaje se cifra solo en el servidor'},
    {e:'📡',t:'El mensaje viaja por una red privada'},
    {e:'💻',t:'Solo se puede leer en computadoras'},
  ]},
  {q:'¿Qué es un ataque "man in the middle"?',choices:[
    {e:'👥',t:'Un atacante intercepta la comunicación entre dos partes',ok:true},
    {e:'🤼',t:'Dos hackers atacando al mismo tiempo'},
    {e:'🎭',t:'Suplantar a alguien en redes sociales'},
    {e:'💣',t:'Un ataque DDoS coordinado'},
  ]},
  {q:'¿Cuál protocolo es más seguro para transferir archivos?',choices:[
    {e:'📁',t:'FTP'},
    {e:'🔐',t:'SFTP',ok:true},
    {e:'📡',t:'Telnet'},
    {e:'🌐',t:'HTTP'},
  ]},
  {q:'¿Qué es el "social engineering" en ciberseguridad?',choices:[
    {e:'💬',t:'Manipular personas para obtener información confidencial',ok:true},
    {e:'🤝',t:'Usar redes sociales para marketing'},
    {e:'🖥️',t:'Hackear cuentas de redes sociales'},
    {e:'📊',t:'Analizar comportamiento en redes'},
  ]},
];

const SEASON_TIERS=[
  {name:'Bronce',   icon:'🥉', color:'#cd7f32', minPts:0},
  {name:'Plata',    icon:'🥈', color:'#c0c0c0', minPts:100},
  {name:'Oro',      icon:'🥇', color:'#ffd700', minPts:250},
  {name:'Platino',  icon:'💠', color:'#1cb0f6', minPts:500},
  {name:'Diamante', icon:'💎', color:'#b9f2ff', minPts:1000},
  {name:'Maestro',  icon:'👑', color:'#ce82ff', minPts:2000},
];

function getCompTier(pts){
  let tier=SEASON_TIERS[0];
  SEASON_TIERS.forEach(t=>{if(pts>=t.minPts)tier=t;});
  return tier;
}

const TOURNAMENTS=[
  {id:'t1',name:'Copa de Contraseñas',icon:'🔑',topic:'Contraseñas',
   prize:'500 XP + Marco Dorado',startDate:'Hoy 18:00',players:24,maxPlayers:32,
   active:true,myScore:85,standings:[
    {pos:1,name:'CyberNinja',avatar:'🥷',score:120},
    {pos:2,name:'SecureHawk',avatar:'🦅',score:105},
    {pos:3,name:'Me',avatar:'',score:85,isMe:true},
    {pos:4,name:'DataPunk',avatar:'🤘',score:70},
  ]},
  {id:'t2',name:'Torneo Anti-Phishing',icon:'🎣',topic:'Phishing',
   prize:'300 XP + Título Especial',startDate:'Mañana 15:00',players:18,maxPlayers:64,
   active:false,myScore:0,standings:[]},
  {id:'t3',name:'Gran Torneo Cyber',icon:'🏆',topic:'Todas las secciones',
   prize:'1500 XP + Marco Leyenda',startDate:'Sábado 12:00',players:8,maxPlayers:128,
   active:false,myScore:0,standings:[]},
];

// Renderiza la pestaña competitiva: rango actual, historial de duelos y tabla de posiciones
function renderCompetitiveTab(){
  const el=$('tab-competitive');if(!el)return;
  const compPts=gs.compPoints||0;
  const tier=getCompTier(compPts);
  const nextTierIdx=SEASON_TIERS.findIndex(t=>t===tier)+1;
  const nextTier=nextTierIdx<SEASON_TIERS.length?SEASON_TIERS[nextTierIdx]:null;
  const friends=friendsData.filter(f=>f.status==='friend'&&f.online);

  el.innerHTML='';
  const wrap=document.createElement('div');wrap.className='competitive-wrap';

  // ── Hero banner ──
  wrap.innerHTML=`
    <div class="comp-hero">
      <div class="comp-season-badge">🏆 Temporada 1 · Ciberseguridad</div>
      <div class="comp-hero-title">Modo Competitivo</div>
      <div class="comp-hero-sub">Pon a prueba tus conocimientos contra otros jugadores en tiempo real</div>
    </div>`;

  // ── Season Rank ──
  const srCard=document.createElement('div');srCard.className='season-rank-card';
  const ptsToNext=nextTier?nextTier.minPts-compPts:0;
  srCard.innerHTML=`
    <div style="display:flex;align-items:center;gap:.8rem">
      <span style="font-size:2.2rem">${tier.icon}</span>
      <div style="flex:1">
        <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;color:var(--muted);letter-spacing:.4px">Rango de temporada</div>
        <div style="font-size:1rem;font-weight:900;color:${tier.color}">${tier.name}</div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:1px">${compPts} pts${nextTier?' · '+ptsToNext+' para '+nextTier.name:' · Rango máximo'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:.7rem;font-weight:900;color:var(--muted)">Puntos</div>
        <div style="font-size:1.1rem;font-weight:900;color:${tier.color}">${compPts}</div>
      </div>
    </div>
    ${nextTier?`<div style="background:var(--border);border-radius:99px;height:6px;overflow:hidden;margin:.7rem 0 .4rem">
      <div style="height:100%;background:${tier.color};border-radius:99px;width:${Math.round(((compPts-tier.minPts)/(nextTier.minPts-tier.minPts))*100)}%;transition:width .5s"></div>
    </div>`:''}
    <div class="season-ranks-row">
      ${SEASON_TIERS.map(t=>{
        const isCurr=t===tier;
        const achieved=compPts>=t.minPts;
        return `<div class="season-rank-tier ${isCurr?'current-tier':''} ${achieved&&!isCurr?'achieved':''} ${!achieved?'locked-tier':''}">
          <div style="font-size:1.2rem">${t.icon}</div>
          <div style="font-size:.56rem;font-weight:900;color:${isCurr?t.color:'var(--muted)'}">${t.name}</div>
        </div>`;
      }).join('')}
    </div>`;
  wrap.appendChild(srCard);

  // ── Modos de juego ──
  const modeTitle=document.createElement('div');modeTitle.className='friends-section-title';
  modeTitle.textContent='⚔️ Elige tu modo';
  wrap.appendChild(modeTitle);

  const modesGrid=document.createElement('div');modesGrid.className='comp-modes';
  const MODES=[
    {icon:'⚡',name:'Duelo Rápido',desc:'1vs1 · 5 preguntas · 60 seg',unlocked:true,color:'var(--orange)',bg:'var(--os)'},
    {icon:'🏆',name:'Torneo',desc:'Brackets eliminatorios · 8-128 jugadores',unlocked:true,color:'var(--yellow)',bg:'var(--ys)'},
    {icon:'👥',name:'Reto de Amigos',desc:'Desafía a alguien de tu lista',unlocked:friends.length>0,color:'var(--purple)',bg:'var(--ps)'},
    {icon:'🌍',name:'Clasificatoria',desc:'Sube de rango de temporada',unlocked:compPts>=0,color:'var(--blue)',bg:'var(--bs)'},
  ];
  MODES.forEach(mode=>{
    const card=document.createElement('div');
    card.className='comp-mode-card'+(mode.unlocked?'':' locked-mode');
    card.style.borderColor=mode.unlocked?mode.color:'';
    card.innerHTML=`
      <span class="comp-mode-icon">${mode.icon}</span>
      <div class="comp-mode-name">${mode.name}</div>
      <div class="comp-mode-desc">${mode.desc}</div>
      ${!mode.unlocked?'<div style="font-size:.6rem;color:var(--muted);margin-top:.3rem">🔒 Agrega amigos primero</div>':''}`;
    if(mode.unlocked){
      if(mode.name==='Duelo Rápido') card.onclick=()=>startQuickDuel();
      else if(mode.name==='Torneo') card.onclick=()=>scrollToTournaments(wrap);
      else if(mode.name==='Reto de Amigos') card.onclick=()=>showFriendChallengeMenu(wrap,friends);
      else if(mode.name==='Clasificatoria') card.onclick=()=>startRankedDuel();
    }
    modesGrid.appendChild(card);
  });
  wrap.appendChild(modesGrid);

  // ── Active duel zone (placeholder) ──
  const duelZone=document.createElement('div');duelZone.id='active-duel-zone';
  wrap.appendChild(duelZone);

  // ── Torneos ──
  const tourTitle=document.createElement('div');tourTitle.className='friends-section-title';
  tourTitle.id='tournaments-section';
  tourTitle.textContent='🏆 Torneos activos';
  wrap.appendChild(tourTitle);

  TOURNAMENTS.forEach(t=>{
    const card=buildTournamentCard(t);
    wrap.appendChild(card);
  });

  el.appendChild(wrap);
}

function buildTournamentCard(t){
  const card=document.createElement('div');card.className='tournament-card';
  card.innerHTML=`
    <div class="tournament-header" style="background:${t.active?'linear-gradient(135deg,#1a1a2e,#16213e)':'var(--bg)'}">
      <div class="tournament-icon">${t.icon}</div>
      <div class="tournament-info">
        <div class="tournament-name" style="color:${t.active?'#fff':'var(--text)'}">${t.name}</div>
        <div class="tournament-meta" style="color:${t.active?'#8888aa':'var(--muted)'}">
          ${t.active?'🔴 En curso':'🕐 '+t.startDate} · ${t.players}/${t.maxPlayers} jugadores · ${t.topic}
        </div>
      </div>
      <div class="tournament-prize">${t.prize}</div>
    </div>`;

  if(t.active && t.standings.length>0){
    const prog=document.createElement('div');prog.className='tournament-progress';
    prog.innerHTML=`
      <div style="font-size:.7rem;font-weight:900;color:var(--muted);margin-bottom:.4rem">📊 Clasificación actual</div>`;
    const standDiv=document.createElement('div');standDiv.className='tournament-standings';
    t.standings.forEach(s=>{
      const row=document.createElement('div');
      row.className='ts-row'+(s.isMe?' me':'');
      const medals=['🥇','🥈','🥉'];
      row.innerHTML=`
        <div class="ts-pos">${medals[s.pos-1]||'#'+s.pos}</div>
        <div class="ts-av">${s.isMe?gs.profile.avatar:s.avatar}</div>
        <div class="ts-name">${s.isMe?gs.profile.name+' <span style="font-size:.6rem;background:var(--blue);color:#fff;padding:1px 5px;border-radius:99px">TÚ</span>':s.name}</div>
        <div class="ts-score">⚡${s.score} pts</div>`;
      standDiv.appendChild(row);
    });
    prog.appendChild(standDiv);
    card.appendChild(prog);
  }

  const joinBtn=document.createElement('button');
  joinBtn.className='comp-join-btn';
  if(t.active){
    joinBtn.style.cssText='background:linear-gradient(135deg,#ff4b4b,#ce82ff);color:#fff';
    joinBtn.innerHTML='⚔️ Jugar ronda siguiente';
    joinBtn.onclick=()=>startTournamentRound(t);
  } else {
    joinBtn.style.cssText='background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff';
    joinBtn.innerHTML='🏆 Inscribirse — '+t.startDate;
    joinBtn.onclick=()=>joinTournament(t);
  }
  card.appendChild(joinBtn);
  return card;
}

function scrollToTournaments(wrap){
  const sec=document.getElementById('tournaments-section');
  if(sec) sec.scrollIntoView({behavior:'smooth',block:'start'});
}

function showFriendChallengeMenu(wrap,friends){
  const existing=document.getElementById('friend-challenge-menu');
  if(existing){existing.remove();return;}
  const menu=document.createElement('div');menu.id='friend-challenge-menu';
  menu.style.cssText='background:var(--white);border-radius:16px;padding:1rem;border:2px solid var(--purple);margin-bottom:.8rem';
  menu.innerHTML=`<div style="font-size:.8rem;font-weight:900;color:var(--text);margin-bottom:.6rem">👥 ¿A quién quieres retar?</div>`;
  const list=document.createElement('div');list.className='friends-list';
  friends.forEach(f=>{
    const row=buildFriendCard(f,'friend');
    list.appendChild(row);
  });
  menu.appendChild(list);
  const duelZone=document.getElementById('active-duel-zone');
  if(duelZone) duelZone.before(menu);
}

function startQuickDuel(){
  const opp=friendsData.filter(f=>f.status==='friend'&&f.online)[0]||{name:'Oponente',avatar:'🤖',xp:500};
  openDuelGame(opp,'quick');
}
function startRankedDuel(){
  const opp={name:'Rival',avatar:'🎯',xp:gs.xp+Math.floor(Math.random()*200-100)};
  openDuelGame(opp,'ranked');
}
// Inicia un duelo con un amigo: navega a la pestaña competitiva y abre el juego de duelo
function startDuelWith(friend){openDuelGame(friend,'quick');}

// Abre el minijuego de duelo contra el oponente especificado con el modo de juego dado
function openDuelGame(opp,mode){
  const duelZone=document.getElementById('active-duel-zone');
  if(!duelZone)return;
  duelScore={me:0,opp:0};duelQIdx=0;duelActive=true;
  const questions=[...DUEL_QUESTIONS].sort(()=>Math.random()-.5).slice(0,5);
  let myCombo=0,answers=[];

  function renderDuel(){
    clearInterval(duelTimer);
    if(duelQIdx>=questions.length){endDuel(opp,mode,answers);return;}
    const q=questions[duelQIdx];
    duelZone.innerHTML='';
    const wrap=document.createElement('div');wrap.className='duel-wrap';

    // ── Top bar ──
    const topbar=document.createElement('div');topbar.className='duel-topbar';
    const modeLabel=document.createElement('div');modeLabel.className='duel-mode-label';
    modeLabel.textContent={quick:'⚡ Duelo Rápido',ranked:'🏆 Clasificatoria',tournament:'🎯 Torneo',friend:'👥 Duelo Amigo'}[mode]||'⚔️ Duelo';
    const qCounter=document.createElement('div');qCounter.className='duel-q-counter';
    qCounter.textContent=(duelQIdx+1)+' / '+questions.length;
    const timerRing=document.createElement('div');timerRing.className='duel-timer-ring';timerRing.id='duel-timer-ring';
    timerRing.textContent='12';
    topbar.appendChild(modeLabel);topbar.appendChild(qCounter);topbar.appendChild(timerRing);
    wrap.appendChild(topbar);

    // ── Progress dots ──
    const dots=document.createElement('div');dots.className='duel-progress-dots';
    questions.forEach((_,i)=>{
      const dot=document.createElement('div');dot.className='dprog-dot';
      if(i<duelQIdx) dot.classList.add(answers[i]===true?'correct':'wrong');
      else if(i===duelQIdx) dot.classList.add('active');
      dots.appendChild(dot);
    });
    wrap.appendChild(dots);

    // ── Scoreboard ──
    const board=document.createElement('div');board.className='duel-scoreboard';
    board.innerHTML=`
      <div class="duel-player-zone me-zone">
        <span class="duel-pav">${gs.profile.avatar}</span>
        <div class="duel-pname">${gs.profile.name.split(' ')[0]}</div>
        <div class="duel-pscore" id="score-me" style="color:#58cc02">${duelScore.me}</div>
        ${myCombo>=2?`<div style="font-size:.65rem;color:#ffc800;font-weight:900">🔥 x${myCombo}</div>`:''}
      </div>
      <div class="duel-vs-sep">VS</div>
      <div class="duel-player-zone opp-zone">
        <span class="duel-pav">${opp.avatar}</span>
        <div class="duel-pname">${opp.name.split(' ')[0]}</div>
        <div class="duel-pscore" id="score-opp" style="color:#ff4b4b">${duelScore.opp}</div>
      </div>`;
    wrap.appendChild(board);

    // ── Opponent thinking indicator ──
    const thinking=document.createElement('div');thinking.className='opp-thinking';thinking.id='opp-thinking';
    thinking.innerHTML=`<span>${opp.avatar} pensando</span><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>`;
    wrap.appendChild(thinking);

    // ── Question zone ──
    const qZone=document.createElement('div');qZone.className='duel-question-zone';
    const qText=document.createElement('div');qText.className='duel-q-text';qText.textContent=q.q;
    qZone.appendChild(qText);

    // ── Choices ──
    const grid=document.createElement('div');grid.className='duel-choices-grid';
    let answered=false;
    q.choices.forEach((ch)=>{
      const btn=document.createElement('button');btn.className='duel-choice-btn';
      btn.innerHTML=`<span class="duel-choice-emoji">${ch.e}</span><span>${ch.t}</span>`;
      btn.onclick=()=>{
        if(answered)return;answered=true;
        clearInterval(duelTimer);
        const correct=!!ch.ok;
        btn.classList.add(correct?'correct':'wrong');
        // Reveal correct answer
        grid.querySelectorAll('.duel-choice-btn').forEach((b,i)=>{
          b.disabled=true;
          if(q.choices[i].ok&&!correct) b.classList.add('reveal');
        });
        if(correct){duelScore.me++;myCombo++;} else {myCombo=0;}
        answers.push(correct);
        // Update score with bump animation
        const scoreEl=document.getElementById('score-me');
        if(scoreEl){scoreEl.textContent=duelScore.me;scoreEl.classList.add('bump');setTimeout(()=>scoreEl.classList.remove('bump'),200);}
        // Show combo
        if(myCombo>=2){
          const combo=document.createElement('div');combo.className='duel-combo';
          combo.textContent='🔥 Combo x'+myCombo+'! +'+(myCombo*2)+' puntos bonus';
          qZone.appendChild(combo);
        }
        // Simulate opponent after delay
        const oppDelay=800+Math.random()*1200;
        setTimeout(()=>{
          const th=document.getElementById('opp-thinking');if(th)th.style.display='none';
          const oppCorrect=Math.random()>(0.3+duelQIdx*0.05);
          if(oppCorrect){duelScore.opp++;}
          const oppEl=document.getElementById('score-opp');
          if(oppEl){oppEl.textContent=duelScore.opp;oppEl.classList.add('bump');setTimeout(()=>oppEl.classList.remove('bump'),200);}
          setTimeout(()=>{duelQIdx++;renderDuel();},600);
        },oppDelay);
      };
      grid.appendChild(btn);
    });
    qZone.appendChild(grid);
    wrap.appendChild(qZone);
    duelZone.appendChild(wrap);

    // ── Timer ──
    let t=12;
    duelTimer=setInterval(()=>{
      t--;
      const ring=document.getElementById('duel-timer-ring');
      if(ring){ring.textContent=t;ring.className='duel-timer-ring'+(t<=4?' urgent':'');}
      if(t<=0){
        clearInterval(duelTimer);
        if(!answered){
          answered=true;answers.push(false);myCombo=0;
          grid.querySelectorAll('.duel-choice-btn').forEach((b,i)=>{
            b.disabled=true;if(q.choices[i].ok)b.classList.add('reveal');
          });
          const oppCorrect=Math.random()>0.4;
          if(oppCorrect)duelScore.opp++;
          setTimeout(()=>{duelQIdx++;renderDuel();},1000);
        }
      }
    },1000);
  }
  renderDuel();
  duelZone.scrollIntoView({behavior:'smooth',block:'start'});
}

function endDuel(opp,mode,answers){
  duelActive=false;clearInterval(duelTimer);
  const won=duelScore.me>duelScore.opp;
  const draw=duelScore.me===duelScore.opp;
  const correct=(answers||[]).filter(Boolean).length;
  const xpGain=(won?40:draw?20:10)+(correct*3);
  const ptsGain=won?30:draw?10:5;
  const gemsGain=won?8:draw?3:1;
  gs.xp+=xpGain;gs.gems+=gemsGain;
  if(!gs.compPoints)gs.compPoints=0;
  gs.compPoints+=ptsGain;

  // Save to duel history
  if(opp.id){
    if(!duelHistory[opp.id])duelHistory[opp.id]=[];
    duelHistory[opp.id].unshift({
      result:won?'win':draw?'draw':'loss',
      score:duelScore.me+'-'+duelScore.opp,
      date:'Hoy'
    });
    // Update friend win/loss stats
    const f=friendsData.find(x=>x.id===opp.id);
    if(f){if(won)f.wins=(f.wins||0)+1;else if(!draw)f.losses=(f.losses||0)+1;}
  }

  save();checkAndGrantBadges&&checkAndGrantBadges();
  updateTopBar();

  const duelZone=document.getElementById('active-duel-zone');
  if(!duelZone)return;
  duelZone.innerHTML='';

  const card=document.createElement('div');card.className='duel-result-card';
  const borderCol=won?'var(--green)':draw?'var(--yellow)':'var(--red)';
  card.style.border='2.5px solid '+borderCol;

  const resultIcon=won?'🏆':draw?'🤝':'💪';
  const resultTitle=won?'¡Victoria!':draw?'¡Empate!':'Derrota... ¡Sigue intentando!';
  const resultColor=won?'var(--gd)':draw?'var(--yd)':'var(--rd)';

  card.innerHTML=`
    <div style="font-size:3rem;margin-bottom:.3rem;animation:popIn .4s cubic-bezier(.34,1.56,.64,1)">${resultIcon}</div>
    <div style="font-size:1.15rem;font-weight:900;color:${resultColor};margin-bottom:.8rem">${resultTitle}</div>`;

  // Scoreboard
  const vsDiv=document.createElement('div');vsDiv.className='duel-result-vs';
  vsDiv.innerHTML=`
    <div class="duel-result-player">
      <span class="duel-result-av">${gs.profile.avatar}</span>
      <div style="font-size:.78rem;font-weight:900;color:var(--text)">${gs.profile.name.split(' ')[0]}</div>
      <div class="duel-result-score" style="color:var(--green)">${duelScore.me}</div>
    </div>
    <div style="font-size:1.1rem;color:var(--muted);font-weight:900">VS</div>
    <div class="duel-result-player">
      <span class="duel-result-av">${opp.avatar}</span>
      <div style="font-size:.78rem;font-weight:900;color:var(--text)">${opp.name.split(' ')[0]}</div>
      <div class="duel-result-score" style="color:var(--red)">${duelScore.opp}</div>
    </div>`;
  card.appendChild(vsDiv);

  // Accuracy
  const acc=answers&&answers.length?Math.round((answers.filter(Boolean).length/answers.length)*100):0;
  const accBar=document.createElement('div');
  accBar.style.cssText='margin:.6rem auto;max-width:220px';
  accBar.innerHTML=`
    <div style="display:flex;justify-content:space-between;font-size:.65rem;font-weight:900;color:var(--muted);margin-bottom:3px">
      <span>Precisión</span><span>${acc}%</span>
    </div>
    <div style="background:var(--border);border-radius:99px;height:7px;overflow:hidden">
      <div style="background:${acc>=70?'var(--green)':acc>=40?'var(--yellow)':'var(--red)'};width:${acc}%;height:100%;border-radius:99px;transition:width .8s"></div>
    </div>`;
  card.appendChild(accBar);

  // Rewards
  const rewardsDiv=document.createElement('div');rewardsDiv.className='duel-rewards-row';
  [
    {val:'+'+xpGain+' XP', color:'var(--green)',bg:'var(--gs)',border:'var(--green)'},
    {val:'+'+gemsGain+' 💎', color:'var(--blue)',bg:'var(--bs)',border:'var(--blue)'},
    {val:'+'+ptsGain+' pts temp.', color:'var(--orange)',bg:'var(--os)',border:'var(--orange)'},
  ].forEach(r=>{
    const pill=document.createElement('div');pill.className='duel-reward-pill';
    pill.style.cssText=`color:${r.color};background:${r.bg};border-color:${r.border}`;
    pill.textContent=r.val;rewardsDiv.appendChild(pill);
  });
  card.appendChild(rewardsDiv);

  // Buttons
  const btns=document.createElement('div');btns.style.cssText='display:flex;gap:.5rem;margin-top:.8rem;flex-direction:column';
  const again=document.createElement('button');
  again.style.cssText='padding:.7rem;border-radius:12px;border:none;background:linear-gradient(135deg,#ff4b4b,#ce82ff);color:#fff;font-family:Nunito;font-weight:900;font-size:.88rem;cursor:pointer';
  again.textContent='⚔️ Jugar de nuevo';again.onclick=()=>startQuickDuel();
  const back=document.createElement('button');
  back.style.cssText='padding:.65rem;border-radius:12px;border:none;background:var(--bg);color:var(--text);font-family:Nunito;font-weight:900;font-size:.85rem;cursor:pointer;border:2px solid var(--border)';
  back.textContent='← Ver competitivo';back.onclick=()=>renderCompetitiveTab();
  btns.appendChild(again);btns.appendChild(back);
  card.appendChild(btns);
  duelZone.appendChild(card);
}

function joinTournament(t){
  showToast('✅ ¡Inscrito en '+t.name+'! Comienza el '+t.startDate);
  t.players++;t.active=false;
  renderCompetitiveTab();
}

function startTournamentRound(t){
  const opp=t.standings.find(s=>!s.isMe)||{name:'Rival',avatar:'🎯',xp:600};
  openDuelGame({name:opp.name,avatar:opp.avatar,xp:opp.score},'tournament');
}

function getRankingData(){
  const BOTS=[
    {name:'CyberNinja',avatar:'🥷',xp:1240,badge:'🏆'},
    {name:'SecureHawk',avatar:'🦅',xp:980,badge:'🥇'},
    {name:'CipherFox',avatar:'🦊',xp:860,badge:'🥈'},
    {name:'DataShield',avatar:'🛡️',xp:720,badge:'🥉'},
    {name:'NetGuard',avatar:'🤖',xp:610,badge:''},
    {name:'ByteWolf',avatar:'🐺',xp:490,badge:''},
    {name:'PixelHero',avatar:'🦸',xp:380,badge:''},
    {name:'CodeMaster',avatar:'👨‍💻',xp:250,badge:''},
    {name:'SafeStar',avatar:'⭐',xp:140,badge:''},
  ];
  const me={name:gs.profile.name,avatar:gs.profile.avatar,xp:gs.xp,isMe:true,badge:''};
  const all=[...BOTS,me].sort((a,b)=>b.xp-a.xp);
  return all;
}
// Renderiza el ranking global de jugadores ordenado por XP
function renderRankingTab(){
  const el=$('tab-ranking');
  const data=getRankingData();
  const myPos=data.findIndex(r=>r.isMe)+1;
  const medals=['🥇','🥈','🥉'];
  el.innerHTML=`<div class="ranking-wrap">
    <div class="ranking-header">
      <div class="ranking-title">🏆 Ranking Global</div>
      <div class="ranking-sub">Tu posición: <strong>#${myPos}</strong> de ${data.length} jugadores</div>
    </div>
    <div class="ranking-list">
      ${data.map((r,i)=>`
        <div class="ranking-item ${r.isMe?'me':''} ${i===0?'top1':i===1?'top2':i===2?'top3':''}">
          <div class="rank-pos">${medals[i]||'#'+(i+1)}</div>
          <div class="rank-avatar">${r.avatar}</div>
          <div class="rank-name">${r.name}${r.isMe?' <span style="font-size:.65rem;background:var(--blue);color:#fff;padding:1px 6px;border-radius:99px">TÚ</span>':''}</div>
          <div class="rank-xp">⚡${r.xp} XP</div>
          ${r.badge?`<div class="rank-badge">${r.badge}</div>`:''}
        </div>`).join('')}
    </div>
  </div>`;
}

/* ═══════════════════════════════════
   PLACEMENT TEST
═══════════════════════════════════ */
let _pIdx=0,_pScore=0;
function openPlacement(){
  if(gs.placementDone){showToast('Ya completaste la prueba de posicionamiento');return;}
  _pIdx=0;_pScore=0;
  document.getElementById('placement-overlay').classList.add('show');
  renderPlacementQ();
}
// Renderiza la pregunta actual del test de nivel con las opciones de respuesta
function renderPlacementQ(){
  const pips=document.getElementById('placement-pips');
  pips.innerHTML=PLACEMENT_QS.map((_,i)=>`<div class="placement-pip ${i<_pIdx?'done':i===_pIdx?'active':''}"></div>`).join('');
  const content=document.getElementById('placement-content');
  if(_pIdx>=PLACEMENT_QS.length){
    // Show result
    const pct=_pScore/PLACEMENT_QS.length;
    const level=pct>=.85?'Avanzado':pct>=.5?'Intermedio':'Básico';
    const colors={Avanzado:'#8b5cf6',Intermedio:'#f59e0b',Básico:'#10b981'};
    gs.placementDone=true;gs.placementLevel=level;
    gs.xp+=30;save();checkAndGrantBadges();
    content.innerHTML=`<div class="placement-result">
      <div style="font-size:3rem">${pct>=.85?'🏆':pct>=.5?'⭐':'📚'}</div>
      <div style="font-size:1.1rem;font-weight:900;color:var(--text);margin:.5rem 0">¡Prueba completada!</div>
      <div style="font-size:.88rem;color:var(--muted);margin-bottom:.8rem">${_pScore}/${PLACEMENT_QS.length} respuestas correctas</div>
      <div class="placement-level-badge" style="background:${colors[level]}">${level==='Avanzado'?'🔥':level==='Intermedio'?'⚡':'🌱'} Nivel: ${level}</div>
      <div style="font-size:.8rem;color:var(--muted);margin:.5rem 0">+30 XP ganados</div>
      <button onclick="document.getElementById('placement-overlay').classList.remove('show');showTab('profile')" style="margin-top:.8rem;width:100%;padding:.75rem;border-radius:12px;border:none;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-family:Nunito;font-weight:900;font-size:.95rem;cursor:pointer">Ver mi perfil →</button>
    </div>`;
    return;
  }
  const q=PLACEMENT_QS[_pIdx];
  content.innerHTML=`
    <div class="placement-q">${q.q}</div>
    <div class="placement-opts">
      ${q.choices.map((ch,ci)=>`<button class="placement-opt" onclick="answerPlacement(${ci},${!!ch.ok})">
        <span style="font-size:1.2rem">${ch.e}</span><span>${ch.t}</span>
      </button>`).join('')}
    </div>`;
}
function answerPlacement(ci,correct){
  const btns=document.querySelectorAll('.placement-opt');
  btns.forEach(b=>b.style.pointerEvents='none');
  btns[ci].classList.add(correct?'correct':'wrong');
  if(correct) _pScore++;
  // find and highlight correct if wrong
  if(!correct) PLACEMENT_QS[_pIdx].choices.forEach((ch,i)=>{if(ch.ok)btns[i].classList.add('correct');});
  setTimeout(()=>{_pIdx++;renderPlacementQ();},900);
}

/* ═══════════════════════════════════
   DAILY CHALLENGE
═══════════════════════════════════ */
function checkDailyReset(){
  const today=new Date().toDateString();
  if(gs.dailyDate!==today){gs.dailyDone=false;}
}
function closeDailyChallenge(){
  document.getElementById('daily-overlay').classList.remove('show');
}
function openDailyChallenge(){
  checkDailyReset();
  const ch=getTodayChallenge();
  document.getElementById('daily-emoji').textContent=ch.emoji;
  document.getElementById('daily-title').textContent=ch.title;
  document.getElementById('daily-subtitle').textContent=gs.dailyDone?'¡Ya completaste el reto de hoy!':'¡Complétalo y gana '+ch.xp+' XP y '+ch.gems+' 💎!';
  const body=document.getElementById('daily-body');
  if(gs.dailyDone){
    body.innerHTML=`<div class="daily-done-banner">✅ Reto completado hoy<br><span style="font-size:.8rem;font-weight:700;opacity:.8">Vuelve mañana para un nuevo reto</span></div>
    <button onclick="document.getElementById('daily-overlay').classList.remove('show')" style="margin-top:1rem;width:100%;padding:.7rem;border-radius:12px;border:none;background:var(--green);color:#fff;font-family:Nunito;font-weight:900;cursor:pointer">Cerrar</button>`;
  } else {
    body.innerHTML=`<div class="daily-q">${ch.q}</div>
    <div class="daily-opts">
      ${ch.choices.map((opt,i)=>`<button class="daily-opt" onclick="answerDaily(${i},${!!opt.ok},${ch.xp},${ch.gems})">
        <span style="font-size:1.1rem">${opt.e}</span><span>${opt.t}</span>
      </button>`).join('')}
    </div>`;
  }
  document.getElementById('daily-overlay').classList.add('show');
}
function answerDaily(ci,correct,xpReward,gemsReward){
  const btns=document.querySelectorAll('.daily-opt');
  btns.forEach(b=>b.style.pointerEvents='none');
  btns[ci].classList.add(correct?'correct':'wrong');
  if(!correct) getTodayChallenge().choices.forEach((ch,i)=>{if(ch.ok)btns[i].classList.add('correct');});
  setTimeout(()=>{
    const body=document.getElementById('daily-body');
    if(correct){
      const today=new Date().toDateString();
      gs.dailyDone=true;gs.dailyDate=today;gs.dailyStreak++;
      gs.xp+=xpReward;gs.gems+=gemsReward;save();
      updateTopBar();checkAndGrantBadges();
      body.innerHTML=`<div style="text-align:center;padding:.8rem 0">
        <div style="font-size:2.5rem">🎉</div>
        <div style="font-size:1.1rem;font-weight:900;color:var(--gd);margin:.4rem 0">¡Correcto!</div>
        <div style="font-size:.88rem;color:var(--muted)">+${xpReward} XP · +${gemsReward} 💎 · Racha de retos: ${gs.dailyStreak} 🔥</div>
        <button onclick="document.getElementById('daily-overlay').classList.remove('show')" style="margin-top:1rem;width:100%;padding:.7rem;border-radius:12px;border:none;background:var(--green);color:#fff;font-family:Nunito;font-weight:900;cursor:pointer">¡Genial!</button>
      </div>`;
    } else {
      body.innerHTML=`<div style="text-align:center;padding:.8rem 0">
        <div style="font-size:2.5rem">😅</div>
        <div style="font-size:1rem;font-weight:900;color:var(--rd);margin:.4rem 0">Respuesta incorrecta</div>
        <div style="font-size:.82rem;color:var(--muted)">No perdiste racha. ¡Mañana lo intentas de nuevo!</div>
        <button onclick="document.getElementById('daily-overlay').classList.remove('show')" style="margin-top:1rem;width:100%;padding:.7rem;border-radius:12px;border:none;background:var(--border);color:var(--text);font-family:Nunito;font-weight:900;cursor:pointer">Cerrar</button>
      </div>`;
    }
  },900);
}

/* ═══════════════════════════════════════════════════════
   LESSON ENGINE
═══════════════════════════════════════════════════════ */

// Inicia una actividad: resetea estado, carga la unidad/actividad y muestra la intro de lección
function startLesson(uid,actIdx){
  // Objeto que rastrea las respuestas de la sesión actual: {índiceQ: 'correct'|'wrong'}
  window._theoryAnswered={}; // reset per activity
  if(gs.hearts<=0){showNoHearts();return}
  curUnit=UNITS.find(u=>u.id===uid);
  curActIdx=actIdx;
  curQIdx=0;answered=false;lesCorrect=0;lesStartTime=Date.now();
  lesTotalQ=curUnit.activities[actIdx].questions.length;
  window._shownHalfway=false;
  $('unit-detail').classList.remove('open');
  // Bloquear botón de teoría hasta que se complete la lección
  const theoryBtn=document.getElementById('theory-open-btn');
  if(theoryBtn){theoryBtn.classList.add('locked');theoryBtn.setAttribute('title','Completa la lección para desbloquear la teoría');theoryBtn.setAttribute('aria-disabled','true');}
  showScreen('lesson');
  showLessonInfo('intro', uid, curUnit.activities[actIdx].title, ()=>renderQ());
}



// Renderiza la pregunta actual según su tipo (choice/tf/pair/sort/scenario) en la tarjeta de lección
function renderQ(){
  if(curQIdx>=lesTotalQ){
    // Show end info then result
    showLessonInfo('end', curUnit.id, curUnit.activities[curActIdx].title, ()=>endLesson());
    return;
  }
  answered=false;pairSelLeft=null;pairMatched=new Set();
  hideFB();
  const q=curUnit.activities[curActIdx].questions[curQIdx];
  const pct=Math.round((curQIdx/lesTotalQ)*100);
  $('les-prog-fill').style.width=pct+'%';
  // hearts
  const lh=$('les-hearts');lh.innerHTML='';
  for(let i=0;i<5;i++){const s=document.createElement('span');s.className='les-h'+(i>=gs.hearts?' lost':'');s.textContent='❤️';lh.appendChild(s);}
  const area=$('q-area');area.innerHTML='';
  const card=document.createElement('div');card.className='q-card';
  
  // Midway info at Q3
  if(curQIdx===3 && !window._shownHalfway){
    window._shownHalfway=true;
    showLessonInfo('halfway', curUnit.id, curUnit.activities[curActIdx].title, ()=>{_buildQ(card,q);area.appendChild(card);});
    return;
  }
  _buildQ(card,q);
  area.appendChild(card);
  setTimeout(()=>narrateQuestion(q),200);
}

let currentQ=null;
function _buildQ(card,q){
  currentQ=q; // Track for Shadow hints

  /* ── CONCEPTO CLAVE — always shown first ── */
  if(q.theory){
    const th=document.createElement('div');
    th.className='q-theory';
    th.textContent=q.theory;
    card.appendChild(th);
  }

  // Every 3rd question (q index 2 or 5) use a game if type matches
  const useGame = (curQIdx===2 && q.type==='choice') || (curQIdx===5 && q.type==='sort');
  if(useGame && curQIdx===2 && q.type==='choice'){buildPong(card,q);}
  else if(useGame && curQIdx===5 && q.type==='sort'){buildTetris(card,q);}
  else if(q.type==='choice')buildChoice(card,q);
  else if(q.type==='tf')buildTF(card,q);
  else if(q.type==='pair')buildPair(card,q);
  else if(q.type==='sort')buildSort(card,q);
  else if(q.type==='scenario')buildScenario(card,q);
  else buildChoice(card,q);
}


function buildChoice(card,q){
  const wide=q.choices.some(c=>c.t.length>20);
  const inner=document.createElement('div');
  inner.innerHTML=`<div class="q-badge qb-choice">🖱️ Elige la correcta</div>
    <span class="q-char">${q.char}</span>
    <div class="q-title">${q.q}</div>
    ${q.hint?`<div class="q-hint">${q.hint}</div>`:''}
    <div class="choices-grid${wide?' wide':''}">
      ${q.choices.map((c,i)=>`<button class="ch-btn" data-idx="${i}" data-ok="${!!c.ok}" tabindex="0" onclick="choiceClick(this)">
        <span class="ch-em">${c.e}</span><span>${c.t}</span>
      </button>`).join('')}
    </div>`;
  while(inner.firstChild) card.appendChild(inner.firstChild);
}
function buildTF(card,q){
  const _tf=document.createElement("div");_tf.innerHTML=`<div class="q-badge qb-tf">✅ Verdadero o Falso</div>
    <span class="q-char">${q.char}</span>
    <div class="q-title">${q.q}</div>
    <div class="tf-wrap">
      <button class="tf-btn t-side" tabindex="0" onclick="tfClick(this,true,${q.ans})" aria-label="Verdadero">✅ VERDADERO</button>
      <button class="tf-btn f-side" tabindex="0" onclick="tfClick(this,false,${q.ans})" aria-label="Falso">❌ FALSO</button>
    </div>`;
;
  while(_tf.firstChild) card.appendChild(_tf.firstChild);}
function buildPair(card,q){
  /* Each right chip gets a unique data-pos (position after shuffle) and data-pair (original pair index).
     This way duplicate texts are never confused — matching is purely by pair index, not text. */
  const rightOrder=q.right.map((txt,i)=>({txt,pair:i})).sort(()=>Math.random()-.5);
  const _tmp_=document.createElement("div");_tmp_.innerHTML=`<div class="q-badge qb-pair">🔗 Relaciona los pares</div>
    <span class="q-char">${q.char}</span>
    <div class="q-title">${q.q}</div>
    <div class="pair-wrap">
      <div class="pair-col">
        <div class="pair-col-label">Concepto</div>
        ${q.left.map((l,i)=>`<div class="pair-chip" data-side="L" data-pair="${i}" onclick="pairTap(this)">${l}</div>`).join('')}
      </div>
      <div class="pair-col">
        <div class="pair-col-label">Descripción</div>
        ${rightOrder.map((r,pos)=>`<div class="pair-chip" data-side="R" data-pos="${pos}" data-pair="${r.pair}" onclick="pairTap(this)">${r.txt}</div>`).join('')}
      </div>
    </div>
    <div class="pair-status" id="pair-st">Toca un concepto de la izquierda para empezar</div>`;
  while(_tmp_.firstChild) card.appendChild(_tmp_.firstChild);
}
function buildSort(card,q){
  const shuffled=[...q.items].sort(()=>Math.random()-.5);
  window._sortItems=q.items;window._sortCorrect=q.correct;window._sortQ=q;
  const _so=document.createElement("div");_so.innerHTML=`<div class="q-badge qb-sort">↕️ Ordena los pasos</div>
    <span class="q-char">${q.char}</span>
    <div class="q-title">${q.q}</div>
    <div class="sort-list" id="sort-list">
      ${shuffled.map((item,i)=>`<div class="sort-item" draggable="true" data-text="${encodeURIComponent(item)}" ondragstart="sortDragStart(event)" ondragover="sortDragOver(event)" ondrop="sortDrop(event)">
        <span class="sort-handle">⠿</span><span>${item}</span>
      </div>`).join('')}
    </div>
    <button style="margin-top:.8rem;padding:.6rem 1.2rem;border-radius:var(--r);border:none;background:var(--blue);color:#fff;font-family:Nunito;font-weight:800;font-size:.88rem;cursor:pointer" onclick="checkSort()">Verificar orden →</button>`;
;
  while(_so.firstChild) card.appendChild(_so.firstChild);}
function buildScenario(card,q){
  const sc=q.scenario;
  let scHTML='';

  /* ── Email visual simulator ── */
  if(sc.type==='email'){
    const isSus=sc.isSuspicious!==false; // default suspicious unless flagged safe
    const urlSafe=sc.urlSafe||false;
    const addrClass=isSus?'suspicious':'';
    const lockIcon=urlSafe?'🔒':'⚠️';
    const urlClass=urlSafe?'safe':(isSus?'danger':'');
    const domainDisplay=sc.from.split('@')[1]||sc.from;
    const ctaColor=sc.ctaColor||'#e53935';
    const brandColor=sc.brandColor||'#1a73e8';
    const brandEmoji=sc.brandEmoji||'🏦';
    const brandName=sc.brandName||sc.from.split('@')[1]?.split('.')[0]||'Portal';
    const subjectClean=sc.subject.replace(/[⚠️🚨]/g,'').trim();
    scHTML=`
    <div class="sim-analyze-hint">🔎 Analiza con cuidado cada detalle de este correo</div>
    <div class="sim-wrap sim-email">
      <span class="sim-badge">📧 Email recibido</span>
      <div class="em-topbar">
        <span class="em-app-icon">✉️</span>
        <span class="em-app-name">Correo</span>
        <div class="em-client-dots"><span></span><span></span><span></span></div>
      </div>
      <div class="em-header" style="background:linear-gradient(135deg,${brandColor},${brandColor}cc)">
        <div class="em-logo">${brandEmoji}</div>
        <div>
          <div class="em-header-name">${brandName}</div>
          <div class="em-header-tagline">Notificación de seguridad</div>
        </div>
      </div>
      <div class="em-meta">
        <div class="em-from-row">
          <div class="em-avatar" style="background:${brandColor}">${brandEmoji}</div>
          <div class="em-from-info">
            <div class="em-sender-name">${brandName} Seguridad</div>
            <div class="em-sender-addr ${addrClass}" title="Dominio del remitente">${sc.from}</div>
          </div>
        </div>
        <div class="em-subject-line">${sc.subject}</div>
      </div>
      <div class="em-body-wrap">
        <div class="em-body-txt">${sc.body}</div>
        ${sc.link?`<a class="em-cta-btn" style="background:${ctaColor}">${sc.linkLabel||'Verificar ahora →'}</a>
        <div style="font-size:.65rem;color:#999;margin-top:.35rem;font-family:monospace">${sc.link}</div>`:''}
      </div>
      <div class="em-footer">Este mensaje fue enviado automáticamente. No respondas a este correo.</div>
    </div>`;
  }
  /* ── SMS visual simulator ── */
  else if(sc.type==='sms'){
    scHTML=`
    <div class="sim-analyze-hint">🔎 Analiza este mensaje de texto cuidadosamente</div>
    <div class="sim-wrap sim-sms">
      <span class="sim-badge">📱 SMS recibido</span>
      <div class="sms-topbar">
        <span class="sms-back">‹</span>
        <div class="sms-contact-info">
          <div class="sms-contact-name">${sc.subject||'Desconocido'}</div>
          <div class="sms-contact-num">${sc.from}</div>
        </div>
        <span style="color:#0a84ff;font-size:.8rem">⋯</span>
      </div>
      <div class="sms-time">Hoy ${sc.time||'14:32'}</div>
      <div class="sms-body">
        <div class="sms-msg">
          ${sc.body}
          ${sc.link?`<div style="margin-top:.3rem"><span class="ph-link sus-link">${sc.link}</span></div>`:''}
        </div>
      </div>
    </div>`;
  }
  /* ── WhatsApp visual simulator ── */
  else if(sc.type==='whatsapp'){
    scHTML=`
    <div class="sim-analyze-hint">🔎 Analiza este mensaje de WhatsApp</div>
    <div class="sim-wrap sim-phone">
      <span class="sim-badge">💬 WhatsApp</span>
      <div class="ph-statusbar">
        <span>9:41</span>
        <span class="ph-app-name">WhatsApp</span>
        <div class="ph-icons"><span>📶</span><span>🔋</span></div>
      </div>
      <div style="background:#075e54;padding:.4rem .7rem;display:flex;align-items:center;gap:.5rem">
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:.9rem">${sc.avatar||'👤'}</div>
        <div>
          <div style="font-size:.78rem;font-weight:800;color:var(--social-text)">${sc.from}</div>
          <div style="font-size:.62rem;color:rgba(255,255,255,.7)">${sc.contactSaved?'✅ Guardado':'❓ No guardado'}</div>
        </div>
      </div>
      <div class="ph-chat-area" style="background:#e5ddd5">
        <div class="ph-bubble received">
          ${sc.body}
          ${sc.link?`<span class="ph-link sus-link">${sc.link}</span>`:''}
          <div class="ph-time">${sc.time||'14:32'} ✓</div>
        </div>
      </div>
    </div>`;
  }
  /* ── Browser / fake website simulator ── */
  else if(sc.type==='browser'){
    const urlSafe=sc.urlSafe||false;
    const urlClass=urlSafe?'safe':'danger';
    const lockIcon=urlSafe?'🔒':'⚠️';
    scHTML=`
    <div class="sim-analyze-hint">🔎 Analiza esta página web con atención</div>
    <div class="sim-wrap sim-browser">
      <span class="sim-badge">🌐 Sitio web</span>
      ${sc.showWarning?`<div class="browser-warning"><span class="warn-icon">⚠️</span> Este sitio puede ser peligroso — Chrome lo bloqueó</div>`:''}
      <div class="br-chrome">
        <div class="br-dots"><span class="rd"></span><span class="yl"></span><span class="gn"></span></div>
        <div class="br-urlbar ${urlClass}">
          <span class="lock-icon">${lockIcon}</span>
          <span class="url-text">${sc.url}</span>
        </div>
      </div>
      <div class="br-body">
        <div class="fake-site-header">
          <div class="fake-logo-box" style="background:${sc.brandColor||'#1a73e8'}">${sc.brandEmoji||'🏦'}</div>
          <div>
            <div class="fake-site-name">${sc.siteName||'Portal Seguro'}</div>
            <div class="fake-tagline">${sc.tagline||'Tu seguridad es lo primero'}</div>
          </div>
        </div>
        <div class="fake-form">
          <div class="fake-input">${sc.field1||'Usuario o correo electrónico'}</div>
          <div class="fake-input focus-state">${sc.field2||'••••••••••••'}</div>
          <div class="fake-btn ${sc.btnColor||'red'}">${sc.btnLabel||'Iniciar sesión'}</div>
          <div class="fake-ssl-note">${urlSafe?'🔒 Conexión segura SSL':'⚠️ Conexión no verificada'}</div>
        </div>
      </div>
    </div>`;
  }
  /* ── Fallback texto plano ── */
  else {
    scHTML=`<div class="scenario-box">
      <div class="sc-from">De: <strong>${sc.from}</strong></div>
      <div class="sc-subject">${sc.subject||''}</div>
      <div class="sc-body">${sc.body}</div>
      ${sc.link?`<div class="sc-link danger">${sc.link}</div>`:''}
    </div>`;
  }

  const _tms_=document.createElement("div");_tms_.innerHTML=`<div class="q-badge qb-choice">🔍 Analiza este escenario</div>
    <div class="q-title">${q.q}</div>
    ${scHTML}
    <div class="choices-grid wide">
      ${q.choices.map((c,i)=>`<button class="ch-btn" data-idx="${i}" data-ok="${!!c.ok}" tabindex="0" onclick="choiceClick(this)">
        <span class="ch-em">${c.e}</span><span>${c.t}</span>
      </button>`).join('')}
    </div>`;;
  while(_tms_.firstChild) card.appendChild(_tms_.firstChild);
}

/* ─── Interactions ─── */
// Maneja el clic en una opción múltiple: evalúa si es correcta, registra en teoría y muestra feedback
function choiceClick(btn){
  if(answered)return;answered=true;
  document.querySelectorAll('.ch-btn').forEach(b=>b.disabled=true);
  const ok=btn.dataset.ok==='true';
  const q=curUnit.activities[curActIdx].questions[curQIdx];
  theoryMarkAnswer(curQIdx, ok);
  if(ok){btn.classList.add('correct');lesCorrect++;showFB(true,q.explain);}
  else{btn.classList.add('wrong');loseHeart();showFB(false,q.explain);}
}
// Maneja la respuesta a preguntas Verdadero/Falso: evalúa, registra y muestra feedback
function tfClick(btn,val,correct){
  if(answered)return;answered=true;
  document.querySelectorAll('.tf-btn').forEach(b=>b.disabled=true);
  const q=curUnit.activities[curActIdx].questions[curQIdx];
  // correct comes from HTML template as string/bool, use == for coercion-safe compare
  const isRight=(val==correct)||(String(val)===String(correct));
  theoryMarkAnswer(curQIdx, isRight);
  if(isRight){btn.classList.add('correct');lesCorrect++;showFB(true,q.explain);}
  else{btn.classList.add('wrong');loseHeart();showFB(false,q.explain);}
}
// Maneja el toque en chips de emparejamiento: selecciona, empareja y registra acierto/error
function pairTap(chip){
  if(answered)return;
  const side=chip.dataset.side;
  const pairIdx=parseInt(chip.dataset.pair); // unique pair index, works even with duplicate text
  if(chip.classList.contains('matched'))return;

  if(side==='L'){
    // Deselect any previously selected left chip
    document.querySelectorAll('.pair-chip.sel-a').forEach(c=>c.classList.remove('sel-a'));
    chip.classList.add('sel-a');
    pairSelLeft={pair:pairIdx, el:chip};
    const st=$('pair-st');if(st)st.textContent='Ahora toca la descripción correcta →';

  } else {
    // side === 'R'
    if(!pairSelLeft)return;
    const q=curUnit.activities[curActIdx].questions[curQIdx];

    if(pairIdx===pairSelLeft.pair){
      // ✅ Correct — mark exactly these two chips (not by query, but by direct reference + pair index)
      pairSelLeft.el.classList.remove('sel-a');
      pairSelLeft.el.classList.add('matched');
      chip.classList.add('matched');
      pairMatched.add(pairIdx);
      pairSelLeft=null;

      const st=$('pair-st');
      if(st)st.textContent=`✅ ${pairMatched.size}/${q.left.length} relacionados`;
      if(pairMatched.size===q.left.length){
        answered=true;lesCorrect++;
        theoryMarkAnswer(curQIdx, true);
        document.querySelectorAll('.pair-chip').forEach(c=>c.style.pointerEvents='none');
        showFB(true,q.explain);
      }
    } else {
      // ❌ Wrong — flash exactly these two chips only
      chip.classList.add('bad-flash');
      pairSelLeft.el.classList.add('bad-flash');
      setTimeout(()=>{
        document.querySelectorAll('.pair-chip').forEach(c=>c.classList.remove('bad-flash','sel-a'));
      },400);
      pairSelLeft=null;
      if(!window._theoryAnswered[curQIdx]) window._theoryAnswered[curQIdx]='wrong';
      const st=$('pair-st');if(st)st.textContent='❌ Incorrecto, intenta de nuevo';
    }
  }
}

let sortDragEl=null;
function sortDragStart(e){
  sortDragEl=e.currentTarget;
  sortDragEl.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
}
function sortDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  document.querySelectorAll('.sort-item').forEach(el=>el.classList.remove('over'));
  e.currentTarget.classList.add('over');
}
function sortDrop(e){
  e.preventDefault();
  const target=e.currentTarget;
  if(!sortDragEl||sortDragEl===target)return;
  const list=$('sort-list');
  const allItems=[...list.children];
  const dragPos=allItems.indexOf(sortDragEl);
  const targetPos=allItems.indexOf(target);
  if(dragPos<targetPos)list.insertBefore(sortDragEl,target.nextSibling);
  else list.insertBefore(sortDragEl,target);
  sortDragEl=null;
  document.querySelectorAll('.sort-item').forEach(el=>el.classList.remove('dragging','over'));
}
// Verifica el orden actual de los elementos drag & drop contra el orden correcto
function checkSort(){
  if(answered)return;answered=true;
  const list=$('sort-list');
  const items=[...list.children];
  // Get current order of item texts
  const userTexts=items.map(el=>decodeURIComponent(el.dataset.text));
  // correctOrder is array of indices into _sortItems meaning "item at correctOrder[0] should be first"
  const correctTexts=window._sortCorrect.map(idx=>window._sortItems[idx]);
  const q=curUnit.activities[curActIdx].questions[curQIdx];
  let allCorrect=true;
  items.forEach((el,i)=>{
    const ok=userTexts[i]===correctTexts[i];
    if(!ok)allCorrect=false;
    el.classList.add(ok?'correct':'wrong');
  });
  theoryMarkAnswer(curQIdx, allCorrect);
  if(allCorrect){lesCorrect++;showFB(true,q.explain);}
  else{loseHeart();showFB(false,`Orden correcto: ${correctTexts.join(' → ')}. ${q.explain}`);}
}

/* ─── Hearts ─── */
// Resta un corazón, actualiza la barra superior y muestra el overlay de sin corazones si llega a 0
function loseHeart(){
  if(gs.hearts>0){gs.hearts--;save();updateTopBar();}
  // Only show overlay after feedback bar closes (CONTINUAR), not mid-answer
  if(gs.hearts<=0){
    // Mark so nextQ() shows overlay instead of continuing
    window._pendingNoHearts=true;
  }
}
function showNoHearts(){$('no-hearts-overlay').classList.add('show')}
function hideNoHearts(){$('no-hearts-overlay').classList.remove('show');goHome()}
function goMinigame(){$('no-hearts-overlay').classList.remove('show');document.getElementById('mg-select-overlay').classList.add('show')}

/* ─── Feedback ─── */
// Muestra la barra de feedback inferior con color verde/rojo y la explicación de la respuesta
function showFB(ok,explain){
  const bar=$('fb-bar'),icon=$('fb-icon'),title=$('fb-title'),exp=$('fb-explain'),btn=$('fb-btn');
  bar.className='feedback-bar show '+(ok?'ok':'fail');
  const _mb=document.getElementById('mascot-bubble');if(_mb)_mb.classList.add('raised');
  icon.textContent=ok?'🎉':'💔';icon.className='fb-big-icon';
  title.className='fb-title '+(ok?'fb-ok':'fb-fail');
  title.textContent=ok?['¡Excelente!','¡Correcto!','¡Genial!','¡Perfecto!','¡Muy bien!'][Math.floor(Math.random()*5)]:'¡Casi! Inténtalo mejor';pixelReact(ok?'correct':'wrong');
  /* Shadow da pista si la respuesta fue incorrecta */
  if(!ok && typeof shadowHint==='function'){
    setTimeout(()=>shadowHint(currentQ?.q||'', currentQ?.type||'choice'), 600);
  }
  setTimeout(()=>narrateResult(ok,explain),150);
  exp.textContent=explain||'';
  btn.className='fb-cont-btn '+(ok?'ok-cont':'fail-cont');
  btn.textContent='CONTINUAR';
  save();
}
// Oculta la barra de feedback inferior
function hideFB(){$('fb-bar').className='feedback-bar';const _mb=document.getElementById('mascot-bubble');if(_mb)_mb.classList.remove('raised');}
// Avanza a la siguiente pregunta, actualiza el progreso y refresca el panel de teoría si está abierto
function nextQ(){
  // If theory panel is open, refresh it to reflect new current question
  const _tp=document.getElementById('theory-panel');
  if(_tp&&_tp.classList.contains('open')){
    const qs=(curUnit&&curUnit.activities&&curUnit.activities[curActIdx])
      ?curUnit.activities[curActIdx].questions:[];
    _theoryRenderList(qs);
    setTimeout(()=>{
      const cur=document.querySelector('.th-q-card.current');
      if(cur) cur.scrollIntoView({behavior:'smooth',block:'center'});
    },100);
  }
  if(window._pendingNoHearts){
    window._pendingNoHearts=false;
    hideFB();
    showNoHearts();
    return;
  }
  curQIdx++;renderQ();
}

/* ─── End Lesson ─── */
function endLesson(){
  const elapsed=Math.round((Date.now()-lesStartTime)/1000);
  const xp=lesCorrect*15+(lesCorrect===lesTotalQ?30:0);
  const acc=Math.round((lesCorrect/lesTotalQ)*100);
  gs.xp+=xp;gs.gems+=lesCorrect;
  if(acc>=50)gs.streak++;else gs.streak=0;
  if(!gs.completedActs[curUnit.id])gs.completedActs[curUnit.id]=[];
  if(!gs.completedActs[curUnit.id].includes(curActIdx))gs.completedActs[curUnit.id].push(curActIdx);
  // Refill 1 heart on perfect
  if(acc===100&&gs.hearts<5)gs.hearts++;
  // Desbloquear botón de teoría al completar la lección
  const theoryBtn=document.getElementById('theory-open-btn');
  if(theoryBtn){theoryBtn.classList.remove('locked');theoryBtn.removeAttribute('aria-disabled');theoryBtn.setAttribute('title','Ver teoría y preguntas');}
  save();
  $('rc-xp').textContent='+'+xp;
  $('rc-acc').textContent=acc+'%';
  $('rc-streak').textContent=gs.streak;
  $('rc-time').textContent=elapsed+'s';
  $('res-emoji').textContent=acc===100?'🏆':acc>=60?'⭐':'😤';
  $('res-title').textContent=acc===100?'¡Perfecto!':acc>=60?'¡Lección completada!':'Sigue practicando';
  $('res-sub').textContent=`${lesCorrect}/${lesTotalQ} correctas · +${xp} XP`;
  hideFB();showScreen('result');updateTopBar();
}
// Navega a la pantalla home (mapa de unidades) y actualiza la barra superior
function goHome(){
  hideFB();
  window._pendingNoHearts=false;
  clearInterval(mgTimer);
  showScreen('home');
  renderHome();
}
function confirmClose(){
  const overlay=document.getElementById('exit-confirm-overlay');
  if(overlay)overlay.classList.add('show');
  else goHome();
}

/* ═══════════════════════════════════════════════════════
   MINI-GAME — "Toca lo Seguro"
═══════════════════════════════════════════════════════ */
// Inicia el minijuego de pares: baraja las preguntas y renderiza el primer round
function startMiniGame(){
  mgScore=0;mgIdx=0;
  mgRound=[...MG_ROUNDS].sort(()=>Math.random()-.5);
  window._pendingNoHearts=false;
  const wrap=$('mg-wrap');
  wrap.innerHTML=`
    <div class="mg-header">
      <span class="mg-owl">🦉</span>
      <h2 class="mg-title">¡Toca lo Seguro!</h2>
      <p class="mg-sub">Identifica los elementos SEGUROS y tócalos para ganar vidas</p>
    </div>
    <div class="mg-lives-needed">Necesitas <strong>6 puntos</strong> para recuperar ❤️❤️ vidas</div>
    <div id="mg-game-area">
      <p class="mg-instructions">🔒 Toca solo los elementos <strong>SEGUROS</strong> · ❌ Ignora los peligrosos</p>
      <div class="mg-score-row">
        <div class="mg-score">🏅 Puntos: <span id="mg-pts">0</span></div>
        <div class="mg-timer-bar"><div class="mg-timer-fill" id="mg-timer-fill" style="width:100%"></div></div>
        <div style="font-size:.8rem;font-weight:800;color:rgba(255,255,255,.7)"><span id="mg-time">30</span>s</div>
      </div>
      <div id="mg-items-grid"></div>
    </div>`;
  renderMGRound();
  mgTimerVal=30;
  clearInterval(mgTimer);
  mgTimer=setInterval(()=>{
    mgTimerVal--;
    const tf=$('mg-timer-fill'),tt=$('mg-time');
    if(tf)tf.style.width=(mgTimerVal/30*100)+'%';
    if(tt)tt.textContent=mgTimerVal;
    if(mgTimerVal<=0){clearInterval(mgTimer);endMiniGame()}
  },1000);
}
// Renderiza un round del minijuego de pares con los chips de conceptos y descripciones
function renderMGRound(){
  const grid=$('mg-items-grid');if(!grid)return;
  grid.innerHTML='';
  // Pick 6 items using rotating index, never mutate mgRound
  const total=mgRound.length;
  for(let i=0;i<6;i++){
    const item=mgRound[(mgIdx+i)%total];
    const btn=document.createElement('button');
    btn.className='mg-item-btn';
    btn.innerHTML=`${item.icon} ${item.label}`;
    btn.dataset.safe=item.safe;
    btn.onclick=()=>mgTap(btn,item.safe);
    grid.appendChild(btn);
  }
  mgIdx=(mgIdx+6)%total;
}
function mgTap(btn,safe){
  btn.disabled=true;
  if(safe){
    btn.classList.add('correct-tap');mgScore++;
    const pts=$('mg-pts');if(pts)pts.textContent=mgScore;
    // refresh grid after short delay if all tapped
    setTimeout(()=>{const remaining=document.querySelectorAll('.mg-item-btn:not([disabled])');
      if(remaining.length===0)renderMGRound();},300);
  }else{
    btn.classList.add('wrong-tap');mgTimerVal=Math.max(0,mgTimerVal-3);
  }
}
function endMiniGame(){
  clearInterval(mgTimer);
  const livesEarned=mgScore>=6?2:mgScore>=3?1:0;
  const wrap=$('mg-wrap');
  const earned=document.getElementById('mg-game-area');
  if(earned)earned.style.display='none';
  const res=document.createElement('div');
  res.className='mg-result';
  res.innerHTML=`
    <span class="mg-r-icon">${livesEarned>0?'🎉':'😔'}</span>
    <h3>${livesEarned>0?'¡Bien hecho!':'Sigue intentando'}</h3>
    <p>${mgScore} puntos · ${livesEarned>0?`Recuperaste ${livesEarned} ❤️ vida${livesEarned>1?'s':''}`:'No alcanzaste los 3 puntos mínimos'}</p>
    <button class="mg-claim-btn" onclick="claimLives(${livesEarned})">${livesEarned>0?`Reclamar ${livesEarned>1?livesEarned+' vidas':'vida'} ❤️`:'Intentar de nuevo 🔄'}</button>`;
  wrap.appendChild(res);
  if(livesEarned>0){gs.hearts=Math.min(5,gs.hearts+livesEarned);save();updateTopBar()}
}
function claimLives(earned){
  if(earned>0){showToast(`❤️ ¡Recuperaste ${earned} vida${earned>1?'s':''}`);goHome();}
  else startMiniGame();
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */

/* MASCOT PIXEL */
const PIXEL_MSGS=[
  // ── CONTRASEÑAS (20) ──
  ['🔑','Una contraseña de 12 caracteres aleatorios tardaría 34,000 años en romperse con hardware actual.'],
  ['🔐','El gestor de contraseñas más popular del mundo tiene más de 25 millones de usuarios. ¡Vale la pena usarlo!'],
  ['🔒','El 81% de las brechas de datos se deben a contraseñas débiles o reutilizadas. ¡Cada cuenta merece una única!'],
  ['💡','Una frase de 4 palabras aleatorias como "caballo-batería-grapadora-correcta" es más segura que una sola palabra con símbolos.'],
  ['🎲','Los gestores de contraseñas generan claves imposibles de adivinar como "xK#9mP!2qL@vN". No necesitas recordarlas tú.'],
  ['⚠️','¿Sabías que "123456" fue la contraseña más usada en 2024? Más de 2 millones de cuentas la usan.'],
  ['🧂','El "salting" es agregar datos aleatorios a tu contraseña antes de cifrarla. Hace que dos contraseñas iguales se vean diferentes en la base de datos.'],
  ['🕐','Con hardware de 2024, una contraseña de 8 caracteres se puede romper en menos de 1 hora por fuerza bruta.'],
  ['🏦','Los bancos nunca te pedirán tu contraseña completa por teléfono o email. Si alguien lo hace, es una estafa.'],
  ['🔄','Cambiar contraseñas regularmente ya no es la mejor práctica. Lo importante es que sean únicas y largas.'],
  ['📊','El 65% de las personas reutiliza la misma contraseña en múltiples sitios. Si hackean uno, hackean todos.'],
  ['🧩','Las preguntas de seguridad son débiles porque las respuestas (nombre de mascota, ciudad natal) están en tus redes sociales.'],
  ['⚡','Un ataque de diccionario prueba millones de palabras comunes en segundos. "Contraseña1!" cae en el primer minuto.'],
  ['🌐','Puedes verificar si tu email estuvo en una brecha de datos en haveibeenpwned.com — ¡es gratuito!'],
  ['📱','Usa contraseñas diferentes para tu email principal. Es la llave maestra: quien la tenga, accede a todo lo demás.'],
  ['🤖','Los bots pueden intentar miles de contraseñas por segundo. Una contraseña de 6 caracteres cae en segundos.'],
  ['🎭','El "credential stuffing" usa contraseñas robadas de un sitio para intentar entrar en otros. Por eso, ¡nunca reutilices!'],
  ['💾','Los gestores de contraseñas usan cifrado AES-256 — el mismo estándar que usan los bancos centrales del mundo.'],
  ['🔓','Si no usas un gestor de contraseñas, probablemente recuerdas menos de 10 contraseñas. Tienes más de 10 cuentas online.'],
  ['🛡️','Una contraseña con mayúsculas, minúsculas, números y símbolos tiene 95^N combinaciones posibles, donde N es la longitud.'],
  // ── PHISHING (20) ──
  ['🎣','El 96% del phishing llega por email, pero el smishing (SMS) y el vishing (voz) están creciendo rápidamente.'],
  ['🐟','Los atacantes de phishing invierten solo $34 USD en promedio para lanzar una campaña que puede robar millones.'],
  ['📧','El spear phishing usa tu nombre, empresa y cargo reales para parecer más creíble. Siempre verifica el remitente.'],
  ['🔗','Pasa el mouse sobre un enlace antes de hacer clic. La URL real aparece en la barra inferior del navegador.'],
  ['🏦','Los bancos, PayPal y Amazon nunca te piden verificar tu cuenta por email. Ese mensaje es phishing.'],
  ['⏰','La urgencia falsa es la táctica #1 del phishing: "Tu cuenta será bloqueada en 24 horas". Los ataques reales no avisan.'],
  ['🌐','Un dominio como "paypal-secure.net" no es PayPal. El dominio real siempre está justo antes del punto final (.com, .co).'],
  ['🤳','El phishing por WhatsApp es el más creciente en Latinoamérica. Si un contacto te manda un link raro, llámalo a confirmar.'],
  ['📞','El vishing (phishing por voz) puede usar IA para clonar la voz de un familiar. Establece una palabra clave secreta con tu familia.'],
  ['🎯','El 91% de los ciberataques exitosos comienzan con un email de phishing. Es la puerta de entrada más común.'],
  ['🖥️','Los sitios de phishing a veces tienen certificado HTTPS (el candadito). El candado no garantiza que sea legítimo.'],
  ['📝','Si recibes un email sospechoso de tu "banco", abre el navegador manualmente y escribe la dirección. Nunca hagas clic.'],
  ['👁️','Los emails de phishing suelen tener errores tipográficos o de gramática. Léelos con cuidado.'],
  ['📱','Nunca escanees un código QR en un lugar público sin saber a dónde te lleva. Pueden redirigirte a sitios maliciosos.'],
  ['💼','El CEO fraud o BEC (Business Email Compromise) engaña a empleados para que transfieran dinero. Cuesta a empresas $43B/año.'],
  ['🎭','Los atacantes crean perfiles falsos en LinkedIn para hacer spear phishing más creíble. Verifica antes de responder.'],
  ['🚩','Señales de phishing: saludo genérico, urgencia, enlace sospechoso, pide datos sensibles, remitente extraño.'],
  ['🔍','Puedes reportar emails de phishing en Colombia a la línea del CAI Virtual de la Policía Nacional: caivirtual.policia.gov.co'],
  ['🌍','El 1.5% de todos los sitios web en internet son de phishing. Hay nuevos creados cada día.'],
  ['🤖','Herramientas de IA pueden generar emails de phishing perfectos en segundos. El phishing se está volviendo más sofisticado.'],
  // ── MALWARE (15) ──
  ['🦠','Existen más de 1,000 millones de programas maliciosos conocidos. Se crean 450,000 nuevos cada día.'],
  ['💰','El ransomware WannaCry de 2017 afectó 200,000 computadores en 150 países en un solo día.'],
  ['🔌','Un USB desconocido puede infectar tu PC en segundos. Nunca conectes dispositivos de origen desconocido.'],
  ['📲','El malware móvil aumentó un 400% en 2023. Descarga apps solo de tiendas oficiales como App Store o Play Store.'],
  ['💾','Los troyanos se disfrazan de software legítimo. Un "crack" de Photoshop puede estar lleno de malware.'],
  ['🕵️','El spyware puede grabar todo lo que escribes (keylogger) y enviarlo al atacante sin que lo notes.'],
  ['🔄','Los backups regulares son la mejor defensa contra ransomware. La regla 3-2-1: 3 copias, 2 medios, 1 offsite.'],
  ['🌐','Los botnets son redes de computadoras infectadas controladas remotamente. Tu PC puede ser parte de uno sin saberlo.'],
  ['📧','El malware más común se distribuye por adjuntos de email: PDF, Word, Excel con macros maliciosas.'],
  ['🛡️','Un antivirus actualizado detecta el 99.9% del malware conocido. Actualiza las definiciones todos los días.'],
  ['🔒','El ransomware cifra tus archivos con AES-256. Sin la clave del atacante, recuperarlos es prácticamente imposible.'],
  ['🖥️','El rootkit es el tipo de malware más difícil de detectar: se esconde en el sistema operativo y sobrevive a reinicios.'],
  ['💡','El 94% del malware llega por email. Nunca abras adjuntos inesperados, aunque vengan de un contacto conocido.'],
  ['🎮','Los juegos pirata son la segunda fuente más común de malware después del email. No vale el riesgo.'],
  ['🔧','Las actualizaciones de seguridad del sistema operativo parchean vulnerabilidades que el malware aprovecha. ¡Actualiza siempre!'],
  // ── REDES (15) ──
  ['📡','En una red WiFi pública, cualquier persona en la misma red puede interceptar tu tráfico no cifrado.'],
  ['🔒','WPA3 es el protocolo WiFi más seguro disponible actualmente. WEP se puede romper en menos de 1 minuto.'],
  ['🌐','Una VPN cifra todo tu tráfico de internet, incluso en redes WiFi inseguras. Esencial para trabajo remoto.'],
  ['🏠','Cambia la contraseña predeterminada de tu router. Muchos atacantes conocen las contraseñas de fábrica.'],
  ['🔧','El HTTPS cifra los datos entre tu navegador y el servidor. Sin él, todo va en texto plano por la red.'],
  ['📶','Desactiva la conexión automática a redes WiFi en tu teléfono. Tu dispositivo puede conectarse a redes falsas.'],
  ['🎭','Un "evil twin attack" crea una red WiFi falsa con el mismo nombre que una legítima para robar tu tráfico.'],
  ['🖥️','El firewall es como un guardia de seguridad en la puerta de tu red: bloquea tráfico no autorizado.'],
  ['📊','El 34% de las organizaciones han sufrido ataques por empleados conectados a redes inseguras en cafeterías.'],
  ['🔐','SSH (puerto 22) es el protocolo seguro para administrar servidores remotamente. FTP (puerto 21) es inseguro.'],
  ['🌍','Tor es una red anónima que cifra tu tráfico en 3 capas. Lenta pero extremadamente privada.'],
  ['📱','Desactiva el Bluetooth cuando no lo uses. Los ataques Bluejacking y Bluesnarfing roban datos vía Bluetooth.'],
  ['🔄','El DNS poisoning redirige dominios legítimos a sitios maliciosos. DNSSEC protege contra este ataque.'],
  ['💻','Un ataque DDoS puede derribar cualquier servidor inundándolo con millones de peticiones por segundo.'],
  ['🛡️','La segmentación de red aísla dispositivos IoT del resto de tu red. Tu nevera smart no debería ver tus archivos.'],
  // ── CUENTAS / 2FA (15) ──
  ['📱','Las apps de autenticación (Google Authenticator, Authy) son más seguras que los SMS para el 2FA.'],
  ['🔐','El 2FA con SMS tiene una vulnerabilidad: el SIM swapping. Un atacante puede transferir tu número a su SIM.'],
  ['🗝️','Las llaves de seguridad física (YubiKey) son la forma más segura de 2FA. Ni el phishing puede robarlas.'],
  ['👤','El robo de identidad afecta a 14 millones de personas en EEUU cada año. El 2FA lo previene en el 99.9% de casos.'],
  ['📧','Configura un email de recuperación diferente y seguro. Si pierdes el acceso, lo necesitarás.'],
  ['🔒','El inicio de sesión único (SSO) con Google o Facebook es conveniente pero crea un punto único de fallo.'],
  ['💡','Revisa regularmente qué aplicaciones tienen acceso a tu cuenta de Google o Facebook y revoca las que no uses.'],
  ['🚨','Si recibes un código 2FA que no pediste, alguien intentó acceder a tu cuenta. Cambia la contraseña inmediatamente.'],
  ['🤖','Los password managers modernos incluyen 2FA incorporado. No necesitas apps separadas.'],
  ['📊','Las cuentas con 2FA activado tienen un 99.9% menos de probabilidad de ser comprometidas, según Microsoft.'],
  ['🌐','Single Sign-On (SSO) corporativo centraliza el acceso. Si falla el proveedor de identidad, falla todo.'],
  ['💼','El principio de mínimo privilegio: cada usuario solo debe tener acceso a lo que necesita para su trabajo.'],
  ['🔄','Las sesiones activas no cerradas son una vulnerabilidad. Siempre cierra sesión en dispositivos compartidos.'],
  ['🎭','El "account takeover" (ATO) es cuando alguien toma control de tu cuenta. El 2FA lo hace casi imposible.'],
  ['📱','Activa notificaciones de inicio de sesión en tus cuentas importantes. Sabrás de inmediato si alguien entra.'],
  // ── DATOS CURIOSOS GENERALES (15) ──
  ['🌍','Colombia tiene el Centro Cibernético Policial (CCP) que investiga crímenes en internet. Puedes denunciar en caivirtual.policia.gov.co'],
  ['💰','El cibercrimen genera más dinero que el tráfico de drogas a nivel global: más de $8 billones de dólares en 2023.'],
  ['👶','La primera computadora con contraseña fue creada en MIT en 1961. Era un sistema para dar acceso por tiempo limitado.'],
  ['🎂','El primer virus informático, Creeper (1971), no era malicioso. Solo mostraba el mensaje: soy el creeper, atrápame si puedes.'],
  ['🏆','Kevin Mitnick fue el hacker más buscado del FBI en los 90. Luego se convirtió en consultor de seguridad para empresas.'],
  ['📚','La ciberseguridad como campo profesional creció un 350% en demanda laboral entre 2013 y 2024.'],
  ['🤝','Bug bounty: empresas como Google, Microsoft y Facebook pagan a hackers éticos por encontrar vulnerabilidades. ¡Hasta $2M USD!'],
  ['🔬','El campo de la forense digital puede recuperar archivos "borrados" de un disco duro años después de haberlos eliminado.'],
  ['⚖️','En Colombia, los delitos informáticos están tipificados en la Ley 1273 de 2009 con penas de hasta 8 años de prisión.'],
  ['🌐','Hay más de 4.5 mil millones de dispositivos conectados a internet. Cada uno es un posible vector de ataque.'],
  ['🎓','La certificación CISSP es considerada el estándar de oro en ciberseguridad. Requiere 5 años de experiencia mínimo.'],
  ['🔭','El CERT (Computer Emergency Response Team) fue creado en 1988 tras el primer gusano de internet que afectó 6,000 máquinas.'],
  ['💡','El término "hacker" originalmente era positivo: alguien brillante que encontraba soluciones creativas. Los "crackers" son los maliciosos.'],
  ['🏗️','La arquitectura Zero Trust ("nunca confíes, siempre verifica") es el modelo de seguridad adoptado por las grandes empresas hoy.'],
  ['🤖','La IA ya puede generar deepfakes de video en tiempo real para ataques de ingeniería social. El mundo cambia rápido.'],
];

/* ─── SHADOW QUESTION HINTS (por pregunta, sin revelar la respuesta) ─── */
const SHADOW_HINTS = {
  // Por tipo de pregunta
  choice: [
    ['🤔','Piensa en cuál opción protege mejor tu información personal...'],
    ['💡','Recuerda: un atacante siempre busca el camino más fácil. ¿Cuál opción lo hace más difícil?'],
    ['🔍','Descarta las opciones que impliquen compartir o exponer información...'],
    ['🧠','Pregúntate: ¿cuál de estas opciones seguiría recomendando un experto en seguridad?'],
    ['⚡','Pista: la respuesta correcta siempre prioriza la privacidad y el control sobre tus datos.'],
  ],
  tf: [
    ['🤔','Piensa si esa práctica te haría más vulnerable o más seguro...'],
    ['💡','Si algo parece conveniente pero arriesgado, probablemente no es la mejor práctica de seguridad.'],
    ['🔍','¿Qué pasaría si un atacante aprovechara esa situación? ¿Te protegería o te expondría?'],
  ],
  pair: [
    ['🔗','Relaciona cada concepto con su función: ¿protege o ataca? ¿cifra o expone?'],
    ['💡','Los ataques buscan vulnerabilidades. Las defensas las parchean. ¿Cuál es cuál?'],
    ['🤔','Piensa en el objetivo de cada elemento: ¿quién se beneficia del atacante y quién del defensor?'],
  ],
  sort: [
    ['📋','Piensa en el orden lógico: ¿qué debe ocurrir primero para que lo siguiente tenga sentido?'],
    ['🔄','En seguridad, el orden importa. Primero detectas, luego respondes, luego remedias.'],
    ['💡','Piensa como un profesional de seguridad: ¿cuál sería el flujo natural de este proceso?'],
  ],
  scenario: [
    ['🔍','Analiza cada detalle del escenario: el remitente, la URL, el mensaje, la urgencia...'],
    ['⚠️','Las señales de alerta son sutiles. ¿El dominio es exactamente correcto? ¿La urgencia parece real?'],
    ['🎭','Los atacantes imitan perfectamente a entidades legítimas. Busca inconsistencias pequeñas.'],
  ],
  // Por tema (se detecta por la pregunta)
  password: [
    ['🔑','Recuerda: longitud > complejidad. Una frase larga siempre gana a una corta con símbolos.'],
    ['💡','Una buena contraseña no debe tener información personal, palabras del diccionario ni patrones obvios.'],
    ['🔐','Los gestores de contraseñas son la solución número 1 recomendada por expertos para este problema.'],
    ['⚡','Pista: piensa en qué hace una contraseña difícil de adivinar tanto para humanos como para máquinas.'],
  ],
  phishing: [
    ['🎣','En phishing, siempre verifica el dominio del remitente. La parte importante está después del @.'],
    ['💡','La urgencia y el miedo son las principales armas del phishing. Si sientes presión, para y verifica.'],
    ['🔍','¿La URL destino coincide con el sitio real? Pasa el mouse antes de hacer clic.'],
    ['📧','Ninguna entidad legítima te pedirá contraseñas, números de tarjeta o códigos 2FA por email.'],
  ],
  malware: [
    ['🦠','Pregúntate: ¿de dónde viene este software? Las fuentes no oficiales son las más peligrosas.'],
    ['💡','Si algo pide permisos que no necesita para su función, eso es una señal de alerta.'],
    ['🛡️','Los backups regulares son la mejor defensa contra ransomware. ¿Tienes una copia reciente?'],
    ['🔄','Las actualizaciones de seguridad parchean las vulnerabilidades que el malware aprovecha.'],
  ],
  network: [
    ['📡','En redes públicas, cualquier tráfico no cifrado puede ser interceptado por cualquiera en la misma red.'],
    ['🔒','Recuerda la jerarquía de seguridad WiFi: WPA3 > WPA2 > WPA > WEP (este último es inseguro).'],
    ['💡','Una VPN cifra TODO tu tráfico, no solo el de una app. Es esencial en redes no confiables.'],
    ['🌐','HTTPS cifra la comunicación entre tú y el sitio. HTTP va en texto plano visible para cualquiera.'],
  ],
  twofa: [
    ['📱','Recuerda: app de autenticación > SMS > nada. Cada capa adicional multiplica la seguridad.'],
    ['💡','El 2FA protege incluso si roban tu contraseña. El atacante también necesita tu segundo factor.'],
    ['🔐','Las llaves de seguridad física son inmunes al phishing porque verifican el dominio del sitio.'],
  ],
};

/* Detectar categoría de la pregunta */
function detectQuestionCategory(questionText) {
  const q = (questionText||'').toLowerCase();
  if(/contrase|password|clave|gestor|bruta|diccionario/.test(q)) return 'password';
  if(/phish|correo|email|enlace|link|dominio|suplant|bancol|urgente/.test(q)) return 'phishing';
  if(/malware|virus|ransomware|troyano|spyware|descarg|adjunto|crack/.test(q)) return 'malware';
  if(/red|wifi|vpn|https|http|cifr|protocolo|ftp|ssh|wpa|wep/.test(q)) return 'network';
  if(/2fa|autenticac|factor|sms|verificac|sesion|cuenta/.test(q)) return 'twofa';
  return null;
}

/* Shadow da una pista contextual sin revelar la respuesta */
function shadowHint(questionText, questionType) {
  const sp = document.getElementById('mascot-speech');
  const st = document.getElementById('speech-text');
  if (!sp || !st) return;

  const category = detectQuestionCategory(questionText);
  let pool = [];

  // Primero intentar hints por categoría temática
  if (category && SHADOW_HINTS[category]) {
    pool = SHADOW_HINTS[category];
  }
  // Fallback a hints por tipo de pregunta
  else if (SHADOW_HINTS[questionType]) {
    pool = SHADOW_HINTS[questionType];
  }
  // Fallback general
  else {
    pool = SHADOW_HINTS.choice;
  }

  const hint = pool[Math.floor(Math.random() * pool.length)];
  st.innerHTML = hint[0] + ' <strong>Pista de Shadow:</strong><br>' + hint[1];
  sp.classList.remove('hidden');
  speechVisible = true;

  // Animar la mascota
  const owl = document.getElementById('mascot-owl');
  if (owl) {
    owl.textContent = '🤔';
    setTimeout(() => { owl.textContent = '🐺'; }, 2500);
  }
}

let speechVisible=false,pixelMsgIdx=0;
function toggleSpeech(){
  speechVisible=!speechVisible;
  const sp=document.getElementById('mascot-speech');
  if(speechVisible){
    sp.classList.remove('hidden');
    const tip=PIXEL_MSGS[pixelMsgIdx%PIXEL_MSGS.length];
    document.getElementById('speech-text').innerHTML=tip[0]+' '+tip[1];
    pixelMsgIdx++;
  }else{sp.classList.add('hidden')}
}
function hideSpeech(){speechVisible=false;document.getElementById('mascot-speech').classList.add('hidden')}
function pixelReact(type){
  const owl=document.getElementById('mascot-owl');
  const faces={correct:'🥳',wrong:'😬',start:'🤔',end:'🎉'};
  owl.textContent=faces[type]||'🐺';
  setTimeout(()=>{owl.textContent='🐺'},2500);
}
/* TRIVIA RAPIDA */
const TRIVIA_QS=[
  {q:'¿Que significa HTTPS?',opts:['HyperText Transfer Protocol Secure','High Transfer Protocol System','HyperText Tracking Protocol Service','Hard Transfer Protocol Security'],ans:0,exp:'La S final significa que la conexion esta cifrada con TLS, protegiendo tus datos en transito.'},
  {q:'¿Cuantos caracteres minimo debe tener una contrasena segura?',opts:['6 caracteres','8 caracteres','10 caracteres','12 o mas'],ans:3,exp:'Con hardware actual, contrasenas de 8 caracteres se rompen en horas. Usa minimo 12-16.'},
  {q:'¿Que es el phishing?',opts:['Un tipo de virus','Engano para robar datos personales','Software espia','Error de sistema'],ans:1,exp:'El phishing usa mensajes falsos para engañarte y robar tus credenciales.'},
  {q:'¿Que hace una VPN?',opts:['Acelera el internet','Cifra y oculta tu trafico de red','Elimina virus','Bloquea publicidad'],ans:1,exp:'Una VPN crea un tunel cifrado para tus datos, ocultando tu actividad de hackers en la red.'},
  {q:'¿Que es el ransomware?',opts:['Software de respaldo','Antivirus especial','Malware que cifra tus archivos y pide rescate','Virus que roba contraseñas'],ans:2,exp:'El ransomware bloquea tus archivos y exige pago. La mejor defensa son backups regulares.'},
  {q:'¿Para que sirve el 2FA?',opts:['Doble velocidad de internet','Segunda capa de verificacion de identidad','Dos contrasenas distintas','Verificar email dos veces'],ans:1,exp:'El 2FA requiere algo que SABES mas algo que TIENES, haciendo tu cuenta casi imposible de hackear.'},
  {q:'¿Que protocolo es mas seguro para transferir archivos?',opts:['FTP','HTTP','SFTP','Correo electronico'],ans:2,exp:'SFTP usa cifrado SSH para proteger los archivos. FTP y HTTP van en texto plano sin cifrado.'},
  {q:'¿Que es una brecha de datos?',opts:['Error de programacion','Filtracion no autorizada de informacion','Corte de internet','Virus en base de datos'],ans:1,exp:'Una brecha expone datos de usuarios. HaveIBeenPwned.com te avisa si tu email fue comprometido.'},
  {q:'¿Cual es la señal mas confiable de phishing?',opts:['Muchas imagenes','Dominio del remitente incorrecto','Texto muy largo','Sin firma del email'],ans:1,exp:'El dominio (despues del @) lo revela todo. paypal-secure.net no es PayPal real.'},
  {q:'¿Que es el credential stuffing?',opts:['Crear contrasenas automaticas','Probar contrasenas robadas en muchos sitios','Hackear por WiFi','Robar emails masivamente'],ans:1,exp:'Los hackers compran bases de datos de contrasenas y las prueban en cientos de sitios de forma automatica.'},
  {q:'¿Que protocolo WiFi se considera inseguro y obsoleto?',opts:['WPA3','WPA2','WEP','WPA'],ans:2,exp:'WEP se puede romper en minutos con herramientas gratuitas. Usa siempre WPA2 o WPA3.'},
  {q:'¿Que es el SIM swapping?',opts:['Cambiar de telefono','Atacante transfiere tu numero a su SIM','Hackear la red celular','Clonar tu telefono'],ans:1,exp:'El atacante convence a tu operador de dar tu numero a otra SIM. Por eso las apps 2FA son mas seguras que SMS.'},
];
let tq_qs=[],tq_idx=0,tq_score=0,tq_timer=null,tq_time=0,tq_answered=false;
function startTrivia(){
  tq_qs=[...TRIVIA_QS].sort(()=>Math.random()-.5).slice(0,8);
  tq_idx=0;tq_score=0;tq_time=0;
  clearInterval(tq_timer);
  tq_timer=setInterval(()=>{tq_time++;const el=document.getElementById('tq-time');if(el)el.textContent=tq_time+'s'},1000);
  showScreen('minigame2');renderTriviaQ();
}
// Renderiza una pregunta del minijuego de trivia de velocidad (minigame2)
function renderTriviaQ(){
  const wrap=document.getElementById('mg2-wrap');if(!wrap)return;
  if(tq_idx>=tq_qs.length){endTrivia();return}
  const q=tq_qs[tq_idx];tq_answered=false;
  wrap.innerHTML=`<div class="mg2-scorebar"><span>⚡ <span id="tq-score">${tq_score}</span> pts</span><span style="font-size:.8rem;opacity:.7">${tq_idx+1}/${tq_qs.length} · <span id="tq-time">${tq_time}s</span></span></div>
  <div style="background:rgba(255,255,255,.08);border-radius:12px;height:8px;width:100%;overflow:hidden"><div style="height:100%;background:linear-gradient(90deg,#58cc02,#00cba1);width:${tq_idx/tq_qs.length*100}%;transition:width .4s"></div></div>
  <div class="mg2-card"><div class="mg2-question">❓ ${q.q}</div><div class="mg2-options">${q.opts.map((o,i)=>`<button class="mg2-opt" id="tq-opt-${i}" onclick="triviaAnswer(${i},${q.ans})">${o}</button>`).join('')}</div><div class="mg2-feedback" id="tq-fb"></div></div>`;
}
function triviaAnswer(chosen,correct){
  if(tq_answered)return;tq_answered=true;
  document.querySelectorAll('.mg2-opt').forEach(b=>b.disabled=true);
  const fb=document.getElementById('tq-fb');
  if(chosen===correct){document.getElementById('tq-opt-'+chosen).classList.add('correct-opt');tq_score+=10;if(fb)fb.innerHTML='✅ Correcto! +10 pts';pixelReact('correct');}
  else{document.getElementById('tq-opt-'+chosen).classList.add('wrong-opt');document.getElementById('tq-opt-'+correct).classList.add('correct-opt');if(fb)fb.innerHTML='❌ '+tq_qs[tq_idx].exp;pixelReact('wrong');}
  document.getElementById('tq-score').textContent=tq_score;
  setTimeout(()=>{tq_idx++;renderTriviaQ()},1800);
}
function endTrivia(){
  clearInterval(tq_timer);
  const livesEarned=tq_score>=60?2:tq_score>=30?1:0;
  if(livesEarned>0){gs.hearts=Math.min(5,gs.hearts+livesEarned);save();updateTopBar()}
  const wrap=document.getElementById('mg2-wrap');
  wrap.innerHTML=`<div style="text-align:center;padding:1rem 0"><span style="font-size:3rem;display:block;margin-bottom:.5rem;animation:popIn .4s cubic-bezier(.34,1.56,.64,1)">${livesEarned>0?'🏆':'📚'}</span><div style="font-size:1.4rem;font-weight:900;margin-bottom:.3rem">${livesEarned>0?'Trivia completada!':'Buen intento!'}</div><div style="opacity:.75;font-size:.85rem;margin-bottom:.5rem">${tq_score} puntos · ${tq_time}s · ${livesEarned>0?'Recuperaste '+livesEarned+' vida'+(livesEarned>1?'s':''):'Necesitas 30+ puntos para ganar vida'}</div><div style="display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin-top:1rem"><button style="padding:.8rem 1.8rem;border-radius:16px;border:none;background:linear-gradient(135deg,#58cc02,#00cba1);color:#fff;font-family:Nunito;font-weight:900;cursor:pointer;font-size:.95rem" onclick="${livesEarned>0?"showToast('Vidas recuperadas!');goHome()":"startTrivia()"}">${livesEarned>0?'Seguir aprendiendo':'Intentar de nuevo'}</button><button style="padding:.8rem 1.4rem;border-radius:16px;border:2px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-family:Nunito;font-weight:800;cursor:pointer;font-size:.85rem" onclick="goHome()">Ir al inicio</button></div></div>`;
}
function launchGame(type){
  document.getElementById('mg-select-overlay').classList.remove('show');
  if(type==='toca'){showScreen('minigame');startMiniGame();}
  else if(type==='trivia'){startTrivia();}
}


/* ════════════════════════════
   UNIT INTRO / INFO SYSTEM
════════════════════════════ */
const UNIT_INTROS = {
  passwords:{
    color:'#58cc02',colorD:'#46a302',icon:'🔑',
    what:'Las contraseñas son la primera línea de defensa de tus cuentas digitales. En esta sección aprenderás cómo funcionan los ataques y cómo crear contraseñas que sean prácticamente imposibles de hackear.',
    concepts:[
      {icon:'💥',text:'Qué es un ataque de fuerza bruta y cómo la longitud de tu contraseña lo hace inútil'},
      {icon:'🤖',text:'Cómo los bots usan credenciales robadas para entrar a tus cuentas (credential stuffing)'},
      {icon:'🗄️',text:'Por qué los gestores de contraseñas son más seguros que recordarlas tú'},
      {icon:'🔐',text:'Cómo el 2FA bloquea el 99% de los hackeos aunque te roben la contraseña'},
    ],
    midpoint:'¡Llevas la mitad! Ya sabes cómo crear contraseñas fuertes. Ahora viene la parte sobre gestores y 2FA — la combinación perfecta.',
    endpoint:'¡Sección completada! Ahora tus contraseñas son prácticamente invulnerables. El siguiente paso: aprender a detectar cuando alguien intenta engañarte.',
  },
  phishing:{
    color:'#1cb0f6',colorD:'#0a90d4',icon:'🎣',
    what:'El phishing es la técnica de hacking más común del mundo — el 90% de los ciberataques empiezan así. Aprenderás a identificar correos, mensajes y sitios falsos antes de que sea tarde.',
    concepts:[
      {icon:'📧',text:'Cómo los atacantes falsifican remitentes y copian diseños de bancos y empresas'},
      {icon:'🔗',text:'Cómo leer dominios correctamente para detectar URLs falsas al instante'},
      {icon:'🎭',text:'Qué es el spear phishing: ataques personalizados con tu información real'},
      {icon:'📱',text:'Smishing (SMS falsos) y Vishing (llamadas falsas) — los vectores menos conocidos'},
    ],
    midpoint:'¡Mitad del camino! Ya puedes detectar phishing básico. Ahora aprenderás las técnicas avanzadas que engañan incluso a expertos.',
    endpoint:'¡Completado! Ahora tu cerebro es un detector de phishing. Siguiente sección: cómo los virus y malware infectan dispositivos.',
  },
  malware:{
    color:'#ff9500',colorD:'#cc7700',icon:'🦠',
    what:'El malware (software malicioso) viene en muchas formas: virus, ransomware, spyware, troyanos... Aprenderás cómo se instala sin que lo notes y cómo defenderte en capas.',
    concepts:[
      {icon:'💾',text:'Por qué los programas crackeados son el vector #1 de infección por troyanos'},
      {icon:'💰',text:'Cómo funciona el ransomware: cifra tus archivos y pide rescate en criptomonedas'},
      {icon:'📎',text:'Cómo archivos PDF, Word e imágenes pueden contener código malicioso'},
      {icon:'🛡️',text:'La estrategia de defensa en capas: antivirus + actualizaciones + backups'},
    ],
    midpoint:'¡Mitad! Ya conoces los tipos de malware. Ahora verás cómo proteger tu teléfono y cómo actuar si te infectas.',
    endpoint:'¡Sección completada! Ahora sabes cómo funciona el malware y cómo eliminarlo. Siguiente: seguridad en redes WiFi.',
  },
  networks:{
    color:'#9c27ff',colorD:'#7a00e6',icon:'📡',
    what:'Las redes son el medio por donde viajan todos tus datos. Una red insegura es como hablar en voz alta en público — cualquiera puede escucharte. Aprenderás a navegar de forma segura en cualquier red.',
    concepts:[
      {icon:'☕',text:'Por qué las redes WiFi públicas son peligrosas y qué puedes hacer en ellas'},
      {icon:'🔒',text:'Qué es HTTPS y cómo el cifrado TLS protege tus datos en tránsito'},
      {icon:'🕵️',text:'Cómo funciona un ataque Man in the Middle: el atacante entre tú y el servidor'},
      {icon:'📡',text:'Por qué cambiar la contraseña de tu router es una de las medidas más importantes'},
    ],
    midpoint:'¡Mitad! Ya entiendes los riesgos de WiFi público. Ahora verás VPNs, DNS y Bluetooth — atacantes invisibles.',
    endpoint:'¡Completado! Tus redes ahora son mucho más seguras. Última sección: cómo proteger tus cuentas con 2FA.',
  },
  accounts:{
    color:'#00cba1',colorD:'#00a080',icon:'🔐',
    what:'Tus cuentas digitales contienen tu identidad, dinero y datos personales. Aprenderás a protegerlas con autenticación fuerte, a detectar si fueron comprometidas y qué hacer si te hackean.',
    concepts:[
      {icon:'📲',text:'Diferencia entre 2FA por SMS (vulnerable) y apps de autenticación (seguro)'},
      {icon:'🔍',text:'Cómo verificar si tu email apareció en una brecha de datos con HaveIBeenPwned'},
      {icon:'👁️',text:'Qué información personal en redes sociales ayuda a los hackers a atacarte'},
      {icon:'🚨',text:'Los pasos exactos que debes seguir si te hackean una cuenta'},
    ],
    midpoint:'¡Mitad! Ya dominas el 2FA. Ahora aprenderás sobre privacidad digital y gestión de tu huella en internet.',
    endpoint:'¡Felicidades! Completaste safeXP. Tus cuentas, redes y dispositivos ahora están protegidos. Comparte tu logro!',
  },
  ai_security:{
    color:'#7c3aed',colorD:'#5b21b6',icon:'🤖',
    what:'La Inteligencia Artificial está cambiando el mundo — pero también está armando a los ciberdelincuentes con herramientas sin precedentes. Deepfakes de voz y video, phishing perfecto generado automáticamente, perfiles falsos en redes y manipulación masiva son amenazas reales hoy. Esta sección te enseña a reconocerlas y defenderte.',
    concepts:[
      {icon:'🎭',text:'Qué son los deepfakes y cómo detectar videos, fotos y voces generadas por IA'},
      {icon:'🎣',text:'Por qué el phishing generado por IA es más peligroso que el phishing tradicional'},
      {icon:'🤖',text:'Cómo los chatbots maliciosos y los perfiles falsos te manipulan en redes sociales'},
      {icon:'🔍',text:'Herramientas reales para verificar contenido: Deepware, Hive, Google Reverse Image'},
      {icon:'🛡️',text:'Cómo la autenticación fuerte (llaves físicas, 2FA con app) resiste ataques de IA'},
      {icon:'🧠',text:'El protocolo SIFT para no difundir desinformación generada por IA'},
    ],
    midpoint:'¡Mitad del camino! Ya entiendes los deepfakes y el phishing con IA. Ahora viene la parte de privacidad, redes sociales y las herramientas concretas para protegerte.',
    endpoint:'¡Completaste IA y Seguridad! Eres uno de los pocos que entiende cómo la IA puede usarse en tu contra — y cómo defenderte. Comparte este conocimiento con tu familia y amigos.',
  },
};

let _lessonInfoCallback = null;

// Muestra el overlay de introducción o cierre de lección con el título y callback de continuación
function showLessonInfo(type, unitId, actTitle, onContinue){
  const intro = UNIT_INTROS[unitId];
  if(!intro) { onContinue(); return; }
  const modal = document.getElementById('li-modal-inner');
  const overlay = document.getElementById('lesson-info-overlay');
  _lessonInfoCallback = onContinue;
  
  let html = '';
  if(type==='intro'){
    html = `
      <div class="li-header" style="background:linear-gradient(135deg,${intro.color},${intro.colorD});position:relative">
        <button onclick="dismissLessonInfo();goHome()" aria-label="Cancelar y volver" style="position:absolute;top:.7rem;right:.7rem;background:rgba(255,255,255,.25);border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;color:#fff;font-size:1rem;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1;z-index:2">✕</button>
        <div class="li-header-icon">${intro.icon}</div>
        <div class="li-header-text">
          <h2>${actTitle}</h2>
          <p>Actividad de ${intro.icon} ${UNITS.find(u=>u.id===unitId)?.label||''}</p>
        </div>
      </div>
      <div class="li-body">
        <!-- BLOQUE TEORÍA -->
        <div class="li-section">
          <div class="li-section-title">📖 Contexto y por qué importa</div>
          <div class="li-card" style="border-left-color:${intro.color};line-height:1.65;font-size:.84rem">${intro.what}</div>
        </div>
        <!-- CONCEPTOS CLAVE -->
        <div class="li-section">
          <div class="li-section-title">🔑 Conceptos clave que dominarás</div>
          <div class="li-what-list">
            ${intro.concepts.map((c,i)=>`<div class="li-what-item" style="padding:.5rem .6rem;border-radius:10px;background:${intro.color}12;border:1.5px solid ${intro.color}30;margin-bottom:.2rem">
              <span class="li-what-icon" style="font-size:1.3rem">${c.icon}</span>
              <div>
                <div style="font-size:.82rem;font-weight:800;color:var(--text)">${c.text}</div>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <!-- ESTRUCTURA -->
        <div class="li-section">
          <div class="li-section-title">🎯 Cómo funciona esta actividad</div>
          <div style="display:flex;flex-direction:column;gap:.4rem">
            <div style="display:flex;align-items:center;gap:.6rem;padding:.45rem .7rem;border-radius:9px;background:${intro.color}10;font-size:.8rem;font-weight:700">
              <span style="font-size:1.1rem">📚</span><span style="flex:1">Lees un concepto clave antes de cada pregunta</span><span style="font-size:.7rem;color:var(--muted);white-space:nowrap">Teoría</span>
            </div>
            <div style="display:flex;align-items:center;gap:.6rem;padding:.45rem .7rem;border-radius:9px;background:${intro.color}10;font-size:.8rem;font-weight:700">
              <span style="font-size:1.1rem">❓</span><span style="flex:1">Respondes preguntas variadas (opción múltiple, V/F, relacionar, ordenar)</span><span style="font-size:.7rem;color:var(--muted);white-space:nowrap">Práctica</span>
            </div>
            <div style="display:flex;align-items:center;gap:.6rem;padding:.45rem .7rem;border-radius:9px;background:${intro.color}10;font-size:.8rem;font-weight:700">
              <span style="font-size:1.1rem">💡</span><span style="flex:1">Cada respuesta incluye una explicación que refuerza el aprendizaje</span><span style="font-size:.7rem;color:var(--muted);white-space:nowrap">Feedback</span>
            </div>
            <div style="display:flex;align-items:center;gap:.6rem;padding:.45rem .7rem;border-radius:9px;background:var(--rsf);font-size:.8rem;font-weight:700">
              <span style="font-size:1.1rem">❤️</span><span style="flex:1">Si fallas pierdes 1 vida — ¡las puedes recuperar jugando!</span><span style="font-size:.7rem;color:var(--muted);white-space:nowrap">Vidas</span>
            </div>
          </div>
        </div>
        <button class="li-start-btn" style="background:${intro.color};box-shadow:0 4px 0 ${intro.colorD}" onclick="dismissLessonInfo()">¡Empecemos a aprender! ${intro.icon} →</button>
      </div>`;
  } else if(type==='halfway'){
    const halfTips={
      passwords:'Las contraseñas más largas son exponencialmente más seguras: pasar de 8 a 12 caracteres multiplica el tiempo de hackeo por millones.',
      phishing:'El 95% de las víctimas de phishing tienen algo en común: actuaron por urgencia o miedo. Siempre pausa antes de hacer clic.',
      malware:'El malware moderno puede estar dormido por meses antes de activarse, esperando el momento de mayor impacto.',
      networks:'En WiFi público, herramientas como Wireshark permiten ver tu tráfico en tiempo real — literalmente en segundos.',
      accounts:'El 81% de los hackeos de datos aprovechan contraseñas débiles o reutilizadas. El 2FA bloquea el 99.9% de ataques automatizados.'
    };
    html = `
      <div class="li-header" style="background:linear-gradient(135deg,${intro.color},${intro.colorD})">
        <div class="li-header-icon">⚡</div>
        <div class="li-header-text"><h2>¡Mitad del camino!</h2><p>Ya completaste 3 preguntas — ¡excelente ritmo!</p></div>
      </div>
      <div class="li-body">
        <div class="li-section">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
            <span style="font-size:1.4rem">🧠</span>
            <div class="li-section-title" style="margin:0">Dato que te puede salvar</div>
          </div>
          <div class="li-card" style="border-left-color:${intro.color};font-size:.85rem;line-height:1.6;font-style:italic">"${halfTips[unitId]||intro.midpoint}"</div>
        </div>
        <div class="li-section">
          <div class="li-section-title">💡 Recordatorio de lo aprendido</div>
          <div class="li-card" style="border-left-color:${intro.color}">${intro.midpoint}</div>
        </div>
        <div class="li-section">
          <div class="li-section-title">📊 Tu progreso en esta actividad</div>
          <div style="background:var(--border);border-radius:99px;height:14px;overflow:hidden;margin-top:.3rem;position:relative">
            <div style="height:100%;background:linear-gradient(90deg,${intro.color},${intro.colorD});width:50%;border-radius:99px;transition:width .6s ease"></div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.3)">3 / 6 preguntas</div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--muted);margin-top:.3rem;font-weight:700">
            <span>Inicio</span><span>¡Ya vas a la mitad!</span><span>Meta</span>
          </div>
        </div>
        <button class="li-start-btn" style="background:${intro.color};box-shadow:0 4px 0 ${intro.colorD}" onclick="dismissLessonInfo()">¡Seguir aprendiendo! 💪</button>
      </div>`;
  } else if(type==='end'){
    html = `
      <div class="li-header" style="background:linear-gradient(135deg,${intro.color},${intro.colorD})">
        <div class="li-header-icon">🏆</div>
        <div class="li-header-text"><h2>¡Actividad completada!</h2><p>${actTitle}</p></div>
      </div>
      <div class="li-body">
        <div class="li-section" style="text-align:center;padding:.5rem 0">
          <div style="font-size:2.8rem;margin-bottom:.4rem;animation:popIn .4s cubic-bezier(.34,1.56,.64,1)">🎉</div>
          <div style="font-size:.88rem;color:var(--muted);font-weight:700">${intro.endpoint}</div>
        </div>
        <div class="li-section">
          <div class="li-section-title">✅ Lo que acabas de aprender</div>
          <div style="display:flex;flex-direction:column;gap:.35rem">
            ${intro.concepts.map(c=>`<div style="display:flex;align-items:flex-start;gap:.6rem;padding:.45rem .7rem;border-radius:9px;background:${intro.color}12;border-left:3px solid ${intro.color}">
              <span style="font-size:1rem">${c.icon}</span>
              <span style="font-size:.79rem;font-weight:700;color:var(--text);line-height:1.4">${c.text}</span>
            </div>`).join('')}
          </div>
        </div>
        <div class="li-section">
          <div class="li-section-title">🚀 Tu siguiente paso</div>
          <div class="li-card" style="border-left-color:${intro.color};font-size:.82rem">Continúa con la siguiente actividad para profundizar más. Cada lección te acerca al nivel de <strong>Experto en Ciberseguridad</strong>. ¡Lo estás logrando!</div>
        </div>
        <button class="li-start-btn" style="background:${intro.color};box-shadow:0 4px 0 ${intro.colorD}" onclick="dismissLessonInfo()">Ver mis resultados 🎉</button>
      </div>`;
  }
  modal.innerHTML = html;
  overlay.classList.add('show');
}

function dismissLessonInfo(){
  document.getElementById('lesson-info-overlay').classList.remove('show');
  if(_lessonInfoCallback){ _lessonInfoCallback(); _lessonInfoCallback=null; }
}

/* ════════════════════════════
   INLINE PONG MINI-GAME
════════════════════════════ */
/* ════════════════════════════════════════════════
   MINIJUEGO 1 — FIREWALL DEFENDER 🛡️
   Bloquea paquetes maliciosos con tu firewall
════════════════════════════════════════════════ */
let fwAnim=null,fwRunning=false,fwScore=0,fwLives=3,fwQ=null;

// Construye el minijuego tipo Pong en un canvas de HTML5 como pregunta especial de lección
function buildPong(card,q){
  fwQ=q;
  const wrap=document.createElement('div');wrap.className='q-card';
  const badge=document.createElement('div');badge.className='q-badge qb-choice';badge.textContent='🛡️ Minijuego: Firewall Defender';
  const char=document.createElement('span');char.className='q-char';char.textContent=q.char||'🛡️';
  const title=document.createElement('div');title.className='q-title';title.textContent=q.q;
  card.appendChild(badge);card.appendChild(char);card.appendChild(title);
  const gameDiv=document.createElement('div');gameDiv.className='inline-game-wrap';
  gameDiv.style.cssText='position:relative;height:200px;background:linear-gradient(180deg,#0d1b2a,#1a3a5c);border-radius:14px;margin-top:.6rem;overflow:hidden;border:2px solid #1cb0f6';
  gameDiv.innerHTML=`<canvas id="fw-c" width="340" height="200" style="width:100%;height:100%;display:block"></canvas>
    <div id="fw-msg" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;background:rgba(0,0,0,.7)">
      <span style="font-size:2rem">🛡️</span>
      <span style="color:#fff;font-size:.9rem;font-weight:800">Firewall Defender</span>
      <span style="color:#1cb0f6;font-size:.75rem;text-align:center;max-width:240px">Mueve el firewall para bloquear los paquetes maliciosos 🦠.<br>Deja pasar los paquetes seguros ✅</span>
      <button id="fw-start-btn" style="margin-top:.4rem;padding:.5rem 1.2rem;border-radius:10px;border:none;background:var(--blue);color:#fff;font-weight:900;cursor:pointer;font-size:.85rem">¡Defender la red!</button>
    </div>`;
  gameDiv.querySelector('#fw-start-btn').onclick=(e)=>startFirewall(e,q);
  card.appendChild(gameDiv);
  // Answer choices below — use choiceClick (same as buildChoice)
  const choiceWrap=document.createElement('div');choiceWrap.id='fw-choices';choiceWrap.style.display='none';
  choiceWrap.style.marginTop='.6rem';
  choiceWrap.style.display='none';
  choiceWrap.style.flexDirection='column';
  choiceWrap.style.gap='.4rem';
  if(q.choices){q.choices.forEach((ch,i)=>{
    const btn=document.createElement('button');btn.className='ch-btn';
    btn.dataset.ok=ch.ok?'true':'false';btn.dataset.idx=String(i);
    btn.setAttribute('onclick','choiceClick(this)');
    btn.innerHTML=`<span class="ch-emoji">${ch.e||'▶'}</span>${ch.t}`;
    choiceWrap.appendChild(btn);
  })}
  card.appendChild(choiceWrap);
}

function startFirewall(e,q){
  const overlay=document.getElementById('fw-msg');if(overlay)overlay.style.display='none';
  const canvas=document.getElementById('fw-c');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  let fw={x:W/2-30,w:60,h:12,y:H-20,speed:6};
  let packets=[],fwSc=0,fwLv=3,fwFrame=0;
  const PACKET_TYPES=[
    {emoji:'🦠',safe:false,color:'#ff4b4b',label:'Malware'},
    {emoji:'🎣',safe:false,color:'#ff9600',label:'Phishing'},
    {emoji:'💣',safe:false,color:'#ce82ff',label:'DDoS'},
    {emoji:'✅',safe:true, color:'#58cc02',label:'Seguro'},
    {emoji:'🔒',safe:true, color:'#1cb0f6',label:'HTTPS'},
  ];
  let keys={};
  const onKey=e=>keys[e.key]=e.type==='keydown';
  document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKey);

  // Touch/mouse control
  canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();
    const scale=canvas.width/r.width;
    fw.x=(e.clientX-r.left)*scale-fw.w/2;
  });
  canvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    const r=canvas.getBoundingClientRect();
    const scale=canvas.width/r.width;
    fw.x=(e.touches[0].clientX-r.left)*scale-fw.w/2;
  },{passive:false});

  function spawnPacket(){
    const t=PACKET_TYPES[Math.floor(Math.random()*PACKET_TYPES.length)];
    packets.push({x:Math.random()*(W-30)+10,y:-20,vy:1.5+fwSc*.04,type:t,size:24});
  }

  function drawFW(){
    ctx.clearRect(0,0,W,H);
    // Background grid
    ctx.strokeStyle='rgba(28,176,246,.08)';ctx.lineWidth=1;
    for(let i=0;i<W;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke()}
    for(let i=0;i<H;i+=20){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke()}

    // Score & lives
    ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.fillText('🛡️ '+fwSc,8,18);
    ctx.fillText('❤️'.repeat(fwLv),W-70,18);

    // Packets
    packets.forEach(p=>{
      ctx.font=p.size+'px Arial';
      ctx.fillText(p.type.emoji,p.x-p.size/2,p.y+p.size/2);
    });

    // Firewall paddle
    const grad=ctx.createLinearGradient(fw.x,fw.y,fw.x+fw.w,fw.y+fw.h);
    grad.addColorStop(0,'#1cb0f6');grad.addColorStop(1,'#58cc02');
    ctx.fillStyle=grad;
    ctx.beginPath();ctx.roundRect(fw.x,fw.y,fw.w,fw.h,6);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 10px Arial';ctx.textAlign='center';
    ctx.fillText('FIREWALL',fw.x+fw.w/2,fw.y+9);ctx.textAlign='left';
  }

  function gameLoop(){
    fwFrame++;
    if(keys['ArrowLeft']||keys['a']) fw.x=Math.max(0,fw.x-fw.speed);
    if(keys['ArrowRight']||keys['d']) fw.x=Math.min(W-fw.w,fw.x+fw.speed);
    if(fwFrame%50===0) spawnPacket();

    packets.forEach(p=>p.y+=p.vy);

    // Collision check
    packets=packets.filter(p=>{
      const hit=p.x>fw.x-10&&p.x<fw.x+fw.w+10&&p.y>fw.y-p.size&&p.y<fw.y+fw.h;
      if(hit){
        if(!p.type.safe){fwSc+=10;return false;} // blocked malware = good
        else{fwLv--;if(fwLv<=0){endFirewall(fwSc,q);return false;}return false;} // blocked safe = bad
      }
      if(p.y>H){
        if(p.type.safe){fwSc+=5;return false;} // safe passed = good
        else{fwLv--;if(fwLv<=0){endFirewall(fwSc,q);return false;}} // malware passed = bad
        return false;
      }
      return true;
    });

    drawFW();
    if(fwLv>0&&fwSc<80) fwAnim=requestAnimationFrame(gameLoop);
    else endFirewall(fwSc,q);
  }
  fwRunning=true;fwAnim=requestAnimationFrame(gameLoop);
}

function endFirewall(score,q){
  cancelAnimationFrame(fwAnim);fwRunning=false;
  const overlay=document.getElementById('fw-msg');
  if(overlay){
    const won=score>=30;
    overlay.style.display='flex';
    overlay.innerHTML=`<span style="font-size:2rem">${won?'🏆':'💪'}</span>
      <span style="color:${won?'#58cc02':'#ffc800'};font-size:.95rem;font-weight:900">${won?'¡Red defendida!':'¡Sigue practicando!'}</span>
      <span style="color:var(--social-text);font-size:.78rem">${score} paquetes maliciosos bloqueados</span>
      <span style="color:#1cb0f6;font-size:.75rem;text-align:center;max-width:240px">Un firewall real filtra tráfico según reglas. Ahora responde la pregunta:</span>`;
  }
  const ch=document.getElementById('fw-choices');if(ch)ch.style.display='flex';
  if(ch)ch.style.flexDirection='column';if(ch)ch.style.gap='.4rem';
}


/* ════════════════════════════════════════════════
   MINIJUEGO 2 — PASSWORD BUILDER 🔑
   Construye una contraseña segura clasificando caracteres
════════════════════════════════════════════════ */
let pbInterval=null,pbRunning=false,pbScore=0;

// Construye el constructor de contraseñas seguras (llamado 'Tetris' internamente) como pregunta de lección
function buildTetris(card,q){
  if(q.theory){const th=document.createElement('div');th.className='q-theory';th.innerHTML=q.theory;card.appendChild(th)}
  const badge=document.createElement('div');badge.className='q-badge qb-sort';badge.textContent='🔑 Minijuego: Construye tu Contraseña';
  const char=document.createElement('span');char.className='q-char';char.textContent=q.char||'🔑';
  const title=document.createElement('div');title.className='q-title';title.textContent=q.q;
  card.appendChild(badge);card.appendChild(char);card.appendChild(title);

  const gameDiv=document.createElement('div');
  gameDiv.style.cssText='margin-top:.6rem;border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#1a1a2e,#0f3460);padding:1rem;border:2px solid #ce82ff;display:flex;flex-direction:column;align-items:center;gap:.6rem';
  gameDiv.id='pb-wrap';

  const CHARS=[
    {c:'A',type:'upper',color:'#58cc02'},{c:'z',type:'lower',color:'#1cb0f6'},
    {c:'7',type:'number',color:'#ffc800'},{c:'!',type:'symbol',color:'#ff4b4b'},
    {c:'P',type:'upper',color:'#58cc02'},{c:'a',type:'lower',color:'#1cb0f6'},
    {c:'3',type:'number',color:'#ffc800'},{c:'@',type:'symbol',color:'#ff4b4b'},
    {c:'K',type:'upper',color:'#58cc02'},{c:'m',type:'lower',color:'#1cb0f6'},
    {c:'9',type:'number',color:'#ffc800'},{c:'#',type:'symbol',color:'#ff4b4b'},
  ];

  let password=[],target={upper:2,lower:3,number:2,symbol:1}; // need this mix
  let current=[...CHARS].sort(()=>Math.random()-.5);

  function strength(){
    const has={upper:0,lower:0,number:0,symbol:0};
    password.forEach(p=>has[p.type]++);
    const met=Object.keys(target).filter(k=>has[k]>=target[k]).length;
    const len=password.length;
    if(met===4&&len>=8)return{label:'💪 ¡Muy fuerte!',color:'#58cc02',pct:100};
    if(met>=3&&len>=6)return{label:'👍 Fuerte',color:'#1cb0f6',pct:70};
    if(met>=2&&len>=4)return{label:'⚠️ Moderada',color:'#ffc800',pct:40};
    return{label:'❌ Débil',color:'#ff4b4b',pct:15};
  }

  function render(){
    gameDiv.innerHTML='';
    const header=document.createElement('div');
    header.style.cssText='width:100%;display:flex;justify-content:space-between;align-items:center';
    header.innerHTML=`<span style="color:var(--social-text);font-size:.75rem;font-weight:800">🔑 Construye una contraseña segura</span>
      <span style="color:#ce82ff;font-size:.72rem">Añade: 2 MAY + 3 min + 2 núm + 1 símbolo</span>`;
    gameDiv.appendChild(header);

    // Password display
    const pwDisplay=document.createElement('div');
    pwDisplay.style.cssText='background:#0a0a1a;border-radius:10px;padding:.5rem 1rem;min-height:36px;width:100%;display:flex;gap:4px;flex-wrap:wrap;align-items:center;border:2px solid #3a3a5a;min-width:0;box-sizing:border-box';
    if(password.length===0){
      pwDisplay.innerHTML='<span style="color:#6a6a8a;font-size:.78rem">Toca los caracteres para añadirlos...</span>';
    } else {
      password.forEach((p,i)=>{
        const ch=document.createElement('span');
        ch.style.cssText=`color:${p.color};font-family:monospace;font-size:1.1rem;font-weight:900;cursor:pointer;padding:1px 3px;border-radius:4px;background:rgba(255,255,255,.05)`;
        ch.textContent=p.c;ch.title='Clic para quitar';
        ch.onclick=()=>{password.splice(i,1);render()};
        pwDisplay.appendChild(ch);
      });
    }
    gameDiv.appendChild(pwDisplay);

    // Strength meter
    const str=strength();
    const meterWrap=document.createElement('div');meterWrap.style.cssText='width:100%';
    meterWrap.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span style="color:${str.color};font-size:.72rem;font-weight:900">${str.label}</span>
      <span style="color:#6a6a8a;font-size:.7rem">${password.length} caracteres</span>
    </div>
    <div style="background:#2a2a3e;border-radius:99px;height:6px;overflow:hidden">
      <div style="background:${str.color};width:${str.pct}%;height:100%;border-radius:99px;transition:width .3s"></div>
    </div>`;
    gameDiv.appendChild(meterWrap);

    // Category legend
    const legend=document.createElement('div');
    legend.style.cssText='display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center';
    [{label:'MAY',color:'#58cc02'},{label:'min',color:'#1cb0f6'},{label:'123',color:'#ffc800'},{label:'!@#',color:'#ff4b4b'}]
      .forEach(({label,color})=>{
        const l=document.createElement('span');
        l.style.cssText=`color:${color};font-size:.65rem;font-weight:900;background:var(--grad-social-card);padding:2px 8px;border-radius:6px;border:1px solid ${color}40`;
        l.textContent=label;legend.appendChild(l);
      });
    gameDiv.appendChild(legend);

    // Available chars
    const charsWrap=document.createElement('div');
    charsWrap.style.cssText='display:flex;gap:5px;flex-wrap:wrap;justify-content:center;width:100%';
    current.forEach((item,i)=>{
      const btn=document.createElement('button');
      btn.style.cssText=`width:34px;height:34px;border-radius:8px;border:2px solid ${item.color}60;background:rgba(255,255,255,.05);color:${item.color};font-family:monospace;font-size:1.1rem;font-weight:900;cursor:pointer;transition:.12s`;
      btn.textContent=item.c;
      btn.onclick=()=>{
        password.push(item);current.splice(i,1);
        if(current.length===0)current=[...CHARS].sort(()=>Math.random()-.5);
        render();
        // Check win condition
        const s=strength();
        if(s.pct===100){
          setTimeout(()=>endPasswordBuilder(q),500);
        }
      };
      charsWrap.appendChild(btn);
    });
    gameDiv.appendChild(charsWrap);

    // Skip button
    const skipBtn=document.createElement('button');
    skipBtn.style.cssText='padding:.35rem .9rem;border-radius:8px;border:none;background:rgba(255,255,255,.1);color:#afafaf;font-size:.75rem;font-weight:700;cursor:pointer';
    skipBtn.textContent='Saltar minijuego →';
    skipBtn.onclick=()=>endPasswordBuilder(q);
    gameDiv.appendChild(skipBtn);
  }

  render();
  card.appendChild(gameDiv);
}

function endPasswordBuilder(q){
  const wrap=document.getElementById('pb-wrap');
  if(wrap){
    wrap.innerHTML=`<div style="text-align:center;padding:.5rem 0">
      <div style="font-size:2rem;margin-bottom:.3rem">🏆</div>
      <div style="color:#58cc02;font-size:.95rem;font-weight:900;margin-bottom:.3rem">¡Contraseña construida!</div>
      <div style="color:#afafaf;font-size:.78rem">Una buena contraseña combina mayúsculas, minúsculas, números y símbolos.</div>
    </div>`;
  }
  // Show sort question
  const qCard=document.querySelector('.q-card');if(!qCard)return;
  const existing=qCard.querySelector('.sort-list');if(existing)return;
  buildSort(qCard,q);
}

// tetrisDrop stubs — tetPiece/collides/tetrisStep are from a planned Tetris extension
// that was replaced by the Password Builder (buildTetris). These stubs prevent ReferenceErrors.
let tetPiece=null;
function collides(piece){ return false; } // stub
function tetrisStep(){ }                  // stub
function tetrisDrop(){if(!tetPiece)return;while(!collides(tetPiece))tetPiece.y++;tetPiece.y--;tetrisStep()}


/* ════════════════════════════════════════════════
   ACCESIBILIDAD — safeXP  v4  (foco + narrador)
════════════════════════════════════════════════ */

/* ── 1. ESTADO ── */
const A11Y_KEY = 'safexp_a11y_v1';
let a11yState = {
  theme:'light', font:'normal',
  narrator:false, readExplain:false,
  keyNav:false, reduceMotion:false
};
try{ const s=localStorage.getItem(A11Y_KEY); if(s) a11yState={...a11yState,...JSON.parse(s)}; }catch(e){}
// Persiste el estado de accesibilidad en localStorage
function saveA11y(){ try{ localStorage.setItem(A11Y_KEY,JSON.stringify(a11yState)); }catch(e){} }

/* ── 2. MOTOR TTS ── */
const _S = window.speechSynthesis || null;
let _voice      = null;
let _narOn      = false;   // estado en tiempo real
let _readExp    = false;
let _speaking   = false;
let _q          = [];      // cola de texto

/* Carga la mejor voz española disponible */
function _loadVoice(){
  if(!_S) return;
  const all = _S.getVoices();
  _voice =
    all.find(v=>v.lang==='es-ES') ||
    all.find(v=>v.lang==='es-MX') ||
    all.find(v=>v.lang==='es-US') ||
    all.find(v=>v.lang.startsWith('es')) ||
    all[0] || null;
}
if(_S){ _S.onvoiceschanged = _loadVoice; _loadVoice(); }

/* Habla un fragmento de texto — respeta la cola */
function _pump(){
  if(_speaking || _q.length===0 || !_S) return;
  _speaking = true;
  const txt = _q.shift();
  const u   = new SpeechSynthesisUtterance(txt);
  u.lang    = 'es-ES';
  u.rate    = 0.88;
  u.pitch   = 1.0;
  u.volume  = 1;
  if(_voice) u.voice = _voice;
  u.onend   = u.onerror = () => { _speaking=false; _pump(); };
  _S.speak(u);
}

/* speak(texto, urgente?)  — LA FUNCIÓN PRINCIPAL */
// Usa la Web Speech API para narrar texto en voz alta (accesibilidad auditiva)
function speak(txt, urgent=false){
  if(!txt) return;
  /* Región live ARIA — funciona con NVDA/JAWS/VoiceOver del SO */
  const live = document.getElementById('a11y-live');
  if(live){
    live.textContent='';
    requestAnimationFrame(()=>{ live.textContent = txt; });
  }
  /* Web Speech API — sólo si el narrador está activado */
  if(!_narOn || !_S) return;
  if(urgent){ _S.cancel(); _q=[]; _speaking=false; }
  /* Dividir en frases cortas para evitar corte del navegador */
  const frases = txt.match(/[^.!?¡¿\n]{1,120}[.!?\n]?/g) || [txt];
  frases.forEach(f=>{ if(f.trim()) _q.push(f.trim()); });
  _pump();
}

function stopSpeak(){ if(_S){ _S.cancel(); } _q=[]; _speaking=false; }

/* ── 3. LECTOR DE FOCO — el corazón del TalkBack ── */
/*
   Escucha el evento "focusin" en TODO el documento.
   Cada vez que el usuario hace Tab (o toca en móvil con accesibilidad)
   sobre cualquier elemento interactivo, calculamos qué decir y lo leemos.
*/
document.addEventListener('focusin', e => {
  if(!_narOn) return;
  const el  = e.target;
  const tag = el.tagName.toLowerCase();
  let txt   = '';

  /* ── Prioridad 1: aria-label explícito ── */
  if(el.getAttribute('aria-label')){
    txt = el.getAttribute('aria-label');
  }
  /* ── Prioridad 2: botones de respuesta (ch-btn) ── */
  else if(el.classList.contains('ch-btn')){
    const idx   = [...document.querySelectorAll('.ch-btn')].indexOf(el)+1;
    const texto = el.querySelector('span:last-child')?.textContent||el.textContent;
    txt = `Opción ${idx}: ${texto.trim()}. Presiona Enter o Space para seleccionar`;
  }
  /* ── Prioridad 3: botones verdadero/falso ── */
  else if(el.classList.contains('tf-btn')){
    const esV = el.classList.contains('t-side');
    txt = esV ? 'Botón: Verdadero. Presiona Enter para responder verdadero'
               : 'Botón: Falso. Presiona Enter para responder falso';
  }
  /* ── Prioridad 4: fichas de pares ── */
  else if(el.classList.contains('pair-chip')){
    const lado = el.dataset.side==='L' ? 'Columna izquierda, concepto' : 'Columna derecha, descripción';
    txt = `${lado}: ${el.textContent.trim()}. Presiona Enter para seleccionar`;
  }
  /* ── Prioridad 5: elementos de ordenar ── */
  else if(el.classList.contains('sort-item')){
    const pos = [...document.querySelectorAll('.sort-item')].indexOf(el)+1;
    txt = `Elemento ${pos} de ${document.querySelectorAll('.sort-item').length}: ${el.querySelector('span:last-child')?.textContent||''}. Puedes arrastrarlo con el mouse`;
  }
  /* ── Prioridad 6: botón continuar ── */
  else if(el.id==='fb-btn'){
    const esCorrecto = document.getElementById('fb-bar')?.classList.contains('ok');
    txt = (esCorrecto ? '¡Correcto! ' : 'Incorrecto. ') + 'Botón: Continuar. Presiona Enter para la siguiente pregunta';
  }
  /* ── Prioridad 7: botón cerrar lección ── */
  else if(el.classList.contains('les-close')){
    txt = 'Botón: Salir de la lección. Presiona Enter para salir';
  }
  /* ── Prioridad 8: botones del panel ── */
  else if(el.closest('#a11y-panel')){
    if(tag==='button') txt = el.textContent.trim() ? `Botón: ${el.textContent.trim()}` : '';
    else if(tag==='input'&&el.type==='checkbox'){
      const label = el.closest('.a11y-toggle-row')?.querySelector('.a11y-toggle-label')?.textContent||'';
      txt = `${label}: ${el.checked?'activado':'desactivado'}. Presiona Space para cambiar`;
    }
  }
  /* ── Prioridad 9: botones generales ── */
  else if(tag==='button'){
    txt = el.textContent.trim() ? `Botón: ${el.textContent.trim()}` : '';
  }
  /* ── Prioridad 10: inputs de texto ── */
  else if(tag==='input' && el.type!=='checkbox'){
    const ph = el.placeholder || el.getAttribute('aria-label') || 'Campo de texto';
    txt = `Campo de entrada: ${ph}`;
  }

  if(txt) speak(txt, true);
});

/* ── 4. NARRAR PREGUNTA COMPLETA ── */
/*  Llamado automáticamente cada vez que se muestra una nueva pregunta.
    Lee: tipo → dato clave → la pregunta → cada opción → instrucción  */
function narrateQuestion(q){
  if(!_narOn || !q) return;
  stopSpeak();
  const tipos = {
    choice  : 'Pregunta de opción múltiple',
    tf      : 'Pregunta de Verdadero o Falso',
    pair    : 'Ejercicio: Relaciona los pares',
    sort    : 'Ejercicio: Ordena los pasos',
    scenario: 'Ejercicio: Analiza este mensaje'
  };
  let partes = [ tipos[q.type] || 'Pregunta' ];
  if(q.theory) partes.push( 'Concepto clave: ' + q.theory.replace(/<[^>]+>/g,'') );
  partes.push( q.q );
  if(q.choices && q.choices.length){
    q.choices.forEach((ch,i)=>{ partes.push(`Opción ${i+1}: ${ch.t}`); });
    partes.push('Usa Tab para moverte entre opciones y Enter para seleccionar. También puedes presionar el número de la opción.');
  } else if(q.type==='tf'){
    partes.push('Presiona V para Verdadero o F para Falso. O usa Tab para llegar a cada botón y Enter para responder.');
  } else if(q.type==='pair'){
    partes.push('Toca primero un elemento de la columna izquierda y luego el que corresponde en la derecha.');
  } else if(q.type==='sort'){
    partes.push('Arrastra los elementos para ordenarlos. Cuando termines, presiona el botón Verificar orden.');
  }
  _q = partes.filter(p=>p.trim());
  _pump();
}

/* ── 5. NARRAR RESULTADO ── */
function narrateResult(ok, explain){
  if(!_narOn) return;
  stopSpeak();
  let partes = [ ok ? '¡Correcto! Muy bien.' : 'Incorrecto.' ];
  if(_readExp && explain) partes.push( explain.replace(/<[^>]+>/g,'') );
  partes.push('Presiona Enter o el botón Continuar para la siguiente pregunta.');
  _q = partes.filter(p=>p.trim());
  _pump();
}

/* announce() — para mensajes de sistema (cambios de tema, etc.) */
function announce(txt){ speak(txt, true); }

/* ── 6. APLICAR CONFIGURACIÓN VISUAL ── */
// Aplica todas las configuraciones de accesibilidad activas al DOM (tema, fuente, movimiento, voz)
function applyA11y(){
  const html = document.documentElement;
  html.setAttribute('data-theme', a11yState.theme);
  html.setAttribute('data-font',  a11yState.font);
  html.setAttribute('data-nav',   a11yState.keyNav ? 'keyboard' : '');
  a11yState.reduceMotion
    ? html.setAttribute('data-motion','reduce')
    : html.removeAttribute('data-motion');

  /* Sincronizar checkboxes */
  [{id:'sw-narrator',  v:a11yState.narrator},
   {id:'sw-readexplain',v:a11yState.readExplain},
   {id:'sw-keynav',    v:a11yState.keyNav},
   {id:'sw-motion',    v:a11yState.reduceMotion}
  ].forEach(({id,v})=>{ const el=document.getElementById(id); if(el) el.checked=!!v; });

  /* Sincronizar botones de tema */
  ['light','dark','hc-light','hc-dark'].forEach(t=>{
    const b=document.getElementById('theme-btn-'+t);
    if(b){ b.classList.toggle('active',a11yState.theme===t); b.setAttribute('aria-pressed',a11yState.theme===t?'true':'false'); }
  });

  /* Sincronizar botones de fuente */
  ['normal','lg','xl','xxl'].forEach(f=>{
    const b=document.getElementById('font-btn-'+f);
    if(b){ b.classList.toggle('active',a11yState.font===f); b.setAttribute('aria-pressed',a11yState.font===f?'true':'false'); }
  });

  /* Atajos de teclado */
  const ks=document.getElementById('key-shortcuts');
  if(ks) ks.style.display=a11yState.keyNav?'block':'none';

  /* Reducir movimiento */
  let rmStyle=document.getElementById('reduce-motion-style');
  if(a11yState.reduceMotion){
    if(!rmStyle){ rmStyle=document.createElement('style'); rmStyle.id='reduce-motion-style'; document.head.appendChild(rmStyle); }
    rmStyle.textContent='*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}';
  } else { if(rmStyle) rmStyle.remove(); }

  /* Actualizar iconos del topbar según tema */
  updateTopbarIcons(a11yState.theme);
}

/* ── 7. CONTROLES DE UI ── */
/* ── Iconos del topbar por tema ── */
const TOPBAR_ICONS = {
  light:     { streak:'🔥', gems:'💎', xp:'⚡', heart:'❤️', heartLost:'🩶' },
  dark:      { streak:'🔥', gems:'💎', xp:'⚡', heart:'❤️', heartLost:'🩶' },
  'hc-light':{ streak:'🔥', gems:'💎', xp:'⚡', heart:'❤️', heartLost:'🩶' },
  'hc-dark': { streak:'🔥', gems:'💎', xp:'⚡', heart:'❤️', heartLost:'🩶' },
};
function updateTopbarIcons(theme){
  const ic = TOPBAR_ICONS[theme] || TOPBAR_ICONS.light;
  const si = document.getElementById('tb-streak-icon');
  const gi = document.getElementById('tb-gems-icon');
  const xi = document.getElementById('tb-xp-icon');
  if(si) si.textContent = ic.streak;
  if(gi) gi.textContent = ic.gems;
  if(xi) xi.textContent = ic.xp;
  /* Update hearts */
  const hr = document.getElementById('hearts-row');
  if(hr){
    hr.querySelectorAll('.h-icon').forEach(el=>{
      el.textContent = el.classList.contains('lost') ? ic.heartLost : ic.heart;
    });
  }
}

// Cambia el tema visual (normal/dark/hc-light/hc-dark), lo guarda y lo anuncia por voz
function setTheme(t){
  a11yState.theme=t; saveA11y(); applyA11y();

/* iOS/Safari: desbloquear AudioContext al primer toque */
document.addEventListener('click',_unlockAudio,{once:true});

  speak({light:'Tema claro activado.',dark:'Tema oscuro activado.','hc-light':'Alto contraste claro activado.','hc-dark':'Alto contraste oscuro activado.'}[t]||'Tema cambiado.', true);
}

// Cambia el tamaño de fuente (normal/large/xlarge), actualiza el CSS y guarda la preferencia
function setFont(f){
  a11yState.font=f; saveA11y(); applyA11y();

/* iOS/Safari: desbloquear AudioContext al primer toque */
document.addEventListener('click',_unlockAudio,{once:true});

  speak({normal:'Texto tamaño normal.',lg:'Texto grande.',xl:'Texto muy grande.',xxl:'Texto extra grande.'}[f]||'Tamaño cambiado.', true);
}

function toggleNarrator(on){
  a11yState.narrator=on; _narOn=on; saveA11y();
  if(on){
    _loadVoice();
    /* Pequeño retardo para que el checkbox termine su evento antes de hablar */
    setTimeout(()=>{
      _q=[];_speaking=false;
      speak('Narrador activado. Desde ahora leeré en voz alta todo lo que reciba el foco: preguntas, opciones y botones. Usa Tab para moverte. Cierra este panel para comenzar.', true);
    }, 300);
  } else {
    stopSpeak();
    /* Solo actualizar región ARIA sin TTS */
    const live=document.getElementById('a11y-live');
    if(live){ live.textContent=''; requestAnimationFrame(()=>{ live.textContent='Narrador desactivado.'; }); }
  }
}

function toggleReadExplain(on){
  a11yState.readExplain=on; _readExp=on; saveA11y();
  speak(on ? 'Las explicaciones se leerán después de responder.' : 'Las explicaciones ya no se leerán.', true);
}

function toggleKeyNav(on){
  a11yState.keyNav=on; saveA11y(); applyA11y();

/* iOS/Safari: desbloquear AudioContext al primer toque */
document.addEventListener('click',_unlockAudio,{once:true});

  speak(on ? 'Modo teclado activado. Usa Tab para navegar. Números 1 al 4 para responder. V y F para verdadero y falso. Enter para continuar. Escape para salir. R para releer.' : 'Modo teclado desactivado.', true);
}

function toggleMotion(on){
  a11yState.reduceMotion=on; saveA11y(); applyA11y();

/* iOS/Safari: desbloquear AudioContext al primer toque */
document.addEventListener('click',_unlockAudio,{once:true});

  speak(on ? 'Animaciones reducidas.' : 'Animaciones activadas.', true);
}

function resetA11y(){
  stopSpeak();
  a11yState={theme:'light',font:'normal',narrator:false,readExplain:false,keyNav:false,reduceMotion:false};
  _narOn=false; _readExp=false;
  saveA11y(); applyA11y();

/* iOS/Safari: desbloquear AudioContext al primer toque */
document.addEventListener('click',_unlockAudio,{once:true});

  speak('Configuración restablecida a valores predeterminados.', true);
}

function testNarrator(){
  _loadVoice();
  const orig = _narOn;
  _narOn = true;
  stopSpeak();
  _q = [
    'Probando el narrador de safeXP.',
    'Si escuchas esto, el narrador funciona correctamente.',
    'Cuando estés en una lección, recibirás el foco en cada elemento con Tab.',
    'El narrador leerá cada pregunta, sus opciones y los botones.',
    'Presiona Tab ahora para escuchar los elementos de este panel.'
  ];
  _pump();
  /* Restaurar estado original después de la prueba */
  setTimeout(()=>{ if(!a11yState.narrator) _narOn=orig; }, 8000);
}

/* ── 8. PANEL ABRIR / CERRAR ── */
function openA11yPanel(){
  const panel=document.getElementById('a11y-panel');
  const bd=document.getElementById('a11y-panel-backdrop');
  if(!panel||!bd) return;
  panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
  bd.classList.add('show');
  /* No interrumpir voz activa al abrir */
  const live=document.getElementById('a11y-live');
  if(live){ live.textContent=''; requestAnimationFrame(()=>{ live.textContent='Panel de accesibilidad abierto. Use Tab para navegar por las opciones.'; }); }
  setTimeout(()=>{
    const first=panel.querySelector('button:not([disabled])');
    if(first) first.focus();
  },350);
}

function closeA11yPanel(){
  const panel=document.getElementById('a11y-panel');
  const bd=document.getElementById('a11y-panel-backdrop');
  if(!panel||!bd) return;
  panel.classList.remove('open'); panel.setAttribute('aria-hidden','true');
  bd.classList.remove('show');
  document.getElementById('a11y-open-btn')?.focus();
  if(_narOn) speak('Panel cerrado. Listo para la lección. Usa Tab para navegar.', true);
}

/* ── 9. ATAJOS DE TECLADO GLOBALES ── */
document.addEventListener('keydown', e=>{
  const tag      = document.activeElement.tagName.toLowerCase();
  const inInput  = (tag==='input'||tag==='textarea'||tag==='select');

  /* A → abrir panel */
  if((e.key==='a'||e.key==='A') && !inInput){
    const panel=document.getElementById('a11y-panel');
    if(panel && !panel.classList.contains('open')){ openA11yPanel(); e.preventDefault(); return; }
  }

  /* Escape → cerrar panel / salir de lección */
  if(e.key==='Escape'){
    const panel=document.getElementById('a11y-panel');
    if(panel && panel.classList.contains('open')){ closeA11yPanel(); e.preventDefault(); return; }
    if(document.getElementById('lesson')?.classList.contains('active')){ confirmClose(); e.preventDefault(); return; }
  }

  /* Sólo en modo teclado + lección activa */
  if(!a11yState.keyNav) return;
  if(!document.getElementById('lesson')?.classList.contains('active')) return;

  /* Enter → continuar / cerrar modal */
  if(e.key==='Enter'){
    const fb=document.getElementById('fb-bar');
    if(fb?.classList.contains('show')){ document.getElementById('fb-btn')?.click(); e.preventDefault(); return; }
    const li=document.getElementById('lesson-info-overlay');
    if(li?.classList.contains('show')){ dismissLessonInfo(); e.preventDefault(); return; }
  }

  /* 1-4 → seleccionar opción */
  if(['1','2','3','4'].includes(e.key) && !inInput){
    const btns=[...document.querySelectorAll('.ch-btn:not([disabled])')];
    if(btns[+e.key-1]){ btns[+e.key-1].click(); e.preventDefault(); return; }
  }

  /* V / F → verdadero / falso */
  if(!inInput){
    if(e.key==='v'||e.key==='V'){ document.querySelector('.tf-btn.t-side:not([disabled])')?.click(); e.preventDefault(); return; }
    if(e.key==='f'||e.key==='F'){ document.querySelector('.tf-btn.f-side:not([disabled])')?.click(); e.preventDefault(); return; }
    /* R → releer pregunta */
    if(e.key==='r'||e.key==='R'){
      const q=curUnit?.activities?.[curActIdx]?.questions?.[curQIdx];
      if(q){ narrateQuestion(q); e.preventDefault(); return; }
    }
  }
});

/* ── 10. ACCESIBILIDAD DE BOTONES — tabIndex ──
   Asegura que todos los botones interactivos en las lecciones reciban foco */
function makeA11yFocusable(){
  document.querySelectorAll('.ch-btn,.tf-btn,.pair-chip,.sort-item,#fb-btn,.les-close').forEach(el=>{
    if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
    /* Enter y Space activan botones no-button */
    if(el.tagName.toLowerCase()!=='button'){
      el.addEventListener('keydown', ev=>{
        if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); el.click(); }
      });
    }
  });
}
/* Observar cambios del DOM para aplicar tabindex dinámicamente */
new MutationObserver(()=> makeA11yFocusable())
  .observe(document.body, {childList:true, subtree:true});

/* ── 11. DETECCIÓN DE PREFERENCIAS DEL SISTEMA ── */
if(window.matchMedia?.('(prefers-color-scheme: dark)').matches && a11yState.theme==='light'){
  a11yState.theme='dark'; saveA11y();
}
if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !a11yState.reduceMotion){
  a11yState.reduceMotion=true; saveA11y();
}

/* ── 12. INICIALIZACIÓN ── */
// Al terminar de parsear el DOM: inicializa accesibilidad, carga datos, configura listeners globales
document.addEventListener('DOMContentLoaded',()=>{
  _narOn    = a11yState.narrator;
  _readExp  = a11yState.readExplain;
  _loadVoice();
  applyA11y();

/* iOS/Safari: desbloquear AudioContext al primer toque */
// Desbloquea el AudioContext en iOS/Safari con un utterance vacío en el primer toque del usuario
document.addEventListener('click', function _unlockAudio(){
  if(_S && _S.paused===undefined){} // already running
  if(_S){
    const u=new SpeechSynthesisUtterance('');
    u.volume=0; _S.speak(u);
  }
  document.removeEventListener('click',_unlockAudio);
},{once:true});

  makeA11yFocusable();
});
applyA11y();
/* iOS/Safari: el desbloqueo de audio se maneja dentro del listener DOMContentLoaded */

/* ════════════════════════════════════════════════
   QUIZ DE DESBLOQUEO DE SECCIÓN
════════════════════════════════════════════════ */
let _uqUnitIdx=0, _uqQs=[], _uqIdx=0, _uqScore=0, _uqAnswered=false;

/* Reúne 5 preguntas de la unidad anterior */
function _getUnlockQuestions(unitIdx){
  const prevUnit=UNITS[unitIdx-1];
  const pool=[];
  prevUnit.activities.forEach(act=>{
    act.questions.forEach(q=>{
      if(q.type==='choice'&&q.choices) pool.push(q);
      else if(q.type==='tf') pool.push(q);
    });
  });
  /* Mezclar y tomar 5 */
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,Math.min(5,pool.length));
}

function showUnlockQuiz(unitIdx){
  _uqUnitIdx=unitIdx;
  _uqQs=_getUnlockQuestions(unitIdx);
  _uqIdx=0; _uqScore=0; _uqAnswered=false;
  const unit=UNITS[unitIdx];
  const prevUnit=UNITS[unitIdx-1];
  document.getElementById('uq-emoji').textContent=unit.icon;
  document.getElementById('uq-title').textContent='Desbloquear: '+unit.label;
  document.getElementById('uq-sub').textContent='Demuestra que dominas "'+prevUnit.label+'". Necesitas 4/5 correctas.';
  document.getElementById('uq-result').classList.remove('show');
  document.getElementById('uq-question-area').style.display='block';
  document.getElementById('unlock-overlay').classList.add('show');
  _uqRender();
}

function _uqRender(){
  if(_uqIdx>=_uqQs.length){ _uqFinish(); return; }
  const q=_uqQs[_uqIdx];
  _uqAnswered=false;
  /* Progress */
  const pct=Math.round((_uqIdx/_uqQs.length)*100);
  document.getElementById('uq-prog-fill').style.width=pct+'%';
  document.getElementById('uq-prog-lbl').textContent=_uqIdx+' / '+_uqQs.length;
  /* Question */
  document.getElementById('uq-q').textContent=(q.char||'❓')+' '+q.q;
  document.getElementById('uq-fb').className='uq-fb';
  /* Options */
  const optsEl=document.getElementById('uq-opts');
  optsEl.innerHTML='';
  if(q.type==='choice'&&q.choices){
    q.choices.forEach((ch,i)=>{
      const btn=document.createElement('button');
      btn.className='uq-opt';
      btn.innerHTML=`<span>${ch.e||'▸'}</span><span>${ch.t}</span>`;
      btn._uqCorrect = !!ch.ok;
      btn.onclick=()=>_uqAnswer(btn,!!ch.ok,q.explain);
      optsEl.appendChild(btn);
    });
  } else if(q.type==='tf'){
    [{label:'✅ VERDADERO',val:true},{label:'❌ FALSO',val:false}].forEach(({label,val})=>{
      const btn=document.createElement('button');
      btn.className='uq-opt';
      btn.textContent=label;
      btn._uqCorrect = (val===q.ans);
      btn.onclick=()=>_uqAnswer(btn,val===q.ans,q.explain);
      optsEl.appendChild(btn);
    });
  }
}

function _uqAnswer(btn,correct,explain){
  if(_uqAnswered) return;
  _uqAnswered=true;
  if(correct) _uqScore++;
  btn.classList.add(correct?'correct':'wrong');
  /* Mark correct answer if wrong */
  if(!correct){
    [...document.querySelectorAll('.uq-opt')].forEach(b=>{
      if(b.onclick && b.onclick.toString().includes('true')){
        b.classList.add('correct');
      }
    });
    // Fallback: mark by re-evaluating each button's bound handler result
    document.querySelectorAll('.uq-opt').forEach(b=>{
      const handler = b._uqCorrect;
      if(handler === true) b.classList.add('correct');
    });
  }
  /* Disable all */
  document.querySelectorAll('.uq-opt').forEach(b=>b.style.pointerEvents='none');
  /* Feedback */
  const fb=document.getElementById('uq-fb');
  fb.className='uq-fb show '+(correct?'ok':'fail');
  fb.textContent=(correct?'✅ ¡Correcto! ':'❌ Incorrecto. ')+( explain||'');
  /* Next after delay */
  setTimeout(()=>{
    _uqIdx++;
    _uqRender();
  },1600);
}

function _uqFinish(){
  const passed=_uqScore>=Math.ceil(_uqQs.length*0.8);
  const unit=UNITS[_uqUnitIdx];
  document.getElementById('uq-question-area').style.display='none';
  document.getElementById('uq-prog-fill').style.width='100%';
  document.getElementById('uq-prog-lbl').textContent=_uqScore+' / '+_uqQs.length;
  const resultEl=document.getElementById('uq-result');
  resultEl.classList.add('show');

  if(passed){
    document.getElementById('uq-result-icon').textContent='🎉';
    document.getElementById('uq-result-title').textContent='¡Sección desbloqueada!';
    document.getElementById('uq-result-sub').textContent=
      'Obtuviste '+_uqScore+'/'+_uqQs.length+' correctas. "'+unit.label+'" ya está disponible.';
    document.getElementById('uq-result-btn').textContent='Ir a '+unit.label+' →';
    document.getElementById('uq-result-btn').onclick=()=>{
      /* Desbloquear: marcar todas las actividades de la unidad anterior como completadas */
      const prevUnit=UNITS[_uqUnitIdx-1];
      if(!gs.completedActs[prevUnit.id]) gs.completedActs[prevUnit.id]=[];
      prevUnit.activities.forEach((_,i)=>{
        if(!gs.completedActs[prevUnit.id].includes(i)) gs.completedActs[prevUnit.id].push(i);
      });
      save();
      closeUnlockQuiz();
      renderHome();
      showToast('🔓 '+unit.label+' desbloqueado con el quiz');
    };
  } else {
    document.getElementById('uq-result-icon').textContent='😔';
    document.getElementById('uq-result-title').textContent='Casi lo logras';
    document.getElementById('uq-result-sub').textContent=
      'Obtuviste '+_uqScore+'/'+_uqQs.length+'. Necesitas 4 correctas. ¡Intenta de nuevo!';
    document.getElementById('uq-result-btn').textContent='Intentar de nuevo';
    document.getElementById('uq-result-btn').onclick=()=>{
      document.getElementById('uq-result').classList.remove('show');
      document.getElementById('uq-question-area').style.display='block';
      showUnlockQuiz(_uqUnitIdx);
    };
  }
}

function closeUnlockQuiz(){
  document.getElementById('unlock-overlay').classList.remove('show');
}
/* Cerrar con Escape */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.getElementById('unlock-overlay').classList.contains('show')){
    closeUnlockQuiz();
  }
});


/* ════════════════════════════════════════════════════════
   MODO DESARROLLADOR
   Contraseña: safexp-dev-2024
════════════════════════════════════════════════════════ */
// Contraseña hasheada con _hashSimple — no almacenar contraseñas en texto plano
// Valor original: 'safexp-dev-2024'  →  reemplaza con tu propio hash en producción
const DEV_PASSWORD = _hashSimple('safexp-dev-2024');
let _devMode = false;
let _devShowAnswers = false;

/* ── Auth ── */
function openDevAuth(){
  if(_devMode){ openDevPanel(); return; }
  document.getElementById('dev-auth-overlay').classList.add('show');
  setTimeout(()=>document.getElementById('dev-auth-input').focus(),150);
}
function closeDevAuth(){
  document.getElementById('dev-auth-overlay').classList.remove('show');
  document.getElementById('dev-auth-input').value='';
  devAuthClearError();
}
function devAuthClearError(){
  document.getElementById('dev-auth-input').classList.remove('error');
  document.getElementById('dev-auth-error').classList.remove('show');
}
function devAuthSubmit(){
  const val = document.getElementById('dev-auth-input').value;
  if(_hashSimple(val) === DEV_PASSWORD){
    closeDevAuth();
    _devMode = true;
    document.body.classList.add('devmode');
    openDevPanel();
  } else {
    const inp = document.getElementById('dev-auth-input');
    inp.classList.add('error');
    document.getElementById('dev-auth-error').classList.add('show');
    inp.value='';
    setTimeout(()=>inp.focus(),50);
  }
}

/* ── Panel ── */
function openDevPanel(){
  document.getElementById('dev-panel').classList.add('show');
  document.getElementById('dev-header-sub').textContent =
    `v${new Date().getFullYear()} · ${UNITS.length} unidades · ${UNITS.reduce((a,u)=>a+u.activities.length,0)} actividades`;
  devRefreshAll();
}
function closeDevPanel(){
  document.getElementById('dev-panel').classList.remove('show');
}

/* ── Tabs ── */
function devShowTab(id, e){
  document.querySelectorAll('.dev-tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.dev-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('dev-tab-'+id).classList.add('active');
  if(e && e.target) e.target.classList.add('active');
  devRefreshAll();
}

/* ── Refresh all panel data ── */
function devRefreshAll(){
  _devRenderStats();
  _devRenderUnits();
  _devRenderAnswers();
  _devRenderState();
}

function _devRenderStats(){
  const el = document.getElementById('dev-stats-display');
  const totalActs = UNITS.reduce((a,u)=>a+u.activities.length,0);
  const doneActs  = UNITS.reduce((a,u)=>a+(gs.completedActs[u.id]||[]).length,0);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">
      <div>⚡ XP: <strong>${gs.xp}</strong></div>
      <div>💎 Gemas: <strong>${gs.gems}</strong></div>
      <div>🔥 Racha: <strong>${gs.streak} días</strong></div>
      <div>❤️ Corazones: <strong>${gs.hearts}/5</strong></div>
      <div>✅ Actividades: <strong>${doneActs}/${totalActs}</strong></div>
      <div>📚 Unidades: <strong>${(typeof UNITS!=="undefined"&&UNITS?UNITS.filter(u=>getUnitProgress(u.id)===100).length:0)}/${UNITS.length}</strong></div>
    </div>
    <div style="margin-top:.6rem;font-size:.7rem;color:var(--muted)">
      Modo desarrollador activo
    </div>`;
}

function _devRenderUnits(){
  const el = document.getElementById('dev-units-list');
  if(!el) return;
  el.innerHTML='';
  UNITS.forEach((unit,ui)=>{
    const prog = getUnitProgress(unit.id);
    const unlocked = isUnitUnlocked(unit.id);
    const block = document.createElement('div');
    block.className='dev-unit-block';
    block.innerHTML=`
      <button class="dev-unit-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="dev-unit-dot" style="background:${unit.color}"></div>
        <span class="dev-unit-name">${unit.icon} ${unit.label}</span>
        <span class="dev-unit-prog">${prog}% · ${unlocked?'🔓':'🔒'}</span>
        <span class="dev-unit-chevron">›</span>
      </button>
      <div class="dev-unit-body">
        ${unit.activities.map((act,ai)=>{
          const done = isActDone(unit.id,ai);
          const cur  = !done&&isActUnlocked(unit.id,ai)&&unlocked;
          const lck  = !unlocked||(!done&&!isActUnlocked(unit.id,ai));
          const badge= done?'done':cur?'current':'locked';
          const bLabel=done?'✓ Completada':cur?'▶ Actual':'🔒 Bloqueada';
          return `<div class="dev-act-row">
            <div class="dev-act-title">
              ${ai+1}. ${act.title}
              <span class="dev-act-badge ${badge}">${bLabel}</span>
              <button onclick="devJumpToAct('${unit.id}',${ai})" style="margin-left:auto;font-size:.65rem;background:var(--blue);color:#fff;border:none;border-radius:6px;padding:.15rem .45rem;cursor:pointer;font-family:Nunito;font-weight:800">▶ Ir</button>
            </div>
            <div style="font-size:.7rem;color:var(--muted)">${act.questions.length} preguntas</div>
          </div>`;
        }).join('')}
      </div>`;
    el.appendChild(block);
  });
}

/* ── Build a full read-only preview of one question ── */
function _devBuildQuestionPreview(q, qi, unitColor){
  const wrap = document.createElement('div');
  wrap.className = 'dev-q-preview';
  wrap.style.cssText = `border:2px solid ${unitColor}44;border-radius:14px;overflow:hidden;margin-bottom:.7rem;background:var(--white)`;

  /* Header bar */
  const typeLabels={choice:'🖱️ Opción múltiple',tf:'✅ Verdadero / Falso',pair:'🔗 Relaciona pares',sort:'↕️ Ordena pasos',scenario:'🔍 Escenario visual'};
  const typeColors={choice:'var(--blue)',tf:'var(--green)',pair:'var(--purple)',sort:'var(--orange)',scenario:'var(--red)'};
  const hdr = document.createElement('div');
  hdr.style.cssText=`background:${unitColor}18;padding:.45rem .8rem;display:flex;align-items:center;gap:.5rem;border-bottom:2px solid ${unitColor}33`;
  hdr.innerHTML=`<span style="font-size:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:${typeColors[q.type]||'var(--muted)'}">P${qi+1} · ${typeLabels[q.type]||q.type}</span>`;
  wrap.appendChild(hdr);

  /* Body: render the actual question card */
  const body = document.createElement('div');
  body.style.cssText='padding:.8rem;pointer-events:none;user-select:none';

  /* Theory box */
  if(q.theory){
    const th=document.createElement('div');th.className='q-theory';th.innerHTML=q.theory;body.appendChild(th);
  }

  /* Question header */
  if(q.char){const ch=document.createElement('span');ch.className='q-char';ch.textContent=q.char;body.appendChild(ch);}
  const qt=document.createElement('div');qt.className='q-title';qt.textContent=q.q;body.appendChild(qt);
  if(q.hint){const qh=document.createElement('div');qh.className='q-hint';qh.textContent=q.hint;body.appendChild(qh);}

  /* ── CHOICE ── */
  if(q.type==='choice' && q.choices){
    const grid=document.createElement('div');
    const wide=q.choices.some(c=>c.t.length>20);
    grid.className='choices-grid'+(wide?' wide':'');
    grid.style.marginTop='.5rem';
    q.choices.forEach(ch=>{
      const btn=document.createElement('div');
      btn.className='ch-btn'+(ch.ok?' correct':'');
      btn.style.cssText=ch.ok?`border-color:var(--green);background:var(--gs);position:relative`:`opacity:.65;position:relative`;
      btn.innerHTML=`<span class="ch-em">${ch.e||''}</span><span>${ch.t}</span>`;
      if(ch.ok){
        const tag=document.createElement('span');
        tag.style.cssText='position:absolute;top:4px;right:7px;font-size:.6rem;font-weight:900;color:var(--gd);background:var(--gs);padding:1px 5px;border-radius:99px';
        tag.textContent='✓ CORRECTA';
        btn.appendChild(tag);
      }
      grid.appendChild(btn);
    });
    body.appendChild(grid);
  }

  /* ── PONG (pregunta 3 type=choice) → mostrar como choice + badge ── */
  else if(q.type==='pong'){
    const badge=document.createElement('div');badge.className='q-badge qb-choice';badge.textContent='🏓 Minijuego Pong — luego responde';body.appendChild(badge);
    const grid=document.createElement('div');grid.className='choices-grid';grid.style.marginTop='.5rem';
    (q.choices||[]).forEach(ch=>{
      const btn=document.createElement('div');
      btn.className='ch-btn'+(ch.ok?' correct':'');
      btn.style.cssText=ch.ok?'border-color:var(--green);background:var(--gs);position:relative':'opacity:.65';
      btn.innerHTML=`<span class="ch-em">${ch.e||''}</span><span>${ch.t}</span>`;
      if(ch.ok){const tag=document.createElement('span');tag.style.cssText='position:absolute;top:4px;right:7px;font-size:.6rem;font-weight:900;color:var(--gd)';tag.textContent='✓';btn.appendChild(tag);}
      grid.appendChild(btn);
    });
    body.appendChild(grid);
  }

  /* ── TRUE/FALSE ── */
  else if(q.type==='tf'){
    const tw=document.createElement('div');tw.className='tf-wrap';tw.style.marginTop='.5rem';
    [{val:true,label:'✅ VERDADERO'},{val:false,label:'❌ FALSO'}].forEach(({val,label})=>{
      const btn=document.createElement('div');
      const isCorrect=(val===q.ans);
      btn.className='tf-btn correct '+(val?'t-side':'f-side');
      /* Use inline style with hardcoded hex so dark theme cannot override */
      if(isCorrect){
        btn.style.cssText='border:2.5px solid #58cc02 !important;background:#d7f5b1 !important;color:#46a302 !important;font-weight:900;position:relative;border-radius:12px;padding:1rem;text-align:center;font-size:.9rem';
        btn.innerHTML=label+'<span style="position:absolute;top:4px;right:8px;font-size:.65rem;font-weight:900;color:#46a302;background:#d7f5b1;padding:1px 5px;border-radius:99px">✓ CORRECTO</span>';
      } else {
        btn.style.cssText='opacity:.45;border-radius:12px;padding:1rem;text-align:center;font-size:.9rem;border:2.5px solid #ccc';
        btn.textContent=label;
      }
      tw.appendChild(btn);
    });
    body.appendChild(tw);
  }

  /* ── PAIR ── */
  else if(q.type==='pair'){
    const pw=document.createElement('div');pw.className='pair-wrap';pw.style.marginTop='.5rem';
    const colL=document.createElement('div');colL.className='pair-col';
    const colR=document.createElement('div');colR.className='pair-col';
    colL.innerHTML='<div class="pair-col-label">Concepto</div>';
    colR.innerHTML='<div class="pair-col-label">✅ Respuesta correcta</div>';
    (q.left||[]).forEach((l,i)=>{
      const BASE='display:flex;align-items:center;gap:.55rem;padding:.55rem .75rem;border-radius:10px;border:2px solid #58cc02;background:#d7f5b1;color:#46a302;font-size:.8rem;font-weight:700;min-height:52px';
      const numStyle='min-width:20px;height:20px;border-radius:50%;background:#58cc02;color:#fff;font-size:.68rem;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0';
      const chipL=document.createElement('div');chipL.style.cssText=BASE;
      const nL=document.createElement('span');nL.style.cssText=numStyle;nL.textContent=i+1;
      chipL.appendChild(nL);chipL.appendChild(document.createTextNode(l));
      const chipR=document.createElement('div');chipR.style.cssText=BASE;
      const nR=document.createElement('span');nR.style.cssText=numStyle;nR.textContent=i+1;
      chipR.appendChild(nR);chipR.appendChild(document.createTextNode((q.right||[])[i]||'?'));
      colL.appendChild(chipL);colR.appendChild(chipR);
    });
    pw.appendChild(colL);pw.appendChild(colR);
    body.appendChild(pw);
  }

  /* ── SORT ── */
  else if(q.type==='sort'){
    const sl=document.createElement('div');sl.style.cssText='display:flex;flex-direction:column;gap:.45rem;margin-top:.5rem';
    const ordered=(q.correct||[]).map(idx=>(q.items||[])[idx]).filter(Boolean);
    ordered.forEach((item,i)=>{
      const d=document.createElement('div');
      d.style.cssText='display:flex;align-items:center;gap:.6rem;padding:.55rem .75rem;border-radius:10px;border:2px solid #58cc02;background:#d7f5b1;color:#46a302;font-size:.82rem;font-weight:700';
      const num=document.createElement('span');
      num.style.cssText='min-width:22px;height:22px;border-radius:50%;background:#58cc02;color:#fff;font-size:.72rem;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0';
      num.textContent=i+1;
      const txt=document.createElement('span');txt.textContent=item;
      d.appendChild(num);d.appendChild(txt);
      sl.appendChild(d);
    });
    body.appendChild(sl);
  }

  /* ── SCENARIO (email / sms / whatsapp / browser) ── */
  else if(q.type==='scenario'){
    /* Build scenario HTML into a detached container, then clone into body */
    const tmpRoot = document.createElement('div');
    document.getElementById('dev-panel').appendChild(tmpRoot); // attach so buildScenario works
    tmpRoot.style.cssText='position:absolute;left:-9999px;visibility:hidden';
    const tmpCard = document.createElement('div');
    tmpRoot.appendChild(tmpCard);
    const savedIdx=curQIdx; curQIdx=0;
    try{ buildScenario(tmpCard,q); } catch(e){ console.warn('devPreview scenario err',e); }
    curQIdx=savedIdx;
    /* Clone the rendered HTML so no circular reference */
    const cloned = tmpCard.cloneNode(true);
    tmpRoot.remove(); // detach temp container
    /* Disable interactivity + highlight correct */
    cloned.querySelectorAll('.ch-btn').forEach(btn=>{
      btn.removeAttribute('onclick');
      btn.style.pointerEvents='none';
      if(btn.dataset.ok==='true'){
        btn.style.cssText='border-color:var(--green);background:var(--gs);pointer-events:none;position:relative';
        const tag=document.createElement('span');
        tag.style.cssText='position:absolute;top:4px;right:7px;font-size:.6rem;font-weight:900;color:var(--gd)';
        tag.textContent='✓ CORRECTA'; btn.appendChild(tag);
      } else {
        btn.style.opacity='.6';btn.style.pointerEvents='none';
      }
    });
    cloned.querySelectorAll('[onclick]').forEach(el=>el.removeAttribute('onclick'));
    /* Append children of clone into body */
    while(cloned.firstChild) body.appendChild(cloned.firstChild);
  }

  /* Explanation */
  if(q.explain){
    const exp=document.createElement('div');
    exp.style.cssText='margin-top:.6rem;padding:.5rem .7rem;background:var(--bs);border-radius:8px;font-size:.74rem;color:var(--bd);font-weight:700;line-height:1.4';
    exp.innerHTML=`💡 <em>${q.explain}</em>`;
    body.appendChild(exp);
  }

  wrap.appendChild(body);
  return wrap;
}

function _devRenderAnswers(){
  const el = document.getElementById('dev-answers-list');
  if(!el) return;
  el.innerHTML='';

  UNITS.forEach(unit=>{
    /* Unit section header */
    const unitDiv = document.createElement('div');
    unitDiv.style.cssText='margin-bottom:1.4rem';
    const unitHdr=document.createElement('div');
    unitHdr.style.cssText=`font-size:.88rem;font-weight:900;color:#fff;margin-bottom:.6rem;padding:.55rem .9rem;background:linear-gradient(135deg,${unit.color},${unit.colorD});border-radius:10px;display:flex;align-items:center;gap:.5rem`;
    unitHdr.innerHTML=`<span>${unit.icon}</span><span>${unit.label}</span><span style="margin-left:auto;font-size:.7rem;opacity:.8">${unit.activities.length} actividades</span>`;
    unitDiv.appendChild(unitHdr);

    unit.activities.forEach((act,ai)=>{
      /* Activity accordion */
      const actBlock = document.createElement('div');
      actBlock.className='dev-unit-block';
      actBlock.style.marginBottom='.5rem';

      const actHdr=document.createElement('button');
      actHdr.className='dev-unit-header';
      actHdr.onclick=function(){actBlock.classList.toggle('open')};
      actHdr.innerHTML=`
        <div class="dev-unit-dot" style="background:${unit.color}"></div>
        <span class="dev-unit-name" style="font-size:.82rem">${ai+1}. ${act.title}</span>
        <span class="dev-unit-prog">${act.questions.length} preguntas</span>
        <span class="dev-unit-chevron">›</span>`;

      const actBody=document.createElement('div');
      actBody.className='dev-unit-body';
      actBody.style.padding='.7rem .8rem';

      act.questions.forEach((q,qi)=>{
        /* For q index 2 (pong) and 5 (tetris) show game badge */
        const isGame2=(qi===2&&q.type==='choice');
        const isGame5=(qi===5&&q.type==='sort');
        if(isGame2||isGame5){
          const gameBadge=document.createElement('div');
          gameBadge.style.cssText=`background:var(--grad-social);border-radius:10px;padding:.5rem .8rem;margin-bottom:.7rem;display:flex;align-items:center;gap:.6rem;font-size:.78rem;color:#fff`;
          gameBadge.innerHTML=`<span style="font-size:1.2rem">${isGame2?'🏓':'🧱'}</span><span><strong>${isGame2?'Minijuego Pong':'Minijuego Tetris'}</strong> — el usuario juega, luego responde esta pregunta</span>`;
          actBody.appendChild(gameBadge);
        }
        actBody.appendChild(_devBuildQuestionPreview(q, qi, unit.color));
      });

      actBlock.appendChild(actHdr);
      actBlock.appendChild(actBody);
      unitDiv.appendChild(actBlock);
    });

    el.appendChild(unitDiv);
  });
}

function _devRenderState(){
  const el = document.getElementById('dev-state-pre');
  if(!el) return;
  el.textContent = JSON.stringify(gs, null, 2);
}

/* ── Quick actions ── */
function devUnlockAll(){
  UNITS.forEach(u=>{
    if(!gs.completedActs[u.id]) gs.completedActs[u.id]=[];
    // Mark first activity done to unlock
    if(!gs.completedActs[u.id].includes(0)) gs.completedActs[u.id].push(0);
  });
  save(); renderHome(); devRefreshAll();
  showToast('🔓 Todas las unidades desbloqueadas');
}
function devCompleteAll(){
  UNITS.forEach(u=>{
    if(!gs.completedActs[u.id]) gs.completedActs[u.id]=[];
    u.activities.forEach((_,i)=>{
      if(!gs.completedActs[u.id].includes(i)) gs.completedActs[u.id].push(i);
    });
  });
  save(); renderHome(); devRefreshAll();
  showToast('✅ Todo completado');
}
function devMaxStats(){
  gs.xp=9999; gs.gems=999; gs.streak=30;
  save(); updateTopBar(); devRefreshAll();
  showToast('⚡ Stats al máximo');
}
function devFillHearts(){
  gs.hearts=5; save(); updateTopBar(); devRefreshAll();
  showToast('❤️ Corazones restaurados');
}
function devResetProgress(){
  if(!confirm('¿Reiniciar TODO el progreso? No se puede deshacer.')) return;
  // xp: puntos de experiencia | streak: días consecutivos de práctica | gems: moneda del juego
  gs={xp:0,streak:0,gems:0,hearts:5,completedActs:{},lastHeartRefill:Date.now()};
  save(); renderHome(); updateTopBar(); devRefreshAll();
  showToast('🔄 Progreso reiniciado');
}
function devJumpToAct(uid, actIdx){
  // Unlock all prior activities
  UNITS.forEach(u=>{
    if(!gs.completedActs[u.id]) gs.completedActs[u.id]=[];
    if(u.id===uid){
      for(let i=0;i<actIdx;i++){
        if(!gs.completedActs[u.id].includes(i)) gs.completedActs[u.id].push(i);
      }
    } else {
      const ui=UNITS.findIndex(x=>x.id===uid);
      const thisUi=UNITS.findIndex(x=>x.id===u.id);
      if(thisUi<ui){
        u.activities.forEach((_,i)=>{
          if(!gs.completedActs[u.id].includes(i)) gs.completedActs[u.id].push(i);
        });
      }
    }
  });
  save(); closeDevPanel(); renderHome();
  setTimeout(()=>{ openUnitDetail(uid,actIdx); startLesson(uid,actIdx); },300);
  showToast('▶ Saltando a actividad...');
}
function devToggleAnswers(){}
function devCopyState(){
  navigator.clipboard?.writeText(JSON.stringify(gs,null,2))
    .then(()=>showToast('📋 Estado copiado al portapapeles'))
    .catch(()=>showToast('❌ No se pudo copiar'));
}
function devClearStorage(){
  if(!confirm('¿Eliminar todos los datos de localStorage?')) return;
  localStorage.clear();
  showToast('🗑️ localStorage limpiado — recarga la página');
}

/* Cerrar con Escape */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('dev-panel').classList.contains('show')) closeDevPanel();
    else if(document.getElementById('dev-auth-overlay').classList.contains('show')) closeDevAuth();
  }
  /* Konami-style shortcut: Ctrl+Shift+D opens auth */
  if(e.ctrlKey&&e.shiftKey&&e.key==='D'){ e.preventDefault(); openDevAuth(); }
});

renderHome();updateTopBar();

/* ══════════════════════════════════════════════════════
   AUTH SYSTEM — safeXP
   Almacenamiento: localStorage (demo / single-device)
   Reemplazar con backend real en producción.
══════════════════════════════════════════════════════ */

const AUTH_KEY = 'safexp_auth_v1';   // stores {users:[...]}
const AUTH_SESSION = 'safexp_session'; // stores {email, name, avatar, guest}

const AVATARS_LIST = ['🧑‍💻','👩‍💻','🥷','🦊','🐺','🦁','🐉','🤖','👾','🎮',
                      '🦸','🦹','🧙','🕵️','🛸','💀','🔒','⚡','🌐','🚀'];

let _authSelectedAvatar = AVATARS_LIST[0];

/* ── Helpers ── */
// Lee la base de datos de usuarios desde localStorage; retorna {} si no existe o hay error
function _authGetDB(){ try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'{}')}catch{return{}} }
// Guarda la base de datos de usuarios en localStorage como JSON
function _authSaveDB(db){ localStorage.setItem(AUTH_KEY, JSON.stringify(db)) }
// Lee la sesión activa del usuario desde localStorage; retorna null si no hay sesión
function _authGetSession(){ try{return JSON.parse(localStorage.getItem(AUTH_SESSION)||'null')}catch{return null} }
// Persiste la sesión del usuario (email, nombre, avatar) en localStorage
function _authSaveSession(s){ localStorage.setItem(AUTH_SESSION, JSON.stringify(s)) }
// Elimina la sesión activa del localStorage (equivale a cerrar sesión)
function _authClearSession(){ localStorage.removeItem(AUTH_SESSION) }

// Hash no-criptográfico de la contraseña para almacenamiento local demo; usar bcrypt en producción
function _hashSimple(str){
  // Simple non-crypto hash — fine for demo, use bcrypt server-side in prod
  let h=5381;
  for(let i=0;i<str.length;i++) h=((h<<5)+h)+str.charCodeAt(i)|0;
  return 'h'+Math.abs(h).toString(36);
}

/* ── Init auth screen ── */
// Inicializa el sistema de auth: construye el grid de avatares y verifica si hay sesión activa
function authInit(){
  // Build avatar grid
  const grid = document.getElementById('auth-avatar-grid');
  if(grid){
    grid.innerHTML='';
    AVATARS_LIST.forEach(av=>{
      const btn=document.createElement('button');
      btn.className='auth-avatar-opt'+(av===_authSelectedAvatar?' selected':'');
      btn.textContent=av;btn.type='button';
      btn.onclick=()=>{
        _authSelectedAvatar=av;
        grid.querySelectorAll('.auth-avatar-opt').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
      };
      grid.appendChild(btn);
    });
  }

  // Check existing session
  const session = _authGetSession();
  if(session){
    authEnterApp(session, false);
    return;
  }
  // Show auth screen
  const screen = document.getElementById('auth-screen');
  if(screen) screen.classList.remove('hidden');
}

/* ── Tab switching ── */
// Alterna entre los paneles de Login y Registro, actualizando clases y atributos aria
function authSwitchTab(tab){
  ['login','register'].forEach(t=>{
    document.getElementById('panel-'+t).classList.toggle('active', t===tab);
    const btn=document.getElementById('tab-'+t+'-btn');
    if(btn){ btn.classList.toggle('active', t===tab); btn.setAttribute('aria-selected', t===tab); }
  });
  authHideBanners();
}

/* ── Show/hide banners ── */
// Muestra el banner rojo de error global con el mensaje especificado
function authShowError(msg){
  const b=document.getElementById('auth-error-banner');
  const t=document.getElementById('auth-error-text');
  if(b&&t){t.textContent=msg;b.classList.add('show');}
}
// Muestra el banner verde de éxito con el mensaje especificado
function authShowSuccess(msg){
  const b=document.getElementById('auth-success-banner');
  const t=document.getElementById('auth-success-text');
  if(b&&t){t.textContent=msg;b.classList.add('show');}
}
// Oculta ambos banners (error y éxito) quitando la clase .show
function authHideBanners(){
  document.getElementById('auth-error-banner')?.classList.remove('show');
  document.getElementById('auth-success-banner')?.classList.remove('show');
}

/* ── Field-level errors ── */
// Muestra error específico de un campo: texto rojo debajo del input y borde rojo en el input
function authFieldError(id, msg){
  const el=document.getElementById(id+'-err');
  const inp=document.getElementById(id);
  if(el){el.textContent=msg;el.classList.add('show');}
  if(inp) inp.classList.add('error');
}
// Limpia el error de un campo específico: quita texto de error y borde rojo
function authClearError(id){
  const el=document.getElementById(id+'-err');
  const inp=document.getElementById(id);
  if(el) el.classList.remove('show');
  if(inp) inp.classList.remove('error');
  authHideBanners();
}

/* ── Password toggle ── */
// Alterna el tipo del input entre 'password' (oculto) y 'text' (visible), cambia el ícono del ojo
function authTogglePw(fieldId, btn){
  const inp=document.getElementById(fieldId);
  if(!inp) return;
  const isText = inp.type==='text';
  inp.type = isText?'password':'text';
  btn.textContent = isText?'👁️':'🙈';
}

/* ── Password strength ── */
// Evalúa la fortaleza de la contraseña (longitud, mayúsculas, números, símbolos) y actualiza la barra visual
function authCheckStrength(pw){
  const wrap=document.getElementById('pw-strength-wrap');
  const bar=document.getElementById('pw-strength-bar');
  const lbl=document.getElementById('pw-strength-label');
  if(!wrap||!bar||!lbl) return;
  if(!pw){ wrap.classList.remove('show'); return; }
  wrap.classList.add('show');

  let score=0;
  if(pw.length>=8) score++;
  if(pw.length>=12) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;

  const levels=[
    {w:'15%',bg:'var(--red)',label:'Muy débil 🔴'},
    {w:'30%',bg:'var(--orange)',label:'Débil 🟠'},
    {w:'55%',bg:'var(--yellow)',label:'Regular 🟡'},
    {w:'78%',bg:'var(--teal)',label:'Buena 🟢'},
    {w:'100%',bg:'var(--green)',label:'Excelente 💚'},
  ];
  const lvl=levels[Math.min(score,4)];
  bar.style.width=lvl.w;
  bar.style.background=lvl.bg;
  lbl.textContent=lvl.label;
  lbl.style.color=lvl.bg;
}

/* ── Validation ── */
// Valida formato de email con regex; retorna true si tiene formato user@domain.ext
function _validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) }
// Valida que el nombre tenga entre 2 y 24 caracteres
function _validName(n){ return n.trim().length>=2 && n.trim().length<=24 }

/* ── Loading state ── */
// Activa/desactiva el estado de carga de un botón CTA (spinner visible, botón deshabilitado)
function _authSetLoading(btnId, on){
  const btn=document.getElementById(btnId);
  if(btn){ btn.classList.toggle('loading',on); btn.disabled=on; }
}

/* ══ REGISTER ══ */
// Valida todos los campos del formulario de registro y crea la cuenta si son correctos
function doRegister(){
  authHideBanners();
  let ok=true;

  const name=(document.getElementById('reg-name')?.value||'').trim();
  const email=(document.getElementById('reg-email')?.value||'').trim().toLowerCase();
  const pass=document.getElementById('reg-pass')?.value||'';
  const pass2=document.getElementById('reg-pass2')?.value||'';
  const terms=document.getElementById('reg-terms')?.checked;

  if(!_validName(name)){authFieldError('reg-name','El nombre debe tener entre 2 y 24 caracteres');ok=false;}
  if(!_validEmail(email)){authFieldError('reg-email','Ingresa un correo electrónico válido');ok=false;}
  if(pass.length<8){authFieldError('reg-pass','La contraseña debe tener al menos 8 caracteres');ok=false;}
  if(pass!==pass2){authFieldError('reg-pass2','Las contraseñas no coinciden');ok=false;}
  if(!terms){authFieldError('reg-terms','Debes aceptar los términos para continuar');ok=false;}
  if(!ok) return;

  // Check if email already exists
  const db=_authGetDB();
  if(!db.users) db.users=[];
  if(db.users.some(u=>u.email===email)){
    authShowError('Ya existe una cuenta con ese correo. Inicia sesión.');
    return;
  }

  _authSetLoading('reg-cta',true);
  setTimeout(()=>{
    const newUser={
      id:'u_'+Date.now(),
      name,email,
      password:_hashSimple(pass),
      avatar:_authSelectedAvatar,
      createdAt:new Date().toISOString(),
    };
    db.users.push(newUser);
    _authSaveDB(db);

    const session={email, name, avatar:_authSelectedAvatar, guest:false, id:newUser.id};
    _authSaveSession(session);
    _authSetLoading('reg-cta',false);
    authShowSuccess('¡Cuenta creada! Bienvenid@ a safeXP 🎉');
    setTimeout(()=>authEnterApp(session, true), 900);
  },700);
}

/* ══ LOGIN ══ */
// Valida email/contraseña, busca el usuario en la DB local y crea la sesión si coincide
function doLogin(){
  authHideBanners();
  let ok=true;

  const email=(document.getElementById('login-email')?.value||'').trim().toLowerCase();
  const pass=document.getElementById('login-pass')?.value||'';

  if(!_validEmail(email)){authFieldError('login-email','Ingresa un correo electrónico válido');ok=false;}
  if(!pass){authFieldError('login-pass','Ingresa tu contraseña');ok=false;}
  if(!ok) return;

  _authSetLoading('login-cta',true);
  setTimeout(()=>{
    const db=_authGetDB();
    const user=(db.users||[]).find(u=>u.email===email && u.password===_hashSimple(pass));
    if(!user){
      _authSetLoading('login-cta',false);
      authShowError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
      document.getElementById('login-pass').value='';
      return;
    }
    const session={email:user.email, name:user.name, avatar:user.avatar, guest:false, id:user.id};
    _authSaveSession(session);
    _authSetLoading('login-cta',false);
    authEnterApp(session, false);
  },600);
}

/* ══ GUEST ══ */
// Crea una sesión de invitado temporal sin persistencia de progreso
function doGuestLogin(){
  const session={email:'', name:'Invitado', avatar:'👤', guest:true, id:'guest_'+Date.now()};
  // Don't persist guest session
  authEnterApp(session, false);
}

/* ══ FORGOT PASSWORD ══ */
// Simula el flujo de recuperación de contraseña (en producción enviaría un email real)
function authForgotPassword(){
  const email=(document.getElementById('login-email')?.value||'').trim().toLowerCase();
  if(!_validEmail(email)){
    authFieldError('login-email','Ingresa tu correo primero para recuperar la contraseña');
    return;
  }
  const db=_authGetDB();
  const exists=(db.users||[]).some(u=>u.email===email);
  // Always show same message (security)
  authShowSuccess('Si ese correo está registrado, recibirás instrucciones. (Demo: revisa consola)');
  if(exists) console.info('[safeXP dev] Password reset for:',email,'— implement email flow server-side');
}

/* ══ ENTER APP ══ */
// Oculta la pantalla de auth, aplica datos del usuario al gs y carga progreso guardado
function authEnterApp(session, isNew){
  // Hide auth screen
  const authScreen=document.getElementById('auth-screen');
  if(authScreen) authScreen.classList.add('hidden');

  // Apply session data to game state
  if(session.name && session.name!=='Invitado'){
    gs.profile.name = session.name;
  }
  if(session.avatar){
    gs.profile.avatar = session.avatar;
  }

  // If returning user, load their saved progress
  if(!session.guest && !isNew){
    const savedKey = 'safexp_v1_'+session.id;
    try{
      const saved=localStorage.getItem(savedKey)||localStorage.getItem(LS);
      if(saved){const parsed=JSON.parse(saved);gs={...gs,...parsed}; if(!gs.profile.cosmetics) gs.profile.cosmetics={frame:'frame_none',title:'title_none'};}
    }catch(e){}
  }

  // Show topbar avatar
  _authUpdateTopbarAvatar(session);

  // Update topbar
  updateTopBar();
  renderHome();

  // If brand new user, show welcome toast
  if(isNew){
    setTimeout(()=>showToast('¡Bienvenid@ '+session.name+'! 🎉 Empieza tu primera lección.'),1200);
  }
}

/* ── Show user avatar in topbar ── */
// Crea e inserta el botón de avatar del usuario en la barra superior tras el login
function _authUpdateTopbarAvatar(session){
  let wrap=document.getElementById('tb-user-avatar-wrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='tb-user-avatar-wrap';wrap.className='show';
    wrap.style.alignItems='center';
    const btn=document.createElement('button');
    btn.id='tb-user-avatar';
    btn.title=(session.guest?'Invitado':'Mi perfil')+' • '+session.name;
    btn.setAttribute('aria-label','Perfil de usuario');
    btn.textContent=session.avatar;
    btn.onclick=()=>{ if(!session.guest) showTab('profile'); else { if(confirm('¿Salir del modo invitado?')) authLogout(); } };
    wrap.appendChild(btn);
    // Insert before dev-btn in topbar-right
    const tbRight=document.querySelector('.topbar-right');
    if(tbRight) tbRight.prepend(wrap);
  }
  const btn=document.getElementById('tb-user-avatar');
  if(btn){ btn.textContent=session.avatar; btn.title=session.name; }
}

/* ══ LOGOUT ══ */
// Cierra sesión: limpia localStorage, resetea el estado gs y vuelve a mostrar la pantalla de auth
function authLogout(){
  if(!confirm('¿Cerrar sesión?')) return;
  _authClearSession();
  // Reset game state to defaults
  gs.xp=0;gs.streak=0;gs.gems=0;gs.hearts=5;gs.completedActs={};
  gs.lastHeartRefill=Date.now();gs.placementDone=false;gs.placementLevel='básico';
  gs.dailyDone=false;gs.dailyDate='';gs.dailyStreak=0;gs.badges=[];gs.rankingName='';
  gs.profile={name:'Aprendiz',avatar:'🧑‍💻',bio:'',cosmetics:{frame:'frame_none',title:'title_none'}};
  document.getElementById('tb-user-avatar-wrap')?.remove();
  const authScreen=document.getElementById('auth-screen');
  if(authScreen){ authScreen.classList.remove('hidden'); authHideBanners(); }
  authSwitchTab('login');
}

/* Expose logout globally for profile tab */
window.authLogout=authLogout;

/* ── showCosmeticPicker ──
   La función es referenciada en el renderizado del perfil pero no estaba
   definida en el proyecto original. Muestra/colapsa el panel de cosméticos. */
// Muestra/oculta el panel de cosméticos en la pestaña de perfil y auto-carga la pestaña 'frames'
function showCosmeticPicker(){
  const zone=document.getElementById('cosmetic-picker-zone');
  if(!zone) return;
  const isHidden=zone.style.display==='none'||zone.style.display==='';
  zone.style.display=isHidden?'block':'none';
  if(isHidden){
    zone.scrollIntoView({behavior:'smooth',block:'nearest'});
    // Auto-render the first tab (frames)
    const firstTabBtn=zone.querySelector('.cosmetic-tab');
    showCosmeticTab('frames', firstTabBtn);
  }
}
window.showCosmeticPicker=showCosmeticPicker;

/* ── showCosmeticTab ──
   Renderiza el contenido de marcos o títulos dentro del cosmetic-picker-zone.
   Era referenciada en renderProfileTab pero nunca fue definida. */
// Renderiza el contenido de marcos o títulos en el picker de cosméticos
function showCosmeticTab(type, btnEl){
  // Update tab active state
  const tabBtns = document.querySelectorAll('.cosmetic-tab');
  tabBtns.forEach(b => b.classList.remove('active'));
  if(btnEl) btnEl.classList.add('active');

  const container = document.getElementById('cosmetic-content');
  if(!container) return;

  const items = COSMETICS[type === 'frames' ? 'frames' : 'titles'] || [];
  const equippedId = gs.profile.cosmetics?.[type === 'frames' ? 'frame' : 'title'] || (type === 'frames' ? 'frame_none' : 'title_none');

  let html = '<div class="cosmetic-grid">';
  items.forEach(item => {
    const unlocked = isCosmeticUnlocked(item);
    const equipped  = item.id === equippedId;
    const cls = ['cosmetic-item',
      equipped  ? 'cosmetic-equipped' : '',
      !unlocked ? 'cosmetic-locked'   : ''
    ].filter(Boolean).join(' ');

    const storageKey = type === 'frames' ? 'frame' : 'title';
    const clickHandler = unlocked
      ? `onclick="equipCosmetic('${storageKey}','${item.id}')" style="cursor:pointer"`
      : `onclick="showToast('${item.unlockDesc} 🔒')" style="cursor:pointer"`;

    html += `<div class="${cls}" ${clickHandler} title="${item.unlockDesc}">
      ${!unlocked ? '<span class="cosmetic-lock-icon">🔒</span>' : ''}
      <div class="cosmetic-preview" style="color:${item.color}">${item.preview}</div>
      <div class="cosmetic-name">${item.name}</div>
      ${equipped ? '<div style="font-size:.55rem;color:var(--green);font-weight:900;margin-top:1px">✓ Equipado</div>' : ''}
    </div>`;
  });
  html += '</div>';

  // Hint below grid
  if(type === 'frames'){
    html += '<div class="cosmetic-unlock-hint">💡 Desbloquea marcos completando unidades y logrando hitos de XP</div>';
  } else {
    html += '<div class="cosmetic-unlock-hint">💡 Desbloquea títulos completando unidades y retos diarios</div>';
  }

  container.innerHTML = html;
}
window.showCosmeticTab = showCosmeticTab;




/* ══════════════════════════════════════════════════════════
   PANEL DE TEORÍA Y PREGUNTAS — safeXP
   Drawer lateral que muestra todas las preguntas de la
   actividad activa con teoría, tipo y respuesta correcta.
══════════════════════════════════════════════════════════ */

/* Track which questions have been answered and with what result */
window._theoryAnswered = {}; // key: qIdx -> 'correct'|'wrong'

/* Called from choiceClick, tfClick, pairTap, checkSort after answer */
// Registra si una pregunta fue respondida correcta/incorrectamente y actualiza la tarjeta en el panel
function theoryMarkAnswer(qIdx, correct){
  window._theoryAnswered[qIdx] = correct ? 'correct' : 'wrong';
  // Refresh card status if panel is open
  const panel = document.getElementById('theory-panel');
  if(panel && panel.classList.contains('open')){
    const card = document.querySelector('.th-q-card[data-qidx="'+qIdx+'"]');
    if(card){
      card.classList.remove('answered-correct','answered-wrong','current');
      card.classList.add(correct ? 'answered-correct' : 'answered-wrong');
      const numEl = card.querySelector('.th-q-num');
      if(numEl) numEl.textContent = correct ? '✓' : '✗';
      const statEl = card.querySelector('.th-q-status');
      if(statEl) statEl.textContent = correct ? '✅' : '❌';
    }
  }
  _theoryUpdateProgress();
}

// Calcula el % de preguntas respondidas y actualiza la barra de progreso del panel de teoría
function _theoryUpdateProgress(){
  const qs = (curUnit && curUnit.activities && curUnit.activities[curActIdx])
    ? curUnit.activities[curActIdx].questions : [];
  const total = qs.length;
  const done = Object.keys(window._theoryAnswered).length;
  const pct = total ? Math.round(done/total*100) : 0;
  const fill = document.getElementById('theory-prog-fill');
  const lbl  = document.getElementById('theory-prog-label');
  if(fill) fill.style.width = pct+'%';
  if(lbl)  lbl.textContent  = done+' / '+total+' respondidas';
}

/* ── Open ── */
// Abre el drawer de teoría: renderiza las tarjetas, actualiza progreso y hace scroll a la pregunta actual
function openTheoryPanel(){
  const qs = (curUnit && curUnit.activities && curUnit.activities[curActIdx])
    ? curUnit.activities[curActIdx].questions : [];

  const titleEl = document.getElementById('theory-panel-title');
  const subEl   = document.getElementById('theory-panel-sub');
  if(titleEl && curUnit) titleEl.textContent = curUnit.activities[curActIdx]?.title || 'Teoría';
  if(subEl) subEl.textContent = qs.length + ' pregunta' + (qs.length!==1?'s':'') + ' · toca cada una para expandir';

  _theoryRenderList(qs);
  _theoryUpdateProgress();

  const panel = document.getElementById('theory-panel');
  if(panel) panel.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Scroll to current question
  setTimeout(()=>{
    const cur = document.querySelector('.th-q-card.current');
    if(cur) cur.scrollIntoView({behavior:'smooth', block:'center'});
  }, 350);
}

/* ── Close ── */
// Cierra el drawer de teoría con animación y restaura el scroll del body
function closeTheoryPanel(){
  const panel = document.getElementById('theory-panel');
  if(panel) panel.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Render list ── */
// Renderiza todas las tarjetas de preguntas en el panel: número, estado, tipo, teoría y respuesta correcta
function _theoryRenderList(qs){
  const list = document.getElementById('theory-list');
  if(!list) return;
  list.innerHTML = '';

  const TYPE_META = {
    choice:  { label:'Opción múltiple', icon:'🖱️', bg:'var(--bs)', color:'var(--bd)' },
    tf:      { label:'Verdadero / Falso', icon:'✅', bg:'var(--os,#fff3e0)', color:'var(--od,#cc7000)' },
    pair:    { label:'Relacionar pares', icon:'🔗', bg:'var(--ps)', color:'var(--pd)' },
    sort:    { label:'Ordenar pasos', icon:'↕️', bg:'var(--ts)', color:'var(--td)' },
    scenario:{ label:'Escenario real', icon:'📧', bg:'var(--ys)', color:'var(--yd)' },
  };

  qs.forEach((q, idx) => {
    const meta = TYPE_META[q.type] || { label: q.type, icon:'❓', bg:'var(--border)', color:'var(--text)' };
    const status = window._theoryAnswered[idx];
    const isCurrent = idx === curQIdx;
    const isExpanded = isCurrent; // auto-expand current

    const card = document.createElement('div');
    card.className = 'th-q-card' +
      (isCurrent ? ' current' : '') +
      (status === 'correct' ? ' answered-correct' : '') +
      (status === 'wrong'   ? ' answered-wrong'   : '') +
      (isExpanded ? ' expanded' : '');
    card.setAttribute('data-qidx', idx);

    const numDisplay = status === 'correct' ? '✓' : status === 'wrong' ? '✗' : (idx+1);
    const statusIcon = status === 'correct' ? '✅' : status === 'wrong' ? '❌' : isCurrent ? '👉' : '⬜';

    // Build correct answer string
    let answerHTML = '';
    if(q.type === 'choice'){
      const correct = q.choices?.find(c => c.ok);
      if(correct) answerHTML = `<span class="th-answer-correct">✓ ${correct.e || ''} ${correct.t}</span>`;
    } else if(q.type === 'tf'){
      answerHTML = `<span class="th-answer-correct">✓ ${q.ans ? 'VERDADERO' : 'FALSO'}</span>`;
    } else if(q.type === 'pair'){
      answerHTML = q.left?.map((l,i) =>
        `<div style="font-size:.75rem;padding:.15rem 0;color:var(--text)"><strong>${l}</strong> → ${q.right?.[q.pairs?.[i]?.[1] ?? i] || q.right?.[i] || ''}</div>`
      ).join('') || '';
    } else if(q.type === 'sort'){
      answerHTML = q.correct?.map((itemIdx,i) =>
        `<div style="font-size:.75rem;padding:.1rem 0;color:var(--text)"><strong>${i+1}.</strong> ${q.items?.[itemIdx] ?? itemIdx}</div>`
      ).join('') || q.items?.join(' → ') || '';
    } else if(q.type === 'scenario'){
      const sc = q.scenario;
      answerHTML = sc?.verdict
        ? `<span class="th-answer-correct">✓ ${sc.verdict}</span>`
        : q.choices?.find(c=>c.ok)
          ? `<span class="th-answer-correct">✓ ${q.choices.find(c=>c.ok).t}</span>`
          : '<span style="color:var(--muted);font-size:.78rem">Analiza el escenario</span>';
    }

    card.innerHTML = `
      <div class="th-q-head" onclick="theoryToggleCard(this.parentElement)">
        <div class="th-q-num">${numDisplay}</div>
        <div class="th-q-info">
          ${isCurrent ? '<span class="th-current-badge">👁️ Actual</span><br>' : ''}
          <div class="th-q-title">${q.q || q.char || '—'}</div>
          <span class="th-q-type-badge" style="background:${meta.bg};color:${meta.color}">${meta.icon} ${meta.label}</span>
        </div>
        <span class="th-q-status">${statusIcon}</span>
        <span class="th-q-chevron">▶</span>
      </div>
      <div class="th-q-body">
        ${q.theory ? `
        <div class="th-theory-block">
          <div class="th-theory-label">📚 Concepto clave</div>
          <div class="th-theory-text">${q.theory}</div>
        </div>` : ''}
        ${answerHTML ? `
        <div class="th-answer-block">
          <div class="th-answer-label">✅ Respuesta correcta</div>
          <div class="th-answer-text">${answerHTML}</div>
        </div>` : ''}
        ${q.explain ? `
        <div class="th-explain-block">
          <div class="th-explain-text">💡 ${q.explain}</div>
        </div>` : ''}
      </div>`;

    list.appendChild(card);
  });
}

/* ── Toggle expand card ── */
// Expande o colapsa una tarjeta del panel de teoría al hacer clic en su cabecera
window.theoryToggleCard=function theoryToggleCard(card){
  const wasExpanded = card.classList.contains('expanded');
  // Collapse all
  document.querySelectorAll('.th-q-card.expanded').forEach(c => c.classList.remove('expanded'));
  // Expand if it wasn't
  if(!wasExpanded) card.classList.add('expanded');
}

/* ── Keyboard: close on Escape ── */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    const panel = document.getElementById('theory-panel');
    if(panel && panel.classList.contains('open')){ closeTheoryPanel(); e.stopPropagation(); }
  }
});

/* Reset answers tracker when starting a new lesson */
// (auth init calls authInit() below — startLesson already patched inline above)


/* ══════════════════════════════════════════════════════════════
   ZONA SOCIAL — safeXP
   Feed de actividad, mensajes directos, compartir progreso
══════════════════════════════════════════════════════════════ */

/* ── Datos del feed (mock — en prod viene del backend) ── */
let SOCIAL_FEED = [
  {
    id:'fe1', authorId:'f1', author:'CyberNinja', avatar:'🥷', online:true,
    time:'hace 5 min', type:'unit_done',
    content:{unit:'🎣 Phishing', pct:100},
    reactions:{liked:false, fire:false, clap:false, wow:false},
    reactionCounts:{liked:4, fire:2, clap:1, wow:0},
    comments:[
      {author:'SecureHawk', avatar:'🦅', text:'¡Excelente! Yo tardé el doble 😅'}
    ]
  },
  {
    id:'fe2', authorId:'f2', author:'SecureHawk', avatar:'🦅', online:false,
    time:'hace 32 min', type:'badge',
    content:{badge:'🏆 Caza-Phishing', desc:'Completó todas las actividades de phishing'},
    reactions:{liked:false, fire:false, clap:false, wow:false},
    reactionCounts:{liked:6, fire:3, clap:4, wow:1},
    comments:[]
  },
  {
    id:'fe3', authorId:'f3', author:'CipherFox', avatar:'🦊', online:true,
    time:'hace 1 h', type:'streak',
    content:{days:7},
    reactions:{liked:false, fire:true, clap:false, wow:false},
    reactionCounts:{liked:2, fire:8, clap:1, wow:0},
    comments:[
      {author:'CyberNinja', avatar:'🥷', text:'¡7 días seguidos! 🔥 Sigue así'},
      {author:'DataShield',  avatar:'🛡️', text:'Yo llegué a 14, tú puedes!'}
    ]
  },
  {
    id:'fe4', authorId:'f4', author:'DataShield', avatar:'🛡️', online:false,
    time:'hace 3 h', type:'progress',
    content:{label:'Contraseñas', pct:60, xp:480},
    reactions:{liked:false, fire:false, clap:false, wow:false},
    reactionCounts:{liked:1, fire:0, clap:2, wow:0},
    comments:[]
  },
  {
    id:'fe5', authorId:'f3', author:'CipherFox', avatar:'🦊', online:true,
    time:'hace 5 h', type:'duel_win',
    content:{vs:'ByteWolf', score:'4-2'},
    reactions:{liked:false, fire:false, clap:false, wow:false},
    reactionCounts:{liked:3, fire:1, clap:2, wow:0},
    comments:[]
  },
];

/* ── Mensajes directos (mock) ── */
let MSG_THREADS = {
  f1: {
    friend: null, // filled from friendsData
    unread: 2,
    messages: [
      {mine:false, text:'¡Oye! ¿Terminaste el módulo de redes?', time:'10:21'},
      {mine:true,  text:'Casi, me falta una actividad 😅', time:'10:22'},
      {mine:false, text:'¿Jugamos un duelo rápido cuando termines?', time:'10:23'},
      {mine:false, text:'Tengo racha de 3 victorias seguidas 😈', time:'10:23'},
    ]
  },
  f2: {
    friend: null,
    unread: 0,
    messages: [
      {mine:true,  text:'Buen partido ayer ⚔️', time:'Ayer'},
      {mine:false, text:'¡Gracias! Estaba en racha jaja', time:'Ayer'},
      {mine:true,  text:'Revancha pronto 💪', time:'Ayer'},
    ]
  },
  f3: {
    friend: null,
    unread: 1,
    messages: [
      {mine:false, text:'Acabo de compartir mi progreso en el feed', time:'09:14'},
      {mine:false, text:'¡Míralo!', time:'09:14'},
      {mine:false, type:'progress_card', data:{xp:620, streak:3, units:3}, time:'09:15'},
    ]
  },
  f4: {
    friend: null,
    unread: 0,
    messages: [
      {mine:true, text:'Bienvenido a safeXP! 🛡️', time:'Ayer'},
    ]
  },
};

let _activeMsgThread = null; // friend id of open conversation

/* ── Llenar referencias de amigos en threads ── */
// Rellena la referencia .friend en cada hilo de mensajes buscando en friendsData
function _socialInitThreads(){
  if(typeof friendsData==='undefined'||!friendsData) return;
  Object.keys(MSG_THREADS).forEach(id=>{
    MSG_THREADS[id].friend = friendsData.find(f=>f.id===id) || null;
  });
}

/* ══════════════════════════════
   RENDER FRIENDS TAB (REPLACED)
   Ahora incluye sub-tabs: Feed / Amigos / Mensajes
══════════════════════════════ */
// Renderiza la pestaña social completa: crea los 4 sub-tabs (Feed/Amigos/Mensajes/Compartir) y sus paneles
function renderFriendsTab(){
  const el = document.getElementById('tab-friends');
  if(!el) return;
  _socialInitThreads();

  const myFriends  = friendsData.filter(f=>f.status==='friend');
  const pendingIn  = friendsData.filter(f=>f.status==='pending_in');
  const pendingOut = friendsData.filter(f=>f.status==='pending_out');
  const onlineCount= myFriends.filter(f=>f.online).length;
  const totalUnread= Object.values(MSG_THREADS).reduce((s,t)=>s+(t.unread||0),0);

  // Nav notification dot
  const navFriends = document.getElementById('nav-friends');
  if(navFriends){
    let dot = navFriends.querySelector('.nav-notif');
    const hasNotif = pendingIn.length > 0 || totalUnread > 0;
    if(hasNotif && !dot){
      dot = document.createElement('span'); dot.className='nav-notif';
      navFriends.style.position='relative'; navFriends.appendChild(dot);
    } else if(!hasNotif && dot) dot.remove();
  }

  el.innerHTML = '';

  // ── Sub-tabs ──
  const tabsBar = document.createElement('div');
  tabsBar.className = 'social-tabs';
  const SOCIAL_SUBTABS = [
    {id:'feed',     icon:'📰', label:'Feed'},
    {id:'friends',  icon:'👥', label:'Amigos'+(pendingIn.length?` <span style="background:var(--orange);color:#fff;border-radius:99px;padding:0 5px;font-size:.55rem">${pendingIn.length}</span>`:'')},
    {id:'messages', icon:'💬', label:'Mensajes'+(totalUnread?` <span style="background:var(--blue);color:#fff;border-radius:99px;padding:0 5px;font-size:.55rem">${totalUnread}</span>`:'')},
    {id:'share',    icon:'📊', label:'Compartir'},
  ];
  SOCIAL_SUBTABS.forEach((t,i)=>{
    const btn = document.createElement('button');
    btn.className = 'social-tab-btn' + (i===0?' active':'');
    btn.id = 'stab-'+t.id;
    btn.innerHTML = `<span class="st-icon">${t.icon}</span><span>${t.label}</span>`;
    btn.onclick = ()=>socialSwitchTab(t.id);
    tabsBar.appendChild(btn);
  });
  el.appendChild(tabsBar);

  // ── Panel: FEED ──
  const feedPanel = document.createElement('div');
  feedPanel.className = 'social-panel active'; feedPanel.id = 'spanel-feed';
  feedPanel.appendChild(_buildFeedPanel());
  el.appendChild(feedPanel);

  // ── Panel: AMIGOS ──
  const friendsPanel = document.createElement('div');
  friendsPanel.className = 'social-panel'; friendsPanel.id = 'spanel-friends';
  friendsPanel.appendChild(_buildFriendsPanel(myFriends, pendingIn, pendingOut, onlineCount));
  el.appendChild(friendsPanel);

  // ── Panel: MENSAJES ──
  const msgPanel = document.createElement('div');
  msgPanel.className = 'social-panel'; msgPanel.id = 'spanel-messages';
  msgPanel.appendChild(_buildMessagesPanel(myFriends));
  el.appendChild(msgPanel);

  // ── Panel: COMPARTIR ──
  const sharePanel = document.createElement('div');
  sharePanel.className = 'social-panel'; sharePanel.id = 'spanel-share';
  sharePanel.appendChild(_buildSharePanel());
  el.appendChild(sharePanel);
}

/* ── Switch de sub-tabs ── */
// Alterna entre los sub-tabs sociales: activa el panel correspondiente y marca el botón activo
window.socialSwitchTab=function socialSwitchTab(id){
  document.querySelectorAll('.social-tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.social-panel').forEach(p=>p.classList.remove('active'));
  const btn = document.getElementById('stab-'+id);
  const panel = document.getElementById('spanel-'+id);
  if(btn) btn.classList.add('active');
  if(panel) panel.classList.add('active');
}

/* ══════════════════════════════
   PANEL: FEED
══════════════════════════════ */
// Construye el panel del feed: botón 'Publicar mi progreso' + tarjetas de actividad de amigos
function _buildFeedPanel(){
  const wrap = document.createElement('div');

  // Botón "Publicar mi progreso"
  const postBtn = document.createElement('button');
  postBtn.className = 'share-progress-btn';
  postBtn.innerHTML = '📊 Publicar mi progreso en el feed';
  postBtn.onclick = ()=> openShareProgressModal('feed');
  wrap.appendChild(postBtn);

  // Feed cards
  const feedWrap = document.createElement('div');
  feedWrap.className = 'feed-wrap';
  SOCIAL_FEED.forEach(item=> feedWrap.appendChild(_buildFeedCard(item)));
  wrap.appendChild(feedWrap);
  return wrap;
}

// Construye una tarjeta del feed: cabecera, bloque de contenido según tipo, reacciones y comentarios
function _buildFeedCard(item){
  const card = document.createElement('div');
  card.className = 'feed-card'; card.id = 'feed-card-'+item.id;

  // Header
  const head = document.createElement('div'); head.className = 'feed-head';
  const av = document.createElement('div'); av.className = 'feed-av'; av.textContent = item.avatar;
  if(item.online){ const pip=document.createElement('div'); pip.className='feed-online-pip'; av.appendChild(pip); }
  const meta = document.createElement('div'); meta.className = 'feed-meta';

  const TYPE_LABELS = {
    unit_done:  {label:'Módulo completado', color:'var(--green)',  bg:'var(--gs)', icon:'✅'},
    badge:      {label:'Logro desbloqueado', color:'var(--yellow)', bg:'var(--ys)', icon:'🏆'},
    streak:     {label:'Racha épica',        color:'var(--orange)', bg:'var(--os)', icon:'🔥'},
    progress:   {label:'Progreso',           color:'var(--blue)',   bg:'var(--bs)', icon:'📈'},
    duel_win:   {label:'Duelo ganado',       color:'var(--purple)', bg:'var(--ps)', icon:'⚔️'},
    shared_prog:{label:'Compartió progreso', color:'var(--teal)',   bg:'var(--ts)', icon:'📊'},
  };
  const tl = TYPE_LABELS[item.type] || {label:item.type, color:'var(--muted)', bg:'var(--bg)', icon:'ℹ️'};
  const badge = `<span class="feed-type-badge" style="background:${tl.bg};color:${tl.color}">${tl.icon} ${tl.label}</span>`;

  meta.innerHTML = `<div class="feed-author">${item.author} ${badge}</div><div class="feed-time">${item.time}</div>`;
  head.appendChild(av); head.appendChild(meta);
  card.appendChild(head);

  // Content block
  const body = document.createElement('div');
  if(item.type === 'unit_done'){
    body.innerHTML = `<div class="feed-unit-done"><span class="feed-unit-icon">${item.content.unit.split(' ')[0]}</span><div class="feed-unit-text">Completó el módulo <strong>${item.content.unit}</strong> con un 100% ✨</div></div>`;
  } else if(item.type === 'badge'){
    body.innerHTML = `<div class="feed-achievement"><span class="feed-achievement-icon">${item.content.badge.split(' ')[0]}</span><div><div class="feed-achievement-text">Desbloqueó el logro<br><strong>${item.content.badge.split(' ').slice(1).join(' ')}</strong></div><div class="feed-achievement-sub">${item.content.desc}</div></div></div>`;
  } else if(item.type === 'streak'){
    body.innerHTML = `<div class="feed-streak"><span class="feed-streak-flame">🔥</span><div class="feed-streak-text">¡Racha de <strong>${item.content.days} días</strong> consecutivos! Sin parar.</div></div>`;
  } else if(item.type === 'progress'){
    body.innerHTML = `<div class="feed-progress"><div class="feed-progress-title">📈 Progreso en ${item.content.label}</div><div class="feed-progress-bar"><div class="feed-progress-fill" style="width:${item.content.pct}%"></div></div><div class="feed-progress-meta"><span>${item.content.pct}% completado</span><span>⚡ ${item.content.xp} XP</span></div></div>`;
  } else if(item.type === 'duel_win'){
    body.innerHTML = `<div class="feed-unit-done"><span class="feed-unit-icon">⚔️</span><div class="feed-unit-text">¡Ganó un duelo contra <strong>${item.content.vs}</strong>!<br><span style="font-size:.75rem;opacity:.8">Puntuación: ${item.content.score}</span></div></div>`;
  } else if(item.type === 'shared_prog'){
    const d = item.content;
    body.innerHTML = `<div class="msg-progress-card"><div class="msg-progress-card-title">📊 Mi progreso en safeXP</div><div class="msg-progress-card-stat"><span>⚡ ${d.xp} XP</span><span>🔥 ${d.streak} días</span><span>🏆 ${d.units} módulos</span></div></div>`;
  }
  card.appendChild(body);

  // Reactions
  const reactionsDiv = document.createElement('div'); reactionsDiv.className = 'feed-reactions';
  const REACTIONS = [
    {key:'liked', emoji:'👍'}, {key:'fire', emoji:'🔥'}, {key:'clap', emoji:'👏'}, {key:'wow', emoji:'😮'}
  ];
  REACTIONS.forEach(r=>{
    const btn = document.createElement('button');
    btn.className = 'reaction-btn' + (item.reactions[r.key]?' reacted':'');
    btn.innerHTML = `<span class="reaction-emoji">${r.emoji}</span><span class="reaction-count">${item.reactionCounts[r.key]||0}</span>`;
    btn.onclick = ()=> _toggleReaction(item.id, r.key, btn);
    reactionsDiv.appendChild(btn);
  });

  // Comments toggle
  const commentsToggle = document.createElement('button');
  commentsToggle.className = 'reaction-btn';
  commentsToggle.innerHTML = `💬 <span class="reaction-count">${item.comments.length}</span>`;
  commentsToggle.onclick = ()=>{
    const cSection = card.querySelector('.comments-section');
    if(cSection) cSection.style.display = cSection.style.display==='none'?'block':'none';
  };
  reactionsDiv.appendChild(commentsToggle);
  card.appendChild(reactionsDiv);

  // Comments section
  const commentsSec = document.createElement('div');
  commentsSec.className = 'comments-section';
  commentsSec.style.display = item.comments.length ? 'block' : 'none';

  if(item.comments.length){
    const commentsList = document.createElement('div'); commentsList.className = 'feed-comments-list';
    item.comments.forEach(c=>{
      commentsList.innerHTML += `<div class="feed-comment"><div class="feed-comment-av">${c.avatar}</div><div class="feed-comment-bubble"><div class="feed-comment-name">${c.author}</div>${c.text}</div></div>`;
    });
    commentsSec.appendChild(commentsList);
  }

  // Comment input
  const commentRow = document.createElement('div'); commentRow.className = 'feed-comment-row';
  const cInput = document.createElement('input'); cInput.className='feed-comment-input'; cInput.placeholder='Añade un comentario…'; cInput.maxLength=120;
  cInput.onkeydown = e=>{ if(e.key==='Enter') _postComment(item.id, cInput, commentsSec); };
  const cSend = document.createElement('button'); cSend.className='feed-comment-send'; cSend.innerHTML='➤';
  cSend.onclick = ()=> _postComment(item.id, cInput, commentsSec);
  commentRow.appendChild(cInput); commentRow.appendChild(cSend);
  commentsSec.appendChild(commentRow);
  card.appendChild(commentsSec);

  return card;
}

// Alterna la reacción del usuario en un post: incrementa/decrementa el contador y actualiza el botón
window["_toggleReaction"]=function _toggleReaction(feedId, key, btn){
  const item = SOCIAL_FEED.find(f=>f.id===feedId); if(!item) return;
  item.reactions[key] = !item.reactions[key];
  item.reactionCounts[key] = Math.max(0, item.reactionCounts[key] + (item.reactions[key]?1:-1));
  btn.classList.toggle('reacted', item.reactions[key]);
  btn.querySelector('.reaction-count').textContent = item.reactionCounts[key];
}

// Agrega un comentario a un post del feed y lo renderiza en el DOM inmediatamente
window["_postComment"]=function _postComment(feedId, input, section){
  const text = input.value.trim(); if(!text) return;
  const item = SOCIAL_FEED.find(f=>f.id===feedId); if(!item) return;
  const comment = {author: gs.profile.name||'Yo', avatar: gs.profile.avatar||'🧑‍💻', text};
  item.comments.push(comment);
  input.value='';
  let list = section.querySelector('.feed-comments-list');
  if(!list){ list=document.createElement('div'); list.className='feed-comments-list'; section.insertBefore(list, section.querySelector('.feed-comment-row')); }
  list.innerHTML += `<div class="feed-comment"><div class="feed-comment-av">${comment.avatar}</div><div class="feed-comment-bubble"><div class="feed-comment-name">${comment.author}</div>${comment.text}</div></div>`;
  section.style.display='block';
  // Update comment count button
  const card = document.getElementById('feed-card-'+feedId);
  if(card){ const countEl=card.querySelectorAll('.reaction-count'); if(countEl.length>=5) countEl[4].textContent=item.comments.length; }
}

/* ══════════════════════════════
   PANEL: AMIGOS (restructured)
══════════════════════════════ */
// Construye el panel de amigos: stats, código de invitación, búsqueda, solicitudes y listas
function _buildFriendsPanel(myFriends, pendingIn, pendingOut, onlineCount){
  const wrap = document.createElement('div');
  const myCode='SAFE-'+(gs.profile.name.substring(0,3).toUpperCase())+'-'+String(gs.xp).padStart(4,'0');

  // Stats row
  const statsRow = document.createElement('div');
  statsRow.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-bottom:1rem';
  [{val:myFriends.length,lbl:'Amigos',icon:'👥',color:'var(--blue)'},
   {val:onlineCount,lbl:'En línea',icon:'🟢',color:'var(--green)'},
   {val:(typeof duelHistory!=='undefined'?Object.values(duelHistory).flat().filter(d=>d.result==='win').length:0),lbl:'Victorias',icon:'🏆',color:'var(--yellow)'}
  ].forEach(s=>{
    const box=document.createElement('div');
    box.style.cssText=`background:var(--white);border-radius:14px;padding:.7rem;text-align:center;border:2px solid var(--border)`;
    box.innerHTML=`<div style="font-size:1.2rem;font-weight:900;color:${s.color}">${s.icon} ${s.val}</div><div style="font-size:.62rem;color:var(--muted);font-weight:800;margin-top:2px">${s.lbl}</div>`;
    statsRow.appendChild(box);
  });
  wrap.appendChild(statsRow);

  // Invite code
  const shareBox = document.createElement('div'); shareBox.className='share-link-box';
  shareBox.innerHTML=`<div style="font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.3rem">🔗 Tu código de amigo</div><span class="share-link-code">${myCode}</span><div style="font-size:.68rem;color:var(--muted);margin:.3rem 0">Comparte este código para que te agreguen</div><div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.4rem"><button class="share-btn" style="background:var(--bs);color:var(--bd)" onclick="copyFriendCode('${myCode}')">📋 Copiar</button><button class="share-btn" style="background:#25D366;color:#fff" onclick="shareViaWhatsApp('${myCode}')">💬 WhatsApp</button><button class="share-btn" style="background:var(--ps);color:var(--pd)" onclick="shareViaOther('${myCode}')">🔗 Más opciones</button></div>`;
  wrap.appendChild(shareBox);

  // Search
  const searchSec = document.createElement('div');
  searchSec.innerHTML=`<div class="friends-section-title">🔍 Buscar jugador</div><div class="friends-search-bar"><input class="friends-search-input" id="friend-search-input" placeholder="Nombre o código SAFE-XXX-0000..." maxlength="30" oninput="debouncedSearch()" onkeydown="if(event.key==='Enter')searchFriend()"><button class="friends-search-btn" onclick="searchFriend()">Buscar</button></div><div id="friend-search-results"></div>`;
  wrap.appendChild(searchSec);

  // Pending incoming
  if(pendingIn.length){
    const pSec=document.createElement('div');
    const badge=`<span style="background:var(--orange);color:#fff;border-radius:99px;padding:1px 7px;font-size:.6rem;margin-left:.3rem">${pendingIn.length}</span>`;
    pSec.innerHTML=`<div class="friends-section-title" style="color:var(--orange)">📩 Solicitudes recibidas${badge}</div>`;
    const list=document.createElement('div');list.className='friends-list';
    pendingIn.forEach(f=>list.appendChild(buildFriendCard(f,'pending_in')));
    pSec.appendChild(list);wrap.appendChild(pSec);
  }

  // Online
  const onSec=document.createElement('div');
  onSec.innerHTML=`<div class="friends-section-title">🟢 En línea (${onlineCount})</div>`;
  const onList=document.createElement('div');onList.className='friends-list';
  myFriends.filter(f=>f.online).forEach(f=>onList.appendChild(buildFriendCard(f,'friend')));
  if(!myFriends.filter(f=>f.online).length) onList.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.8rem;padding:.5rem">Ningún amigo en línea ahora</div>';
  onSec.appendChild(onList);wrap.appendChild(onSec);

  // Offline
  const offFriends=myFriends.filter(f=>!f.online);
  if(offFriends.length){
    const offSec=document.createElement('div');
    offSec.innerHTML=`<div class="friends-section-title">⚫ Desconectados</div>`;
    const offList=document.createElement('div');offList.className='friends-list';
    offFriends.forEach(f=>offList.appendChild(buildFriendCard(f,'friend')));
    offSec.appendChild(offList);wrap.appendChild(offSec);
  }

  // Pending out
  if(pendingOut.length){
    const outSec=document.createElement('div');
    outSec.innerHTML=`<div class="friends-section-title" style="color:var(--muted)">⏳ Solicitudes enviadas</div>`;
    const outList=document.createElement('div');outList.className='friends-list';
    pendingOut.forEach(f=>outList.appendChild(buildFriendCard(f,'pending_out')));
    outSec.appendChild(outList);wrap.appendChild(outSec);
  }

  if(!myFriends.length&&!pendingIn.length){
    const empty=document.createElement('div');empty.className='friend-empty';
    empty.innerHTML='<span class="friend-empty-icon">👥</span>Aún no tienes amigos.<br>¡Busca jugadores o comparte tu código!';
    wrap.appendChild(empty);
  }
  return wrap;
}

/* ══════════════════════════════
   PANEL: MENSAJES
══════════════════════════════ */
// Construye la lista de hilos de mensajes directos ordenados por no leídos primero
function _buildMessagesPanel(myFriends){
  const wrap = document.createElement('div');
  const list = document.createElement('div'); list.className='msg-list';

  const myCode='SAFE-'+(gs.profile.name.substring(0,3).toUpperCase())+'-'+String(gs.xp).padStart(4,'0');

  // New message button
  const newMsgBtn = document.createElement('button');
  newMsgBtn.className='share-progress-btn'; newMsgBtn.style.marginBottom='.2rem';
  newMsgBtn.innerHTML='✏️ Nuevo mensaje';
  newMsgBtn.onclick=()=>showToast('Busca un amigo en la pestaña Amigos y escríbele desde allí 👆');
  wrap.appendChild(newMsgBtn);

  // Build threads sorted by unread first, then time
  const threads = Object.entries(MSG_THREADS)
    .map(([id,t])=>({id, ...t, friend: friendsData.find(f=>f.id===id)}))
    .filter(t=>t.friend && t.friend.status==='friend')
    .sort((a,b)=>(b.unread||0)-(a.unread||0));

  threads.forEach(t=>{
    if(!t.friend) return;
    const lastMsg = t.messages[t.messages.length-1];
    const preview = lastMsg ? (lastMsg.type==='progress_card'?'📊 Compartió su progreso': (lastMsg.mine?'Tú: ':'')+lastMsg.text) : '—';
    const div = document.createElement('div');
    div.className = 'msg-thread' + (t.unread?'  unread':'');
    div.innerHTML=`
      <div class="msg-thread-av">${t.friend.avatar}${t.friend.online?'<div class="friend-online-dot" style="width:9px;height:9px;bottom:1px;right:1px"></div>':''}</div>
      <div class="msg-thread-info">
        <div class="msg-thread-name">${t.friend.name}</div>
        <div class="msg-thread-preview">${preview}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem">
        <div class="msg-thread-time">${lastMsg?lastMsg.time:''}</div>
        ${t.unread?`<div class="msg-unread-badge">${t.unread}</div>`:''}
      </div>`;
    div.onclick = ()=> openMsgConversation(t.id);
    list.appendChild(div);
  });

  if(!threads.length){
    list.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.85rem;padding:2rem 0">💬 No hay mensajes aún.<br>¡Agrega amigos para chatear!</div>';
  }
  wrap.appendChild(list);
  return wrap;
}

/* ══════════════════════════════
   PANEL: COMPARTIR PROGRESO
══════════════════════════════ */
// Construye el panel de compartir: tarjeta de progreso + botones de compartir + logros recientes
function _buildSharePanel(){
  const wrap = document.createElement('div');
  const completedUnits = (typeof UNITS!=="undefined"&&UNITS?UNITS.filter(u=>getUnitProgress(u.id)===100).length:0);
  const totalWins = (typeof duelHistory!=='undefined'?Object.values(duelHistory).flat().filter(d=>d.result==='win').length:0);
  const rank = getCurrentRank(gs.xp);

  wrap.innerHTML = `
    <div style="background:var(--white);border-radius:16px;border:2px solid var(--border);padding:1rem;margin-bottom:.8rem;color:var(--text)">
      <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:.6rem">📊 Tu tarjeta de progreso</div>
      <div id="share-panel-preview"></div>
      <div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.85rem">
        <div style="display:flex;gap:.5rem">
          <button class="spm-share-btn whatsapp" style="flex:1" onclick="openShareProgressModal('whatsapp')">💬 WhatsApp</button>
          <button class="spm-share-btn twitter"  style="flex:1" onclick="openShareProgressModal('twitter')">🐦 Twitter/X</button>
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="spm-share-btn friends"  style="flex:1" onclick="openShareProgressModal('feed')">📰 Publicar en Feed</button>
          <button class="spm-share-btn copy"     style="flex:1" onclick="openShareProgressModal('copy')">📋 Copiar texto</button>
        </div>
      </div>
    </div>

    <div style="background:var(--white);border-radius:16px;border:2px solid var(--border);padding:1rem">
      <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:.6rem">🏆 Logros recientes para compartir</div>
      <div style="display:flex;flex-direction:column;gap:.5rem" id="share-badges-list"></div>
    </div>`;

  // Fill preview
  setTimeout(()=>{
    const prev = document.getElementById('share-panel-preview');
    if(prev) prev.appendChild(_buildProgressCard());
    const badgeList = document.getElementById('share-badges-list');
    if(badgeList){
      const recent = gs.badges.slice(-3);
      if(recent.length){
        recent.forEach(bid=>{
          const ach = ACHIEVEMENTS_DEF?.find(a=>a.id===bid);
          if(!ach) return;
          const row = document.createElement('div');
          row.style.cssText='display:flex;align-items:center;gap:.6rem;padding:.5rem;background:var(--bg);border-radius:10px';
          row.innerHTML=`<span style="font-size:1.3rem">${ach.icon}</span><div style="flex:1"><div style="font-size:.82rem;font-weight:800">${ach.name}</div><div style="font-size:.7rem;color:var(--muted);font-weight:700">${ach.desc}</div></div><button class="spm-share-btn friends" style="padding:.4rem .7rem;font-size:.75rem;flex:unset" onclick="shareSpecificBadge('${bid}')">Compartir</button>`;
          badgeList.appendChild(row);
        });
      } else {
        badgeList.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.82rem;padding:.5rem">¡Completa actividades para desbloquear logros!</div>';
      }
    }
  },0);

  return wrap;
}

/* ── Construye la tarjeta visual de progreso ── */
// Genera la tarjeta visual de progreso: avatar, rango, stats de XP/racha/módulos y dots de progreso
function _buildProgressCard(compact=false){
  const completedUnits = UNITS ? UNITS.filter(u=>getUnitProgress(u.id)===100).length : 0;
  const rank = getCurrentRank(gs.xp);
  const card = document.createElement('div');
  card.style.cssText=`background:var(--grad-social);border-radius:${compact?'12px':'16px'};padding:${compact?'.8rem':'1rem'};color:var(--social-text);border:1px solid var(--grad-social-border)`;
  let unitDots='';
  if(UNITS) UNITS.forEach(u=>{
    const pct=getUnitProgress(u.id);
    unitDots+=`<div class="spm-unit-dot ${pct===100?'done':pct>0?'partial':''}"></div>`;
  });
  card.innerHTML=`
    <div class="spm-preview-header">
      <div class="spm-preview-av">${gs.profile.avatar||'🧑‍💻'}</div>
      <div><div class="spm-preview-name">${gs.profile.name||'Aprendiz'}</div><div class="spm-preview-rank" style="color:${rank.color}">${rank.icon} ${rank.name}</div></div>
      <div style="margin-left:auto;font-size:.8rem;opacity:.6;font-weight:700">safeXP 🛡️</div>
    </div>
    <div class="spm-stats-grid">
      <div class="spm-stat"><div class="spm-stat-val">⚡${gs.xp}</div><div class="spm-stat-lbl">XP Total</div></div>
      <div class="spm-stat"><div class="spm-stat-val">🔥${gs.streak||0}</div><div class="spm-stat-lbl">Racha</div></div>
      <div class="spm-stat"><div class="spm-stat-val">✅${completedUnits}</div><div class="spm-stat-lbl">Módulos</div></div>
    </div>
    <div class="spm-units-bar"><div class="spm-units-label">Progreso por módulo</div><div class="spm-units-dots">${unitDots}</div></div>`;
  return card;
}

/* ══════════════════════════════
   CONVERSACIONES
══════════════════════════════ */
// Abre la pantalla de conversación directa: rellena cabecera, renderiza mensajes y desliza el panel
function openMsgConversation(friendId){
  const thread = MSG_THREADS[friendId];
  const friend = friendsData.find(f=>f.id===friendId);
  if(!thread||!friend) return;

  _activeMsgThread = friendId;
  thread.unread = 0; // mark as read

  // Fill header
  document.getElementById('msg-conv-av').textContent = friend.avatar;
  document.getElementById('msg-conv-name').textContent = friend.name;
  document.getElementById('msg-conv-status').textContent = friend.online ? '🟢 En línea ahora' : '⚫ Desconectado · '+friend.lastActTime;
  const duelBtn = document.getElementById('msg-conv-duel-btn');
  if(duelBtn) duelBtn.style.display = friend.online ? '' : 'none';

  // Render bubbles
  _renderMsgBubbles(thread.messages);

  // Open
  const conv = document.getElementById('msg-conversation');
  if(conv){ conv.classList.add('open'); document.body.style.overflow='hidden'; }
  setTimeout(()=>{
    const bubbles = document.getElementById('msg-bubbles');
    if(bubbles) bubbles.scrollTop = bubbles.scrollHeight;
  },200);
}

// Renderiza las burbujas de chat: propias (azul-derecha) y del amigo (gris-izquierda)
function _renderMsgBubbles(messages){
  const container = document.getElementById('msg-bubbles');
  if(!container) return;
  container.innerHTML='';
  messages.forEach(m=>{
    if(m.type==='progress_card' && m.data){
      const wrap = document.createElement('div'); wrap.className='msg-bubble-wrap other';
      const card = document.createElement('div'); card.className='msg-bubble'; card.style.maxWidth='85%';
      const pc = document.createElement('div'); pc.className='msg-progress-card';
      pc.innerHTML=`<div class="msg-progress-card-title">📊 Progreso compartido</div><div class="msg-progress-card-stat"><span>⚡${m.data.xp} XP</span><span>🔥${m.data.streak}d</span><span>✅${m.data.units} mód.</span></div>`;
      card.appendChild(pc);
      const time=document.createElement('div');time.className='msg-bubble-time';time.textContent=m.time;
      wrap.appendChild(card);wrap.appendChild(time);
      container.appendChild(wrap);
      return;
    }
    const wrap = document.createElement('div'); wrap.className='msg-bubble-wrap '+(m.mine?'mine':'other');
    const bubble = document.createElement('div'); bubble.className='msg-bubble'; bubble.textContent=m.text;
    const time = document.createElement('div'); time.className='msg-bubble-time'; time.textContent=m.time;
    wrap.appendChild(bubble); wrap.appendChild(time);
    container.appendChild(wrap);
  });
}

// Cierra la conversación: desliza el panel, restaura scroll y actualiza la lista de mensajes
function closeMsgConversation(){
  const conv = document.getElementById('msg-conversation');
  if(conv) conv.classList.remove('open');
  document.body.style.overflow='';
  _activeMsgThread = null;
  // Re-render messages panel to update unread counts
  const msgPanel = document.getElementById('spanel-messages');
  if(msgPanel){
    const friends = (typeof friendsData!=='undefined'&&friendsData)?friendsData.filter(f=>f.status==='friend'):[];
    msgPanel.innerHTML='';
    msgPanel.appendChild(_buildMessagesPanel(friends));
  }
}

// Envía un mensaje: agrega al hilo, renderiza y simula respuesta automática si el amigo está online
function sendMessage(){
  const input = document.getElementById('msg-input');
  const text = (input?.value||'').trim();
  if(!text || !_activeMsgThread) return;
  const thread = MSG_THREADS[_activeMsgThread];
  if(!thread) return;
  const now = new Date();
  const time = now.getHours()+':'+(String(now.getMinutes()).padStart(2,'0'));
  thread.messages.push({mine:true, text, time});
  input.value='';
  _renderMsgBubbles(thread.messages);
  setTimeout(()=>{
    const bubbles = document.getElementById('msg-bubbles');
    if(bubbles) bubbles.scrollTop = bubbles.scrollHeight;
  },50);
  // Simulate reply after 1.2s if friend is online
  const friend = friendsData.find(f=>f.id===_activeMsgThread);
  if(friend?.online){
    const REPLIES = [
      '¡Jaja sí, eso estuvo difícil! 😅',
      '¿Cuándo jugamos un duelo? ⚔️',
      '¡Yo también lo logré! 🎉',
      '¡Sigue así, campeón! 💪',
      'Compartí mi progreso en el feed, míralo 👀',
      '¿Ya viste el nuevo módulo de IA?',
    ];
    setTimeout(()=>{
      if(_activeMsgThread !== friend.id) return;
      const reply=REPLIES[Math.floor(Math.random()*REPLIES.length)];
      const replyTime = new Date(); const rt=replyTime.getHours()+':'+(String(replyTime.getMinutes()).padStart(2,'0'));
      thread.messages.push({mine:false, text:reply, time:rt});
      _renderMsgBubbles(thread.messages);
      setTimeout(()=>{const b=document.getElementById('msg-bubbles');if(b)b.scrollTop=b.scrollHeight;},50);
    }, 1200 + Math.random()*800);
  }
}

// Inicia un duelo con el amigo de la conversación activa: cierra el chat y abre el duelo
function msgStartDuel(){
  if(!_activeMsgThread) return;
  const friend = friendsData.find(f=>f.id===_activeMsgThread);
  if(!friend) return;
  closeMsgConversation();
  setTimeout(()=>startDuelWith(friend), 200);
}

// Abre el modal de compartir progreso en modo 'msg' para enviarlo en el chat activo
function msgShareProgress(){
  openShareProgressModal('msg');
}

/* Open from friend drawer */
// Abre el chat con un amigo específico desde su drawer de perfil
function openChatWithFriend(friendId){
  closeFriendDrawer();
  showTab('friends');
  setTimeout(()=>{ const mp=document.getElementById('spanel-messages'); if(!mp){ renderFriendsTab(); setTimeout(()=>{ socialSwitchTab('messages'); setTimeout(()=>openMsgConversation(friendId),150); },100); } else { socialSwitchTab('messages'); setTimeout(()=>openMsgConversation(friendId),150); } },200);
}

/* ══════════════════════════════
   MODAL COMPARTIR PROGRESO
══════════════════════════════ */
let _shareDest = 'feed';

// Abre el modal bottom-sheet de compartir progreso con la tarjeta visual y las opciones
function openShareProgressModal(dest){
  _shareDest = dest || 'feed';
  const modal = document.getElementById('share-progress-modal');
  if(!modal) return;
  // Fill preview
  const prev = document.getElementById('spm-preview');
  if(prev){ prev.innerHTML=''; prev.appendChild(_buildProgressCard()); }
  // Set caption placeholder
  const caption = document.getElementById('spm-caption');
  if(caption) caption.value = `¡Mira mi progreso en safeXP! 🛡️ Ya llevo ${gs.xp} XP y ${gs.streak||0} días de racha.`;
  modal.classList.add('open');
  document.body.style.overflow='hidden';
}

// Cierra el modal de compartir progreso con animación y restaura el scroll
function closeShareProgressModal(){
  const modal = document.getElementById('share-progress-modal');
  if(modal) modal.classList.remove('open');
  document.body.style.overflow='';
}

// Ejecuta la acción de compartir según el destino: WhatsApp, Twitter, Feed, chat o portapapeles
function doShareProgress(dest){
  const caption = document.getElementById('spm-caption')?.value||'';
  const rank = getCurrentRank(gs.xp);
  const completedUnits = UNITS ? UNITS.filter(u=>getUnitProgress(u.id)===100).length : 0;
  const text = caption || `¡Mira mi progreso en safeXP! 🛡️
${rank.icon} ${rank.name} · ⚡${gs.xp} XP · 🔥${gs.streak||0} días · ✅${completedUnits} módulos
Aprende ciberseguridad: safexp.app`;

  if(dest==='whatsapp'){
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  } else if(dest==='twitter'){
    window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text.substring(0,270)),'_blank');
  } else if(dest==='feed'){
    // Post to social feed
    SOCIAL_FEED.unshift({
      id:'fe_'+Date.now(), authorId:'me',
      author: gs.profile.name||'Yo', avatar: gs.profile.avatar||'🧑‍💻', online:true,
      time:'ahora mismo', type:'shared_prog',
      content:{xp:gs.xp, streak:gs.streak||0, units:completedUnits},
      reactions:{liked:false,fire:false,clap:false,wow:false},
      reactionCounts:{liked:0,fire:0,clap:0,wow:0},
      comments:[]
    });
    closeShareProgressModal();
    showTab('friends');
    setTimeout(()=>{ socialSwitchTab('feed'); showToast('📰 ¡Publicado en el Feed!'); }, 200);
    return;
  } else if(dest==='msg'){
    // Send as message in active conversation
    if(_activeMsgThread){
      const thread = MSG_THREADS[_activeMsgThread];
      if(thread){
        const now=new Date(); const t=now.getHours()+':'+(String(now.getMinutes()).padStart(2,'0'));
        thread.messages.push({mine:true, type:'progress_card', data:{xp:gs.xp,streak:gs.streak||0,units:completedUnits}, time:t});
        closeShareProgressModal();
        _renderMsgBubbles(thread.messages);
        setTimeout(()=>{const b=document.getElementById('msg-bubbles');if(b)b.scrollTop=b.scrollHeight;},50);
        showToast('📊 ¡Progreso compartido en el chat!');
        return;
      }
    }
    closeShareProgressModal();
    openShareProgressModal('feed');
    return;
  } else if(dest==='copy'){
    navigator.clipboard?.writeText(text).then(()=>{ showToast('📋 ¡Texto copiado!'); }).catch(()=>showToast(text));
    closeShareProgressModal();
    return;
  }
  closeShareProgressModal();
}

// Comparte un logro específico usando navigator.share o copiando el texto al portapapeles
function shareSpecificBadge(badgeId){
  const ach = ACHIEVEMENTS_DEF?.find(a=>a.id===badgeId);
  if(!ach) return;
  const text=`¡Acabo de desbloquear "${ach.name}" en safeXP! ${ach.icon}
${ach.desc}
Aprende ciberseguridad: safexp.app 🛡️`;
  if(navigator.share){ navigator.share({title:'safeXP — Logro desbloqueado',text}); }
  else { navigator.clipboard?.writeText(text).then(()=>showToast('📋 Texto copiado')); }
}

// Close on Escape
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    const conv=document.getElementById('msg-conversation');
    if(conv&&conv.classList.contains('open')){ closeMsgConversation(); return; }
    const modal=document.getElementById('share-progress-modal');
    if(modal&&modal.classList.contains('open')){ closeShareProgressModal(); return; }
  }
});

// Update openFriendDrawer to include a "Enviar mensaje" button
const _origOpenFriendDrawer = window.openFriendDrawer || openFriendDrawer;
window.openFriendDrawer = function(f){
  _origOpenFriendDrawer(f);
  // Add message button to drawer actions after it renders
  setTimeout(()=>{
    const actionsDiv = document.querySelector('#friend-drawer .drawer-actions');
    if(actionsDiv && !actionsDiv.querySelector('.msg-friend-btn')){
      const msgBtn=document.createElement('button');msgBtn.className='drawer-action-btn msg-friend-btn';
      msgBtn.style.cssText='background:var(--bs);color:var(--bd)';
      msgBtn.innerHTML='💬 Enviar mensaje';
      msgBtn.onclick=()=>openChatWithFriend(f.id);
      actionsDiv.insertBefore(msgBtn, actionsDiv.firstChild);
    }
  },50);
};


// ── Expose social functions called from JS-generated onclick handlers ──
window.socialSwitchTab       = typeof socialSwitchTab       !== 'undefined' ? socialSwitchTab       : null;
window.theoryToggleCard      = typeof theoryToggleCard      !== 'undefined' ? theoryToggleCard      : null;
window._toggleReaction       = typeof _toggleReaction       !== 'undefined' ? _toggleReaction       : null;
window._postComment          = typeof _postComment          !== 'undefined' ? _postComment          : null;
window.openMsgConversation   = typeof openMsgConversation   !== 'undefined' ? openMsgConversation   : null;
window.closeMsgConversation  = typeof closeMsgConversation  !== 'undefined' ? closeMsgConversation  : null;
window.openShareProgressModal= typeof openShareProgressModal!== 'undefined' ? openShareProgressModal: null;
window.closeShareProgressModal=typeof closeShareProgressModal!=='undefined' ? closeShareProgressModal: null;
window.doShareProgress       = typeof doShareProgress       !== 'undefined' ? doShareProgress       : null;
window.shareSpecificBadge    = typeof shareSpecificBadge    !== 'undefined' ? shareSpecificBadge    : null;
window.msgStartDuel          = typeof msgStartDuel          !== 'undefined' ? msgStartDuel          : null;
window.msgShareProgress      = typeof msgShareProgress      !== 'undefined' ? msgShareProgress      : null;
window.openChatWithFriend    = typeof openChatWithFriend    !== 'undefined' ? openChatWithFriend    : null;
window.sendMessage           = typeof sendMessage           !== 'undefined' ? sendMessage           : null;

// ── Auto-init auth on load ──
// Punto de entrada de la app: verifica si hay sesión guardada y muestra auth o entra directamente
authInit();