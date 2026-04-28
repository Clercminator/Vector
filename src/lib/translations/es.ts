import type { TranslationDictionary } from "../translations";

const esTranslations: TranslationDictionary = {
    // ... existing ES translations (managed by next block below via AllowMultiple? No, need to be careful with structure)

    // Auth (Extended)
    "auth.password": "Contraseña",
    "auth.forgotPassword": "¿Olvidaste tu contraseña?",
    "auth.sendResetLink": "Enviar enlace de recuperación",
    "auth.signInWithMagicLink": "Iniciar sesión con enlace mágico",
    "auth.orContinueWith": "O continuar con",
    "auth.backToSignIn": "Volver a Iniciar Sesión",
    "auth.dontHaveAccount": "¿No tienes cuenta? Regístrate",
    "auth.alreadyHaveAccount": "¿Ya tienes cuenta? Inicia sesión",
    "auth.resetUnsuccessful": "Error al enviar enlace de recuperación.",

    // Profile Security
    "profile.security": "Seguridad",
    "profile.changePassword": "Cambiar Contraseña",
    "profile.currentPassword": "Contraseña Actual",
    "profile.newPassword": "Nueva Contraseña",
    "profile.confirmPassword": "Confirmar Contraseña",
    "profile.updatePassword": "Actualizar Contraseña",
    "profile.linkedAccounts": "Cuentas Vinculadas",
    "profile.linkAccount": "Conectar",
    "profile.unlinkAccount": "Desconectar",
    "profile.noLinkedAccounts": "No se encontraron cuentas vinculadas.",
    "profile.passwordUpdated": "¡Contraseña actualizada correctamente!",
    "profile.passwordUpdateError": "Error al actualizar la contraseña.",
    "profile.accountLinked": "¡Cuenta vinculada correctamente!",
    "profile.accountUnlinked": "Cuenta desconectada.",
    "profile.lastMethodError":
      "No se puede desconectar el último método de inicio de sesión.",
    "profile.provider.google": "Google",
    "profile.provider.github": "GitHub",
    "profile.provider.email": "Correo",

    // Account Deletion
    "profile.dangerZone": "Zona de Peligro",
    "profile.deleteAccount": "Eliminar Cuenta",
    "profile.deleteAccountDescription":
      "Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.",
    "profile.deleteAccountConfirmationTitle": "¿Estás absolutamente seguro?",
    "profile.deleteAccountConfirmationDesc":
      "Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y borrará tus datos de nuestros servidores.",
    "profile.typeDeleteToConfirm": "Escribe DELETE para confirmar",
    "profile.confirmDelete": "Eliminar Cuenta",

    // Navigation
    "nav.frameworks": "Métodos",
    "nav.blueprints": "Mis Planes",
    "nav.pricing": "Precios",
    "nav.profile": "Perfil",
    "nav.community": "Comunidad",
    "nav.signin": "Iniciar sesión",
    "nav.signout": "Cerrar sesión",
    "nav.getStarted": "Planifiquemos",
    "nav.about": "Sobre nosotros",
    "nav.articles": "Artículos",
    "nav.admin": "Admin",

    // Hero
    "hero.title.prefix": "Arquitecta Tu",
    "hero.title.suffix": "Ambición.",
    "hero.description":
      "Vector utiliza el pensamiento de primeros principios para convertir objetivos abstractos en planos arquitectónicos precisos.",
    "hero.start": "Empezar a Construir",
    "hero.pricing": "Ver Precios",

    // Frameworks Section
    "frameworks.title": "Elige tu Método",
    "frameworks.subtitle":
      "Cada ambición requiere una lente diferente. Selecciona un marco probado para comenzar tu proceso.",
    "landing.guides.explore": "Lee antes de construir",
    "landing.guides.title":
      "Artículos sobre frameworks pensados para descubrir y actuar.",
    "landing.guides.subtitle":
      "Explora los modelos mentales detrás de Vector, entiende cuándo usar cada uno y entra directo al blueprint adecuado.",
    "landing.guides.cta": "Ver todos los artículos",
    "guides.seoTitle":
      "Artículos de frameworks para planificar metas | Vector AI",
    "guides.seoDescription":
      "Lee artículos prácticos sobre First Principles, OKRs, Ikigai, Pareto y más. Usa Vector para convertir cada modelo en un plan listo para ejecutar.",
    "guides.structuredListName":
      "Frameworks y guías de planificación de Vector",
    "guides.hero.title":
      "Guías editoriales sobre los frameworks detrás de Vector.",
    "guides.hero.subtitle":
      "Estudia cómo funciona cada modelo de planificación, cuándo usarlo y dónde se rompe. Luego convierte el que mejor encaje con tu objetivo en un blueprint accionable.",
    "guides.hero.featured": "Artículo destacado",
    "guides.hero.readFeatured": "Leer guía destacada",
    "guides.hero.startWithFramework": "Empezar con este framework",
    "guides.hero.summaryTitle": "Qué encontrarás aquí",
    "guides.hero.summary.0":
      "Explicaciones prácticas en vez de resúmenes abstractos.",
    "guides.hero.summary.1":
      "Audiencia ideal, tradeoffs y guía de aplicación para cada framework.",
    "guides.hero.summary.2":
      "Caminos directos desde la lectura hasta construir un plan dentro de Vector.",
    "guides.hero.availableCount":
      "Ahora mismo hay {0} guías de frameworks disponibles que cubren los modelos mentales centrales del producto.",
    "guides.topicClusters.eyebrow": "Clústeres temáticos",
    "guides.topicClusters.title":
      "Puntos de entrada construidos alrededor de la intención de búsqueda real.",
    "guides.topicClusters.description":
      "Estos clústeres agrupan la biblioteca según los problemas que la gente realmente busca resolver: elegir un framework, salir del agobio, mejorar sistemas de estudio y comparar modelos cercanos.",
    "guides.cluster.resourceCount": "{0} recursos conectados",
    "guides.cluster.label": "Clúster",
    "guides.library.eyebrow": "Explora la biblioteca",
    "guides.library.title":
      "Filtra el hub público de contenido por tipo de framework o intención de búsqueda.",
    "guides.library.description":
      "Los filtros separan los explainers evergreen de frameworks de las páginas de casos de uso, comparaciones, guías de aplicación y artículos centrados en problemas.",
    "guides.filter.all": "Todo el contenido",
    "guides.filter.frameworks": "Guías de frameworks",
    "guides.filter.selection": "Selección de frameworks",
    "guides.filter.useCase": "Casos de uso",
    "guides.filter.comparison": "Comparaciones",
    "guides.filter.application": "Aplicaciones de frameworks",
    "guides.filter.problem": "Guías basadas en problemas",
    "guides.filter.system": "Sistemas de resultados",
    "guides.filter.tool": "Herramientas y plantillas",
    "guides.filter.example": "Ejemplos de blueprints",
    "guides.filter.synonym": "Intención relacionada",
    "guides.filter.commercial": "Comparativas de productos",
    "guides.editorial.eyebrow": "Artículos editoriales",
    "guides.editorial.title":
      "Artículos orientados a la intención de búsqueda para ayudar a elegir, comparar y aplicar frameworks.",
    "guides.editorial.description":
      "Cada artículo está escrito alrededor de un problema real de planificación y no de consejos genéricos de productividad.",
    "guides.editorial.whyThisExists": "Por qué existe",
    "guides.editorial.readArticle": "Leer artículo",
    "guides.editorial.readFrameworkGuide": "Leer guía del framework",
    "guides.frameworks.eyebrow": "Guías de frameworks",
    "guides.frameworks.title":
      "Explicaciones profundas de los modelos de planificación que Vector convierte en blueprints.",
    "guides.frameworks.description":
      "Estas son las páginas base que definen cada método, para quién encaja y qué tradeoffs implica usarlo.",
    "guides.frameworks.bestFor": "Ideal para",
    "guides.frameworks.readArticle": "Leer artículo",
    "guides.frameworks.startBlueprint": "Empezar blueprint",

    // Footer
    "footer.privacy": "Privacidad",
    "footer.terms": "Términos",
    "footer.security": "Seguridad",
    "footer.contact": "Contacto",
    "footer.copyright": "© 2026 Vector Architect AI",
    "footer.builtBy": "Creado por David Clerc",
    "footer.liftoff": "Experimenta el despegue",

    // Framework Card
    "card.start": "Arquitectar Ahora",
    "card.locked": "Incluido en Estándar",

    // Common
    "common.back": "Atrás",
    "common.save": "Guardar",
    "common.close": "Cerrar",
    "common.cancel": "Cancelar",
    "common.loading": "Cargando...",
    "common.loadMore": "Cargar Más",
    "common.addItem": "Agregar Ítem",
    "common.copiedToClipboard": "Copiado al portapapeles",
    "common.clickToEdit": "Clic para editar...",
    "common.error": "Algo salió mal",
    "common.errorCopiedToClipboard": "Error copiado al portapapeles",
    "common.share": "Compartir",
    "common.exit": "Salir",
    "common.fullScreen": "Pantalla completa",
    "common.copyStrategy": "Copiar estrategia",
    "common.copySection": "Copiar sección",
    "common.copyList": "Copiar lista",
    "common.moveUp": "Mover arriba",
    "common.moveDown": "Mover abajo",
    "common.deleteItem": "Eliminar elemento",
    "common.typeHere": "Escribe aquí...",
    "common.typeTask": "Escribe una tarea...",

    // Onboarding
    "onboarding.welcome.title": "Bienvenido a Vector",
    "onboarding.welcome.desc":
      "Vector no es una lista de tareas. Es un motor arquitectónico para tu vida.",
    "onboarding.step1.title": "Elige un Método",
    "onboarding.step1.desc": "¿Cómo quieres deconstruir tu objetivo?",
    "onboarding.step2.title": "Arquitecta tu Plan",
    "onboarding.step2.desc":
      "Responde las preguntas profundas. Construye el plano.",
    "onboarding.btn.next": "Siguiente",
    "onboarding.btn.start": "Empezar a Arquitectar",

    "onboarding.step3.title": "Aprovecha Vector al máximo",
    "onboarding.step3.desc":
      "Guarda tus planos para seguir el progreso y exporta tus planes de acción.",
    "onboarding.skip": "Omitir",

    // Profile
    "profile.title": "Tu Perfil",
    "profile.upload": "Subir Avatar",
    "profile.currentPlan": "Plan Actual",
    "profile.level": "Nivel",
    "profile.credits": "Planes",
    "profile.normalCredits": "Planes",
    "profile.extraCredits": "Planes extra",
    "profile.expires": "Expira: {0}",
    "profile.expired": "Expirado",
    "profile.neverExpires": "Nunca expira",
    "profile.streak": "Racha",
    "profile.creditsRemaining": "Planes restantes",
    "profile.buyMore": "Obtener más planes",
    "profile.creditPackCta":
      "Compra paquetes de planes con MercadoPago Checkout Pro",
    "profile.creditPackButton": "Comprar {0} por {1}",
    "profile.achievements": "Logros",
    "profile.personalInfo": "Información Personal",
    "profile.personalInfoHint":
      "Esta información se usa para generar un plan personalizado para ti. Cuanto más compartas, más adaptado será tu plan.",
    "profile.personalInfoReminder":
      "Los usuarios que completan su perfil reciben planes más personalizados. Los planes sin suficiente contexto suelen parecer genéricos—completa estos campos para que Vector adapte tu experiencia.",
    "profile.displayName": "Nombre Visible",
    "profile.bio": "Bio / Misión",
    "profile.bioPlaceholder":
      "ej. Qué estás construyendo (máx. 500 caracteres)",
    "profile.includedInPlan": "Incluido en tu plan:",
    "profile.pdfExport": "Exportar PDF",
    "profile.avatarUrl": "URL del Avatar",
    "profile.save": "Guardar Cambios",
    "profile.saving": "Guardando...",
    "profile.success": "Perfil actualizado",
    "profile.error": "Error al guardar el perfil",
    "profile.demographics": "Demografía",
    "profile.age": "Edad",
    "profile.gender": "Género",
    "profile.country": "País",
    "profile.zodiac": "Signo Zodiacal",
    "profile.zodiacPlaceholder": "Seleccionar signo",
    "profile.zodiacImportance":
      "¿Qué tan importante es el signo zodiacal? (para describir tu personalidad)",
    "profile.zodiacImportanceShort": "Relevancia del signo",
    "profile.zodiacImportanceInfo":
      "Cuánto te apoyas en tu signo zodiacal para describir tu personalidad. Nos ayuda a adaptar el tono de tus planes.",
    "profile.zodiacImportancePlaceholder": "Seleccionar",
    "profile.zodiacImportance.super": "Mucho",
    "profile.zodiacImportance.somewhat": "Algo",
    "profile.zodiacImportance.nothing": "Nada en absoluto",
    "profile.interests": "Intereses",
    "profile.skills": "Habilidades y Experiencia",
    "profile.hobbies": "Pasatiempos",
    "profile.preferredPlanStyle": "Estilo de plan preferido",
    "profile.preferredPlanStylePlaceholder": "Seleccionar estilo",
    "profile.planStyle.action_focused":
      "Orientado a la acción (pasos claros, menos reflexión)",
    "profile.planStyle.reflective":
      "Reflexivo (explorar el porqué, luego actuar)",
    "profile.planStyle.balanced": "Equilibrado (mix de ambos)",
    "profile.stayOnTrack": "¿Qué te ayuda a mantener el rumbo?",
    "profile.stayOnTrackPlaceholder":
      "ej. Fechas límite, compañero de rendición de cuentas, recordatorios diarios",
    "profile.vectorPrefs": "Cómo prefieres hablar con Vector",
    "profile.questionFlow": "Flujo de preguntas",
    "profile.questionFlowPlaceholder": "¿Cómo debe preguntarte Vector?",
    "profile.questionFlow.list":
      "Todas las preguntas a la vez — responderé a mi ritmo",
    "profile.questionFlow.one_at_a_time":
      "Una pregunta a la vez — con sugerencias que me ayuden",
    "profile.preferredTone": "Tono preferido",
    "profile.preferredTonePlaceholder": "¿Cómo debe sonar Vector?",
    "profile.preferredTone.friendly": "Amigable y cercano",
    "profile.preferredTone.professional": "Profesional y conciso",
    "profile.preferredTone.direct": "Directo y al grano",
    "profile.preferredTone.encouraging": "Alentador y de apoyo",
    "profile.treatmentLevel": "¿Cómo debe tratarte Vector?",
    "profile.treatmentLevelPlaceholder": "Selecciona tu nivel",
    "profile.treatmentLevel.expert":
      "Como experto — asume que conozco lo básico",
    "profile.treatmentLevel.beginner":
      "Como principiante — explícame conceptos y guíame paso a paso",
    "profile.treatmentLevel.mixed": "Mixto — adaptarse según el tema",
    "profile.otherObservations": "Otras observaciones",
    "profile.otherObservationsPlaceholder":
      "Cualquier otra cosa que quieras que el agente tenga en cuenta al generar tus planes...",
    "profile.values": "Valores Fundamentales",
    "profile.vision": "Visión a Largo Plazo",
    // Dropdown Options
    "country.united_states": "Estados Unidos",
    "country.united_kingdom": "Reino Unido",
    "country.canada": "Canadá",
    "country.australia": "Australia",
    "country.germany": "Alemania",
    "country.france": "Francia",
    "country.spain": "España",
    "country.italy": "Italia",
    "country.brazil": "Brasil",
    "country.mexico": "México",
    "country.argentina": "Argentina",
    "country.bolivia": "Bolivia",
    "country.chile": "Chile",
    "country.colombia": "Colombia",
    "country.costa_rica": "Costa Rica",
    "country.cuba": "Cuba",
    "country.dominican_republic": "República Dominicana",
    "country.ecuador": "Ecuador",
    "country.el_salvador": "El Salvador",
    "country.guatemala": "Guatemala",
    "country.honduras": "Honduras",
    "country.nicaragua": "Nicaragua",
    "country.panama": "Panamá",
    "country.paraguay": "Paraguay",
    "country.peru": "Perú",
    "country.puerto_rico": "Puerto Rico",
    "country.uruguay": "Uruguay",
    "country.venezuela": "Venezuela",
    "country.india": "India",
    "country.china": "China",
    "country.japan": "Japón",
    "country.other": "Otro",

    "gender.male": "Masculino",
    "gender.female": "Femenino",
    "gender.other": "Otro",

    "zodiac.aries": "Aries",
    "zodiac.taurus": "Tauro",
    "zodiac.gemini": "Géminis",
    "zodiac.cancer": "Cáncer",
    "zodiac.leo": "Leo",
    "zodiac.virgo": "Virgo",
    "zodiac.libra": "Libra",
    "zodiac.scorpio": "Escorpio",
    "zodiac.sagittarius": "Sagitario",
    "zodiac.capricorn": "Capricornio",
    "zodiac.aquarius": "Acuario",
    "zodiac.pisces": "Piscis",

    // Auth
    "auth.title": "Inicia sesión en Vector",
    "auth.desc":
      "Te enviaremos un enlace de acceso. Sin contraseñas. Tus planos se sincronizarán.",
    "auth.email": "Correo electrónico",
    "auth.placeholder": "tu@dominio.com",
    "auth.submit": "Enviarme enlace de acceso",
    "auth.sent": "Enlace de acceso enviado a",
    "auth.diffEmail": "Usar otro correo",
    "auth.noSupabase": "Supabase no está configurado.",
    "auth.welcomeBack": "Bienvenido de nuevo",
    "auth.createAccount": "Comienza tu viaje",
    "auth.checkEmail": "Revisa tu correo",
    "auth.signinDesc":
      "Inicia sesión para continuar tu arquitectura de objetivos.",
    "auth.signupDesc":
      "Únete a Vector para construir planos de objetivos desglosados.",
    "auth.sentDesc":
      "Hemos enviado un enlace de acceso a tu bandeja de entrada.",
    "auth.emailAddress": "Dirección de correo",
    "auth.continueSignIn": "Iniciar sesión con enlace",
    "auth.continueSignUp": "Crear Cuenta",
    "auth.needAccount": "¿No tienes cuenta? Regístrate",
    "auth.haveAccount": "¿Ya tienes cuenta? Inicia sesión",
    "auth.sentTo": "Enlace enviado a",
    "auth.checkSpam": "Si no lo ves, revisa tu carpeta de spam.",
    "auth.tryDifferentEmail": "Prueba con otro correo",
    "auth.terms":
      "Al continuar, aceptas los Términos de Servicio y la Política de Privacidad de Vector.",
    "auth.loading": "Procesando...",
    "auth.signingIn": "Iniciando sesión...",
    "auth.creatingAccount": "Creando tu cuenta...",
    "auth.success": "¡Enlace enviado! Revisa tu correo.",
    "auth.credentialsDesc": "Introduce tus datos para acceder a tu cuenta.",
    "auth.signupDesc2": "Empieza a construir tu arquitectura de objetivos hoy.",
    "auth.resetPassword": "Restablecer contraseña",
    "auth.resetDesc":
      "Introduce tu correo para recibir un enlace de restablecimiento.",
    "auth.magicLinkDesc": "Te enviaremos un enlace mágico a tu correo.",
    "auth.signIn": "Iniciar sesión",
    "auth.sendMagicLink": "Enviar enlace mágico",
    "auth.completeCaptcha": "Completa el captcha, por favor.",
    "auth.checkEmailConfirm": "Revisa tu correo para confirmar tu cuenta.",
    "auth.checkEmailConfirmDesc":
      "Hemos enviado un enlace de confirmación a tu correo. Haz clic para activar tu cuenta.",
    "auth.passwordRequirements": "Mínimo 6 caracteres, con letras y números.",
    "auth.accountCreated": "¡Cuenta creada correctamente!",
    "auth.resetLinkSent": "Enlace de restablecimiento enviado a tu correo.",
    "auth.resetLinkSentDesc":
      "Hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo y sigue las instrucciones.",
    "auth.magicLinkSentDesc":
      "Hemos enviado un enlace de acceso a tu correo. Haz clic para iniciar sesión.",
    "auth.authenticationFailed": "Error de autenticación",
    "profile.checkEmailConfirm":
      "Revisa tu nuevo correo para confirmar el cambio.",
    "errors.storageFull":
      "Almacenamiento lleno: No puedes anclar más elementos. Elimina algunos primero.",
    "errors.paymentsNotConfigured":
      "Los pagos no están configurados (Modo de prueba).",
    "errors.templateNoItems": "Esta plantilla no tiene elementos.",
    "feedback.analysisFailed":
      "No se pudo determinar el mejor marco. Intenta de nuevo o elige manualmente.",
    "feedback.analysisError": "Error en el análisis.",

    // Dashboard
    // Dashboard
    "dashboard.new": "Nuevo Plano",
    "dashboard.title": "Mis Planos",
    "dashboard.subtitle":
      "Tus estrategias guardadas, listas para reabrir o exportar.",
    "dashboard.empty":
      'Aún no hay planos guardados. Construye uno y haz clic en "Guardar Plano".',
    "dashboard.start": "Comenzar tu primer plano",
    "dashboard.deleteTitle": "¿Eliminar plano?",
    "dashboard.deleteDesc":
      "Esto eliminará este plano de tu lista. No se puede deshacer.",
    "dashboard.cancel": "Cancelar",
    "dashboard.delete": "Eliminar",
    "dashboard.open": "Abrir",
    "dashboard.created": "Creado",
    "dashboard.exportAll": "Exportar Todo",
    "dashboard.emptyTitle": "No se encontraron planos",
    "dashboard.emptyDesc": "Ajusta tus filtros o crea un nuevo plano.",
    "dashboard.searchPlaceholder": "Buscar planos...",
    "dashboard.filterAll": "Todos",
    "dashboard.createFirst": "Crear tu primer plano",

    // Pricing
    "pricing.title": "Ofertas",
    "pricing.subtitle":
      "Elige la alternativa que mejor se ajuste a tus necesidades.",
    "pricing.mostPopular": "Más Popular",
    "pricing.oneTime": "Pago único",
    "pricing.custom": "A medida",
    "pricing.currentPlan": "Plan Actual",
    "pricing.tier.architect": "Arquitecto",
    "pricing.tier.architect.desc":
      "Un plano completo: todos los métodos, PDF y exportar a calendario.",
    "pricing.tier.builder": "Constructor",
    "pricing.tier.builder.desc":
      "5 planos con acceso completo al tracker, exportación y soporte directo.",
    "pricing.tier.max": "Max",
    "pricing.tier.max.desc":
      "20 planos, todas las capacidades del tracker, atención prioritaria y Leyendo Max incluido.",
    "pricing.tier.enterprise": "Empresarial",
    "pricing.tier.enterprise.desc":
      "Para equipos y organizaciones que requieren escala y control.",
    "pricing.cta.start": "Empezar a Construir",
    "pricing.cta.builder": "Obtener Standard",
    "pricing.cta.max": "Obtener Max",
    "pricing.cta.contact": "Contactar Ventas",
    "pricing.feature.architect.plans": "{0} plano",
    "pricing.feature.architect.frameworks": "Todos los métodos",
    "pricing.feature.architect.ai": "Exportar a PDF y calendario incluido",
    "pricing.feature.builder.plans": "{0} planos",
    "pricing.feature.builder.frameworks": "Todos los métodos",
    "pricing.feature.builder.ai": "Exportar a PDF y calendario",
    "pricing.feature.builder.tracker": "Todas las capacidades del tracker",
    "pricing.feature.builder.support": "Soporte especial 24/7",
    "pricing.feature.max.plans": "{0} planos",
    "pricing.feature.max.frameworks": "Todos los métodos",
    "pricing.feature.max.calendar": "Exportar a Calendario (Google / Outlook)",
    "pricing.feature.max.pdf": "Exportar a PDF y descargar",
    "pricing.feature.max.priority": "Razonamiento de IA prioritario",
    "pricing.feature.max.tracker": "Todas las capacidades del tracker",
    "pricing.feature.max.support": "Soporte especial 24/7",
    "pricing.feature.max.leyendo":
      "Leyendo Max incluido mientras tu suscripción Vector Max siga activa",
    "pricing.feature.enterprise.workspaces": "Espacios de trabajo compartidos",
    "pricing.feature.enterprise.admin": "Panel de administración y analíticas",
    "pricing.feature.enterprise.integration":
      "Integración de métodos personalizados",
    "pricing.feature.enterprise.support": "Soporte dedicado",
    "pricing.regionDetecting": "Detectando región...",
    "pricing.regionLatam": "Pago LATAM (MercadoPago)",
    "pricing.regionGlobal": "Pago US/EU (Tarjetas, PayPal)",
    "pricing.switchToGlobal": "¿Pagas desde US/EU? Cambiar",
    "pricing.switchToLatam": "¿Pagas desde LATAM? Cambiar",
    "pricing.payWithCrypto": "Pagar con cripto (Binance Pay)",
    "pricing.cryptoComingSoon":
      "Pagos con cripto (Binance Pay) próximamente. Contáctanos para recibir aviso.",
    "pricing.redirectMercadoPago": "Redirigiendo al pago...",
    "pricing.redirectLemonSqueezy": "Redirigiendo al pago...",
    "pricing.binance.title": "Pagar con Binance (Cripto)",
    "pricing.binance.subtitle":
      "Pago manual: procesaremos tu upgrade en cuanto lo confirmemos.",
    "pricing.binance.tier": "Plan",
    "pricing.binance.amountNote":
      "Convierte a USDT al pagar. Envía el monto exacto.",
    "pricing.binance.steps": "Pasos:",
    "pricing.binance.step1": "Escanea el código QR con tu app de Binance",
    "pricing.binance.step2":
      "Envía el monto exacto indicado (en USDT o equivalente)",
    "pricing.binance.step3": "Escríbenos por el chat para confirmar tu pago",
    "pricing.binance.manualNote": "Procesamiento manual",
    "pricing.binance.manualDesc":
      "Procesamos pagos en cripto manualmente. Por favor ten paciencia. Asegúrate de notificarnos por chat después de enviar, o no sabremos que debes recibir tu upgrade.",
    "pricing.binance.openChat": "Abrir chat para notificarnos",
    "pricing.paymentSuccess":
      "¡Pago exitoso! Tu cuenta se actualizará en breve.",
    "pricing.paymentFailed": "El pago falló o fue cancelado.",
    "pricing.paymentPending":
      "El pago está en proceso. Tu cuenta se actualizará pronto—recarga en un momento.",

    // Pricing FAQ / How it works
    "pricing.faq.title": "Entender los planes y las funciones",
    "pricing.faq.whatIsPlan.q": "¿Qué es un plano?",
    "pricing.faq.whatIsPlan.a":
      "Un plano es una sesión completa de arquitectura de objetivos: eliges un método (p. ej. primeros principios, Pareto), respondes las preguntas guiadas y obtienes un blueprint estructurado con pasos de acción. Cada blueprint guardado cuenta como un plano dentro del límite de tu nivel.",
    "pricing.faq.finalProduct.q": "¿Cuál es el resultado final?",
    "pricing.faq.finalProduct.a":
      "Obtienes un blueprint visual: un desglose claro de tu objetivo en fases, hitos y próximos pasos concretos. Puedes exportarlo en PDF o añadir acciones a tu calendario (Google, Outlook) para ejecutarlo en el día a día.",
    "pricing.faq.modifiable.q": "¿Se puede modificar?",
    "pricing.faq.modifiable.a":
      'Sí. Puedes refinar tu blueprint en el asistente (p. ej. "añade una tarea para revisar el email a diario") y volver a exportar. Las ediciones y guardados del mismo blueprint no consumen planes adicionales; solo crear nuevos blueprints cuenta para tu límite.',
    "pricing.faq.framework.q": "¿Qué es un método?",
    "pricing.faq.framework.a":
      "Un método es un modelo mental que usamos para desglosar tu objetivo—p. ej. primeros principios, Pareto (80/20) u otros enfoques estructurados. Eliges uno por plano; todos los métodos están incluidos en todos los niveles. La diferencia entre niveles es cuántos planos puedes crear, no qué métodos puedes usar.",
    "pricing.faq.refunds.q": "¿Cómo funcionan los reembolsos?",
    "pricing.faq.refunds.a":
      "Los niveles de pago son pagos únicos. Si no estás satisfecho, contáctanos con los datos de tu compra y gestionaremos las solicitudes de reembolso caso por caso según nuestros términos de servicio.",
    "pricing.faq.exporting.q": "¿Cómo funciona la exportación?",
    "pricing.faq.exporting.a":
      "Puedes exportar tu blueprint como PDF para uso offline y (en niveles compatibles) añadir acciones a Google Calendar o Outlook mediante .ics. La exportación está disponible para cada plano que crees dentro de tu nivel.",

    // About
    "about.title": "Sobre Vector",
    "about.tagline": "Por qué existe Vector y en qué se diferencia.",
    "about.purpose.title": "¿Qué es Vector?",
    "about.purpose.body":
      "Vector es un arquitecto de objetivos con IA. No solo conversa: usa modelos mentales probados (primeros principios, Pareto y otros) para convertir una ambición vaga en un blueprint concreto: fases, hitos y próximos pasos accionables. Obtienes un plan estructurado que puedes exportar y seguir, no un hilo largo de consejos genéricos.",
    "about.vsLLM.title": "Vector frente a ChatGPT, Gemini, Claude",
    "about.vsLLM.body":
      "Los LLM estándar son buenos para conversación abierta y conocimiento amplio. Vector está hecho para una cosa: desglosar objetivos en planes ejecutables. Te guía paso a paso por un método elegido, mantiene tus respuestas en contexto y produce un único blueprint compartible. Piénsalo como un arquitecto dedicado a tus objetivos, no un asistente generalista.",
    "about.founder.title": "¿Quién está detrás de Vector?",
    "about.founder.body":
      "Vector fue creado por David Clerc. Puedes confiar en que el producto está construido con una visión clara y cuidado por cómo la gente define y persigue sus objetivos. Conecta con David en LinkedIn para saludar o hacer preguntas.",
    "about.founder.name": "David Clerc",
    "about.founder.role": "Fundador",
    "about.founder.bio":
      "David Clerc es emprendedor, ingeniero comercial, magíster en finanzas, con amplia experiencia en IA y ciencia de datos. Le encantan los deportes al aire libre, el gimnasio y la lectura.",
    "about.founder.linkedin": "LinkedIn",
    "about.founder.github": "GitHub",
    "about.video.title": "¿Por qué Vector?",
    "about.video.body":
      "Un vídeo breve del fundador sobre qué inspiró Vector y por qué existe. Próximamente.",
    "about.video.comingSoon": "Vídeo próximamente",

    // Community
    "community.title": "Plantillas de la Comunidad",
    "community.subtitle": "Descubre y construye sobre las ambiciones de otros.",
    "community.empty": "Aún no hay plantillas. ¡Sé el primero en publicar!",
    "community.by": "por",
    "community.useTemplate": "Usar Plantilla",
    "community.vote": "Votar",
    "community.gift": "Regalar Puntos",
    "community.voteLogin": "Inicia sesión para votar.",
    "community.voted": "¡Votado!",
    "community.alreadyVoted": "Ya has votado por esto.",
    "community.giftLogin": "Inicia sesión para regalar puntos.",
    "community.gifted": "¡Regalaste 5 puntos al autor!",
    "community.imported": "Plantilla importada a tu espacio.",
    "community.error":
      "No se pudieron cargar las plantillas. Intenta más tarde.",
    "community.voteError": "No se pudo registrar el voto.",
    "community.search": "Buscar plantillas...",
    "community.createFirst": "Crear tu primer Plano",
    "community.noResults":
      "No se encontraron plantillas que coincidan con tu búsqueda.",
    "community.errorMore": "Error al cargar más plantillas.",

    // Leaderboard
    "leaderboard.title": "Tabla de Clasificación",
    "leaderboard.topContributors": "Mejores Colaboradores",
    "leaderboard.subtitle": "Miembros de la comunidad más apreciados",
    "leaderboard.totalVotes": "Votos Totales",
    "leaderboard.templates": "Plantillas",
    "leaderboard.empty": "Aún no hay colaboradores.",
    "leaderboard.error": "Error al cargar la tabla de clasificación.",

    // Common
    "common.about": "¿Qué es?",
    "common.pros": "Pros",
    "common.cons": "Contras",
    "common.example": "Ejemplo",
    "common.use": "Usar este método",

    // Goal Wizard
    // Goal Wizard
    "wizard.newConversation": "Nueva Conversación",
    "wizard.exit": "Salir del Arquitecto",
    "wizard.restart": "Reiniciar",
    "wizard.export": "Exportar a Google",
    "wizard.save": "Guardar Plan",
    "wizard.typePlaceholder": "Escribe tu respuesta...",
    "wizard.synthesizing": "Sintetizando tu plano...",
    "wizard.phase.thinking": "Diseñando estrategia...",
    "wizard.phase.drafting": "Redactando tu plan...",
    "wizard.phase.reviewing": "Revisando calidad...",
    "wizard.phase.finalizing": "Casi listo...",
    "wizard.ai.complete":
      "Arquitectura completa. He sintetizado tu estrategia en un plano visual.",
    "wizard.reopening": "Reabriendo tu plano {0}.",
    "wizard.loaded":
      "Plano cargado. Puedes exportarlo o reiniciar para reconstruirlo.",
    "wizard.welcome": "¡Hola! Soy tu {0}. Vamos a diseñar tu ambición.",
    "wizard.agentStart": "Dime, ¿qué tienes en mente?",
    "wizard.readyToBuild":
      "Vamos a construir tu plan. Tengo tu objetivo en mente.",
    "wizard.yourGoal": "Tu objetivo:",
    "wizard.dsss.firstQuestion":
      "Construyamos tu plan. ¿Cuál es tu situación actual o tu mayor obstáculo?",
    "wizard.lockedError":
      "Este marco no está incluido en tu plan. Actualiza para usarlo.",
    "wizard.viewFullBlueprint": "Ver plano completo, guardar e exportar",
    "wizard.yourBlueprint": "Tu Plano",
    "wizard.liveDraft": "Borrador en vivo",
    "wizard.buildingPlanUpdates":
      "Construyendo tu plan – se actualiza mientras hablamos",
    "wizard.draftPanelPurpose":
      "Tu plan de un vistazo: ve qué está definido y qué sigue mientras lo construimos.",
    "wizard.mandalaCentralGoal": "Objetivo central",
    "wizard.mandalaCategories": "Categorías",
    "mandala.clickToOpen": "Clic para abrir",
    "mandala.backToOverview": "Volver al resumen (Esc)",
    "mandala.backToOverviewTitle": "Volver al resumen (Esc)",
    "mandala.pressEscToGoBack": "Pulsa Esc para volver",
    "mandala.clickAnyCardToEdit": "Haz clic en una tarjeta para editar",
    "mandala.listView": "Vista en lista",
    "mandala.switchToGrid": "Cambiar a cuadrícula",
    "mandala.copyFullStrategy": "Copiar estrategia completa",
    "mandala.previousCluster": "Cluster anterior",
    "mandala.nextCluster": "Siguiente cluster",
    "mandala.moveStepEarlier": "Mover paso antes",
    "mandala.moveStepLater": "Mover paso después",
    "mandala.copyText": "Copiar texto",
    "mandala.addSubTasks": "Añadir sub-tareas o viñetas",
    "mandala.centralGoalPlaceholder": "Objetivo central",
    "mandala.categoryPlaceholder": "Categoría",
    "mandala.stepPlaceholder": "Paso...",
    "mandala.titlePlaceholder": "Título",
    "mandala.stepDetail": "Detalle del paso",
    "mandala.stepOf": "Paso {0} de {1}",
    "mandala.untitledStep": "Paso sin título",
    "mandala.whyThisStep": "Por qué este paso",
    "mandala.whyThisStepPlaceholder":
      "Breve razón de por qué este paso apoya tu objetivo…",
    "mandala.whyThisStepHelp":
      "Explica por qué importa este paso. El agente puede completarlo.",
    "mandala.subTasks": "Sub-tareas / viñetas",
    "mandala.subTasksPlaceholder":
      "ej. Practicar pronunciación con ChatGPT 30 min 3 veces/semana",
    "mandala.subTasksHelp":
      "Acciones concretas que puedes hacer. Añade las que necesites.",
    "mandala.whyThisPillar": "Por qué este pilar",
    "mandala.desktopRecommended":
      "Esta visualización se ve mejor en escritorio. Tu plan está guardado—ábrelo en un portátil o PC para explorar el gráfico Mandala completo.",
    "wizard.visualizationDesktopRecommended":
      "Esta visualización se ve mejor en escritorio. Tu plan está guardado—ábrelo en un portátil o PC para explorar la vista completa.",
    "wizard.inputExpand": "Expandir",
    "wizard.inputCollapse": "Contraer",
    "wizard.viewDraft": "Ver borrador",
    "wizard.closeDraft": "Cerrar borrador",
    "wizard.planPack": "Paquete del plan",
    "wizard.nextBestAction": "Siguiente mejor acción",
    "wizard.commitment": "Compromiso",
    "wizard.weeklyReview": "Revisión semanal",
    "wizard.executiveSummary": "Resumen ejecutivo",
    "wizard.planPackReadyMessage":
      "Tu plano está listo abajo. Revisa el paquete del plan, guárdalo y luego pasa al seguimiento y la exportación.",
    "wizard.upgrade.title": "Desbloquea el blueprint completo",
    "wizard.upgrade.description":
      "Has generado una vista previa. Mejora al Plan Estándar para revelar la estrategia detallada completa.",
    "wizard.upgrade.cta": "Mejorar ahora",
    "wizard.upgrade.back": "No, llévame de vuelta",
    "wizard.sectionRefinement.action": "Afinar {0}",
    "wizard.sectionRefinement.refining": "Afinando...",
    "wizard.sectionRefinement.defaultTitle": "Afinar sección",
    "wizard.sectionRefinement.defaultDescription":
      "Refina una sección del plan sin regenerar el blueprint completo.",
    "wizard.sectionRefinement.optionalContext": "Contexto opcional",
    "wizard.sectionRefinement.defaultPlaceholder":
      "Añade cualquier contexto extra que el ajuste deba respetar.",
    "wizard.sectionRefinement.apply": "Aplicar actualización con IA",
    "wizard.sectionRefinement.error": "No pude afinar esa sección ahora mismo.",
    "wizard.sectionRefinement.diagnosis.description":
      "Refina la lectura estratégica de la situación sin reescribir el resto del plan.",
    "wizard.sectionRefinement.diagnosis.placeholder":
      "Opcional: nombra una restricción nueva, un punto de presión, un punto ciego o un ángulo que el diagnóstico deba tener en cuenta.",
    "wizard.sectionRefinement.proof.description":
      "Refuerza solo el bucle de evidencia, los marcadores y la capa de responsabilidad.",
    "wizard.sectionRefinement.proof.placeholder":
      "Opcional: describe qué evidencia falta, qué debería ser medible o qué tipo de prueba quieres que el plan exija.",
    "wizard.sectionRefinement.recovery.description":
      "Afina la lógica de recuperación para que el plan sobreviva a días malos y semanas fallidas.",
    "wizard.sectionRefinement.recovery.placeholder":
      "Opcional: añade el patrón exacto de fallo o la restricción de recuperación que esta lógica de rescate debe resolver.",
    "wizard.section.diagnosis": "Diagnóstico",
    "wizard.section.operatingSystem": "Sistema de ejecución",
    "wizard.section.proof": "Evidencia",
    "wizard.section.recovery": "Recuperación",
    "wizard.section.diagnosis.title": "Por qué este plan encaja",
    "wizard.section.diagnosis.description":
      "Pon a prueba la lógica primero. Estas tarjetas explican la situación real para la que está diseñado el plan y puedes afinar esta capa sin cambiar el resto del sistema de ejecución.",
    "wizard.section.operatingSystem.title":
      "Lo que realmente ejecutas cada semana",
    "wizard.section.operatingSystem.description":
      "Esta es la parte del plan que debe comportarse como un sistema de ejecución, no como un informe. Afina aquí la cadencia, la secuencia y las reglas operativas.",
    "wizard.section.proof.title": "Cómo se vuelve visible el progreso",
    "wizard.section.proof.description":
      "Usa esta capa para definir qué cuenta como movimiento real. Debe ser obvio cómo medirás, demostrarás y validarás externamente el progreso semana a semana.",
    "wizard.section.recovery.title": "Qué ocurre cuando la ejecución se rompe",
    "wizard.section.recovery.description":
      "Esta capa mantiene vivo el plan después de un mal día o una mala semana. Edita aquí la lógica de fallos, el movimiento de rescate y los disparadores de revisión en lugar de regenerar todo el plan.",
    "wizard.section.frameworkLens": "Lente del framework",
    "wizard.section.frameworkLens.description":
      "La visualización específica del framework queda abajo. El sistema de ejecución compartido de arriba hace que el plan sea más fácil de ejecutar, mientras que la vista única del framework mantiene el blueprint final diferenciado.",
    "wizard.card.strategicDiagnosis": "Diagnóstico estratégico",
    "wizard.card.strategicPillars": "Pilares estratégicos",
    "wizard.card.constraintMap": "Mapa de restricciones",
    "wizard.card.leverageMoves": "Movimientos de palanca",
    "wizard.card.whyThisMatters": "Por qué importa",
    "wizard.card.whatToAvoid": "Qué evitar",
    "wizard.card.firstWeekActions": "Acciones de la primera semana",
    "wizard.card.milestones": "Hitos",
    "wizard.card.ownershipSystem": "Sistema de responsabilidad",
    "wizard.card.cadence": "Cadencia",
    "wizard.card.supportSystem": "Sistema de apoyo",
    "wizard.card.decisionRules": "Reglas de decisión",
    "wizard.card.scheduleSnapshot": "Resumen del horario",
    "wizard.card.scheduleEmpty":
      "Añade arriba sugerencias de horario para que esto se convierta en un ritmo real de ejecución en lugar de una intención flexible.",
    "wizard.card.scoreboard": "Marcador",
    "wizard.card.leadIndicators": "Indicadores líderes",
    "wizard.card.lagIndicators": "Indicadores rezagados",
    "wizard.card.successCriteria": "Criterios de éxito",
    "wizard.card.proofChecklist": "Checklist de evidencia",
    "wizard.card.setupChecklist": "Checklist de preparación",
    "wizard.card.accountabilityHooks": "Ganchos de responsabilidad",
    "wizard.card.failureModes": "Modos de fallo",
    "wizard.card.recoveryProtocol": "Protocolo de recuperación",
    "wizard.card.revisionTriggers": "Disparadores de revisión",
    "wizard.card.reviewAnchor": "Ancla de revisión",
    "wizard.schedule.days": "Días",
    "wizard.schedule.flexible": "flexible",
    "wizard.schedule.time": "Hora",
    "wizard.schedule.minutesShort": "min",
    "wizard.goalMri.title": "Goal MRI",
    "wizard.goalMri.heading":
      "Por qué este plan encajará antes de generar el blueprint completo",
    "wizard.goalMri.description":
      "Vector ya está formando un diagnóstico a partir de tu contexto. Esto muestra la fricción, la palanca y las suposiciones faltantes antes de fijar el plan.",
    "wizard.goalMri.status.ready": "Listo para cerrar",
    "wizard.goalMri.status.leftSingular": "Queda {0} aclaración",
    "wizard.goalMri.status.leftPlural": "Quedan {0} aclaraciones",
    "wizard.goalMri.bottlenecks": "Cuellos de botella",
    "wizard.goalMri.failureModes": "Modos probables de fallo",
    "wizard.goalMri.leverageMoves": "Movimientos de palanca",
    "wizard.goalMri.missingAssumptions": "Suposiciones faltantes",
    "wizard.goalMri.empty.bottlenecks":
      "Todavía falta un patrón de restricción más claro.",
    "wizard.goalMri.empty.failureModes":
      "Los modos de fallo se afinarán a medida que llegue más contexto.",
    "wizard.goalMri.empty.leverageMoves":
      "La capa de palanca todavía se está formando.",
    "wizard.goalMri.empty.missingAssumptions":
      "No se detectaron supuestos faltantes importantes. El plan puede generarse desde aquí.",
    "wizard.blueprintReadyBelow":
      "Tu plano {0} está listo abajo. Revisa tu plan personalizado y ajusta si quieres.",
    "wizard.planStepsPlaceholder":
      "Los pasos de acción aparecerán aquí cuando se genere el plan.",
    "wizard.restartWarning.title": "¿Reiniciar el plan?",
    "wizard.restartWarning.description":
      "¡Cuidado! Si reinicias tu plan se perderá el contenido y ya se consumió un crédito de tu balance en esta conversación porque llegó a la fase final.",
    "wizard.restartWarning.confirm": "Sí, reiniciar",
    "wizard.creditConsumedInPlan":
      "Se consumió 1 plan de tu balance en esta conversación.",
    "wizard.noCredits": "Necesitas más planes para refinar.",
    "wizard.creditError": "Te quedan 0 planes. Actualiza para continuar.",
    "wizard.outOfCredits": "No te quedan planes.",
    "difficulty.easy": "Fácil",
    "difficulty.intermediate": "Intermedio",
    "difficulty.hard": "Difícil",
    "difficulty.godLevel": "Nivel altísimo",
    "difficulty.easyDesc":
      "La mayoría logra esto con esfuerzo moderado. Tus recursos (tiempo, habilidades, voluntad) están alineados.",
    "difficulty.intermediateDesc":
      "Objetivo común; tasa de éxito típica. Requiere esfuerzo constante.",
    "difficulty.hardDesc":
      "Menos personas lo logran. Suele requerir compromiso significativo o suerte.",
    "difficulty.godLevelDesc":
      "Muy pocos lo logran. Exige dedicación excepcional y circunstancias favorables. Ambitioso, no fracaso.",
    "difficulty.whyThis": "Por qué este nivel:",
    "difficulty.ariaLabel": "Nivel de dificultad del objetivo",
    // Framework Titles & Questions
    "fp.title": "Goal Planner Generator",
    "fp.q1":
      "¡Hola! Soy tu Goal Planner Generator. Si estás aquí es porque buscas un cambio real y necesitas una estrategia sólida. Muchos fallan por falta de un plan de acción constante, pero estás en el lugar correcto. Cuéntame: ¿qué objetivo quieres alcanzar, en cuánto tiempo y qué importancia tiene para ti? Crearemos un plan a tu medida. Cuantos más detalles compartas, mejor será el resultado. Es momento de cambiar tu vida.",
    "fp.q2":
      "¿Cuáles son las verdades fundamentales que sabes con certeza? Desglosa el problema en hechos innegociables.",
    "fp.q3":
      "Basado en estas verdades, ¿cuál es una forma completamente nueva de construir esto desde cero?",
    "fp.truths": "Verdades Fundamentales",
    "fp.newApproach": "La Nueva Arquitectura",
    "general.steps": "Pasos de Acción",

    // Admin Dashboard
    "admin.title": "Panel de Administración",
    "admin.subtitle":
      "Gestiona usuarios, modera plantillas y consulta estadísticas del sistema.",
    "admin.tabs.stats": "Estadísticas",
    "admin.tabs.users": "Usuarios",
    "admin.tabs.templates": "Plantillas",
    "admin.tabs.analytics": "Analítica",
    "admin.stats.totalUsers": "Usuarios Totales",
    "admin.stats.totalBlueprints": "Planos Totales",
    "admin.stats.totalTemplates": "Plantillas Totales",
    "admin.users.search": "Buscar usuarios...",
    "admin.users.table.email": "Email",
    "admin.users.table.tier": "Nivel",
    "admin.users.table.credits": "Planes",
    "admin.users.table.admin": "Es Admin",
    "admin.templates.table.title": "Título de Plantilla",
    "admin.templates.table.author": "Autor",
    "admin.templates.table.status": "Estado",
    "admin.templates.table.featured": "Destacado",
    "admin.actions.save": "Guardar",
    "admin.actions.approve": "Aprobar",
    "admin.actions.reject": "Rechazar",
    "admin.actions.feature": "Destacar",
    "admin.actions.unfeature": "Quitar Destacado",
    "admin.actions.refresh": "Actualizar",
    "admin.search.noResults": "No se encontraron usuarios.",
    "admin.users.loading": "Cargando usuarios...",
    "admin.templates.loading": "Cargando plantillas...",
    "admin.templates.noResults": "No se encontraron plantillas.",
    "admin.analytics.title": "Canal de Analítica Global",
    "admin.analytics.desc":
      "La analítica global del sistema requiere la agregación de todos los eventos de usuario. Esta sección se poblará a medida que se desplieguen vistas de informes globales en Supabase.",
    "admin.tabs.payments": "Pagos",
    "admin.payments.title": "Transacciones Recientes",
    "admin.payments.desc":
      "Monitorea los ingresos de la plataforma y eventos de suscripción.",
    "admin.payments.empty": "No hay historial de pagos disponible.",
    "admin.accessDenied": "Acceso Denegado",
    "admin.loading": "Cargando...",

    // Tier Names
    "tier.architect": "Arquitecto",
    "tier.builder": "Constructor",
    "tier.max": "Max",
    "tier.enterprise": "Empresarial",

    // Community Polish
    "community.sort.recent": "Recientes",
    "community.sort.top": "Más votados",
    "community.author.anonymous": "Anónimo",
    "community.desc.empty": "No se proporcionó descripción.",
    "community.loadMore": "Cargar más",
    "app.sync.error": "No se pudieron sincronizar los planos",
    "app.sync.failed": "Sincronización fallida, guardado localmente",
    "app.auth.signedOut": "Sesión cerrada",
    "app.auth.createAccountToTry": "Crea una cuenta para probar el servicio.",
    "app.profile.signInRequired": "Inicia sesión para continuar.",
    "app.blueprint.saved": "¡Plano guardado!",
    "app.blueprint.deleted": "Plano eliminado",
    "app.pricing.enterprise": "Contáctanos para el plan Empresarial",
    "app.template.imported": "¡Plantilla importada!",
    "app.template.published": "¡Plantilla publicada!",
    "app.tier.selected": "Nivel {0} seleccionado",
    "app.publish.prompt": "Ingresa una descripción para esta plantilla:",
    "app.publish.defaultDesc": "Análisis basado en {0}",
    "app.offline": "Modo Offline",
    "app.skipToMain": "Saltar al contenido principal",
    "feedback.button": "Comentarios",
    "feedback.subtitle":
      "Leemos cada mensaje. Tu opinión define lo que construimos.",
    "feedback.ratingLabel": "¿Cómo calificarías tu experiencia?",
    "feedback.optional": "opcional",
    "feedback.messageLabel": "Tu feedback",
    "feedback.messagePlaceholder":
      "¿Qué te funciona? ¿Qué mejorar? Ideas bienvenidas.",
    "feedback.messageRequired": "Escribe tu feedback antes de enviar.",
    "feedback.emailLabel": "Email",
    "feedback.thankYou": "¡Gracias! Lo usaremos para mejorar Vector.",
    "feedback.admin.title": "Comentarios de usuarios",
    "feedback.admin.empty": "Aún no hay comentarios.",
    "feedback.admin.rating": "Valoración",
    "feedback.admin.page": "Página",
    "feedback.admin.message": "Mensaje",
    "feedback.admin.contact": "Contacto",
    "feedback.admin.date": "Fecha",
    "landing.hero.architectYour": "Planifica Tu",
    "landing.hero.ambition": "Ambición.",
    "landing.hero.subtitleChunk.1":
      "Vector usa el pensamiento de primeros principios y marcos probados para convertir metas abstractas en planes precisos.",
    "landing.hero.subtitleChunk.2":
      "Deja de obtener resultados mediocres con consejos genéricos de chats estándar.",
    "landing.hero.subtitleChunk.3":
      "Vector es la mejor herramienta para articular tus ideas en un plan paso a paso ejecutable.",
    "landing.hero.subtitleChunk.4": "Empieza a construir tu futuro hoy.",
    "landing.hero.subtitleChunk.5":
      "Vector es un planificador de metas para todos—no es un chat. Obtén un plan claro que puedes guardar y seguir.",
    "landing.hero.subtitleChunk.6":
      "¿No sabes qué método elegir? Encontraremos el mejor para tu meta—con el mínimo esfuerzo de tu parte.",
    "landing.hero.giftBadge":
      "1 plan gratis para nuevos usuarios que se registren",
    "landing.hero.startBuilding": "Empieza gratis",
    "landing.hero.viewPricing": "Ver precios",
    "landing.hero.helpMePlan": "Ayúdame a lograr mis metas",
    "landing.hero.pathHint":
      "Encuentra el marco adecuado para tu meta, o ve directo al chat.",
    "landing.hero.newHere": "¿Primera vez? Mira cómo funciona",
    "landing.liftoff.vector": "Vector",
    "landing.howItWorks.title": "Cómo funciona Vector",
    "landing.howItWorks.subtitle":
      "De la meta al plan en pocos pasos. Sin tecnicismos: responde, chatea y obtén tu plano.",
    "landing.howItWorks.step1.title": "Cuéntale a Vector tu meta",
    "landing.howItWorks.step1.desc":
      "Responde unas preguntas para que Vector entienda qué quieres.",
    "landing.howItWorks.step2.title": "Recibe tu método",
    "landing.howItWorks.step2.desc":
      "Vector te recomienda el mejor modelo mental para ti.",
    "landing.howItWorks.step3.title": "Construye tu plan",
    "landing.howItWorks.step3.desc":
      "Chatea con Vector para crear tu plan paso a paso.",
    "landing.howItWorks.step4.title": "Exporta o guarda",
    "landing.howItWorks.step4.desc":
      "Descarga PDF, añade al calendario o guarda en tu cuenta.",
    "landing.whatIsVector.title": "¿Qué es Vector?",
    "landing.whatIsVector.desc":
      "Vector es un planificador de metas. Respondes preguntas sencillas y crea un plan paso a paso que puedes guardar y seguir. No es ChatGPT—sin chat interminable. Solo una hoja de ruta clara para tus metas.",
    "landing.howItWorks.vsLLM.title":
      "¿Por qué no usar simplemente ChatGPT o Gemini?",
    "landing.howItWorks.vsLLM.desc":
      "Los modelos de IA estándar son generalistas que te dan texto interminable en un simple 'trozo de papel'. Vector es un arquitecto de metas dedicado. Te guía a través de un modelo mental comprobado paso a paso y sintetiza tus respuestas en un plano altamente visual, facilitando ver la imagen completa. Además, te proporciona herramientas de seguimiento integradas para gestionar activamente tu progreso a lo largo del tiempo, dándole una enorme ventaja competitiva sobre los chatbots estándar.",
    "landing.howItWorks.examples.title": "De lo vago a lo procesable",
    "landing.howItWorks.examples.vague1": '"Quiero ponerme en forma"',
    "landing.howItWorks.examples.actionable1":
      "Un plan de 12 semanas rastreado con hitos semanales, fases de entrenamiento y hábitos alimenticios usando Pareto.",
    "landing.howItWorks.examples.vague2": '"Empezar un negocio"',
    "landing.howItWorks.examples.actionable2":
      "Una hoja de ruta con Primeros Principios desde estudios de mercado hasta un MVP, con tareas exactas listadas.",

    // The Vector Advantage (Bento Box)
    "landing.advantage.title": "La Ventaja Vector",
    "landing.advantage.subtitle":
      "Por qué los verdaderos arquitectos no confían en chats estándar.",
    "landing.advantage.livingPlan.title": "Un Plano Vivo",
    "landing.advantage.livingPlan.desc":
      "Tu plan no se entierra en un chat. Vive en tu panel para rastrearlo, editarlo y consultarlo siempre.",
    "landing.advantage.execution.title": "Hecho para Ejecutar",
    "landing.advantage.execution.desc":
      "Exporta tareas directo a tu Calendario o PDF. Cerramos la brecha entre el plan digital y la acción real.",
    "landing.advantage.quality.title": "Calidad sobre Consejos",
    "landing.advantage.quality.desc":
      "En lugar de consejos genéricos de internet, te obligamos a usar modelos mentales de élite.",
    "landing.advantage.community.title": "Validado por la Comunidad",
    "landing.advantage.community.desc":
      "No empieces desde cero. Clona y adapta planos exitosos que personas reales ya han probado.",
    "landing.advantage.noPrompting.title": 'Cero "Prompt Engineering"',
    "landing.advantage.noPrompting.desc":
      "Solo responde preguntas. Vector actúa como tu entrevistador experto para extraer tus mejores ideas sin esfuerzo.",

    "landing.inspiredBy.title": "Inspirado por grandes mentes",
    "landing.inspiredBy.subtitle":
      "Vector aplica marcos y métodos de líderes de pensamiento en los que ya confías.",
    "authors.tonyRobbins.tagline": "Método RPM",
    "authors.timFerriss.tagline": "DSSS y métodos 4-Hour",
    "authors.elonMusk.tagline": "Primeros principios",
    "authors.eisenhower.tagline": "Matriz Eisenhower",
    "authors.pareto.tagline": "Principio 80/20",
    "authors.johnDoerr.tagline": "OKRs",
    "authors.miekoKamiya.tagline": "Ikigai",
    "authors.jesseItzler.tagline": "Misogi",
    "authors.marcusElliott.tagline": "Misogi",
    "frameworks.helpMeChoose": "Ayúdame a elegir el método adecuado",

    // SEO
    "seo.title":
      "Vector | Planificador de metas con IA, generador de planes de acción y OKR",
    "seo.description":
      "Convierte metas vagas en planes de acción estructurados con IA. Vector usa Primeros Principios, Pareto, OKRs, Eisenhower y otros frameworks para crear hojas de ruta, hitos y próximos pasos.",
    "seo.keywords":
      "planificador de metas con IA, arquitecto de vida IA, generador de planes, analizador de metas, analizador de objetivos, coach de vida, coach de vida IA, herramienta de primeros principios, generador OKR IA, app de establecimiento de metas, generador de planes de acción, desarrollo personal, planificador de carrera, planificador de vida, hoja de ruta, hitos, ejecución, modelos mentales, estrategia, gestión de tareas, blueprint, productividad basada en frameworks",

    // Intake Modal
    "intake.title": "Encuentra tu Método",
    "intake.subtitle":
      "Cuéntale a Vector tu objetivo y te recomendaremos el modelo mental perfecto.",
    "intake.objective.label": "¿Cuál es tu objetivo principal?",
    "intake.objective.placeholder":
      'ej. "Quiero lanzar un negocio SaaS en 3 meses"',
    "intake.stakes.label": "¿Qué está en juego?",
    "intake.stakes.placeholder": 'ej. "Alto riesgo financiero"',
    "intake.horizon.label": "Horizonte Temporal",
    "intake.horizon.placeholder": 'ej. "90 días"',
    "intake.obstacle.label": "¿Cuál es tu mayor obstáculo o situación actual?",
    "intake.obstacle.placeholder":
      'ej. "Me abruman las opciones" o "Falta de tiempo"',
    "intake.successLookLike.label": "¿Cómo se ve el éxito para ti?",
    "intake.successLookLike.placeholder":
      'ej. "Un plan claro que pueda seguir cada día"',
    "intake.optional": "Opcional",
    "intake.objective.hint": "Más detalle ayuda a Vector a recomendar mejor.",
    "intake.reassurance":
      "Vector analizará tus respuestas y sugerirá el mejor método.",
    "intake.analyzing": "Analizando...",
    "intake.analyze": "Obtener mi recomendación",
    "intake.result.title": "Método Recomendado",
    "intake.tryAgain": "Probar de nuevo",
    "intake.useFramework": "Usar Método",
    "intake.fitting": "Por qué esto encaja con tu ambición:",
    "intake.exampleLabel": "Cómo funciona en la práctica:",
    "intake.learnMore": "Saber más sobre este método",
    "wizard.placeholder": "Escribe tu respuesta...",

    "rpm.title": "Estratega de Objetivos RPM",
    "rpm.q1":
      "¿Cuál es el Resultado específico que quieres lograr? (Sé preciso)",
    "rpm.q2":
      "¿Cuál es tu Propósito? ¿Por qué es esto IMPRESCINDIBLE para ti? (El 'Por qué' alimenta el 'Cómo')",
    "rpm.q3":
      "¿Cuál es tu Plan de Acción Masiva? Enumera al menos 5 acciones inmediatas.",
    "rpm.outcome": "Resultado Estratégico",
    "rpm.purpose": "El Propósito (Por qué)",
    "rpm.map": "Plan de Acción Masiva",

    "eisenhower.title": "Priorizador Matriz Eisenhower",
    "eisenhower.q1":
      "¿Qué tienes en mente? Enumera todas las tareas y proyectos que estás manejando actualmente.",
    "eisenhower.q2":
      "¿Cuáles de estos son urgentes (requieren atención inmediata) e importantes (se alinean con tus valores a largo plazo)?",
    "eisenhower.q3":
      "¿Cuáles son importantes pero no urgentes? (Estas son tus tareas de crecimiento)",
    "eisenhower.do": "Hacer (Urgente e Importante)",
    "eisenhower.schedule": "Agendar (No Urgente)",
    "eisenhower.delegate": "Delegar",
    "eisenhower.eliminate": "Eliminar",
    "eisenhower.desc.urgentImportant": "Urgente e Importante",
    "eisenhower.desc.notUrgentImportant": "No Urgente e Importante",
    "eisenhower.desc.urgentNotImportant": "Urgente y No Importante",
    "eisenhower.desc.notUrgentNotImportant": "Ni Urgente Ni Importante",

    "okr.title": "Diseñador de Sistemas OKR",
    "okr.q1":
      "¿Cuál es tu Objetivo de alto nivel para los próximos 90 días? (Hazlo inspirador)",
    "okr.q2":
      "¿Cómo sabrás que has tenido éxito? Enumera 3 Resultados Clave medibles.",
    "okr.q3":
      "¿Cuál es la primera iniciativa importante que lanzarás para alcanzar estos números?",
    "okr.northStar": "La Estrella Polar de 90 Días",
    "okr.keyResult": "Resultado Clave",
    "okr.initiative": "Iniciativa Inmediata",

    "fpf.title": "First Principles",
    "fpf.q1": "¿Cuál es tu objetivo principal?",
    "fpf.q2": "¿Cuáles son las verdades innegables de este problema?",
    "fpf.q3": "Basado en estas verdades, ¿cuál es un nuevo enfoque?",
    "fpf.truths": "Verdades Innegables",
    "fpf.newApproach": "Nuevo Enfoque",

    "gps.title": "El Método GPS",
    "gps.title.long": "El Método GPS (Objetivo, Plan, Sistema)",
    "gps.goal": "Objetivo",
    "gps.plan": "Plan",
    "gps.system": "Sistema",
    "gps.q1": "¿Cuál es tu Objetivo principal? (El Destino)",
    "gps.q2": "¿Cuál es tu Plan para llegar allí? (La Ruta)",
    "gps.q3": "¿Qué Sistema asegurará que sigas el plan? (El Vehículo/Hábitos)",

    "misogi.title": "El Desafío Misogi",
    "misogi.q1":
      "Un Misogi es un desafío anual definitorio con un 50% de probabilidad de éxito. Regla 1: Debe ser difícil. Regla 2: No morir. ¿Cuál es un desafío que te asusta pero te llama?",
    "misogi.q2":
      "¿Por qué crees que tienes una alta probabilidad de fallar? (Si estás seguro de que puedes hacerlo, no es un Misogi).",
    "misogi.q3":
      "¿Cuál es la 'purificación' física o mental que esperas lograr al intentar esto?",

    "ikigai.title": "Ikigai",
    "ikigai.q1":
      "¿Qué te apasiona? (Actividades o temas con los que pierdes la noción del tiempo)",
    "ikigai.q2":
      "¿En qué eres bueno? (Habilidades, fortalezas, lo que la gente te pide)",
    "ikigai.q3":
      "¿Qué necesita el mundo? (Problemas que te importan o causas que importan)",
    "ikigai.q4":
      "¿Por qué te pueden pagar? (Dónde tus habilidades encuentran demanda)",
    "ikigai.love": "Lo que amas",
    "ikigai.goodAt": "En lo que eres bueno",
    "ikigai.worldNeeds": "Lo que el mundo necesita",
    "ikigai.paidFor": "Por lo que te pueden pagar",
    "ikigai.purpose": "Tu Ikigai (propósito)",
    "pareto.focusRatio": "Proporción de enfoque",
    "pareto.highImpactCount": "{0} de alto impacto",
    "pareto.deprioritizeCount": "{0} para quitar prioridad",
    "pareto.subtitleVital": "Alto impacto (20%)",
    "pareto.subtitleTrivial": "Menor impacto (80%)",
    "misogi.challenge": "El desafío",
    "misogi.challengeBadge": "El desafío (50% de probabilidad de fallar)",
    "misogi.failureGap": "La brecha del fracaso",
    "misogi.purification": "La purificación",

    // Frameworks Data
    "fw.first-principles.title": "Método First Principles (Elon Musk)",
    "fw.first-principles.desc":
      "Desglosa problemas complejos en elementos básicos y reensámblalos desde cero.",
    "fw.pareto.title": "Principio de Pareto (80/20)",
    "fw.pareto.desc":
      "Identifica el 20% de los esfuerzos que conducen al 80% de tus resultados.",
    "fw.rpm.title": "Tony Robbins RPM",
    "fw.rpm.desc":
      "Sistema centrado en resultados: Resultado, Propósito y Plan de Acción Masiva.",
    "fw.eisenhower.title": "Matriz de Eisenhower",
    "fw.eisenhower.desc":
      "Categoriza tareas por urgencia e importancia para dominar la priorización.",
    "fw.okr.title": "Sistema OKR",
    "fw.okr.desc":
      "Establece Objetivos ambiciosos y define Resultados Clave medibles.",
    "fw.dsss.title": "Tim Ferriss DSSS",
    "fw.dsss.desc":
      "Deconstrucción, Selección, Secuenciación, Apuestas. Un marco de meta-aprendizaje.",
    "fw.mandalas.title": "Gráfico Mandala",
    "fw.mandalas.desc":
      "Una cuadrícula de 9x9 para mapear un objetivo central y todos los subobjetivos relacionados.",
    "fw.gps.title": "El Método GPS",
    "fw.gps.desc":
      "Cerrando la brecha entre el conocimiento y la ejecución con Objetivo, Plan, Sistema.",
    "fw.misogi.title": "El Desafío Misogi",
    "fw.misogi.desc":
      "Asume un desafío definitorio este año con un 50% de probabilidad de éxito para restablecer tu línea base espiritual.",
    "fw.ikigai.title": "Ikigai",
    "fw.ikigai.desc":
      "Encuentra tu razón de ser en la intersección de lo que amas, lo que se te da bien, lo que el mundo necesita y por lo que te pueden pagar.",

    // Detailed Framework Data (ES)
    "fw.first-principles.definition":
      "Un modelo mental de resolución de problemas que implica descomponer un problema en sus elementos básicos (verdades fundamentales) y luego reensamblarlos desde cero.",
    "fw.first-principles.example":
      "SpaceX redujo los costos de los cohetes calculando el costo de la materia prima en lugar de comprar partes preensambladas.",
    "fw.first-principles.pros.0": "Fomenta la innovación",
    "fw.first-principles.pros.1": "Elimina suposiciones",
    "fw.first-principles.pros.2": "Crea soluciones únicas",
    "fw.first-principles.cons.0": "Consume mucho tiempo",
    "fw.first-principles.cons.1": "Mentalmente exigente",
    "fw.first-principles.cons.2": "Requiere comprensión profunda",

    "fw.pareto.definition":
      "El concepto de que para muchos resultados, aproximadamente el 80% de las consecuencias provienen del 20% de las causas.",
    "fw.pareto.example":
      "Una empresa de software arregla el 20% de los errores más importantes para resolver el 80% de los bloqueos.",
    "fw.pareto.pros.0": "Aumenta la eficiencia",
    "fw.pareto.pros.1": "Enfoca recursos",
    "fw.pareto.pros.2": "Simple de aplicar",
    "fw.pareto.cons.0": "Simplifica en exceso sistemas complejos",
    "fw.pareto.cons.1": "La proporción 80/20 es una estimación",
    "fw.pareto.cons.2": "Puede ignorar detalles pequeños pero cruciales",

    "fw.rpm.definition":
      'El Método de Planificación Rápida (RPM) se centra en el resultado (Result), el "por qué" (Purpose), y el "cómo" (Massive Action Plan).',
    "fw.rpm.example":
      'En lugar de "Ir al gimnasio", el objetivo es "Salud Vibrante" (Resultado) porque "Quiero energía para mis hijos" (Propósito).',
    "fw.rpm.pros.0": "Altamente motivador",
    "fw.rpm.pros.1": "Alinea acciones con valores",
    "fw.rpm.pros.2": "Reduce el trabajo inútil",
    "fw.rpm.cons.0": "Puede ser abrumador inicialmente",
    "fw.rpm.cons.1": "Requiere compromiso emocional",
    "fw.rpm.cons.2": "Estructura menos rígida",

    "fw.eisenhower.definition":
      "Una herramienta de toma de decisiones que divide las tareas en cuatro cuadrantes basados en la urgencia y la importancia.",
    "fw.eisenhower.example":
      'Urgente e Importante: "Caída del servidor". Importante no Urgente: "Planificación estratégica".',

    "fw.misogi.definition":
      "Una dificultad voluntaria asumida para purificar la mente y el cuerpo. Regla 1: Debe ser realmente difícil (tasa de fallo del 50%). Regla 2: No morir.",
    "fw.misogi.example":
      "Remar en tabla a través de un canal de 30 millas sin haber remado más de 5 millas nunca.",
    "fw.misogi.pros.0": "Impulso radical de confianza",
    "fw.misogi.pros.1": "Restablece la dificultad",
    "fw.misogi.pros.2": "Purificación espiritual",
    "fw.misogi.cons.0": "Alta probabilidad de fallo",
    "fw.misogi.cons.1": "Esfuerzo físico/mental",
    "fw.misogi.cons.2": "No es una herramienta diaria",
    "fw.eisenhower.pros.0": "Priorización clara",
    "fw.eisenhower.pros.1": "Reduce la procrastinación",
    "fw.eisenhower.pros.2": "Marco de delegación",
    "fw.eisenhower.cons.0": "Categorización subjetiva",
    "fw.eisenhower.cons.1": "No tiene en cuenta el esfuerzo",
    "fw.eisenhower.cons.2":
      "Puede convertirse en una herramienta de procrastinación",

    "fw.okr.definition":
      "Objetivos y Resultados Clave (OKR) es un marco de establecimiento de metas para definir y rastrear objetivos y sus resultados.",
    "fw.okr.example":
      'Objetivo: "Aumentar el conocimiento de la marca". Resultado Clave: "Lograr 10,000 usuarios activos".',
    "fw.okr.pros.0": "Alinea equipos",
    "fw.okr.pros.1": "Progreso medible",
    "fw.okr.pros.2": "Fomenta la ambición",
    "fw.okr.cons.0": "Puede ser demasiado rígido",
    "fw.okr.cons.1": "Difícil establecer métricas correctas",
    "fw.okr.cons.2": "Puede desmotivar si no se alcanzan los objetivos",

    "fw.dsss.definition":
      "Un marco de 4 pasos para la adquisición rápida de habilidades: Deconstruir, Seleccionar, Secuenciar y Apostar.",
    "fw.dsss.example":
      "Aprender idioma: Deconstruir gramática, Seleccionar 1200 palabras, Secuenciar oraciones, Apostar $100 a aprobar.",
    "fw.dsss.pros.0": "Aprendizaje rápido",
    "fw.dsss.pros.1": "Enfoca en alto impacto",
    "fw.dsss.pros.2": "Responsabilidad integrada",
    "fw.dsss.cons.0": "Requiere disciplina",
    "fw.dsss.cons.1": "Las apuestas pueden ser estresantes",
    "fw.dsss.cons.2": "Necesita buen análisis",
    "dsss.desc.deconstruct": "Descompón la habilidad en subcomponentes",
    "dsss.desc.selection": "Selecciona el 20% vital en el que enfocarte",
    "dsss.desc.sequence": "Orden de aprendizaje o ejecución",
    "dsss.desc.stakes": "Responsabilidad: qué está en juego si no cumples",

    "fw.mandalas.definition":
      "Un gráfico visual con un objetivo central rodeado por 8 categorías, cada una con 8 pasos accionables (64 ítems).",
    "fw.mandalas.example":
      'Objetivo Central: "Mejor Jugador". 8 Externos: Estado Físico, Mental, Control, Velocidad, Suerte, etc.',
    "fw.mandalas.pros.0": "Integral",
    "fw.mandalas.pros.1": "Visualiza conexiones",
    "fw.mandalas.pros.2": "Equilibra objetivos grandes",
    "fw.mandalas.cons.0": "Puede volverse complejo",
    "fw.mandalas.cons.1": "Requiere 64 ítems específicos",
    "fw.mandalas.cons.2": "Difícil de rastrear todo",

    // Share
    "share.button": "Compartir",
    "share.title": "Vector - Arquitecto de Metas IA",
    "share.text": "Arquitecta tu ambición con Vector.",
    "share.success": "¡Enlace copiado al portapapeles!",
    "share.error": "Error al copiar el enlace.",

    // Error Boundary
    "error.title": "Algo salió mal",
    "error.desc":
      "Nos hemos encontrado con un error inesperado. Actualiza la página para intentarlo de nuevo.",
    "error.refresh": "Actualizar página",

    // Quotes
    "quote.1.text":
      "El primer principio es que no debes engañarte a ti mismo y eres la persona más fácil de engañar.",
    "quote.1.author": "Richard Feynman",
    "quote.2.text":
      "Si quieres encontrar los secretos del universo, piensa en términos de energía, frecuencia y vibración.",
    "quote.2.author": "Nikola Tesla",
    "quote.3.text":
      "Las personas que están lo suficientemente locas como para pensar que pueden cambiar el mundo son las que lo hacen.",
    "quote.3.author": "Steve Jobs",
    "quote.4.text":
      "Optimismo, pesimismo, a la mierda eso; vamos a hacer que suceda. Con Dios como mi maldito testigo, estoy empeñado en hacerlo funcionar.",
    "quote.4.author": "Elon Musk",
    "quote.5.text":
      "Tu tiempo es limitado, así que no lo desperdicies viviendo la vida de otra persona.",
    "quote.5.author": "Steve Jobs",
    "quote.6.author": "Elon Musk",

    // Tracker UI
    "tracker.title": "Seguir progreso",
    "tracker.execution.signals": "Señales de ejecución",
    "tracker.execution.stateLabel": "Estado de ejecución",
    "tracker.execution.lastActivity": "Última actividad {0}",
    "tracker.execution.nextBestAction": "Siguiente mejor acción",
    "tracker.execution.overdueSignals": "Señales de atraso",
    "tracker.execution.proofSignals": "Señales de evidencia",
    "tracker.execution.recoveryMove": "Movimiento de recuperación",
    "tracker.execution.adaptiveRevision": "Revisión adaptativa",
    "tracker.execution.revisionTighten": "Ajustar esta semana",
    "tracker.execution.revisionStandard": "Revisar plan",
    "tracker.execution.useRealData":
      "Usa los datos reales de ejecución para simplificar y ajustar el plan.",
    "tracker.execution.risk.low": "bajo",
    "tracker.execution.risk.medium": "medio",
    "tracker.execution.risk.high": "alto",
    "tracker.execution.riskLabel": "riesgo {0}",
    "tracker.execution.state.onTrack": "En marcha",
    "tracker.execution.state.atRisk": "En riesgo",
    "tracker.execution.state.stalled": "Estancado",
    "tracker.execution.state.rescue": "Modo rescate",
    "tracker.execution.summary.onTrack":
      "La cadencia, la evidencia y el progreso están alineados. Mantén el sistema estable.",
    "tracker.execution.summary.atRisk":
      "Todavía se puede recuperar el impulso, pero el ritmo actual necesita una ejecución más ajustada.",
    "tracker.execution.summary.stalled":
      "El plan está perdiendo tracción. Simplifica la semana antes de empujar más.",
    "tracker.execution.summary.rescue":
      "La ejecución se está rompiendo con el alcance actual. Pasa a modo rescate y reduce el plan ahora.",
    "tracker.execution.overdue.noActivity":
      "No se ha registrado actividad en {0} días.",
    "tracker.execution.overdue.noSteps":
      "Todavía no hay pasos registrados como completados. Empieza por la siguiente mejor acción.",
    "tracker.execution.overdue.lowProgress":
      "El progreso sigue por debajo del primer umbral de hito.",
    "tracker.execution.proof.noLog":
      "No se ha registrado ninguna evidencia ni reflexión esta semana.",
    "tracker.execution.proof.noProofAfterSetback":
      "El tracker muestra fricción, pero no hay una nota reciente de evidencia que explique qué cambió.",
    "tracker.execution.recovery.resetPrefix":
      "Reinicia con una pequeña victoria hoy: ",
    "tracker.execution.recovery.shorterPrefix":
      "Si hoy se complica, haz una versión más corta de esta acción: ",
    "tracker.execution.adaptive.tightenPrefix": "Ajusta esta semana",
    "tracker.execution.adaptive.restoreProofLoop":
      "Ajusta esta semana: restablece un bucle de evidencia antes de añadir más alcance.",
    "tracker.execution.adaptive.reviewFit":
      "Revisa si la cadencia actual todavía encaja con tu semana.",
    "tracker.backToPlans": "Volver a Mis Planos",
    "tracker.planSummary": "Resumen del plan",
    "tracker.steps": "Pasos",
    "tracker.markComplete": "Marcar como completado",
    "tracker.didItToday": "¿Lo hice hoy?",
    "tracker.addNote": "Añadir una nota breve (opcional)",
    "tracker.logToday": "Registrar hoy",
    "tracker.streak": "Racha",
    "tracker.dayStreak": "{0} días de racha",
    "tracker.lastDone": "Última vez: {0}",
    "tracker.journal": "Diario",
    "tracker.journalPlaceholder":
      "¿Cómo va? Victorias, obstáculos, reflexiones...",
    "tracker.addEntry": "Añadir entrada",
    "tracker.timeline": "Actividad",
    "tracker.noActivity":
      "Sin actividad todavía. Marca pasos como completados o añade una entrada en el diario.",
    "tracker.checkIn": "Check-in",
    "tracker.completedStep": "Paso completado",
    "tracker.setbackLogged": "Contratiempo registrado",
    "tracker.status.active": "Activo",
    "tracker.status.completed": "Completado",
    "tracker.status.paused": "Pausado",
    "tracker.status.abandoned": "Abandonado",
    "tracker.planNotFound": "Plan no encontrado",
    "tracker.unauthorized": "No tienes acceso a este plan.",
    "tracker.editPlan": "Editar plan",
    "tracker.trackingQuestion": "Pregunta de seguimiento",
    "tracker.trackingQuestionPlaceholder": "ej. ¿Seguiste tu plan hoy?",
    "tracker.share.error": "No se pudo generar el enlace para compartir",
    "shared.backHome": "Volver al inicio",
    "shared.expired": "Enlace vencido o no válido",
    "shared.loadError":
      "No se pudo cargar el plan compartido. Inténtalo de nuevo más tarde.",
    "shared.readOnly": "Plan compartido (solo lectura)",
    "tracker.color": "Color",
    "tracker.frequency": "Frecuencia",
    "tracker.frequency.daily": "Cada día",
    "tracker.frequency.weekly": "Cada semana",
    "tracker.frequency.custom": "Personalizado",
    "tracker.reminder": "Recordatorio",
    "tracker.reminderAt": "A las {0}",
    "tracker.reminderDays": "Días",
    "tracker.reminderAnyDay": "Cualquier día",
    "tracker.calendar": "Calendario",
    "tracker.editHistory": "Editar historial",
    "tracker.score": "Puntuación",
    "tracker.bestStreaks": "Mejores rachas",
    "tracker.currentStreak": "Actual: {0} días",
    "tracker.tileHeatmap": "Actividad reciente",
    "tracker.frequencyHeatmap": "Patrón por día",
    "tracker.savings": "Seguimiento de ahorros",
    "tracker.tags": "Etiquetas",
    "tracker.tagsPlaceholder": "ej. salud, prioridad",
    "tracker.realtimeStreak": "Racha Actual",
    "tracker.startStreakToday": "Comienza tu racha hoy",
    "dashboard.track": "Seguir",

    // Errors
    "errors.agentTimeout":
      "La solicitud tardó demasiado. Por favor, inténtalo de nuevo.",
    "errors.agentConfig":
      "Problema de configuración del servicio IA. Inténtalo más tarde.",
    "errors.agentRateLimit":
      "Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.",
    "errors.agentGeneric":
      "No pudimos completar tu plan. Inténtalo de nuevo o simplifica tu objetivo.",
    "errors.syncFailed":
      "No se pudo guardar. Verifica tu conexión e inténtalo de nuevo.",
    "errors.trackerUpdateFailed":
      "No se pudo actualizar. Por favor, inténtalo de nuevo.",

    "tracker.noStepsToTrack":
      "No se encontraron pasos rastreables para este plan.",
    "tracker.useRelatedTasks":
      "Puedes usar tareas relacionadas, subobjetivos o entradas del diario en su lugar.",
    "support.buttonLabel": "Soporte",
    "support.description":
      "Si tú o alguien que conoces está pasando por un momento difícil, por favor busca ayuda. Hay ayuda disponible de forma anónima y confidencial.",
    "support.noResources":
      "No se encontraron recursos de soporte activos en este momento. En caso de emergencia, llama a tus servicios de emergencia locales.",
    "support.visitWebsite": "Visitar Sitio Web",
    "tracker.todayTitle": "Para hoy",
    "tracker.todayEmpty": "Nada para hoy",
    "tracker.today": "Hoy",

    "profile.exportData": "Exportar mis Datos",
    "profile.exporting": "Preparando exportación...",
    "profile.exportSuccess": "¡Datos exportados con éxito!",
    "profile.exportError": "Error al exportar datos.",
    "profile.dashboardPrefs": "Preferencias del Dashboard",
    "profile.showStreaks": "Mostrar Rachas",
    "profile.showScore": "Mostrar Puntuación",
    "profile.showHeatmap": "Mostrar Mapas de Calor",
    "profile.defaultView": "Vista Predeterminada",
    "profile.digestPrefs": "Preferencias de Resumen",
    "profile.digestFrequency": "Frecuencia del Resumen",
    "profile.digest.weekly": "Semanal",
    "profile.digest.monthly": "Mensual",
    "profile.digest.off": "Desactivado",
    "profile.digestDay": "Día del Resumen",

    "support.title": "Soporte y Recursos de Crisis",
    "support.emergency": "Emergencia / Crisis",
    "support.general": "Soporte General",

    "achievements.first_steps.title": "Primeros Pasos",
    "achievements.first_steps.desc": "Crea tu primer plan",
    "achievements.contributor.title": "Contribuidor",
    "achievements.contributor.desc": "Publica una plantilla en la comunidad",
    "achievements.dedicated.title": "Dedicado",
    "achievements.dedicated.desc": "Usa la app por 3 días consecutivos",
    "achievements.architect.title": "Arquitecto",
    "achievements.architect.desc": "Crea 5 planes",
    "achievements.unstoppable.title": "Imparable",
    "achievements.unstoppable.desc": "Usa la app por 7 días consecutivos",
    "achievements.visionary.title": "Visionario",
    "achievements.visionary.desc": "Crea 20 planes",
  };

export default esTranslations;
