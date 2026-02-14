/**
 * Featured thought leaders whose frameworks appear in Vector.
 * Add photos at public/authors/{slug}.jpg for each; fallback shows initials.
 */
export interface FeaturedAuthor {
  slug: string;
  name: string;
  /** Translation key for short attribution, e.g. "RPM Method" */
  taglineKey: string;
}

export const FEATURED_AUTHORS: FeaturedAuthor[] = [
  { slug: 'tony-robbins', name: 'Tony Robbins', taglineKey: 'authors.tonyRobbins.tagline' },
  { slug: 'tim-ferriss', name: 'Tim Ferriss', taglineKey: 'authors.timFerriss.tagline' },
  { slug: 'elon-musk', name: 'Elon Musk', taglineKey: 'authors.elonMusk.tagline' },
  { slug: 'dwight-eisenhower', name: 'Dwight D. Eisenhower', taglineKey: 'authors.eisenhower.tagline' },
  { slug: 'vilfredo-pareto', name: 'Vilfredo Pareto', taglineKey: 'authors.pareto.tagline' },
  { slug: 'john-doerr', name: 'John Doerr', taglineKey: 'authors.johnDoerr.tagline' },
];

/** Get initials for fallback avatar (e.g. "Tony Robbins" → "TR") */
export function getAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
