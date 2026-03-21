-- Canonical paid mid-tier id is `builder` (not `standard`).
UPDATE public.profiles SET tier = 'builder' WHERE tier = 'standard';
