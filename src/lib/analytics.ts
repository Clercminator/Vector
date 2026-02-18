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
  | 'view_pricing'
  | 'checkout_started'
  | 'signup_referred'
  | 'payment_referred';

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
