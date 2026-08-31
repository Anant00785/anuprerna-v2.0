// Rewrite absolute anuprerna.com links in CMS-authored HTML to relative in-app
// paths, so story/blog/product body content does not "leak" to the live Angular
// site (and stays inside the demo). Asset/image/social/mailto links are left
// untouched (only the bare www origin is stripped from same-site nav links).
export function relativizeCmsHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/(href\s*=\s*["'])https?:\/\/(?:www\.)?anuprerna\.com(?=[/"'])/gi, '$1')
    // story detail canonical route on the demo is /story-details/{slug}/{id}
    // (this 3-segment story remap MUST run before the /crafts catch below).
    .replace(/(href\s*=\s*["'])\/stories\/([^/"']+)\/([^/"'?#]+)/gi, '$1/story-details/$2/$3')
    // Legacy craft landing pages (/crafts/{slug}) have NO in-app equivalent in the
    // demo (live 301s them to a per-craft story, but the slug->story mapping is not
    // deterministic/1:1, so it needs backend data we don't have on the frontend).
    // Route them to the in-app /stories listing so the CTA stays on a relevant
    // in-app page instead of leaking to live / 404ing. (precise per-craft redirect: flagged backend.)
    .replace(/(href\s*=\s*["'])\/crafts(?:\/[^"']*)?/gi, '$1/stories');
}


// Relativize a single absolute anuprerna.com nav URL coming from the Loom API
// (badge links, related-story chips, etc.) to an in-app path. Leaves external /
// asset / subdomain / mailto URLs untouched.
export function relHref(url: string | null | undefined): string {
  if (!url) return '#';
  let p = url.replace(/^https?:\/\/(?:www\.)?anuprerna\.com(?=[/?#]|$)/i, '');
  // Story DETAIL canonical route on the demo is /story-details/{slug}/{id}
  // (live's /stories/{slug}/{id} 301s there). Remap so badge/CMS chips don't 404.
  // MUST run before the /crafts catch below.
  p = p.replace(/^\/stories\/([^/]+)\/([^/?#]+)/, '/story-details/$1/$2');
  // Legacy craft landing pages (/crafts/{slug}) have no in-app equivalent in the
  // demo; route to the /stories listing (precise per-craft redirect needs backend data — flagged).
  p = p.replace(/^\/crafts(?:\/[^?#]*)?/, '/stories');
  return p || '/';
}
