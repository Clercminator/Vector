/**
 * Featured thought leaders whose frameworks appear in Vector.
 * Add photos at public/images/authors/{slug}.{ext} for each (prefer WebP/AVIF for size; run `npm run optimize:images`).
 * Fallback shows initials.
 */
export const AUTHOR_IMAGE_EXTENSIONS = ['avif', 'webp', 'jpg', 'png'] as const;
export interface FeaturedAuthor {
  slug: string;
  name: string;
  /** Translation key for short attribution, e.g. "RPM Method" */
  taglineKey: string;
  /** Translation key for the achievement paragraph shown in the modal */
  achievementKey: string;
  /** Optional exact filename in public/images/authors/ (e.g. "Tony Robbins.png"); if set, used instead of slug + extension */
  imageFile?: string;
}

export const FEATURED_AUTHORS: FeaturedAuthor[] = [
  { slug: 'tony-robbins', name: 'Tony Robbins', taglineKey: 'authors.tonyRobbins.tagline', achievementKey: 'authors.tonyRobbins.achievement', imageFile: 'tony robbins.avif' },
  { slug: 'tim-ferriss', name: 'Tim Ferriss', taglineKey: 'authors.timFerriss.tagline', achievementKey: 'authors.timFerriss.achievement', imageFile: 'Tim-Ferriss.webp' },
  { slug: 'elon-musk', name: 'Elon Musk', taglineKey: 'authors.elonMusk.tagline', achievementKey: 'authors.elonMusk.achievement', imageFile: 'elon musk 1.webp' },
  { slug: 'dwight-eisenhower', name: 'Dwight D. Eisenhower', taglineKey: 'authors.eisenhower.tagline', achievementKey: 'authors.eisenhower.achievement', imageFile: 'dwight-d-eisenhower.webp' },
  { slug: 'vilfredo-pareto', name: 'Vilfredo Pareto', taglineKey: 'authors.pareto.tagline', achievementKey: 'authors.pareto.achievement', imageFile: 'Vilfredo_Pareto.webp' },
  { slug: 'john-doerr', name: 'John Doerr', taglineKey: 'authors.johnDoerr.tagline', achievementKey: 'authors.johnDoerr.achievement', imageFile: 'John Doerr.webp' },
  { slug: 'mieko-kamiya', name: 'Mieko Kamiya', taglineKey: 'authors.miekoKamiya.tagline', achievementKey: 'authors.miekoKamiya.achievement', imageFile: 'Mieko-Kamiya.webp' },
  { slug: 'jesse-itzler', name: 'Jesse Itzler', taglineKey: 'authors.jesseItzler.tagline', achievementKey: 'authors.jesseItzler.achievement', imageFile: 'Jesse Itzler.webp' },
  { slug: 'marcus-elliott', name: 'Dr. Marcus Elliott', taglineKey: 'authors.marcusElliott.tagline', achievementKey: 'authors.marcusElliott.achievement', imageFile: 'dr Marcus Elliott.webp' },
];

/** Get initials for fallback avatar (e.g. "Tony Robbins" → "TR") */
export function getAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
