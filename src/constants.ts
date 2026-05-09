import { ScriptBlock, CueElement, Show } from './types'

// ─── Gel presets ──────────────────────────────────────────────────────────────

export interface GelPreset {
  code: string
  name: string
  color: string
}

export const GEL_PRESETS: { brand: string; gels: GelPreset[] }[] = [
  {
    brand: 'Roscolux',
    gels: [
      // Ambers & Straws
      { code: 'R01',  name: 'Light Bastard Amber',   color: '#f5c87a' },
      { code: 'R02',  name: 'Bastard Amber',          color: '#e8a535' },
      { code: 'R04',  name: 'Medium Bastard Amber',   color: '#d4891a' },
      { code: 'R09',  name: 'Pale Amber Gold',        color: '#f0b545' },
      { code: 'R14',  name: 'Medium Straw',           color: '#e8c060' },
      { code: 'R15',  name: 'Deep Straw',             color: '#d4a830' },
      { code: 'R21',  name: 'Golden Amber',           color: '#c87820' },
      { code: 'R22',  name: 'Deep Amber',             color: '#b06010' },
      // Pinks & Roses
      { code: 'R05',  name: 'Rose Tint',              color: '#ffbbaa' },
      { code: 'R33',  name: 'No Color Pink',          color: '#ffddee' },
      { code: 'R35',  name: 'Light Pink',             color: '#ffbbcc' },
      { code: 'R36',  name: 'Medium Pink',            color: '#ff99bb' },
      { code: 'R37',  name: 'Pale Rose Pink',         color: '#ffaabb' },
      { code: 'R38',  name: 'Light Rose',             color: '#ff88bb' },
      { code: 'R40',  name: 'Aurora Pink',            color: '#ff77aa' },
      { code: 'R41',  name: 'Suprose',                color: '#ff66bb' },
      { code: 'R45',  name: 'Rose',                   color: '#ee5588' },
      { code: 'R46',  name: 'Magenta',                color: '#dd1177' },
      { code: 'R47',  name: 'Light Rose Purple',      color: '#ee66bb' },
      { code: 'R51',  name: 'Surprise Pink',          color: '#ff44cc' },
      { code: 'R339', name: 'Broadway Pink',          color: '#ff55aa' },
      { code: 'R342', name: 'Rose Pink',              color: '#ff9999' },
      { code: 'R356', name: 'Middle Lavender Pink',   color: '#dd88cc' },
      // Reds & Oranges
      { code: 'R19',  name: 'Fire',                   color: '#ff5500' },
      { code: 'R23',  name: 'Orange',                 color: '#ff6600' },
      { code: 'R24',  name: 'Scarlet',                color: '#ee1100' },
      { code: 'R25',  name: 'Orange Red',             color: '#ee3300' },
      { code: 'R26',  name: 'Light Red',              color: '#dd2200' },
      { code: 'R27',  name: 'Medium Red',             color: '#cc2200' },
      { code: 'R29',  name: 'Plum',                   color: '#771133' },
      // Purples & Lavenders
      { code: 'R39',  name: 'Skeleton Violet',        color: '#5522aa' },
      { code: 'R48',  name: 'Rose Purple',            color: '#883399' },
      { code: 'R49',  name: 'Medium Purple',          color: '#6622aa' },
      { code: 'R50',  name: 'Mauve',                  color: '#886688' },
      { code: 'R52',  name: 'Light Lavender',         color: '#ddaaee' },
      { code: 'R54',  name: 'Special Lavender',       color: '#9966cc' },
      { code: 'R56',  name: 'Gypsy Lavender',         color: '#8855bb' },
      { code: 'R57',  name: 'Lavender',               color: '#aa77dd' },
      { code: 'R58',  name: 'Deep Lavender',          color: '#7744bb' },
      { code: 'R59',  name: 'Indigo',                 color: '#4422aa' },
      { code: 'R119', name: 'Light Lavender',         color: '#cc99ee' },
      { code: 'R124', name: 'Narrow Lavender',        color: '#bb88dd' },
      // Blues
      { code: 'R60',  name: 'No Color Blue',          color: '#aaccee' },
      { code: 'R63',  name: 'Pale Blue',              color: '#99bbee' },
      { code: 'R64',  name: 'Light Steel Blue',       color: '#7799cc' },
      { code: 'R65',  name: 'Daylight Blue',          color: '#6699dd' },
      { code: 'R68',  name: 'Sky Blue',               color: '#4499dd' },
      { code: 'R69',  name: 'Brilliant Blue',         color: '#2266dd' },
      { code: 'R70',  name: 'Nile Blue',              color: '#3388cc' },
      { code: 'R72',  name: 'Azure Blue',             color: '#2266cc' },
      { code: 'R73',  name: 'Peacock Blue',           color: '#1155bb' },
      { code: 'R74',  name: 'Night Blue',             color: '#112288' },
      { code: 'R80',  name: 'Primary Blue',           color: '#1144cc' },
      { code: 'R82',  name: 'Surprise Blue',          color: '#3355ee' },
      { code: 'R83',  name: 'Medium Blue',            color: '#2244cc' },
      { code: 'R85',  name: 'Deep Blue',              color: '#0022aa' },
      // Greens
      { code: 'R87',  name: 'Pale Yellow Green',      color: '#ccee88' },
      { code: 'R88',  name: 'Lime Green',             color: '#99dd33' },
      { code: 'R89',  name: 'Moss Green',             color: '#668833' },
      { code: 'R91',  name: 'Primary Green',          color: '#22aa22' },
      { code: 'R93',  name: 'Kelly Green',            color: '#33bb22' },
      { code: 'R94',  name: 'Kelly Green',            color: '#44aa22' },
    ],
  },
  {
    brand: 'Lee',
    gels: [
      // Ambers & Straws
      { code: 'L103', name: 'Straw',                  color: '#f0c850' },
      { code: 'L104', name: 'Deep Amber',             color: '#cc8800' },
      { code: 'L105', name: 'Orange',                 color: '#ee6600' },
      { code: 'L134', name: 'Golden Amber',           color: '#cc8800' },
      { code: 'L135', name: 'Deep Golden Amber',      color: '#bb7700' },
      { code: 'L147', name: 'Apricot',                color: '#ffaa66' },
      { code: 'L162', name: 'Bastard Amber',          color: '#d4a030' },
      { code: 'L179', name: 'Chrome Orange',          color: '#ee6600' },
      // Pinks & Roses
      { code: 'L035', name: 'Light Pink',             color: '#ffbbcc' },
      { code: 'L036', name: 'Medium Pink',            color: '#ff99bb' },
      { code: 'L037', name: 'Pale Rose Pink',         color: '#ffaabb' },
      { code: 'L040', name: 'Aurora Pink',            color: '#ff77aa' },
      { code: 'L107', name: 'Light Rose',             color: '#ffcccc' },
      { code: 'L108', name: 'English Rose',           color: '#ffaacc' },
      { code: 'L111', name: 'Dark Pink',              color: '#ee77aa' },
      { code: 'L113', name: 'Magenta',                color: '#cc2288' },
      { code: 'L114', name: 'Rose Pink',              color: '#ff88bb' },
      { code: 'L127', name: 'Smoky Pink',             color: '#cc8899' },
      { code: 'L128', name: 'Bright Pink',            color: '#ff44aa' },
      { code: 'L148', name: 'Bright Rose',            color: '#ee3388' },
      { code: 'L150', name: 'No Color Rose',          color: '#ffddee' },
      { code: 'L153', name: 'Pale Salmon',            color: '#ffccaa' },
      { code: 'L154', name: 'Pale Rose',              color: '#ffddcc' },
      { code: 'L188', name: 'Surprise Peach',         color: '#ffaa88' },
      { code: 'L194', name: 'Surprise Pink',          color: '#ff66cc' },
      // Reds & Oranges
      { code: 'L024', name: 'Scarlet',                color: '#ee1100' },
      { code: 'L025', name: 'Sunset Red',             color: '#ee3300' },
      { code: 'L026', name: 'Bright Red',             color: '#dd2200' },
      { code: 'L101', name: 'Yellow',                 color: '#ffe822' },
      { code: 'L106', name: 'Primary Red',            color: '#cc1111' },
      { code: 'L158', name: 'Deep Orange',            color: '#ee4400' },
      // Purples & Lavenders
      { code: 'L048', name: 'Rose Purple',            color: '#883399' },
      { code: 'L050', name: 'Mauve',                  color: '#886688' },
      { code: 'L126', name: 'Mauve',                  color: '#996688' },
      { code: 'L136', name: 'Pale Lavender',          color: '#ccaaee' },
      { code: 'L137', name: 'Special Lavender',       color: '#aa88dd' },
      { code: 'L149', name: 'Lilac Tint',             color: '#ddbbee' },
      { code: 'L157', name: 'Pink Lavender',          color: '#cc99dd' },
      { code: 'L163', name: 'Mauve Wash',             color: '#bb8899' },
      { code: 'L170', name: 'Deep Lavender',          color: '#7744aa' },
      { code: 'L180', name: 'Dark Lavender',          color: '#553388' },
      { code: 'L181', name: 'Congo Blue',             color: '#220066' },
      { code: 'L187', name: 'Ultra Violet',           color: '#4411aa' },
      // Blues
      { code: 'L061', name: 'Mist Blue',              color: '#99bbdd' },
      { code: 'L115', name: 'Peacock Blue',           color: '#0077aa' },
      { code: 'L117', name: 'Steel Blue',             color: '#4477aa' },
      { code: 'L118', name: 'Light Blue',             color: '#77aacc' },
      { code: 'L119', name: 'Dark Blue',              color: '#002288' },
      { code: 'L120', name: 'Deep Blue',              color: '#001166' },
      { code: 'L131', name: 'Marine Blue',            color: '#1155aa' },
      { code: 'L132', name: 'Medium Blue',            color: '#3366dd' },
      { code: 'L140', name: 'Summer Blue',            color: '#4488cc' },
      { code: 'L141', name: 'Bright Blue',            color: '#2255dd' },
      { code: 'L144', name: 'No Color Blue',          color: '#aaccee' },
      { code: 'L161', name: 'Slate Blue',             color: '#667788' },
      { code: 'L165', name: 'Daylight Blue',          color: '#6699dd' },
      { code: 'L172', name: 'Lagoon Blue',            color: '#2299bb' },
      { code: 'L183', name: 'Moonlight Blue',         color: '#3377cc' },
      { code: 'L195', name: 'Zenith Blue',            color: '#1144cc' },
      { code: 'L201', name: 'Full CT Blue',           color: '#44aabb' },
      { code: 'L202', name: 'Half CT Blue',           color: '#99ccee' },
      // Greens
      { code: 'L088', name: 'Lime Green',             color: '#99dd33' },
      { code: 'L116', name: 'Medium Blue Green',      color: '#2299aa' },
      { code: 'L124', name: 'Dark Green',             color: '#224422' },
      { code: 'L138', name: 'Pale Green',             color: '#99cc88' },
      { code: 'L139', name: 'Primary Green',          color: '#22aa22' },
      { code: 'L175', name: 'Emerald',                color: '#22bb55' },
    ],
  },
]

// ─── Sample Script ────────────────────────────────────────────────────────────
// "The Last Signal" — a fictional musical excerpt used as the demo show.
// Demonstrates all ScriptBlockTypes so the UI has something interesting to show.

const DEMO_SHOW_ID = 'demo-show-1'

export const DEMO_SCRIPT_BLOCKS: ScriptBlock[] = [
  { id: 'b01', showId: DEMO_SHOW_ID, orderIndex: 0, actLabel: 'Act I', sceneLabel: '', type: 'act', lineText: 'Act I' },
  { id: 'b02', showId: DEMO_SHOW_ID, orderIndex: 1, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'scene', lineText: 'Scene 1' },
  { id: 'b03', showId: DEMO_SHOW_ID, orderIndex: 2, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'location', lineText: '[The Radio Tower — Night]' },
  { id: 'b04', showId: DEMO_SHOW_ID, orderIndex: 3, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'stage_direction', lineText: 'Darkness. A single red indicator light blinks at the top of a radio mast. MIRA sits alone at a transmitter console, headphones hanging around her neck, a notebook open in front of her.' },
  { id: 'b05', showId: DEMO_SHOW_ID, orderIndex: 4, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'song_header', lineText: 'Song No. 1  "The Last Frequency"' },
  { id: 'b06', showId: DEMO_SHOW_ID, orderIndex: 5, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'lyric', speaker: 'Mira', lineText: 'I\'ve been calling out for years now, into a silent sky' },
  { id: 'b07', showId: DEMO_SHOW_ID, orderIndex: 6, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'lyric', speaker: 'Mira', lineText: 'Does anyone receive me, or am I the last reply?' },
  { id: 'b08', showId: DEMO_SHOW_ID, orderIndex: 7, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'lyric', speaker: 'Mira', lineText: 'These wires carry nothing but the echo of my voice' },
  { id: 'b09', showId: DEMO_SHOW_ID, orderIndex: 8, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'lyric', speaker: 'Mira', lineText: 'And yet I keep on broadcasting — I cannot make another choice' },
  { id: 'b10', showId: DEMO_SHOW_ID, orderIndex: 9, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'stage_direction', lineText: 'The song fades. Mira removes her headphones and stares at the console.' },
  { id: 'b11', showId: DEMO_SHOW_ID, orderIndex: 10, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'dialogue', speaker: 'Mira', lineText: '(adjusting the dial) Come on. Anyone out there. Please.' },
  { id: 'b12', showId: DEMO_SHOW_ID, orderIndex: 11, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'stage_direction', lineText: 'Static. Then — a crackle. A voice cuts through.' },
  { id: 'b13', showId: DEMO_SHOW_ID, orderIndex: 12, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'dialogue', speaker: 'Voice (Radio)', lineText: 'Hello? Is — is someone there?' },
  { id: 'b14', showId: DEMO_SHOW_ID, orderIndex: 13, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'dialogue', speaker: 'Mira', lineText: '(gasps, grabbing the mic) Yes — yes I\'m here. Who is this? Where are you broadcasting from?' },
  { id: 'b15', showId: DEMO_SHOW_ID, orderIndex: 14, actLabel: 'Act I', sceneLabel: 'Scene 1', type: 'dialogue', speaker: 'Voice (Radio)', lineText: 'My name is Leon. I\'ve been searching for survivors for six months. I didn\'t think anyone was still transmitting.' },
  { id: 'b16', showId: DEMO_SHOW_ID, orderIndex: 15, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'scene', lineText: 'Scene 2' },
  { id: 'b17', showId: DEMO_SHOW_ID, orderIndex: 16, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'location', lineText: '[A Bunker — Continuous]' },
  { id: 'b18', showId: DEMO_SHOW_ID, orderIndex: 17, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'stage_direction', lineText: 'The set splits. On the opposite side of the stage, LEON sits hunched over an identical transmitter, surrounded by hand-drawn maps, melted candles, and stacked tins of food.' },
  { id: 'b19', showId: DEMO_SHOW_ID, orderIndex: 18, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'dialogue', speaker: 'Leon', lineText: 'I\'m in the eastern sector. Latitude 41. Where are you?' },
  { id: 'b20', showId: DEMO_SHOW_ID, orderIndex: 19, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'dialogue', speaker: 'Mira', lineText: 'The coastal tower. North peninsula. I\'ve been alone here for four months.' },
  { id: 'b21', showId: DEMO_SHOW_ID, orderIndex: 20, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'dialogue', speaker: 'Leon', lineText: 'Four months. God. Are you safe? Do you have supplies?' },
  { id: 'b22', showId: DEMO_SHOW_ID, orderIndex: 21, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'stage_direction', lineText: 'A long pause. Mira looks around the empty tower.' },
  { id: 'b23', showId: DEMO_SHOW_ID, orderIndex: 22, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'dialogue', speaker: 'Mira', lineText: 'I\'m fine. I just — I hadn\'t heard another voice in so long.' },
  { id: 'b24', showId: DEMO_SHOW_ID, orderIndex: 23, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'song_header', lineText: 'Song No. 2  "Found"' },
  { id: 'b25', showId: DEMO_SHOW_ID, orderIndex: 24, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'lyric', speaker: 'Leon', lineText: 'I had given up on daylight, made my peace with being alone' },
  { id: 'b26', showId: DEMO_SHOW_ID, orderIndex: 25, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'lyric', speaker: 'Mira', lineText: 'Then your signal broke the silence, found me standing on my own' },
  { id: 'b27', showId: DEMO_SHOW_ID, orderIndex: 26, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'lyric', speaker: 'Both', lineText: 'Now I know that someone\'s out there — now I know I\'m not alone' },
  { id: 'b28', showId: DEMO_SHOW_ID, orderIndex: 27, actLabel: 'Act I', sceneLabel: 'Scene 2', type: 'lyric', speaker: 'Both', lineText: 'We are found' },
]

// ─── Default element template ──────────────────────────────────────────────────

export const DEFAULT_ELEMENT: Omit<CueElement, 'id' | 'cueId'> = {
  fixtureType: 'Fresnel',
  label: 'New Light',
  gelColor: '#ffffff',
  gelCode: '',
  intensity: 50,
  focusArea: 'General Center',
  notes: '',
}

export const FIXTURE_TYPES = [
  'Fresnel',
  'Ellipsoidal (Leko)',
  'LED Par',
  'Follow Spot',
  'Strip Light',
  'Cyclorama',
  'Moving Head',
  'Practical',
  'Other',
]

// ─── Demo show ────────────────────────────────────────────────────────────────

export const DEMO_SHOW: Show = {
  id: DEMO_SHOW_ID,
  ownerId: 'demo-owner',
  title: 'The Last Signal (Demo)',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  scriptBlocks: DEMO_SCRIPT_BLOCKS,
  cues: [
    {
      id: 'cue-demo-1',
      showId: DEMO_SHOW_ID,
      scriptBlockId: 'b04',
      cueNumber: 1,
      status: 'approved',
      designerConfidence: 4,
      aiDescription: 'The stage plunges into near-total darkness, interrupted only by a single blinking red practical on the tower mast. The red pulse creates an eerie, isolated atmosphere — signaling both danger and the fragile persistence of human presence.',
      aiDescriptionLocked: true,
      aiPreviewUrl: null,
      timingUp: 0,
      timingDown: 3,
      delay: 0,
      notes: 'Blackout from house to this. Ensure the practical blink rate is synced with the sound operator.',
      elements: [
        { id: 'el-d1-1', cueId: 'cue-demo-1', fixtureType: 'Practical', label: 'Tower Blink', gelColor: '#ff2200', gelCode: 'R27', intensity: 100, focusArea: 'Tower Mast', notes: 'Practical LED lamp, pre-rigged to blink at 1.5s interval' },
      ],
      suggestions: [
        { id: 'sug-1', cueId: 'cue-demo-1', authorName: 'Director (Alex)', body: 'Can we add the faintest blue wash on the floor? Like moonlight coming through a window.', rationale: 'It would help separate Mira from the darkness before she starts singing.', strength: 4, status: 'open', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), replies: [{ id: 'rep-1', authorName: 'Designer (Charlotte)', body: 'Great idea — I was thinking L132 at about 15%. Will mock it up before tech.', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() }] },
      ],
    },
    {
      id: 'cue-demo-2',
      showId: DEMO_SHOW_ID,
      scriptBlockId: 'b06',
      cueNumber: 2,
      status: 'pending',
      designerConfidence: 3,
      aiDescription: 'A slow amber special isolates Mira at the console, warm and intimate against the surrounding dark. The color evokes the glow of old vacuum tubes and analog warmth — a beacon in the void.',
      aiDescriptionLocked: false,
      aiPreviewUrl: null,
      timingUp: 4,
      timingDown: 2,
      delay: 0,
      notes: 'Song cue — needs to feel like a warm memory, not a harsh spotlight.',
      elements: [
        { id: 'el-d2-1', cueId: 'cue-demo-2', fixtureType: 'Ellipsoidal (Leko)', label: 'Mira Special', gelColor: '#e8860a', gelCode: 'R02', intensity: 70, focusArea: 'DSC — Mira position', notes: '' },
        { id: 'el-d2-2', cueId: 'cue-demo-2', fixtureType: 'Fresnel', label: 'Back Warm', gelColor: '#c06010', gelCode: 'R05', intensity: 30, focusArea: 'US behind Mira', notes: 'Very low, just enough for separation' },
      ],
      suggestions: [],
    },
  ],
}
