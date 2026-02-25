const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

const additions = {
  en: {
    'shared.expired': 'Link expired or invalid',
    'shared.backHome': 'Back to home',
    'shared.readOnly': 'Shared plan (read-only)',
    'shared.loadError': "Couldn't load shared plan. Please try again later.",
    'tracker.noStepsHint': 'Track your progress with check-ins and journal entries.',
    'common.retry': 'Retry',
    'errors.agentTimeout': 'The request took too long. Please try again.',
    'errors.agentConfig': 'AI service configuration issue. Please try again later.',
    'errors.agentRateLimit': 'Too many requests. Please wait a moment and try again.',
    'errors.agentGeneric': "We couldn't complete your plan. Please try again or simplify your goal.",
    'errors.syncFailed': "Couldn't save. Check your connection and try again.",
    'errors.trackerUpdateFailed': "Couldn't update. Please try again."
  },
  es: {
    'shared.expired': 'Enlace expirado o inválido',
    'shared.backHome': 'Volver al inicio',
    'shared.readOnly': 'Plan compartido (solo lectura)',
    'shared.loadError': "No se pudo cargar el plan. Por favor, inténtelo de nuevo más tarde.",
    'tracker.noStepsHint': 'Sigue tu progreso con registros diarios y notas.',
    'common.retry': 'Reintentar',
    'errors.agentTimeout': 'La solicitud tardó demasiado. Por favor, inténtalo de nuevo.',
    'errors.agentConfig': 'Problema de configuración de IA. Por favor, inténtalo más tarde.',
    'errors.agentRateLimit': 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.',
    'errors.agentGeneric': "No pudimos completar tu plan. Inténtalo de nuevo o simplifica tu objetivo.",
    'errors.syncFailed': "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.",
    'errors.trackerUpdateFailed': "No se pudo actualizar. Por favor, inténtalo de nuevo."
  },
  pt: {
    'shared.expired': 'Link expirado ou inválido',
    'shared.backHome': 'Voltar ao início',
    'shared.readOnly': 'Plano compartilhado (somente leitura)',
    'shared.loadError': "Não foi possível carregar o plano. Tente novamente mais tarde.",
    'tracker.noStepsHint': 'Acompanhe seu progresso com check-ins e anotações.',
    'common.retry': 'Tentar novamente',
    'errors.agentTimeout': 'A solicitação demorou muito. Tente novamente.',
    'errors.agentConfig': 'Problema de configuração de IA. Tente novamente mais tarde.',
    'errors.agentRateLimit': 'Muitas solicitações. Aguarde um momento e tente novamente.',
    'errors.agentGeneric': "Não foi possível concluir seu plano. Tente novamente ou simplifique seu objetivo.",
    'errors.syncFailed': "Não foi possível salvar. Verifique sua conexão e tente novamente.",
    'errors.trackerUpdateFailed': "Não foi possível atualizar. Tente novamente."
  },
  fr: {
    'shared.expired': 'Lien expiré ou invalide',
    'shared.backHome': "Retour à l'accueil",
    'shared.readOnly': 'Plan partagé (lecture seule)',
    'shared.loadError': "Impossible de charger le plan. Veuillez réessayer plus tard.",
    'tracker.noStepsHint': "Suivez vos progrès avec des enregistrements et des notes.",
    'common.retry': 'Réessayer',
    'errors.agentTimeout': 'La demande a pris trop de temps. Veuillez réessayer.',
    'errors.agentConfig': 'Problème de configuration IA. Veuillez réessayer plus tard.',
    'errors.agentRateLimit': 'Trop de requêtes. Veuillez patienter et réessayer.',
    'errors.agentGeneric': "Nous n'avons pas pu terminer votre plan. Réessayez ou simplifiez votre objectif.",
    'errors.syncFailed': "Impossible d'enregistrer. Vérifiez votre connexion et réessayez.",
    'errors.trackerUpdateFailed': "Impossible de mettre à jour. Veuillez réessayer."
  },
  de: {
    'shared.expired': 'Link abgelaufen oder ungültig',
    'shared.backHome': 'Zurück zur Startseite',
    'shared.readOnly': 'Geteilter Plan (schreibgeschützt)',
    'shared.loadError': "Plan konnte nicht geladen werden. Bitte versuchen Sie es später erneut.",
    'tracker.noStepsHint': 'Verfolge deinen Fortschritt mit Check-ins und Notizen.',
    'common.retry': 'Wiederholen',
    'errors.agentTimeout': 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.',
    'errors.agentConfig': 'KI-Konfigurationsproblem. Bitte versuchen Sie es später erneut.',
    'errors.agentRateLimit': 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
    'errors.agentGeneric': "Wir konnten deinen Plan nicht fertigstellen. Versuche es erneut oder vereinfache dein Ziel.",
    'errors.syncFailed': "Speichern fehlgeschlagen. Überprüfe deine Verbindung und versuche es erneut.",
    'errors.trackerUpdateFailed': "Aktualisierung fehlgeschlagen. Bitte versuchen Sie es erneut."
  }
};

const langs = ['en', 'es', 'pt', 'fr', 'de'];

langs.forEach(lang => {
  // Find where this language block ends
  const regex = new RegExp(`^\\s*${lang}:\\s*\\{[\\s\\S]*?^\\s*\\},?$`, 'm');
  
  // Actually, since translations block has nested braces, regex is tricky.
  // Instead, let's just insert at the end of the file or use a simpler strategy.
});

// Since regex is hard, let's just replace the exact end of each object we know
// which currently seems to end with 'dashboard.track': '...' for each language.

langs.forEach(lang => {
  const toAdd = additions[lang];
  const keysStr = Object.entries(toAdd).map(([k, v]) => `    '${k}': ${JSON.stringify(v)},`).join('\n');
  
  // We can look for 'dashboard.track':
  const replacerRegex = new RegExp(`('dashboard\\.track':\\s*'.*?',?)\\s*\\}`, 'g');
  // Unfortunately this might match multiple times if we're not careful.
});
