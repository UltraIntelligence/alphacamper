export type CampgroundPlatform =
  | 'bc_parks'
  | 'ontario_parks'
  | 'recreation_gov'
  | 'parks_canada'
  | 'gtc_manitoba'
  | 'gtc_novascotia'
  | 'gtc_longpoint'
  | 'gtc_maitland'
  | 'gtc_stclair'
  | 'gtc_nlcamping'
  | 'gtc_new_brunswick'
  | 'alberta_parks'
  | 'saskatchewan_parks'
  | 'pei_parks'
  | 'sepaq'

export type CampgroundSupportStatus =
  | 'alertable'
  | 'search_only'
  | 'coming_soon'
  | 'unsupported'

export interface Campground {
  id: string
  name: string
  platform: CampgroundPlatform
  province: string
  park?: string
  supportStatus?: CampgroundSupportStatus
}

export interface CatalogCampground extends Campground {
  supportStatus: CampgroundSupportStatus
}

const PLATFORM_DOMAINS: Record<string, string> = {
  bc_parks: 'camping.bcparks.ca',
  ontario_parks: 'reservations.ontarioparks.ca',
  recreation_gov: 'www.recreation.gov',
  parks_canada: 'reservation.pc.gc.ca',
  gtc_manitoba: 'manitoba.goingtocamp.com',
  gtc_novascotia: 'novascotia.goingtocamp.com',
  gtc_longpoint: 'longpoint.goingtocamp.com',
  gtc_maitland: 'maitlandvalley.goingtocamp.com',
  gtc_stclair: 'stclair.goingtocamp.com',
  gtc_nlcamping: 'nlcamping.ca',
  gtc_new_brunswick: 'reservations.parcsnbparks.ca',
}

const ALERTABLE_PLATFORMS = new Set<string>([
  'bc_parks',
  'ontario_parks',
  'recreation_gov',
  'parks_canada',
  'gtc_longpoint',
  'gtc_maitland',
  'gtc_stclair',
  'gtc_nlcamping',
  'gtc_new_brunswick',
])

const SUPPORT_STATUS_LABELS: Record<CampgroundSupportStatus, string> = {
  alertable: 'Alerts live',
  search_only: 'Search only',
  coming_soon: 'Coming soon',
  unsupported: 'Unsupported',
}

export const CAMPGROUNDS: Campground[] = [
  // ═══════════════════════════════════════════════════════════════
  // BC Parks — resourceLocationId from Camis /api/resourceLocation
  // ═══════════════════════════════════════════════════════════════

  // ── Lower Mainland / Sea-to-Sky ──
  { id: '-2493', name: 'Golden Ears - Alouette', platform: 'bc_parks', province: 'BC', park: 'Golden Ears' },
  { id: '-2471', name: 'Cultus Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2472', name: 'Cypress Provincial Park', platform: 'bc_parks', province: 'BC' },
  { id: '-2503', name: 'Porteau Cove', platform: 'bc_parks', province: 'BC' },
  { id: '-2430', name: 'Alice Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2499', name: 'Joffre Lakes', platform: 'bc_parks', province: 'BC' },
  { id: '-2443', name: 'Birkenhead Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2526', name: 'Rolley Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2528', name: 'Sasquatch', platform: 'bc_parks', province: 'BC' },
  { id: '-2535', name: 'Chilliwack Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2491', name: 'Garibaldi', platform: 'bc_parks', province: 'BC' },
  { id: '-2516', name: 'Nairn Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2492', name: 'Golden Ears - Gold Creek', platform: 'bc_parks', province: 'BC', park: 'Golden Ears' },

  // ── Vancouver Island ──
  { id: '-2504', name: 'Rathtrevor Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2457', name: 'Englishman River Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2494', name: 'Goldstream', platform: 'bc_parks', province: 'BC' },
  { id: '-2489', name: 'French Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2506', name: 'Little Qualicum Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2511', name: 'Miracle Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2538', name: 'Stamp River', platform: 'bc_parks', province: 'BC' },
  { id: '-2537', name: 'Sproat Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2496', name: 'Gordon Bay', platform: 'bc_parks', province: 'BC' },
  { id: '-2486', name: 'Elk Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2539', name: 'Strathcona', platform: 'bc_parks', province: 'BC' },
  { id: '-2527', name: 'Ruckle', platform: 'bc_parks', province: 'BC' },
  { id: '-2508', name: 'Loveland Bay', platform: 'bc_parks', province: 'BC' },
  { id: '-2461', name: 'Fillongley', platform: 'bc_parks', province: 'BC' },

  // ── Okanagan / Kamloops ──
  { id: '-2521', name: 'Okanagan Lake South', platform: 'bc_parks', province: 'BC' },
  { id: '-2497', name: 'Haynes Point', platform: 'bc_parks', province: 'BC' },
  { id: '-2520', name: 'Okanagan Lake North', platform: 'bc_parks', province: 'BC' },
  { id: '-2500', name: 'Juniper Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2501', name: 'Kekuli Bay', platform: 'bc_parks', province: 'BC' },
  { id: '-2502', name: 'Kentucky-Alleyne', platform: 'bc_parks', province: 'BC' },
  { id: '-2522', name: 'Okanagan Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2524', name: 'Paul Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2505', name: 'Lac Le Jeune', platform: 'bc_parks', province: 'BC' },

  // ── Kootenays ──
  { id: '-2512', name: 'Moyie Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2548', name: 'Wasa Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2519', name: 'Norbury Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2525', name: 'Premier Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2549', name: 'Whiteswan Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2507', name: 'Lockhart Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2453', name: 'Blanket Creek', platform: 'bc_parks', province: 'BC' },
  { id: '-2510', name: 'Martha Creek', platform: 'bc_parks', province: 'BC' },

  // ── Shuswap / North ──
  { id: '-2532', name: 'Shuswap Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2509', name: 'Mabel Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2517', name: 'North Thompson River', platform: 'bc_parks', province: 'BC' },
  { id: '-2542', name: 'Ten Mile Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2547', name: 'Wells Gray', platform: 'bc_parks', province: 'BC' },

  // ── Manning / Interior ──
  { id: '-2458', name: 'Manning - Lightning Lake', platform: 'bc_parks', province: 'BC', park: 'Manning' },
  { id: '-2459', name: 'Manning - Coldspring', platform: 'bc_parks', province: 'BC', park: 'Manning' },
  { id: '-2460', name: 'Manning - Hampton', platform: 'bc_parks', province: 'BC', park: 'Manning' },

  // ── Sunshine Coast / North Coast ──
  { id: '-2523', name: 'Porpoise Bay', platform: 'bc_parks', province: 'BC' },
  { id: '-2529', name: 'Saltery Bay', platform: 'bc_parks', province: 'BC' },

  // ═══════════════════════════════════════════════════════════════
  // Ontario Parks — resourceLocationId from Camis /api/resourceLocation
  // ═══════════════════════════════════════════════════════════════

  // ── Algonquin ──
  { id: '-2740399', name: 'Algonquin - Canisbay Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740407', name: 'Algonquin - Pog Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740393', name: 'Algonquin - Lake of Two Rivers', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740395', name: 'Algonquin - Mew Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740409', name: 'Algonquin - Rock Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740411', name: 'Algonquin - Tea Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740413', name: 'Algonquin - Whitefish Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740383', name: 'Algonquin - Achray', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740385', name: 'Algonquin - Brent', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740397', name: 'Algonquin - Kiosk', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },

  // ── Killarney ──
  { id: '-2740523', name: 'Killarney - George Lake', platform: 'ontario_parks', province: 'ON', park: 'Killarney' },

  // ── Sandbanks ──
  { id: '-2740285', name: 'Sandbanks - Outlet River', platform: 'ontario_parks', province: 'ON', park: 'Sandbanks' },
  { id: '-2740287', name: 'Sandbanks - Dunes', platform: 'ontario_parks', province: 'ON', park: 'Sandbanks' },

  // ── Pinery ──
  { id: '-2740575', name: 'Pinery - Burley', platform: 'ontario_parks', province: 'ON', park: 'Pinery' },
  { id: '-2740577', name: 'Pinery - Riverside', platform: 'ontario_parks', province: 'ON', park: 'Pinery' },
  { id: '-2740579', name: 'Pinery - Dunes', platform: 'ontario_parks', province: 'ON', park: 'Pinery' },

  // ── Bon Echo ──
  { id: '-2740387', name: 'Bon Echo - Mazinaw Lake', platform: 'ontario_parks', province: 'ON', park: 'Bon Echo' },
  { id: '-2740389', name: 'Bon Echo - Hardwood Hill', platform: 'ontario_parks', province: 'ON', park: 'Bon Echo' },

  // ── Other Popular Parks ──
  { id: '-2740451', name: 'Grundy Lake', platform: 'ontario_parks', province: 'ON', park: 'Grundy Lake' },
  { id: '-2740611', name: 'Silent Lake', platform: 'ontario_parks', province: 'ON', park: 'Silent Lake' },
  { id: '-2740303', name: 'Arrowhead', platform: 'ontario_parks', province: 'ON', park: 'Arrowhead' },
  { id: '-2740525', name: 'Killbear', platform: 'ontario_parks', province: 'ON', park: 'Killbear' },
  { id: '-2740305', name: 'Awenda', platform: 'ontario_parks', province: 'ON', park: 'Awenda' },
  { id: '-2740307', name: 'Balsam Lake', platform: 'ontario_parks', province: 'ON', park: 'Balsam Lake' },
  { id: '-2740309', name: 'Bass Lake', platform: 'ontario_parks', province: 'ON', park: 'Bass Lake' },
  { id: '-2740391', name: 'Bonnechere', platform: 'ontario_parks', province: 'ON', park: 'Bonnechere' },
  { id: '-2740417', name: 'Charleston Lake', platform: 'ontario_parks', province: 'ON', park: 'Charleston Lake' },
  { id: '-2740453', name: 'Halfway Lake', platform: 'ontario_parks', province: 'ON', park: 'Halfway Lake' },
  { id: '-2740527', name: 'Lake Superior', platform: 'ontario_parks', province: 'ON', park: 'Lake Superior' },
  { id: '-2740529', name: 'Long Point', platform: 'ontario_parks', province: 'ON', park: 'Long Point' },
  { id: '-2740455', name: 'Inverhuron', platform: 'ontario_parks', province: 'ON', park: 'Inverhuron' },
  { id: '-2740457', name: 'MacGregor Point', platform: 'ontario_parks', province: 'ON', park: 'MacGregor Point' },
  { id: '-2740531', name: 'Restoule', platform: 'ontario_parks', province: 'ON', park: 'Restoule' },
  { id: '-2740533', name: 'Rondeau', platform: 'ontario_parks', province: 'ON', park: 'Rondeau' },
  { id: '-2740459', name: 'Kawartha Highlands', platform: 'ontario_parks', province: 'ON', park: 'Kawartha Highlands' },
  { id: '-2740461', name: 'Frontenac', platform: 'ontario_parks', province: 'ON', park: 'Frontenac' },
  { id: '-2740419', name: 'Elora Gorge', platform: 'ontario_parks', province: 'ON', park: 'Elora Gorge' },
  { id: '-2740535', name: 'Turkey Point', platform: 'ontario_parks', province: 'ON', park: 'Turkey Point' },
  { id: '-2740421', name: 'Emily', platform: 'ontario_parks', province: 'ON', park: 'Emily' },
  { id: '-2740423', name: 'Earl Rowe', platform: 'ontario_parks', province: 'ON', park: 'Earl Rowe' },
  { id: '-2740463', name: 'Kakabeka Falls', platform: 'ontario_parks', province: 'ON', park: 'Kakabeka Falls' },
  { id: '-2740465', name: 'Finlayson Point', platform: 'ontario_parks', province: 'ON', park: 'Finlayson Point' },
  { id: '-2740467', name: 'Quetico', platform: 'ontario_parks', province: 'ON', park: 'Quetico' },
  { id: '-2740469', name: 'Kettle Lakes', platform: 'ontario_parks', province: 'ON', park: 'Kettle Lakes' },
  { id: '-2740471', name: 'Bronte Creek', platform: 'ontario_parks', province: 'ON', park: 'Bronte Creek' },
  { id: '-2740473', name: 'Darlington', platform: 'ontario_parks', province: 'ON', park: 'Darlington' },

  // ═══════════════════════════════════════════════════════════════
  // Recreation.gov — campground IDs from recreation.gov/camping/campgrounds/{id}
  // ═══════════════════════════════════════════════════════════════

  // ── Yosemite National Park, CA ──
  { id: '232447', name: 'Upper Pines', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232449', name: 'North Pines', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232450', name: 'Lower Pines', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232446', name: 'Wawona', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232451', name: 'Hodgdon Meadow', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232452', name: 'Crane Flat', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232448', name: 'Tuolumne Meadows', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },
  { id: '232453', name: 'Bridalveil Creek', platform: 'recreation_gov', province: 'CA', park: 'Yosemite' },

  // ── Glacier National Park, MT ──
  { id: '10171274', name: 'Apgar', platform: 'recreation_gov', province: 'MT', park: 'Glacier' },
  { id: '251869', name: 'Many Glacier', platform: 'recreation_gov', province: 'MT', park: 'Glacier' },
  { id: '232493', name: 'Fish Creek', platform: 'recreation_gov', province: 'MT', park: 'Glacier' },
  { id: '232492', name: 'St. Mary', platform: 'recreation_gov', province: 'MT', park: 'Glacier' },
  { id: '258795', name: 'Sprague Creek', platform: 'recreation_gov', province: 'MT', park: 'Glacier' },
  { id: '258799', name: 'Two Medicine', platform: 'recreation_gov', province: 'MT', park: 'Glacier' },

  // ── Olympic National Park, WA ──
  { id: '232464', name: 'Kalaloch', platform: 'recreation_gov', province: 'WA', park: 'Olympic' },
  { id: '247592', name: 'Hoh Rainforest', platform: 'recreation_gov', province: 'WA', park: 'Olympic' },
  { id: '247591', name: 'Mora', platform: 'recreation_gov', province: 'WA', park: 'Olympic' },
  { id: '251906', name: 'Sol Duc Hot Springs', platform: 'recreation_gov', province: 'WA', park: 'Olympic' },
  { id: '247586', name: 'Staircase', platform: 'recreation_gov', province: 'WA', park: 'Olympic' },

  // ── Mount Rainier National Park, WA ──
  { id: '232465', name: 'Ohanapecosh', platform: 'recreation_gov', province: 'WA', park: 'Mount Rainier' },
  { id: '232466', name: 'Cougar Rock', platform: 'recreation_gov', province: 'WA', park: 'Mount Rainier' },
  { id: '259031', name: 'White River', platform: 'recreation_gov', province: 'WA', park: 'Mount Rainier' },

  // ── Grand Teton National Park, WY ──
  { id: '247664', name: 'Jenny Lake', platform: 'recreation_gov', province: 'WY', park: 'Grand Teton' },
  { id: '258830', name: 'Colter Bay', platform: 'recreation_gov', province: 'WY', park: 'Grand Teton' },
  { id: '247663', name: 'Signal Mountain', platform: 'recreation_gov', province: 'WY', park: 'Grand Teton' },
  { id: '247661', name: 'Gros Ventre', platform: 'recreation_gov', province: 'WY', park: 'Grand Teton' },
  { id: '247785', name: 'Lizard Creek', platform: 'recreation_gov', province: 'WY', park: 'Grand Teton' },

  // ── Yellowstone National Park, WY ──
  { id: '247571', name: 'Mammoth', platform: 'recreation_gov', province: 'WY', park: 'Yellowstone' },
  { id: '259308', name: 'Tower Fall', platform: 'recreation_gov', province: 'WY', park: 'Yellowstone' },
  { id: '259309', name: 'Lewis Lake', platform: 'recreation_gov', province: 'WY', park: 'Yellowstone' },
  { id: '259310', name: 'Slough Creek', platform: 'recreation_gov', province: 'WY', park: 'Yellowstone' },
  { id: '259304', name: 'Indian Creek', platform: 'recreation_gov', province: 'WY', park: 'Yellowstone' },

  // ── Rocky Mountain National Park, CO ──
  { id: '232463', name: 'Moraine Park', platform: 'recreation_gov', province: 'CO', park: 'Rocky Mountain' },
  { id: '232462', name: 'Glacier Basin', platform: 'recreation_gov', province: 'CO', park: 'Rocky Mountain' },
  { id: '233187', name: 'Aspenglen', platform: 'recreation_gov', province: 'CO', park: 'Rocky Mountain' },
  { id: '260552', name: 'Timber Creek', platform: 'recreation_gov', province: 'CO', park: 'Rocky Mountain' },

  // ── Zion National Park, UT ──
  { id: '232445', name: 'Watchman', platform: 'recreation_gov', province: 'UT', park: 'Zion' },
  { id: '272266', name: 'South Campground', platform: 'recreation_gov', province: 'UT', park: 'Zion' },

  // ── Grand Canyon National Park, AZ ──
  { id: '232490', name: 'Mather', platform: 'recreation_gov', province: 'AZ', park: 'Grand Canyon' },

  // ── Joshua Tree National Park, CA ──
  { id: '272300', name: 'Jumbo Rocks', platform: 'recreation_gov', province: 'CA', park: 'Joshua Tree' },
  { id: '232472', name: 'Indian Cove', platform: 'recreation_gov', province: 'CA', park: 'Joshua Tree' },
  { id: '232473', name: 'Black Rock', platform: 'recreation_gov', province: 'CA', park: 'Joshua Tree' },
  { id: '272299', name: 'Cottonwood', platform: 'recreation_gov', province: 'CA', park: 'Joshua Tree' },

  // ── Sequoia & Kings Canyon National Parks, CA ──
  { id: '232461', name: 'Lodgepole', platform: 'recreation_gov', province: 'CA', park: 'Sequoia' },
  { id: '232460', name: 'Dorst Creek', platform: 'recreation_gov', province: 'CA', park: 'Sequoia' },

  // ── Acadia National Park, ME ──
  { id: '232508', name: 'Blackwoods', platform: 'recreation_gov', province: 'ME', park: 'Acadia' },
  { id: '234674', name: 'Seawall', platform: 'recreation_gov', province: 'ME', park: 'Acadia' },
  { id: '251833', name: 'Schoodic Woods', platform: 'recreation_gov', province: 'ME', park: 'Acadia' },

  // ── Great Smoky Mountains National Park, TN ──
  { id: '232488', name: 'Cades Cove', platform: 'recreation_gov', province: 'TN', park: 'Great Smoky Mountains' },
  { id: '232487', name: 'Elkmont', platform: 'recreation_gov', province: 'TN', park: 'Great Smoky Mountains' },

  // ── Shenandoah National Park, VA ──
  { id: '232459', name: 'Big Meadows', platform: 'recreation_gov', province: 'VA', park: 'Shenandoah' },
  { id: '232433', name: 'Loft Mountain', platform: 'recreation_gov', province: 'VA', park: 'Shenandoah' },

  // ── Death Valley National Park, CA ──
  { id: '232496', name: 'Furnace Creek', platform: 'recreation_gov', province: 'CA', park: 'Death Valley' },

  // ── Bryce Canyon National Park, UT ──
  { id: '234079', name: 'Sunset', platform: 'recreation_gov', province: 'UT', park: 'Bryce Canyon' },
  { id: '234058', name: 'North', platform: 'recreation_gov', province: 'UT', park: 'Bryce Canyon' },

  // ── Arches National Park, UT ──
  { id: '234059', name: 'Devils Garden', platform: 'recreation_gov', province: 'UT', park: 'Arches' },

  // ── Canyonlands National Park, UT ──
  { id: '251535', name: 'Needles', platform: 'recreation_gov', province: 'UT', park: 'Canyonlands' },

  // ── Big Sur, CA (Los Padres National Forest) ──
  { id: '233116', name: 'Kirk Creek', platform: 'recreation_gov', province: 'CA', park: 'Big Sur' },

  // ═══ Parks Canada ═══

  // ── Banff National Park, AB ──
  { id: '-2147483643', name: 'Two Jack Lakeside', platform: 'parks_canada', province: 'AB', park: 'Banff' },
  { id: '-2147483645', name: 'Two Jack Main', platform: 'parks_canada', province: 'AB', park: 'Banff' },
  { id: '-2147483642', name: 'Lake Louise', platform: 'parks_canada', province: 'AB', park: 'Banff' },
  { id: '-2147483644', name: 'Tunnel Mountain Village I', platform: 'parks_canada', province: 'AB', park: 'Banff' },
  { id: '-2147483646', name: 'Tunnel Mountain Village II', platform: 'parks_canada', province: 'AB', park: 'Banff' },
  { id: '-2147483647', name: 'Tunnel Mountain Trailer Court', platform: 'parks_canada', province: 'AB', park: 'Banff' },
  { id: '-2147483641', name: 'Johnston Canyon', platform: 'parks_canada', province: 'AB', park: 'Banff' },

  // ── Jasper National Park, AB ──
  { id: '-2147483593', name: 'Wapiti', platform: 'parks_canada', province: 'AB', park: 'Jasper' },
  { id: '-2147483594', name: 'Whistlers', platform: 'parks_canada', province: 'AB', park: 'Jasper' },

  // ── Pacific Rim National Park Reserve, BC ──
  { id: '-2147483600', name: 'Green Point', platform: 'parks_canada', province: 'BC', park: 'Pacific Rim' }, // verify ID

  // ── Yoho National Park, BC ──
  { id: '-2147483610', name: 'Kicking Horse', platform: 'parks_canada', province: 'BC', park: 'Yoho' }, // verify ID

  // ── Kootenay National Park, BC ──
  { id: '-2147483612', name: 'Redstreak', platform: 'parks_canada', province: 'BC', park: 'Kootenay' }, // verify ID

  // ── Bruce Peninsula National Park, ON ──
  { id: '-2147483620', name: 'Cyprus Lake', platform: 'parks_canada', province: 'ON', park: 'Bruce Peninsula' }, // verify ID

  // ── Fundy National Park, NB ──
  { id: '-2147483625', name: 'Headquarters', platform: 'parks_canada', province: 'NB', park: 'Fundy' }, // verify ID

  // ── PEI National Park, PE ──
  { id: '-2147483630', name: 'Cavendish', platform: 'parks_canada', province: 'PE', park: 'PEI' }, // verify ID

  // ── Waterton Lakes National Park, AB ──
  { id: '-2147483635', name: 'Townsite', platform: 'parks_canada', province: 'AB', park: 'Waterton Lakes' }, // verify ID
]

export function getDefaultSupportStatus(platform: string): CampgroundSupportStatus {
  return ALERTABLE_PLATFORMS.has(platform) ? 'alertable' : 'unsupported'
}

export function normalizeSupportStatus(
  status: string | null | undefined,
  platform: string,
): CampgroundSupportStatus {
  if (
    status === 'alertable' ||
    status === 'search_only' ||
    status === 'coming_soon' ||
    status === 'unsupported'
  ) {
    return status
  }

  return getDefaultSupportStatus(platform)
}

export function isAlertableSupportStatus(status: string | null | undefined): boolean {
  return status === 'alertable'
}

export function getSupportStatusLabel(status: CampgroundSupportStatus): string {
  return SUPPORT_STATUS_LABELS[status]
}

export function withCatalogSupportStatus(campground: Campground): CatalogCampground {
  return {
    ...campground,
    supportStatus: normalizeSupportStatus(campground.supportStatus, campground.platform),
  }
}

export function searchCampgrounds(query: string): CatalogCampground[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return CAMPGROUNDS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.province.toLowerCase().includes(q) ||
      (c.park && c.park.toLowerCase().includes(q)) ||
      (q.length >= 3 && c.platform === 'bc_parks' && 'british columbia'.includes(q)) ||
      (q.length >= 3 && c.platform === 'ontario_parks' && 'ontario'.includes(q)) ||
      (q.length >= 3 && c.platform === 'recreation_gov' && 'united states'.includes(q)) ||
      (q.length >= 3 && c.platform === 'parks_canada' && ('parks canada'.includes(q) || 'national park'.includes(q)))
  ).map(withCatalogSupportStatus)
}

export function getCampground(id: string): CatalogCampground | undefined {
  const campground = CAMPGROUNDS.find((c) => c.id === id)
  return campground ? withCatalogSupportStatus(campground) : undefined
}

export function getPlatformDomain(platform: string): string | null {
  return PLATFORM_DOMAINS[platform] ?? null
}
