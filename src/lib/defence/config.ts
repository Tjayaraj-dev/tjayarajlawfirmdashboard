// Defence file-index document tabs (the "51B" index). Documents in these
// categories are surfaced on the Defence Case portfolio.
export const DEFENCE_CATEGORY_SLUGS = [
  'def-51a',
  'def-51b',
  'def-note-book',
  'def-photos',
  'def-original-51a',
  'def-prosecution-additional',
  'def-prosecution-statements',
  'def-defence-statements',
  'def-client-personal',
  'def-notices',
  'def-file-a',
  'def-file-b-submissions',
  'def-file-b-authorities',
  'def-file-b-mitigation',
  'def-other',
]

export const EXHIBIT_MARKINGS = ['P', 'ID', 'D'] as const

export const WITNESS_STATUSES = [
  'Not yet called',
  'Testified',
  'Recalled',
  'Withdrawn',
] as const
