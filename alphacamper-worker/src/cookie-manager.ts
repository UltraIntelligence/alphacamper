import { chromium } from "playwright";
import { COOKIE_TTLS, USER_AGENT } from "./config.js";
import { log } from "./logger.js";
import { alertOperator } from "./alerter.js";

export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

interface CacheEntry {
  cookies: CookieData[];
  expiresAt: number;
}

const MIN_TTL_MS = 5 * 60 * 1000;
const TTL_REDUCTION_MS = 5 * 60 * 1000;
const DEFAULT_TTL_MS = 25 * 60 * 1000;

export class CookieManager {
  private cache = new Map<string, CacheEntry>();
  private ttls = new Map<string, number>();

  getTtl(domain: string): number {
    if (this.ttls.has(domain)) {
      return this.ttls.get(domain)!;
    }
    return COOKIE_TTLS[domain] ?? DEFAULT_TTL_MS;
  }

  reduceTtl(domain: string): void {
    const current = this.getTtl(domain);
    const reduced = Math.max(current - TTL_REDUCTION_MS, MIN_TTL_MS);
    this.ttls.set(domain, reduced);
  }

  isExpired(domain: string): boolean {
    const entry = this.cache.get(domain);
    if (!entry) return true;
    return Date.now() >= entry.expiresAt;
  }

  setCookies(domain: string, cookies: CookieData[]): void {
    const ttl = this.getTtl(domain);
    this.cache.set(domain, {
      cookies,
      expiresAt: Date.now() + ttl,
    });
  }

  getCookieHeader(domain: string): string {
    const entry = this.cache.get(domain);
    if (!entry || entry.cookies.length === 0) return "";
    return entry.cookies.map(c => `${c.name}=${c.value}`).join("; ");
  }

  forceExpire(domain: string): void {
    this.cache.delete(domain);
  }

  async refreshCookies(domain: string): Promise<boolean> {
    log.info("Launching browser to refresh cookies", { domain });
    const browser = await chromium.launch({
      headless: true,
      args: [`--user-agent=${USER_AGENT}`],
    });

    try {
      const context = await browser.newContext({ userAgent: USER_AGENT });
      const page = await context.newPage();

      // Use `domcontentloaded` + explicit timeout instead of `networkidle`.
      // Parks Canada (reservation.pc.gc.ca) keeps telemetry/keepalive running
      // past the 30s default, so `networkidle` times out. DCL fires as soon
      // as the document is parsed, which is early enough to have the WAF
      // cookies set but doesn't wait for idle that never comes.
      await page.goto(`https://${domain}/`, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });

      // Check for CAPTCHA
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        "div.g-recaptcha",
        "#captcha-container",
      ];
      for (const selector of captchaSelectors) {
        const el = await page.$(selector);
        if (el) {
          await alertOperator(
            `CAPTCHA detected on ${domain} — manual intervention required`,
            "critical"
          );
          return false;
        }
      }

      // Wait for interactive elements
      try {
        await page.waitForSelector("a, button, input", { timeout: 15000 });
      } catch {
        log.warn("Interactive elements not found within 15s", { domain });
      }

      const cookies = await context.cookies();
      const cookieData: CookieData[] = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: (c.sameSite as "Strict" | "Lax" | "None") ?? "Lax",
      }));

      this.setCookies(domain, cookieData);
      log.info("Cookies refreshed successfully", { domain, count: cookieData.length });
      return true;
    } catch (err) {
      log.error("Failed to refresh cookies", { domain, error: String(err) });
      return false;
    } finally {
      await browser.close();
    }
  }
}
