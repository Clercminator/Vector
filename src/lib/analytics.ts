import { supabase } from './supabase';

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
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only track authenticated users for now

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: eventType,
      data: meta
    });
  } catch (error) {
    console.error('Failed to track event:', error);
    // Fail silently to not impact user experience
  }
}

/** Track page view (path, referrer). Call on route change. */
export function trackPageView(path: string, extra: Record<string, any> = {}) {
  trackEvent('page_view', { path, ...extra });
}

/** Track CTA/element click. */
export function trackClick(elementId: string, label?: string, extra: Record<string, any> = {}) {
  trackEvent('click', { element_id: elementId, label: label || elementId, ...extra });
}

/** Track when user leaves wizard without completing. Call when navigating away from wizard. */
export function trackWizardAbandoned(step?: string, framework?: string) {
  trackEvent('wizard_abandoned', { step, framework });
}

/** Track session end / tab close or navigation away. Fires when tab becomes hidden. */
export function trackSessionEnd(path: string, extra: Record<string, any> = {}) {
  trackEvent('session_end', { path, ...extra });
}
