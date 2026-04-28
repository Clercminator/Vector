import type { TranslationDictionary } from "../translations";

const deTranslations: TranslationDictionary = {
    // Navigation
    "nav.frameworks": "Modelle",
    "nav.blueprints": "Meine Pläne",
    "nav.pricing": "Preise",
    "nav.profile": "Profil",
    "nav.community": "Community",
    "nav.signin": "Anmelden",
    "nav.signout": "Abmelden",
    "nav.getStarted": "Los geht's",
    "nav.about": "Über uns",
    "nav.articles": "Artikel",
    "nav.admin": "Admin",

    // Hero
    "hero.title.prefix": "Gestalten Sie Ihre",
    "hero.title.suffix": "Ambition.",
    "hero.description":
      "Vector nutzt First-Principles-Thinking, um abstrakte Ziele in präzise architektonische Baupläne zu verwandeln.",
    "hero.start": "Jetzt Bauen",
    "hero.pricing": "Preise ansehen",
    "landing.hero.subtitleChunk.1":
      "Vector nutzt First-Principles-Denken und bewährte Frameworks, um abstrakte Ziele in präzise Pläne zu verwandeln.",
    "landing.hero.subtitleChunk.2":
      "Schluss mit mittelmäßigen Ergebnissen und generischem Chat-Rat.",
    "landing.hero.subtitleChunk.3":
      "Vector ist das beste Tool, um Ihre Ideen in einen umsetzbaren Schritt-für-Schritt-Plan zu verwandeln.",
    "landing.hero.subtitleChunk.4": "Bauen Sie Ihre Zukunft ab heute.",
    "landing.hero.subtitleChunk.5":
      "Vector ist ein Zielplaner für alle—kein Chat. Erhalten Sie einen strukturierten Plan zum Speichern und Ausführen.",
    "landing.hero.subtitleChunk.6":
      "Unklar, welches Framework zu wählen? Wir finden das beste für Ihr Ziel—mit minimalem Aufwand von Ihrer Seite.",
    "landing.hero.giftBadge": "1 Gratis-Plan für neue Nutzer bei Registrierung",

    // Frameworks Section
    "frameworks.title": "Wählen Sie Ihren Rahmen",
    "frameworks.subtitle":
      "Jede Ambition erfordert eine andere Linse. Wählen Sie ein bewährtes Framework, um Ihren Prozess zu beginnen.",
    "landing.guides.explore": "Erst lesen, dann bauen",
    "landing.guides.title": "Framework-Artikel für Sichtbarkeit und Umsetzung.",
    "landing.guides.subtitle":
      "Erkunde die mentalen Modelle hinter Vector, verstehe den Einsatz jedes Frameworks und springe direkt in den passenden Blueprint.",
    "landing.guides.cta": "Alle Artikel ansehen",
    "guides.seoTitle": "Framework-Artikel für die Zielplanung | Vector AI",
    "guides.seoDescription":
      "Lies praxisnahe Artikel über First Principles, OKRs, Ikigai, Pareto und mehr. Nutze Vector, um jedes Modell in einen umsetzbaren Plan zu verwandeln.",
    "guides.structuredListName": "Frameworks und Planungsleitfäden von Vector",
    "guides.hero.title":
      "Redaktionelle Leitfäden zu den Frameworks hinter Vector.",
    "guides.hero.subtitle":
      "Erfahre, wie jedes Planungsmodell funktioniert, wann du es einsetzen solltest und wo seine Grenzen liegen. Verwandle dann das passende Modell in einen umsetzbaren Blueprint.",
    "guides.hero.featured": "Empfohlener Artikel",
    "guides.hero.readFeatured": "Empfohlenen Leitfaden lesen",
    "guides.hero.startWithFramework": "Mit diesem Framework starten",
    "guides.hero.summaryTitle": "Was du hier findest",
    "guides.hero.summary.0":
      "Praktische Erklärungen statt abstrakter Zusammenfassungen.",
    "guides.hero.summary.1":
      "Passende Zielgruppen, Trade-offs und Anwendungshinweise für jedes Framework.",
    "guides.hero.summary.2":
      "Direkte Wege vom Lesen zum Aufbau eines Plans in Vector.",
    "guides.hero.availableCount":
      "Aktuell sind {0} Framework-Leitfäden verfügbar, die die zentralen Denkmodelle im Produkt abdecken.",
    "guides.topicClusters.eyebrow": "Thematische Cluster",
    "guides.topicClusters.title":
      "Einstiegspunkte rund um echte Suchintentionen.",
    "guides.topicClusters.description":
      "Diese Cluster ordnen die Bibliothek nach den tatsächlichen Problemen, nach denen Menschen suchen: ein Framework wählen, Überforderung beseitigen, Lernsysteme verbessern und ähnliche Modelle vergleichen.",
    "guides.cluster.resourceCount": "{0} verknüpfte Ressourcen",
    "guides.cluster.label": "Cluster",
    "guides.library.eyebrow": "Bibliothek durchsuchen",
    "guides.library.title":
      "Filtere den öffentlichen Content-Hub nach Framework-Typ oder Suchintention.",
    "guides.library.description":
      "Die Filter trennen dauerhafte Framework-Erklärungen von Use-Case-Seiten, Vergleichen, Anwendungsleitfäden und problemorientierten Artikeln.",
    "guides.filter.all": "Alle Inhalte",
    "guides.filter.frameworks": "Framework-Leitfäden",
    "guides.filter.selection": "Framework-Auswahl",
    "guides.filter.useCase": "Anwendungsfälle",
    "guides.filter.comparison": "Vergleiche",
    "guides.filter.application": "Framework-Anwendungen",
    "guides.filter.problem": "Problemorientierte Leitfäden",
    "guides.filter.system": "Ergebnissysteme",
    "guides.filter.tool": "Tools und Vorlagen",
    "guides.filter.example": "Blueprint-Beispiele",
    "guides.filter.synonym": "Angrenzende Intention",
    "guides.filter.commercial": "Produktvergleiche",
    "guides.editorial.eyebrow": "Redaktionelle Artikel",
    "guides.editorial.title":
      "Suchintention-orientierte Artikel, die Nutzern helfen, Frameworks zu wählen, zu vergleichen und anzuwenden.",
    "guides.editorial.description":
      "Jeder Artikel basiert auf einem echten Planungsproblem statt auf generischen Produktivitätstipps.",
    "guides.editorial.whyThisExists": "Warum es diesen Artikel gibt",
    "guides.editorial.readArticle": "Artikel lesen",
    "guides.editorial.readFrameworkGuide": "Framework-Leitfaden lesen",
    "guides.frameworks.eyebrow": "Framework-Leitfäden",
    "guides.frameworks.title":
      "Tiefgehende Erklärungen zu den Planungsmodellen, die Vector in Blueprints verwandelt.",
    "guides.frameworks.description":
      "Das sind die grundlegenden Framework-Seiten, die jede Methode, ihre passende Zielgruppe und die Trade-offs bei ihrer Nutzung definieren.",
    "guides.frameworks.bestFor": "Am besten geeignet für",
    "guides.frameworks.readArticle": "Artikel lesen",
    "guides.frameworks.startBlueprint": "Blueprint starten",
    "frameworks.helpMeChoose": "Helfen Sie mir bei der Auswahl",

    // SEO
    "seo.title": "Vector | KI-Zielplaner, Aktionsplan-Generator und OKR-Tool",
    "seo.description":
      "Verwandeln Sie vage Ziele mit KI in strukturierte Aktionspläne. Vector nutzt First Principles, Pareto, OKRs, Eisenhower und weitere Frameworks für Roadmaps, Meilensteine und nächste Schritte.",
    "seo.keywords":
      "KI Zielplaner, KI Lebensarchitekt, Plan Generator, Ziel-Analysator, Ziel-Analyse, Life Coach, KI Life Coach, First-Principles-Tool, OKR Generator KI, Zielsetzungs-App, Aktionsplan-Generator, persönliche Entwicklung, Karriereplaner, Lebensplaner, Roadmap, Meilensteine, Umsetzung, Mentale Modelle, Strategie, Aufgabenmanagement, Blueprint, Framework-basierte Produktivität",

    "landing.hero.helpMePlan": "Helfen Sie mir, meine Ziele zu erreichen",
    "landing.hero.pathHint":
      "Finden Sie den richtigen Rahmen für Ihr Ziel oder gehen Sie direkt zum Chat.",

    // Footer
    "footer.privacy": "Datenschutz",
    "footer.terms": "AGB",
    "footer.security": "Sicherheit",
    "footer.contact": "Kontakt",
    "footer.copyright": "© 2026 Vector Architect AI",
    "footer.builtBy": "Erstellt von David Clerc",
    "footer.liftoff": "Erleben Sie den Start",

    // Framework Card
    "card.start": "Architektieren",
    "card.locked": "In Standard enthalten",

    // Tier Names
    "tier.architect": "Architekt",
    "tier.builder": "Builder",
    "tier.max": "Max",
    "tier.enterprise": "Enterprise",

    // Common
    "common.back": "Zurück",
    "common.save": "Speichern",
    "common.close": "Schließen",
    "common.cancel": "Abbrechen",
    "common.loading": "Laden...",
    "common.error": "Etwas ist schief gelaufen",
    "common.about": "Was ist das?",
    "common.pros": "Vorteile",
    "common.cons": "Nachteile",
    "common.example": "Beispiel",
    "common.use": "Dieses Modell verwenden",
    "common.copiedToClipboard": "In die Zwischenablage kopiert",
    "common.errorCopiedToClipboard": "Fehler in die Zwischenablage kopiert",
    "common.share": "Teilen",
    "common.exit": "Beenden",
    "common.fullScreen": "Vollbild",
    "common.copyStrategy": "Strategie kopieren",
    "common.copySection": "Abschnitt kopieren",
    "common.copyList": "Liste kopieren",
    "common.moveUp": "Nach oben",
    "common.moveDown": "Nach unten",
    "common.deleteItem": "Element löschen",
    "common.typeHere": "Hier eingeben...",
    "common.typeTask": "Aufgabe eingeben...",

    // Onboarding
    "onboarding.welcome.title": "Willkommen bei Vector",
    "onboarding.welcome.desc":
      "Vector ist keine To-Do-Liste. Es ist ein architektonischer Motor für Ihr Leben.",
    "onboarding.step1.title": "Wählen Sie ein mentales Modell",
    "onboarding.step1.desc": "Wie wollen Sie Ihr Ziel dekonstruieren?",
    "onboarding.step2.title": "Planen Sie Ihr Vorhaben",
    "onboarding.step2.desc":
      "Beantworten Sie die tiefgreifenden Fragen. Erstellen Sie den Bauplan.",
    "onboarding.btn.next": "Weiter",
    "onboarding.btn.start": "Architektieren starten",
    "onboarding.step3.title": "Holen Sie das Beste aus Vector heraus",
    "onboarding.step3.desc":
      "Speichern Sie Ihre Pläne, um den Fortschritt zu verfolgen, und exportieren Sie Ihre Aktionspläne.",
    "onboarding.skip": "Überspringen",

    // Profile
    "profile.title": "Ihr Profil",
    "profile.level": "Level",
    "profile.credits": "Pläne",
    "profile.normalCredits": "Pläne",
    "profile.extraCredits": "Bonus-Pläne",
    "profile.creditsRemaining": "Pläne übrig",
    "profile.buyMore": "Mehr Pläne",
    "profile.creditPackCta":
      "Kaufen Sie einmalige Planpakete mit MercadoPago Checkout Pro",
    "profile.creditPackButton": "{0} für {1} kaufen",
    "profile.personalInfo": "Persönliche Informationen",
    "profile.personalInfoHint":
      "Diese Angaben werden genutzt, um einen personalisierten Plan für Sie zu erstellen. Je mehr Sie angeben, desto besser wird der Plan auf Sie zugeschnitten.",
    "profile.personalInfoReminder":
      "Nutzer mit vollständigem Profil erhalten personalisiertere Pläne. Pläne ohne genug Kontext wirken oft generisch—füllen Sie diese Felder aus, damit Vector Ihre Erfahrung personalisieren kann.",
    "profile.displayName": "Anzeigename",
    "profile.bio": "Bio / Mission",
    "profile.avatarUrl": "Avatar-URL",
    "profile.save": "Änderungen speichern",
    "profile.saving": "Wird gespeichert...",
    "profile.success": "Profil aktualisiert",
    "profile.error": "Fehler beim Speichern des Profils",

    // Auth
    "auth.title": "Bei Vector anmelden",
    "auth.desc":
      "Wir senden Ihnen einen magischen Link. Keine Passwörter. Ihre Pläne werden synchronisiert.",
    "auth.email": "E-Mail",
    "auth.placeholder": "sie@domain.com",
    "auth.submit": "Anmeldelink senden",
    "auth.sent": "Magischer Link gesendet an",
    "auth.diffEmail": "Andere E-Mail verwenden",
    "auth.noSupabase": "Supabase ist nicht konfiguriert.",

    // Dashboard
    "dashboard.title": "Meine Pläne",
    "dashboard.subtitle":
      "Ihre gespeicherten Strategien, bereit zum Wiederöffnen oder Exportieren.",
    "dashboard.empty":
      'Noch keine gespeicherten Pläne. Erstellen Sie einen und klicken Sie auf "Plan speichern".',
    "dashboard.start": "Starten Sie Ihren ersten Plan",
    "dashboard.deleteTitle": "Plan löschen?",
    "dashboard.deleteDesc":
      "Dies entfernt diesen Plan aus Ihrer Liste. Kann nicht rückgängig gemacht werden.",
    "dashboard.cancel": "Abbrechen",
    "dashboard.delete": "Löschen",
    "dashboard.open": "Öffnen",
    "dashboard.created": "Erstellt",
    "dashboard.searchPlaceholder": "Pläne suchen...",
    "dashboard.filterAll": "Alle",
    "dashboard.createFirst": "Erstellen Sie Ihren ersten Plan",
    "dashboard.emptyTitle": "Keine Pläne gefunden",
    "dashboard.emptyDesc":
      "Passen Sie Ihre Filter an oder erstellen Sie einen neuen Plan.",

    // Pricing
    "pricing.title": "Transparente Preise",
    "pricing.subtitle":
      "Wählen Sie das Niveau an architektonischer Präzision, das Ihre Ambition erfordert.",
    "pricing.mostPopular": "Beliebteste",
    "pricing.oneTime": "Einmalig",
    "pricing.custom": "Benutzerdefiniert",
    "pricing.currentPlan": "Aktueller Plan",
    "pricing.tier.architect": "Architekt",
    "pricing.tier.architect.desc":
      "Ein voller Plan: alle Modelle, PDF- und Kalender-Export.",
    "pricing.tier.builder": "Builder",
    "pricing.tier.builder.desc": "5 Pläne mit allen Modellen und Export.",
    "pricing.tier.max": "Max",
    "pricing.tier.max.desc": "20 Pläne für Power-User und Profis.",
    "pricing.tier.enterprise": "Enterprise",
    "pricing.tier.enterprise.desc":
      "Für Teams und Organisationen, die Skalierung und Kontrolle benötigen.",
    "pricing.cta.start": "Jetzt Bauen",
    "pricing.cta.builder": "Standard wählen",
    "pricing.cta.max": "Max wählen",
    "pricing.cta.contact": "Vertrieb kontaktieren",
    "pricing.feature.architect.frameworks": "Alle Modelle",
    "pricing.feature.architect.blueprints": "{0} Plan mit voller Erfahrung",
    "pricing.feature.architect.credits": "{0} Planerstellung",
    "pricing.feature.architect.ai": "PDF- und Kalender-Export inklusive",
    "pricing.feature.builder.credits": "{0} Planerstellungen",
    "pricing.feature.builder.frameworks": "Alle Modelle",
    "pricing.feature.builder.blueprints": "Bis zu {0} Pläne",
    "pricing.feature.builder.ai": "PDF- und Kalender-Export",
    "pricing.feature.max.credits": "{0} Planerstellungen",
    "pricing.feature.max.frameworks": "Alle Modelle",
    "pricing.feature.max.calendar": "Export zu Kalender (Google / Outlook)",
    "pricing.feature.max.pdf": "Als PDF exportieren und herunterladen",
    "pricing.feature.max.priority": "Priorisiertes KI-Reasoning",
    "pricing.feature.max.blueprints": "Bis zu {0} Pläne",
    "pricing.feature.enterprise.workspaces": "Geteilte Team-Workspaces",
    "pricing.feature.enterprise.admin": "Admin-Dashboard & Analysen",
    "pricing.feature.enterprise.integration": "Individuelle Modell-Integration",
    "pricing.feature.enterprise.support": "Dedizierter Support",
    "pricing.regionDetecting": "Region wird erkannt...",
    "pricing.regionLatam": "LATAM-Zahlung (MercadoPago)",
    "pricing.regionGlobal": "US/EU-Zahlung (Karten, PayPal)",
    "pricing.switchToGlobal": "Aus US/EU zahlend? Wechseln",
    "pricing.switchToLatam": "Aus LATAM zahlend? Wechseln",
    "pricing.payWithCrypto": "Mit Krypto zahlen (Binance Pay)",
    "pricing.cryptoComingSoon":
      "Krypto-Zahlungen (Binance Pay) demnächst. Kontaktieren Sie uns für eine Benachrichtigung.",
    "pricing.redirectMercadoPago": "Weiterleitung zur Kasse...",
    "pricing.redirectLemonSqueezy": "Weiterleitung zur Kasse...",
    "pricing.paymentSuccess":
      "Zahlung erfolgreich! Ihr Konto wird in Kürze aktualisiert.",
    "pricing.paymentFailed": "Zahlung fehlgeschlagen oder abgebrochen.",
    "pricing.paymentPending":
      "Zahlung wird bearbeitet. Ihr Konto wird in Kürze aktualisiert—laden Sie gleich neu.",

    // Community
    "community.title": "Community-Vorlagen",
    "community.subtitle":
      "Entdecken und bauen Sie auf den Ambitionen anderer auf.",
    "community.empty": "Noch keine Vorlagen. Seien Sie der Erste!",
    "community.by": "von",
    "community.useTemplate": "Vorlage verwenden",
    "community.vote": "Abstimmen",
    "community.gift": "Punkte schenken",
    "community.voteLogin": "Bitte anmelden zum Abstimmen.",
    "community.voted": "Abgestimmt!",
    "community.alreadyVoted": "Sie haben bereits abgestimmt.",
    "community.giftLogin": "Anmelden, um Punkte zu schenken.",
    "community.gifted": "hat dem Autor 5 Punkte geschenkt!",
    "community.imported": "Vorlage in Ihren Workspace importiert.",
    "community.error":
      "Fehler beim Laden der Vorlagen. Später erneut versuchen.",
    "community.voteError": "Konnte Stimme nicht registrieren.",

    // Leaderboard
    "leaderboard.title": "Bestenliste",
    "leaderboard.topContributors": "Top-Beitragende",
    "leaderboard.subtitle": "Die geschätztesten Community-Mitglieder",
    "leaderboard.totalVotes": "Gesamtstimmen",
    "leaderboard.templates": "Vorlagen",
    "leaderboard.empty": "Noch keine Beitragenden.",
    "leaderboard.error": "Fehler beim Laden der Bestenliste.",

    // Goal Wizard
    "wizard.exit": "Architekt verlassen",
    "wizard.restart": "Neustart",
    "wizard.export": "Zu Google exportieren",
    "wizard.save": "Plan speichern",
    "wizard.typePlaceholder": "Geben Sie Ihre Antwort ein...",
    "wizard.synthesizing": "Synthetisiere Ihren Plan...",
    "wizard.phase.thinking": "Strategie wird entworfen...",
    "wizard.phase.drafting": "Ihr Plan wird erstellt...",
    "wizard.phase.reviewing": "Qualitätsprüfung...",
    "wizard.phase.finalizing": "Fast fertig...",
    "wizard.ai.complete":
      "Architektur abgeschlossen. Ich habe Ihre Strategie in einen visuellen Plan synthetisiert.",
    "wizard.reopening": "Öffne Ihren Plan {0} erneut.",
    "wizard.loaded": "Plan geladen. Sie können ihn exportieren oder neu bauen.",
    "wizard.welcome":
      "Hallo! Ich bin Ihr {0}. Lassen Sie uns Ihre Ambition architektieren.",
    "wizard.refinePlaceholder":
      "Tippen zum Verfeinern (z.B. 'Füge Aufgabe hinzu: E-Mails prüfen')...",
    "wizard.refineLoading": "Verfeinere Ihren Plan...",
    "wizard.noCredits": "Sie benötigen mehr Pläne, um zu verfeinern.",
    "wizard.refineSuccess": "Aktualisiert! Möchten Sie noch etwas ändern?",
    "wizard.refineError":
      "Konnte den Plan nicht aktualisieren. Bitte versuchen Sie, Ihre Anfrage zu präzisieren.",
    "wizard.configError": "KI ist nicht für Verfeinerung konfiguriert.",
    "wizard.creditError": "Sie haben 0 Pläne. Upgrade erforderlich!",
    "wizard.outOfCredits": "Sie haben keine Pläne mehr.",
    "wizard.lockedError":
      "Dieses Framework ist in Ihrem Plan nicht enthalten. Upgraden Sie, um es zu nutzen.",
    "wizard.exportSuccess": "Erfolgreich zu Google Calendar exportiert!",
    "wizard.exportIcs": ".ics Datei heruntergeladen.",
    "wizard.exportError": "Fehler beim Exportieren der Termine.",
    "wizard.saveSuccess": "Plan erfolgreich gespeichert!",
    "wizard.draftSavedToBlueprints": "Entwurf in Meine Pläne gespeichert",
    "wizard.viewFullBlueprint":
      "Vollständigen Plan anzeigen, speichern & exportieren",
    "wizard.yourBlueprint": "Ihr Plan",
    "wizard.liveDraft": "Live-Entwurf",
    "wizard.buildingPlanUpdates":
      "Ihr Plan wird erstellt – wird beim Sprechen aktualisiert",
    "wizard.draftPanelPurpose":
      "Ihr Plan auf einen Blick: Was steht, was als Nächstes kommt.",
    "wizard.mandalaCentralGoal": "Zentrales Ziel",
    "wizard.mandalaCategories": "Kategorien",
    "mandala.clickToOpen": "Klicken zum Öffnen",
    "mandala.backToOverview": "Zurück zur Übersicht (Esc)",
    "mandala.backToOverviewTitle": "Zurück zur Übersicht (Esc)",
    "mandala.pressEscToGoBack": "Esc drücken zum Zurückgehen",
    "mandala.clickAnyCardToEdit": "Karte zum Bearbeiten anklicken",
    "mandala.listView": "Listenansicht",
    "mandala.switchToGrid": "Zur Rasteransicht",
    "mandala.copyFullStrategy": "Gesamte Strategie kopieren",
    "mandala.previousCluster": "Vorheriger Cluster",
    "mandala.nextCluster": "Nächster Cluster",
    "mandala.moveStepEarlier": "Schritt nach oben",
    "mandala.moveStepLater": "Schritt nach unten",
    "mandala.copyText": "Text kopieren",
    "mandala.addSubTasks": "Unteraufgaben / Stichpunkte",
    "mandala.centralGoalPlaceholder": "Zentrales Ziel",
    "mandala.categoryPlaceholder": "Kategorie",
    "mandala.stepPlaceholder": "Schritt...",
    "mandala.titlePlaceholder": "Titel",
    "mandala.stepDetail": "Schrittdetails",
    "mandala.stepOf": "Schritt {0} von {1}",
    "mandala.untitledStep": "Unbenannter Schritt",
    "mandala.whyThisStep": "Warum dieser Schritt",
    "mandala.whyThisStepPlaceholder":
      "Kurze Begründung, warum dieser Schritt Ihr Ziel unterstützt…",
    "mandala.whyThisStepHelp":
      "Erklären Sie, warum dieser Schritt wichtig ist. Der Agent kann es ausfüllen.",
    "mandala.subTasks": "Unteraufgaben / Stichpunkte",
    "mandala.subTasksPlaceholder":
      "z. B. Aussprache mit ChatGPT 30 Min. 3x/Woche üben",
    "mandala.subTasksHelp":
      "Konkrete Aktionen. Fügen Sie so viele hinzu wie nötig.",
    "mandala.whyThisPillar": "Warum diese Säule",
    "wizard.inputExpand": "Erweitern",
    "wizard.inputCollapse": "Verkleinern",
    "wizard.viewDraft": "Entwurf anzeigen",
    "wizard.closeDraft": "Entwurf schließen",
    "wizard.planPack": "Planpaket",
    "wizard.nextBestAction": "Nächste beste Aktion",
    "wizard.commitment": "Verbindlichkeit",
    "wizard.weeklyReview": "Wöchentliche Überprüfung",
    "wizard.executiveSummary": "Zusammenfassung",
    "wizard.planPackReadyMessage":
      "Ihr Plan ist unten bereit. Prüfen Sie das Planpaket, speichern Sie es und wechseln Sie dann in Tracking und Export.",
    "wizard.upgrade.title": "Vollständigen Blueprint freischalten",
    "wizard.upgrade.description":
      "Sie haben eine Vorschau erstellt. Wechseln Sie zum Standard-Plan, um die vollständige detaillierte Strategie zu sehen.",
    "wizard.upgrade.cta": "Jetzt upgraden",
    "wizard.upgrade.back": "Nein danke, zurück",
    "wizard.sectionRefinement.action": "{0} schärfen",
    "wizard.sectionRefinement.refining": "Wird geschärft...",
    "wizard.sectionRefinement.defaultTitle": "Abschnitt schärfen",
    "wizard.sectionRefinement.defaultDescription":
      "Verfeinern Sie einen Abschnitt des Plans, ohne den gesamten Blueprint neu zu erzeugen.",
    "wizard.sectionRefinement.optionalContext": "Optionaler Kontext",
    "wizard.sectionRefinement.defaultPlaceholder":
      "Fügen Sie zusätzlichen Kontext hinzu, den die Verfeinerung berücksichtigen soll.",
    "wizard.sectionRefinement.apply": "KI-Aktualisierung anwenden",
    "wizard.sectionRefinement.error":
      "Ich konnte diesen Abschnitt gerade nicht schärfen.",
    "wizard.sectionRefinement.diagnosis.description":
      "Verfeinern Sie die strategische Lesart der Situation, ohne den Rest des Plans neu zu schreiben.",
    "wizard.sectionRefinement.diagnosis.placeholder":
      "Optional: nennen Sie eine neue Einschränkung, einen Druckpunkt, einen blinden Fleck oder eine Perspektive, die die Diagnose berücksichtigen soll.",
    "wizard.sectionRefinement.proof.description":
      "Stärken Sie nur die Beweis-Schleife, Scoreboards und die Verantwortungsebene.",
    "wizard.sectionRefinement.proof.placeholder":
      "Optional: beschreiben Sie, welcher Beleg fehlt, was messbar sein sollte oder welche Art von Nachweis der Plan verlangen soll.",
    "wizard.sectionRefinement.recovery.description":
      "Schärfen Sie die Rückfalllogik, damit der Plan schlechte Tage und verpasste Wochen überlebt.",
    "wizard.sectionRefinement.recovery.placeholder":
      "Optional: fügen Sie das genaue Fehlermuster oder die Erholungsbedingung hinzu, die diese Rettungslogik lösen soll.",
    "wizard.section.diagnosis": "Diagnose",
    "wizard.section.operatingSystem": "Ausführungssystem",
    "wizard.section.proof": "Nachweis",
    "wizard.section.recovery": "Erholung",
    "wizard.section.diagnosis.title": "Warum dieser Plan passt",
    "wizard.section.diagnosis.description":
      "Testen Sie zuerst die Logik. Diese Karten erklären die reale Situation, für die der Plan gedacht ist, und Sie können diese Ebene schärfen, ohne den Rest des Ausführungssystems zu verändern.",
    "wizard.section.operatingSystem.title":
      "Was Sie jede Woche tatsächlich ausführen",
    "wizard.section.operatingSystem.description":
      "Dies ist der Teil des Plans, der sich wie ein Ausführungssystem verhalten sollte, nicht wie ein Bericht. Schärfen Sie hier Takt, Reihenfolge und operative Regeln.",
    "wizard.section.proof.title": "Wie Fortschritt sichtbar wird",
    "wizard.section.proof.description":
      "Nutzen Sie diese Ebene, um zu definieren, was als echte Bewegung zählt. Es sollte klar sein, wie Sie Fortschritt Woche für Woche messen, belegen und extern validieren.",
    "wizard.section.recovery.title":
      "Was passiert, wenn die Ausführung abrutscht",
    "wizard.section.recovery.description":
      "Diese Ebene hält den Plan nach einem schlechten Tag oder einer schlechten Woche am Leben. Bearbeiten Sie hier Fehlerlogik, Rettungsschritt und Revisionsauslöser, statt den ganzen Plan neu zu generieren.",
    "wizard.section.frameworkLens": "Framework-Perspektive",
    "wizard.section.frameworkLens.description":
      "Die frameworkspezifische Visualisierung bleibt unten. Das gemeinsame Ausführungssystem oben macht den Plan leichter umsetzbar, während die einzigartige Framework-Ansicht den finalen Blueprint unterscheidbar hält.",
    "wizard.card.strategicDiagnosis": "Strategische Diagnose",
    "wizard.card.strategicPillars": "Strategische Säulen",
    "wizard.card.constraintMap": "Einschränkungskarte",
    "wizard.card.leverageMoves": "Hebelbewegungen",
    "wizard.card.whyThisMatters": "Warum das wichtig ist",
    "wizard.card.whatToAvoid": "Was zu vermeiden ist",
    "wizard.card.firstWeekActions": "Aktionen der ersten Woche",
    "wizard.card.milestones": "Meilensteine",
    "wizard.card.ownershipSystem": "Verantwortungssystem",
    "wizard.card.cadence": "Takt",
    "wizard.card.supportSystem": "Unterstützungssystem",
    "wizard.card.decisionRules": "Entscheidungsregeln",
    "wizard.card.scheduleSnapshot": "Zeitplan-Überblick",
    "wizard.card.scheduleEmpty":
      "Fügen Sie oben Zeitplan-Hinweise hinzu, damit daraus ein echter Ausführungsrhythmus statt einer flexiblen Absicht wird.",
    "wizard.card.scoreboard": "Scoreboard",
    "wizard.card.leadIndicators": "Frühindikatoren",
    "wizard.card.lagIndicators": "Spätindikatoren",
    "wizard.card.successCriteria": "Erfolgskriterien",
    "wizard.card.proofChecklist": "Nachweis-Checkliste",
    "wizard.card.setupChecklist": "Setup-Checkliste",
    "wizard.card.accountabilityHooks": "Verbindlichkeits-Haken",
    "wizard.card.failureModes": "Fehlermuster",
    "wizard.card.recoveryProtocol": "Erholungsprotokoll",
    "wizard.card.revisionTriggers": "Revisionsauslöser",
    "wizard.card.reviewAnchor": "Review-Anker",
    "wizard.schedule.days": "Tage",
    "wizard.schedule.flexible": "flexibel",
    "wizard.schedule.time": "Zeit",
    "wizard.schedule.minutesShort": "Min",
    "wizard.goalMri.title": "Goal MRI",
    "wizard.goalMri.heading":
      "Warum dieser Plan passt, bevor der vollständige Blueprint erzeugt wird",
    "wizard.goalMri.description":
      "Vector formt bereits eine Diagnose aus Ihrem Kontext. Das macht Reibung, Hebel und fehlende Annahmen sichtbar, bevor der Plan festgezogen wird.",
    "wizard.goalMri.status.ready": "Bereit zum Festziehen",
    "wizard.goalMri.status.leftSingular": "Noch {0} Klärung offen",
    "wizard.goalMri.status.leftPlural": "Noch {0} Klärungen offen",
    "wizard.goalMri.bottlenecks": "Engpässe",
    "wizard.goalMri.failureModes": "Wahrscheinliche Fehlermuster",
    "wizard.goalMri.leverageMoves": "Hebelbewegungen",
    "wizard.goalMri.missingAssumptions": "Fehlende Annahmen",
    "wizard.goalMri.empty.bottlenecks":
      "Ein klareres Einschränkungsmuster wird noch benötigt.",
    "wizard.goalMri.empty.failureModes":
      "Die Fehlermuster werden mit mehr Kontext schärfer.",
    "wizard.goalMri.empty.leverageMoves": "Die Hebelebene formt sich noch.",
    "wizard.goalMri.empty.missingAssumptions":
      "Keine größeren fehlenden Annahmen erkannt. Der Plan kann von hier aus erzeugt werden.",
    "wizard.blueprintReadyBelow":
      "Ihr {0}-Plan ist unten bereit. Überprüfen und verfeinern Sie ihn bei Bedarf.",
    "wizard.planStepsPlaceholder":
      "Ihre Aktionsschritte erscheinen hier, sobald der Plan erstellt wurde.",
    "wizard.restartWarning.title": "Plan neu starten?",
    "wizard.restartWarning.description":
      "Achtung! Wenn Sie neu starten, geht der Planinhalt verloren und ein Guthaben wurde bereits für dieses Gespräch verbraucht, da die Endphase erreicht wurde.",
    "wizard.restartWarning.confirm": "Ja, neu starten",
    "wizard.creditConsumedInPlan":
      "1 Plan wurde von Ihrem Guthaben für dieses Gespräch verwendet.",
    "wizard.pdfSuccess": "PDF Heruntergeladen!",
    "wizard.ruleBased": " (Regelbasiert wegen weniger Credits)",
    "difficulty.easy": "Einfach",
    "difficulty.intermediate": "Mittel",
    "difficulty.hard": "Schwer",
    "difficulty.godLevel": "Elite-Level",
    "difficulty.easyDesc":
      "Die meisten erreichen das mit mäßigem Aufwand. Ihre Ressourcen (Zeit, Fähigkeiten, Wille) passen gut.",
    "difficulty.intermediateDesc":
      "Häufiges Ziel; typische Erfolgsrate. Konsequenter Einsatz erforderlich.",
    "difficulty.hardDesc":
      "Weniger Menschen erreichen das. Signifikanter Einsatz oder Glück meist nötig.",
    "difficulty.godLevelDesc":
      "Sehr wenige erreichen das. Außergewöhnliche Hingabe und günstige Umstände. Ehrgeizig, kein Versagen.",
    "difficulty.whyThis": "Warum dieses Niveau:",
    "difficulty.ariaLabel": "Schwierigkeitsgrad des Ziels",

    // Admin
    "admin.title": "Admin-Dashboard",
    "admin.subtitle":
      "Verwalten Sie Benutzer, moderieren Sie Vorlagen und sehen Sie Systemanalysen.",
    "admin.tabs.stats": "Statistik",
    "admin.tabs.users": "Benutzer",
    "admin.tabs.templates": "Vorlagen",
    "admin.tabs.analytics": "Analysen",
    "admin.stats.totalUsers": "Gesamtbenutzer",
    "admin.stats.totalBlueprints": "Gesamtpläne",
    "admin.stats.totalTemplates": "Gesamtvorlagen",
    "admin.users.search": "Benutzer suchen...",
    "admin.users.table.email": "E-Mail",
    "admin.users.table.tier": "Stufe",
    "admin.users.table.credits": "Plans",
    "admin.users.table.admin": "Ist Admin",
    "admin.templates.table.title": "Titel",
    "admin.templates.table.author": "Autor",
    "admin.templates.table.status": "Status",
    "admin.templates.table.featured": "Vorgestellt",
    "admin.actions.save": "Speichern",
    "admin.actions.approve": "Genehmigen",
    "admin.actions.reject": "Ablehnen",
    "admin.actions.feature": "Hervorheben",
    "admin.actions.unfeature": "Hervorhebung entfernen",
    "admin.actions.refresh": "Aktualisieren",
    "admin.search.noResults": "Keine Benutzer gefunden.",
    "admin.users.loading": "Lade Benutzer...",
    "admin.templates.loading": "Lade Vorlagen...",
    "admin.templates.noResults": "Keine Vorlagen gefunden.",
    "admin.analytics.title": "Globale Analyse-Pipeline",
    "admin.analytics.desc":
      "Systemanalysen erfordern Aggregation. Dieser Bereich wird bald gefüllt.",
    "admin.tabs.payments": "Zahlungen",
    "admin.payments.title": "Kürzliche Transaktionen",
    "admin.payments.desc": "Überwachen Sie Plattform-Einnahmen.",
    "admin.payments.empty": "Keine Zahlungshistorie.",
    "admin.accessDenied": "Zugriff verweigert",
    "admin.loading": "Laden...",

    // Frameworks Data
    "fw.first-principles.title": "First Principles",
    "fw.first-principles.desc":
      "Zerlegen Sie komplexe Probleme in Grundelemente.",
    "fw.pareto.title": "Pareto-Prinzip (80/20)",
    "fw.pareto.desc":
      "Identifizieren Sie die 20% der Anstrengungen, die zu 80% der Ergebnisse führen.",
    "fw.rpm.title": "Tony Robbins RPM",
    "fw.rpm.desc": "Ergebnisorientiertes Planungssystem: Result, Purpose, Map.",
    "fw.eisenhower.title": "Eisenhower-Matrix",
    "fw.eisenhower.desc":
      "Kategorisieren Sie Aufgaben nach Dringlichkeit und Wichtigkeit.",
    "fw.okr.title": "OKR-System",
    "fw.okr.desc":
      "Definieren Sie ehrgeizige Ziele und messbare Schlüsselergebnisse.",
    "fw.dsss.title": "DSSS Kompetenzerwerb",
    "fw.dsss.desc":
      "Dekonstruieren, Selektieren, Sequenzieren, Einsatz (Tim Ferriss).",
    "fw.mandalas.title": "Mandala-Chart",
    "fw.mandalas.desc":
      "Ein 9x9-Raster zur Kartierung eines zentralen Ziels und Teilzielen.",

    // Detailed Framework Data (DE)
    "fw.first-principles.definition":
      "Ein mentales Modell, bei dem ein Problem in seine Grundelemente (fundamentale Wahrheiten) zerlegt und von Grund auf neu zusammengesetzt wird.",
    "fw.first-principles.example":
      "SpaceX senkte die Kosten, indem sie die Rohstoffpreise einer Rakete berechneten, anstatt fertige Teile zu kaufen.",
    "fw.first-principles.pros.0": "Fördert Innovation",
    "fw.first-principles.pros.1": "Entfernt Annahmen",
    "fw.first-principles.pros.2": "Schafft einzigartige Lösungen",
    "fw.first-principles.cons.0": "Zeitaufwändig",
    "fw.first-principles.cons.1": "Mental anstrengend",
    "fw.first-principles.cons.2": "Erfordert tiefes Verständnis",

    "fw.pareto.definition":
      "Das Konzept, dass bei vielen Ergebnissen etwa 80% der Folgen aus 20% der Ursachen resultieren.",
    "fw.pareto.example":
      "Ein Unternehmen behebt die Top 20% der Fehler, um 80% der Abstürze zu lösen.",
    "fw.pareto.pros.0": "Steigert Effizienz",
    "fw.pareto.pros.1": "Fokussiert Ressourcen",
    "fw.pareto.pros.2": "Einfach anzuwenden",
    "fw.pareto.cons.0": "Vereinfacht komplexe Systeme zu stark",
    "fw.pareto.cons.1": "80/20 Verhältnis ist eine Schätzung",
    "fw.pareto.cons.2": "Kann wichtige Details ignorieren",

    "fw.rpm.definition":
      'Rapid Planning Method (RPM) konzentriert sich auf das Ergebnis (Result), das "Warum" (Purpose) und das "Wie" (Massive Action Plan).',
    "fw.rpm.example":
      'Statt "Ins Fitnessstudio gehen", ist das Ziel "Lebendige Gesundheit" (Ergebnis), weil "Ich Energie will" (Zweck).',
    "fw.rpm.pros.0": "Hoch motivierend",
    "fw.rpm.pros.1": "Richtet Handlungen an Werten aus",
    "fw.rpm.pros.2": "Reduziert unnötige Arbeit",
    "fw.rpm.cons.0": "Kann anfangs überwältigend sein",
    "fw.rpm.cons.1": "Erfordert emotionale Beteiligung",
    "fw.rpm.cons.2": "Weniger starre Struktur",

    "fw.eisenhower.definition":
      "Ein Entscheidungswerkzeug, das Aufgaben in vier Quadranten basierend auf Dringlichkeit und Wichtigkeit unterteilt.",
    "fw.eisenhower.example":
      'Dringend & Wichtig: "Serverausfall". Wichtig nicht Dringend: "Strategische Planung".',
    "fw.eisenhower.pros.0": "Klare Priorisierung",
    "fw.eisenhower.pros.1": "Reduziert Prokrastination",
    "fw.eisenhower.pros.2": "Delegationsrahmen",
    "fw.eisenhower.cons.0": "Subjektive Kategorisierung",
    "fw.eisenhower.cons.1": "Berücksichtigt Aufwand nicht",
    "fw.eisenhower.cons.2": "Kann selbst zur Prokrastination werden",

    "fw.okr.definition":
      "Objectives and Key Results (OKR) ist ein Rahmenwerk zum Setzen und Verfolgen von Zielen.",
    "fw.okr.example":
      'Ziel: "Markenbekanntheit steigern". Schlüsselergebnis: "10k aktive Nutzer erreichen".',
    "fw.okr.pros.0": "Richtet Teams aus",
    "fw.okr.pros.1": "Messbarer Fortschritt",
    "fw.okr.pros.2": "Fördert Ambition",
    "fw.okr.cons.0": "Kann zu starr sein",
    "fw.okr.cons.1": "Schwer, richtige Metriken zu finden",
    "fw.okr.cons.2": "Kann bei Scheitern demotivieren",

    "fw.dsss.definition":
      "4 Schritte zum schnellen Kompetenzerwerb: Dekonstruieren, Selektieren, Sequenzieren und Einsatz.",
    "fw.dsss.example":
      "Spanisch lernen: Grammatik zerlegen, Top 1200 Wörter wählen, Sätze ordnen, 100$ wetten.",
    "fw.dsss.pros.0": "Schnelles Lernen",
    "fw.dsss.pros.1": "Fokus auf hohen Impact",
    "fw.dsss.pros.2": "Eingebaute Rechenschaftspflicht",
    "fw.dsss.cons.0": "Erfordert Disziplin",
    "fw.dsss.cons.1": "Wetteinsatz kann stressen",
    "fw.dsss.cons.2": "Braucht gute Analyse",
    "dsss.desc.deconstruct": "Zerlegen Sie die Fähigkeit in Teilkomponenten",
    "dsss.desc.selection":
      "Wählen Sie die entscheidenden 20 %, auf die Sie sich konzentrieren",
    "dsss.desc.sequence": "Reihenfolge des Lernens oder der Ausführung",
    "dsss.desc.stakes":
      "Verbindlichkeit: Was steht auf dem Spiel, wenn Sie nicht durchziehen",
    "pareto.focusRatio": "Fokusverhältnis",
    "pareto.highImpactCount": "{0} mit hoher Wirkung",
    "pareto.deprioritizeCount": "{0} zurückstellen",
    "pareto.subtitleVital": "Hohe Wirkung (20 %)",
    "pareto.subtitleTrivial": "Geringere Wirkung (80 %)",
    "misogi.challenge": "Die Herausforderung",
    "misogi.challengeBadge": "Die Herausforderung (50 % Ausfallquote)",
    "misogi.failureGap": "Die Scheiternslücke",
    "misogi.purification": "Die Reinigung",

    "fw.mandalas.definition":
      "Eine visuelle Grafik mit einem zentralen Ziel, umgeben von 8 Kategorien (64 Elemente).",
    "fw.mandalas.example":
      'Zentrales Ziel: "Bester Spieler". 8 Äußere: Physisch, Mental, Kontrolle, Glück, etc.',
    "fw.mandalas.pros.0": "Umfassend",
    "fw.mandalas.pros.1": "Visualisiert Verbindungen",
    "fw.mandalas.pros.2": "Balanciert große Ziele",
    "fw.mandalas.cons.0": "Kann komplex werden",
    "fw.mandalas.cons.1": "Erfordert 64 Elemente",
    "fw.mandalas.cons.2": "Schwer, alles zu verfolgen",

    // Share
    "share.button": "Teilen",
    "share.title": "Vector - KI Ziel-Architekt",
    "share.text": "Gestalten Sie Ihre Ambition mit Vector.",
    "share.success": "Link kopiert!",
    "share.error": "Fehler beim Kopieren.",

    // Error
    "error.title": "Etwas ist schief gelaufen",
    "error.desc":
      "Wir haben einen unerwarteten Fehler festgestellt. Seite aktualisieren.",
    "error.refresh": "Seite aktualisieren",

    // Tracker UI
    "tracker.title": "Fortschritt verfolgen",
    "tracker.execution.signals": "Ausführungssignale",
    "tracker.execution.stateLabel": "Ausführungszustand",
    "tracker.execution.lastActivity": "Letzte Aktivität {0}",
    "tracker.execution.nextBestAction": "Nächste beste Aktion",
    "tracker.execution.overdueSignals": "Verzugssignale",
    "tracker.execution.proofSignals": "Nachweissignale",
    "tracker.execution.recoveryMove": "Erholungsschritt",
    "tracker.execution.adaptiveRevision": "Adaptive Revision",
    "tracker.execution.revisionTighten": "Diese Woche schärfen",
    "tracker.execution.revisionStandard": "Plan überarbeiten",
    "tracker.execution.useRealData":
      "Nutzen Sie die echten Ausführungsdaten, um den Plan zu vereinfachen und zu schärfen.",
    "tracker.execution.risk.low": "niedrig",
    "tracker.execution.risk.medium": "mittel",
    "tracker.execution.risk.high": "hoch",
    "tracker.execution.riskLabel": "{0}es Risiko",
    "tracker.execution.state.onTrack": "Im Takt",
    "tracker.execution.state.atRisk": "Gefährdet",
    "tracker.execution.state.stalled": "Festgefahren",
    "tracker.execution.state.rescue": "Rettungsmodus",
    "tracker.execution.summary.onTrack":
      "Takt, Nachweis und Fortschritt sind ausgerichtet. Halten Sie das System stabil.",
    "tracker.execution.summary.atRisk":
      "Momentum ist noch rettbar, aber der aktuelle Rhythmus braucht straffere Umsetzung.",
    "tracker.execution.summary.stalled":
      "Der Plan verliert Zugkraft. Vereinfachen Sie die Woche, bevor Sie stärker drücken.",
    "tracker.execution.summary.rescue":
      "Die Ausführung bricht unter dem aktuellen Umfang auseinander. Wechseln Sie jetzt in den Rettungsmodus und verengen Sie den Plan.",
    "tracker.execution.overdue.noActivity":
      "Seit {0} Tagen wurde keine Aktivität protokolliert.",
    "tracker.execution.overdue.noSteps":
      "Es wurden noch keine verfolgten Schritte abgeschlossen. Beginnen Sie mit der nächsten besten Aktion.",
    "tracker.execution.overdue.lowProgress":
      "Der Fortschritt liegt noch unter dem ersten Meilenstein-Schwellenwert.",
    "tracker.execution.proof.noLog":
      "Diese Woche wurde noch kein Nachweis oder Reflexion protokolliert.",
    "tracker.execution.proof.noProofAfterSetback":
      "Der Tracker zeigt Reibung, aber es gibt keine aktuelle Nachweis-Notiz, die erklärt, was sich geändert hat.",
    "tracker.execution.recovery.resetPrefix":
      "Starten Sie heute mit einem kleinen Erfolg neu: ",
    "tracker.execution.recovery.shorterPrefix":
      "Wenn heute abrutscht, machen Sie eine kürzere Version dieser Aktion: ",
    "tracker.execution.adaptive.tightenPrefix": "Diese Woche schärfen",
    "tracker.execution.adaptive.restoreProofLoop":
      "Diese Woche schärfen: Stellen Sie zuerst wieder eine Nachweis-Schleife her, bevor Sie den Umfang erhöhen.",
    "tracker.execution.adaptive.reviewFit":
      "Prüfen Sie, ob der aktuelle Takt noch zu Ihrer Woche passt.",
    "tracker.backToPlans": "Zurück zu Meine Pläne",
    "tracker.planSummary": "Zusammenfassung des Plans",
    "tracker.steps": "Schritte",
    "tracker.markComplete": "Als abgeschlossen markieren",
    "tracker.didItToday": "Habe ich es heute gemacht?",
    "tracker.addNote": "Kurze Notiz hinzufügen (optional)",
    "tracker.logToday": "Heute eintragen",
    "tracker.streak": "Serie",
    "tracker.dayStreak": "{0} Tage Serie",
    "tracker.lastDone": "Zuletzt erledigt: {0}",
    "tracker.journal": "Tagebuch",
    "tracker.journalPlaceholder":
      "Wie läuft's? Erfolge, Hindernisse, Reflexionen...",
    "tracker.addEntry": "Eintrag hinzufügen",
    "tracker.timeline": "Aktivität",
    "tracker.noActivity":
      "Noch keine Aktivität. Markieren Sie Schritte als abgeschlossen oder fügen Sie einen Tagebucheintrag hinzu.",
    "tracker.checkIn": "Check-in",
    "tracker.completedStep": "Schritt abgeschlossen",
    "tracker.setbackLogged": "Rückschlag protokolliert",
    "tracker.status.active": "Aktiv",
    "tracker.status.completed": "Abgeschlossen",
    "tracker.status.paused": "Pausiert",
    "tracker.status.abandoned": "Aufgegeben",
    "tracker.planNotFound": "Plan nicht gefunden",
    "tracker.unauthorized": "Sie haben keinen Zugriff auf diesen Plan.",
    "tracker.editPlan": "Plan bearbeiten",
    "tracker.trackingQuestion": "Fortschrittsfrage",
    "tracker.trackingQuestionPlaceholder":
      "z.B. Hast du heute deinen Plan befolgt?",
    "tracker.share.error": "Freigabelink konnte nicht erstellt werden",
    "shared.backHome": "Zur Startseite",
    "shared.expired": "Link abgelaufen oder ungültig",
    "shared.loadError":
      "Der geteilte Plan konnte nicht geladen werden. Bitte versuchen Sie es später erneut.",
    "shared.readOnly": "Geteilter Plan (schreibgeschützt)",
    "tracker.color": "Farbe",
    "tracker.frequency": "Häufigkeit",
    "tracker.frequency.daily": "Jeden Tag",
    "tracker.frequency.weekly": "Jede Woche",
    "tracker.frequency.custom": "Benutzerdefiniert",
    "tracker.reminder": "Erinnerung",
    "tracker.reminderAt": "Um {0}",
    "tracker.reminderDays": "Tage",
    "tracker.reminderAnyDay": "Jeden Tag",
    "tracker.calendar": "Kalender",
    "tracker.editHistory": "Verlauf bearbeiten",
    "tracker.score": "Punktzahl",
    "tracker.bestStreaks": "Beste Serien",
    "tracker.currentStreak": "Aktuell: {0} Tage",
    "tracker.tileHeatmap": "Letzte Aktivität",
    "tracker.frequencyHeatmap": "Muster nach Tag",
    "dashboard.track": "Verfolgen",
  };

export default deTranslations;
