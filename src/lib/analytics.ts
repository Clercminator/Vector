import { supabase } from './supabase';
import { gtagEvent } from './gtag';

export type EventType = 
  | 'blueprint_created' 
  | 'framework_selected' 
  | 'export_pdf' 
  | 'login'
  | 'view_dashboard'
  | 'view_community'
  | 'wizard_started'
  | 'wizard_completed'
  | 'wizard_abandoned'
  | 'view_pricing'
  | 'view_landing'
  | 'checkout_started'
  | 'signup_referred'
  | 'payment_referred'
  | 'page_view'
  | 'click'
  | 'session_end';

export async function trackEvent(eventType: EventType, meta: Record<string, any> = {}) {
  // GA4: fire for all visitors (including anonymous), before any early returns
  const ga4EventMap: Partial<Record<EventType, string>> = {
    checkout_started: 'begin_checkout',
    wizard_completed: 'wizard_completed',
    wizard_started: 'wizard_started',
    export_pdf: 'export_pdf',
    login: 'login',
    view_pricing: 'view_pricing',
    view_landing: 'view_landing',
    view_dashboard: 'view_dashboard',
    framework_selected: 'framework_selected',
  };
  const ga4Name = ga4EventMap[eventType];
  if (ga4Name) {
    gtagEvent(ga4Name, meta as Record<string, string | number | boolean | undefined>);
  }

  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only track authenticated users to Supabase

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: eventType,
      data: meta
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/** Track page view (path, referrer). Call on route change. GA4 page views are sent from App for all visitors. */
export function trackPageView(path: string, extra: Record<string, any> = {}) {
  trackEvent('page_view', { path, ...extra });
}

/** Track CTA/element click. */
export function trackClick(elementId: string, label?: string, extra: Record<string, any> = {}) {
  trackEvent('click', { element_id: elementId, label: label || elementId, ...extra });
  // GA4: CTA clicks for all visitors
  gtagEvent('click_cta', {
    cta_name: elementId,
    cta_label: label ?? elementId,
    ...(extra as Record<string, string | number | boolean | undefined>),
  });
}

/** Track when user leaves wizard without completing. Call when navigating away from wizard. */
export function trackWizardAbandoned(step?: string, framework?: string) {
  trackEvent('wizard_abandoned', { step, framework });
}

/** Track session end / tab close or navigation away. Fires when tab becomes hidden. */
export function trackSessionEnd(path: string, extra: Record<string, any> = {}) {
  trackEvent('session_end', { path, ...extra });
}

/** Wizard context for abandon tracking: GoalWizard updates this; App reads it when user leaves /wizard */
let _wizardContext: { step?: string; framework?: string; completed?: boolean } = {};
export function setWizardContext(ctx: { step?: string; framework?: string; completed?: boolean }) {
  _wizardContext = { ..._wizardContext, ...ctx };
}
export function getWizardContextForAbandon() {
  const c = { ..._wizardContext };
  return c;
}
