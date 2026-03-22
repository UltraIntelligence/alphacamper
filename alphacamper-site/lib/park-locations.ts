/**
 * Static coordinates for every park/campground we track.
 * Used by the hero map to show coverage. Coordinates are approximate park-level
 * locations — sufficient for a zoom-5 overview map.
 * GeoJSON spec: coordinates are [longitude, latitude].
 */

export interface ParkFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { name: string; platform: string }
}

export const PARK_LOCATIONS: ParkFeature[] = [
  // ── BC Parks · Lower Mainland / Sea-to-Sky ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.476, 49.382] }, properties: { name: 'Golden Ears', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.967, 49.058] }, properties: { name: 'Cultus Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.200, 49.397] }, properties: { name: 'Cypress', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.237, 49.554] }, properties: { name: 'Porteau Cove', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.110, 49.761] }, properties: { name: 'Alice Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.494, 50.370] }, properties: { name: 'Joffre Lakes', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.759, 50.648] }, properties: { name: 'Birkenhead Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.404, 49.355] }, properties: { name: 'Rolley Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.742, 49.401] }, properties: { name: 'Sasquatch', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.452, 49.077] }, properties: { name: 'Chilliwack Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.970, 49.920] }, properties: { name: 'Garibaldi', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.699, 50.156] }, properties: { name: 'Nairn Falls', platform: 'bc_parks' } },

  // ── BC Parks · Vancouver Island ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.364, 49.320] }, properties: { name: 'Rathtrevor Beach', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.313, 49.348] }, properties: { name: 'Englishman River Falls', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.556, 48.469] }, properties: { name: 'Goldstream', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.024, 48.348] }, properties: { name: 'French Beach', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.616, 49.366] }, properties: { name: 'Little Qualicum Falls', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-125.062, 49.856] }, properties: { name: 'Miracle Beach', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.823, 49.309] }, properties: { name: 'Stamp River', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.935, 49.272] }, properties: { name: 'Sproat Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.891, 48.922] }, properties: { name: 'Gordon Bay', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-125.284, 50.071] }, properties: { name: 'Elk Falls', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-125.650, 49.680] }, properties: { name: 'Strathcona', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.354, 48.781] }, properties: { name: 'Ruckle', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-125.398, 50.003] }, properties: { name: 'Loveland Bay', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.899, 49.813] }, properties: { name: 'Fillongley', platform: 'bc_parks' } },

  // ── BC Parks · Okanagan / Kamloops ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.567, 49.756] }, properties: { name: 'Okanagan Lake South', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.459, 49.019] }, properties: { name: 'Haynes Point', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.622, 49.951] }, properties: { name: 'Okanagan Lake North', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-120.367, 50.683] }, properties: { name: 'Juniper Beach', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.391, 50.108] }, properties: { name: 'Kekuli Bay', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-120.543, 49.576] }, properties: { name: 'Kentucky-Alleyne', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.570, 49.363] }, properties: { name: 'Okanagan Falls', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.891, 50.820] }, properties: { name: 'Paul Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-120.470, 50.453] }, properties: { name: 'Lac Le Jeune', platform: 'bc_parks' } },

  // ── BC Parks · Kootenays ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.767, 49.291] }, properties: { name: 'Moyie Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.713, 49.761] }, properties: { name: 'Wasa Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.734, 49.611] }, properties: { name: 'Norbury Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.607, 49.849] }, properties: { name: 'Premier Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.783, 50.100] }, properties: { name: 'Whiteswan Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.553, 49.432] }, properties: { name: 'Lockhart Beach', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.068, 51.002] }, properties: { name: 'Blanket Creek', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.118, 51.042] }, properties: { name: 'Martha Creek', platform: 'bc_parks' } },

  // ── BC Parks · Shuswap / North ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.687, 50.857] }, properties: { name: 'Shuswap Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.747, 50.578] }, properties: { name: 'Mabel Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.682, 50.740] }, properties: { name: 'North Thompson River', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.527, 53.052] }, properties: { name: 'Ten Mile Lake', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.827, 51.778] }, properties: { name: 'Wells Gray', platform: 'bc_parks' } },

  // ── BC Parks · Manning / Interior ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-120.793, 49.078] }, properties: { name: 'Manning', platform: 'bc_parks' } },

  // ── BC Parks · Sunshine Coast ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.750, 49.467] }, properties: { name: 'Porpoise Bay', platform: 'bc_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.174, 49.764] }, properties: { name: 'Saltery Bay', platform: 'bc_parks' } },

  // ── Ontario Parks · Algonquin ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.350, 45.533] }, properties: { name: 'Algonquin', platform: 'ontario_parks' } },

  // ── Ontario Parks ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.400, 46.017] }, properties: { name: 'Killarney', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.233, 43.900] }, properties: { name: 'Sandbanks', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.838, 43.265] }, properties: { name: 'Pinery', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.200, 44.917] }, properties: { name: 'Bon Echo', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.103, 45.919] }, properties: { name: 'Grundy Lake', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.050, 44.967] }, properties: { name: 'Silent Lake', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.100, 45.383] }, properties: { name: 'Arrowhead', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.217, 45.350] }, properties: { name: 'Killbear', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.950, 44.783] }, properties: { name: 'Awenda', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.928, 44.572] }, properties: { name: 'Balsam Lake', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.667, 44.500] }, properties: { name: 'Bass Lake', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.600, 45.417] }, properties: { name: 'Bonnechere', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-76.133, 44.533] }, properties: { name: 'Charleston Lake', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.833, 46.883] }, properties: { name: 'Halfway Lake', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-84.450, 47.783] }, properties: { name: 'Lake Superior', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.400, 42.583] }, properties: { name: 'Long Point', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.583, 44.267] }, properties: { name: 'Inverhuron', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.533, 44.283] }, properties: { name: 'MacGregor Point', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.850, 46.000] }, properties: { name: 'Restoule', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.833, 42.283] }, properties: { name: 'Rondeau', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.050, 44.883] }, properties: { name: 'Kawartha Highlands', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-76.650, 44.433] }, properties: { name: 'Frontenac', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.433, 43.683] }, properties: { name: 'Elora Gorge', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.333, 42.700] }, properties: { name: 'Turkey Point', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.383, 44.417] }, properties: { name: 'Emily', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.983, 44.167] }, properties: { name: 'Earl Rowe', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-89.617, 48.400] }, properties: { name: 'Kakabeka Falls', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.950, 45.883] }, properties: { name: 'Finlayson Point', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-91.200, 48.600] }, properties: { name: 'Quetico', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.350, 48.667] }, properties: { name: 'Kettle Lakes', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.750, 43.383] }, properties: { name: 'Bronte Creek', platform: 'ontario_parks' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.733, 43.833] }, properties: { name: 'Darlington', platform: 'ontario_parks' } },

  // ── Recreation.gov · Yosemite, CA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.594, 37.746] }, properties: { name: 'Yosemite Valley', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.653, 37.536] }, properties: { name: 'Wawona', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.786, 37.880] }, properties: { name: 'Hodgdon Meadow', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.803, 37.756] }, properties: { name: 'Crane Flat', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.359, 37.874] }, properties: { name: 'Tuolumne Meadows', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-119.625, 37.666] }, properties: { name: 'Bridalveil Creek', platform: 'recreation_gov' } },

  // ── Recreation.gov · Glacier, MT ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-113.984, 48.497] }, properties: { name: 'Glacier - Apgar', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-113.656, 48.796] }, properties: { name: 'Glacier - Many Glacier', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-114.047, 48.497] }, properties: { name: 'Glacier - Fish Creek', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-113.435, 48.746] }, properties: { name: 'Glacier - St. Mary', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-113.907, 48.494] }, properties: { name: 'Glacier - Sprague Creek', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-113.366, 48.493] }, properties: { name: 'Glacier - Two Medicine', platform: 'recreation_gov' } },

  // ── Recreation.gov · Olympic, WA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.375, 47.610] }, properties: { name: 'Olympic - Kalaloch', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.935, 47.860] }, properties: { name: 'Olympic - Hoh Rainforest', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.559, 47.912] }, properties: { name: 'Olympic - Mora', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-124.102, 47.972] }, properties: { name: 'Olympic - Sol Duc', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-123.331, 47.516] }, properties: { name: 'Olympic - Staircase', platform: 'recreation_gov' } },

  // ── Recreation.gov · Mount Rainier, WA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.564, 46.729] }, properties: { name: 'Rainier - Ohanapecosh', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.746, 46.795] }, properties: { name: 'Rainier - Cougar Rock', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.639, 46.912] }, properties: { name: 'Rainier - White River', platform: 'recreation_gov' } },

  // ── Recreation.gov · Grand Teton, WY ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.724, 43.749] }, properties: { name: 'Grand Teton - Jenny Lake', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.649, 43.901] }, properties: { name: 'Grand Teton - Colter Bay', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.609, 43.843] }, properties: { name: 'Grand Teton - Signal Mountain', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.589, 43.649] }, properties: { name: 'Grand Teton - Gros Ventre', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.643, 44.107] }, properties: { name: 'Grand Teton - Lizard Creek', platform: 'recreation_gov' } },

  // ── Recreation.gov · Yellowstone, WY ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.701, 44.978] }, properties: { name: 'Yellowstone - Mammoth', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.380, 44.914] }, properties: { name: 'Yellowstone - Tower Fall', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.643, 44.284] }, properties: { name: 'Yellowstone - Lewis Lake', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.338, 44.927] }, properties: { name: 'Yellowstone - Slough Creek', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-110.702, 44.924] }, properties: { name: 'Yellowstone - Indian Creek', platform: 'recreation_gov' } },

  // ── Recreation.gov · Rocky Mountain, CO ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-105.591, 40.373] }, properties: { name: 'Rocky Mountain - Moraine Park', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-105.569, 40.349] }, properties: { name: 'Rocky Mountain - Glacier Basin', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-105.595, 40.411] }, properties: { name: 'Rocky Mountain - Aspenglen', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-105.838, 40.462] }, properties: { name: 'Rocky Mountain - Timber Creek', platform: 'recreation_gov' } },

  // ── Recreation.gov · Zion, UT ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-112.986, 37.197] }, properties: { name: 'Zion - Watchman', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-112.982, 37.201] }, properties: { name: 'Zion - South', platform: 'recreation_gov' } },

  // ── Recreation.gov · Grand Canyon, AZ ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-112.140, 36.054] }, properties: { name: 'Grand Canyon - Mather', platform: 'recreation_gov' } },

  // ── Recreation.gov · Joshua Tree, CA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.054, 33.998] }, properties: { name: 'Joshua Tree - Jumbo Rocks', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.156, 34.080] }, properties: { name: 'Joshua Tree - Indian Cove', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.391, 34.074] }, properties: { name: 'Joshua Tree - Black Rock', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.818, 33.746] }, properties: { name: 'Joshua Tree - Cottonwood', platform: 'recreation_gov' } },

  // ── Recreation.gov · Sequoia, CA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.726, 36.596] }, properties: { name: 'Sequoia - Lodgepole', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.797, 36.712] }, properties: { name: 'Sequoia - Dorst Creek', platform: 'recreation_gov' } },

  // ── Recreation.gov · Acadia, ME ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-68.225, 44.327] }, properties: { name: 'Acadia - Blackwoods', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-68.319, 44.235] }, properties: { name: 'Acadia - Seawall', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-68.062, 44.362] }, properties: { name: 'Acadia - Schoodic', platform: 'recreation_gov' } },

  // ── Recreation.gov · Great Smoky Mountains, TN ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-83.836, 35.602] }, properties: { name: 'Great Smoky - Cades Cove', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-83.589, 35.646] }, properties: { name: 'Great Smoky - Elkmont', platform: 'recreation_gov' } },

  // ── Recreation.gov · Shenandoah, VA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.440, 38.523] }, properties: { name: 'Shenandoah - Big Meadows', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-78.664, 38.255] }, properties: { name: 'Shenandoah - Loft Mountain', platform: 'recreation_gov' } },

  // ── Recreation.gov · Death Valley, CA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.866, 36.462] }, properties: { name: 'Death Valley - Furnace Creek', platform: 'recreation_gov' } },

  // ── Recreation.gov · Bryce Canyon, UT ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-112.168, 37.628] }, properties: { name: 'Bryce Canyon - Sunset', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-112.163, 37.643] }, properties: { name: 'Bryce Canyon - North', platform: 'recreation_gov' } },

  // ── Recreation.gov · Arches / Canyonlands, UT ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-109.589, 38.782] }, properties: { name: 'Arches - Devils Garden', platform: 'recreation_gov' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-109.829, 38.152] }, properties: { name: 'Canyonlands - Needles', platform: 'recreation_gov' } },

  // ── Recreation.gov · Big Sur, CA ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.430, 35.898] }, properties: { name: 'Big Sur - Kirk Creek', platform: 'recreation_gov' } },

  // ── Parks Canada · Banff, AB ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.570, 51.352] }, properties: { name: 'Banff - Two Jack', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.209, 51.417] }, properties: { name: 'Banff - Lake Louise', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.550, 51.180] }, properties: { name: 'Banff - Tunnel Mountain', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-115.836, 51.247] }, properties: { name: 'Banff - Johnston Canyon', platform: 'parks_canada' } },

  // ── Parks Canada · Jasper, AB ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.060, 52.836] }, properties: { name: 'Jasper - Wapiti', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.090, 52.876] }, properties: { name: 'Jasper - Whistlers', platform: 'parks_canada' } },

  // ── Parks Canada · BC ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-125.743, 49.014] }, properties: { name: 'Pacific Rim - Green Point', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.475, 51.425] }, properties: { name: 'Yoho - Kicking Horse', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-116.021, 50.917] }, properties: { name: 'Kootenay - Redstreak', platform: 'parks_canada' } },

  // ── Parks Canada · Ontario ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-81.512, 45.228] }, properties: { name: 'Bruce Peninsula - Cyprus Lake', platform: 'parks_canada' } },

  // ── Parks Canada · East ──
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-65.112, 45.595] }, properties: { name: 'Fundy - Headquarters', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-63.374, 46.489] }, properties: { name: 'PEI - Cavendish', platform: 'parks_canada' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-113.902, 49.050] }, properties: { name: 'Waterton Lakes - Townsite', platform: 'parks_canada' } },
]

export const PARK_LOCATIONS_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: PARK_LOCATIONS,
}
