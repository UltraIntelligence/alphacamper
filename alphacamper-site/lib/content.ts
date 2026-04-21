import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface ParkFrontmatter {
  title: string;
  description: string;
  park_slug: string;
  park_name: string;
  region: string;
  booking_system: string;
}

export interface ComparisonFrontmatter {
  title: string;
  description: string;
}

export interface ParkPageDefinition {
  slug: string;
  parkName: string;
  shortName: string;
  region: string;
  bookingSystem: string;
  relatedSlugs: string[];
  blurb: string;
  officialUrl?: string;
}

const CONTENT_ROOT = path.join(process.cwd(), "content");
const PARKS_DIR = path.join(CONTENT_ROOT, "parks");
const COMPARISONS_DIR = path.join(CONTENT_ROOT, "comparisons");

export const PARK_PAGE_DEFINITIONS: ParkPageDefinition[] = [
  {
    slug: "algonquin",
    parkName: "Algonquin Provincial Park",
    shortName: "Algonquin",
    region: "Ontario",
    bookingSystem: "Ontario Parks",
    relatedSlugs: ["killarney", "bon-echo", "sandbanks"],
    blurb: "A classic Ontario family trip where release-day demand and last-minute cancellations both move fast.",
    officialUrl: "https://www.ontarioparks.ca/park/algonquin",
  },
  {
    slug: "killarney",
    parkName: "Killarney Provincial Park",
    shortName: "Killarney",
    region: "Ontario",
    bookingSystem: "Ontario Parks",
    relatedSlugs: ["algonquin", "bon-echo", "sandbanks"],
    blurb: "A bucket-list Ontario park where a small number of coveted campsites create a real speed problem at checkout.",
    officialUrl: "https://www.ontarioparks.ca/park/killarney",
  },
  {
    slug: "bon-echo",
    parkName: "Bon Echo Provincial Park",
    shortName: "Bon Echo",
    region: "Ontario",
    bookingSystem: "Ontario Parks",
    relatedSlugs: ["algonquin", "killarney", "sandbanks"],
    blurb: "A high-demand Ontario summer park where families compete for waterfront and easier-access sites.",
    officialUrl: "https://www.ontarioparks.ca/park/bonecho",
  },
  {
    slug: "sandbanks",
    parkName: "Sandbanks Provincial Park",
    shortName: "Sandbanks",
    region: "Ontario",
    bookingSystem: "Ontario Parks",
    relatedSlugs: ["algonquin", "killarney", "bon-echo"],
    blurb: "A beach-trip favorite where the booking challenge is less about knowing the date and more about booking before someone else does.",
    officialUrl: "https://www.ontarioparks.ca/park/sandbanks",
  },
  {
    slug: "banff",
    parkName: "Banff National Park",
    shortName: "Banff",
    region: "Alberta",
    bookingSystem: "Parks Canada",
    relatedSlugs: ["jasper", "pacific-rim", "golden-ears"],
    blurb: "One of the most competitive mountain trips in Canada, especially when families want the most recognizable campgrounds.",
    officialUrl: "https://parks.canada.ca/pn-np/ab/banff/activ/camping",
  },
  {
    slug: "jasper",
    parkName: "Jasper National Park",
    shortName: "Jasper",
    region: "Alberta",
    bookingSystem: "Parks Canada",
    relatedSlugs: ["banff", "pacific-rim", "golden-ears"],
    blurb: "A short Canadian summer season and iconic campgrounds make Jasper one of the harder Parks Canada booking races.",
    officialUrl: "https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay",
  },
  {
    slug: "pacific-rim",
    parkName: "Pacific Rim National Park Reserve",
    shortName: "Pacific Rim",
    region: "BC",
    bookingSystem: "Parks Canada",
    relatedSlugs: ["golden-ears", "banff", "jasper"],
    blurb: "Green Point is a small-inventory coastal trip, which makes both opening day and cancellation grabs feel tight.",
    officialUrl: "https://parks.canada.ca/pn-np/bc/pacificrim/activ/camping",
  },
  {
    slug: "golden-ears",
    parkName: "Golden Ears Provincial Park",
    shortName: "Golden Ears",
    region: "BC",
    bookingSystem: "BC Parks",
    relatedSlugs: ["pacific-rim", "banff", "jasper"],
    blurb: "A Lower Mainland favorite where local demand makes the best weekends disappear fast.",
    officialUrl: "https://bcparks.ca/golden-ears-park/",
  },
  {
    slug: "yosemite",
    parkName: "Yosemite National Park",
    shortName: "Yosemite",
    region: "California",
    bookingSystem: "Recreation.gov",
    relatedSlugs: ["yellowstone", "banff", "jasper"],
    blurb: "A national-park trip where the challenge is speed: everyone knows the sites are valuable, so the form race matters.",
    officialUrl: "https://www.nps.gov/yose/planyourvisit/campground.htm",
  },
  {
    slug: "yellowstone",
    parkName: "Yellowstone National Park",
    shortName: "Yellowstone",
    region: "Wyoming",
    bookingSystem: "Recreation.gov",
    relatedSlugs: ["yosemite", "banff", "jasper"],
    blurb: "Huge trip demand, short seasonal windows, and family timing constraints make Yellowstone cancellations worth chasing.",
    officialUrl: "https://www.nps.gov/yell/planyourvisit/campgrounds.htm",
  },
];

function listContentSlugs(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => fileName.replace(/\.mdx$/, ""))
    .sort();
}

function readMdxFile<TFrontmatter>(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);

  return {
    source,
    frontmatter: parsed.data as TFrontmatter,
  };
}

export function getParksDirectory(): string {
  return PARKS_DIR;
}

export function getComparisonsDirectory(): string {
  return COMPARISONS_DIR;
}

export function getParkContentPath(slug: string): string {
  return path.join(PARKS_DIR, `${slug}.mdx`);
}

export function getComparisonContentPath(slug: string): string {
  return path.join(COMPARISONS_DIR, `${slug}.mdx`);
}

export function getParkSlugsFromFilesystem(): string[] {
  return listContentSlugs(PARKS_DIR);
}

export function getComparisonSlugsFromFilesystem(): string[] {
  return listContentSlugs(COMPARISONS_DIR);
}

export function findParkPageDefinition(slug: string): ParkPageDefinition | undefined {
  return PARK_PAGE_DEFINITIONS.find((park) => park.slug === slug);
}

export function readParkSource(slug: string): string | null {
  const filePath = getParkContentPath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}

export function readParkFrontmatter(slug: string): ParkFrontmatter | null {
  const filePath = getParkContentPath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readMdxFile<ParkFrontmatter>(filePath).frontmatter;
}

export function readComparisonFrontmatter(slug: string): ComparisonFrontmatter | null {
  const filePath = getComparisonContentPath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readMdxFile<ComparisonFrontmatter>(filePath).frontmatter;
}

export function readComparisonSource(slug: string): string | null {
  const filePath = getComparisonContentPath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}
