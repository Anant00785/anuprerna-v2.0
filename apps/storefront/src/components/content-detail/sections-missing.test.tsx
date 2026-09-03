import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import MobileOnThisPage from './MobileOnThisPage';
import TableOfContents from './TableOfContents';
import ContentBody from './ContentBody';
import type { ContentSection } from './loom';

/**
 * Regression guard for the /content/[contentType]/[slug]/[blogId] outage.
 *
 * `blogContentSectionList` is typed ContentSection[] but the content API omits
 * it entirely on some records. All three of these components did
 * `[...sections]`, and spreading undefined throws:
 *
 *   TypeError: b is not iterable   digest 2548080271
 *   TypeError: a is not iterable   digest 416643122
 *
 * Two digests because two components threw on the same render; ContentBody was
 * the third and would have thrown as soon as the other two were fixed.
 */
const missing = undefined as unknown as ContentSection[];

const section = (over: Partial<ContentSection> = {}): ContentSection =>
  ({ heading: 'Our Story', sortOrder: 1, description: '<p>hi</p>', ...over }) as ContentSection;

// TableOfContents runs a scrollspy once it has entries; jsdom has no
// IntersectionObserver. Stubbed so the "renders normally" case exercises the
// real render path instead of failing on the environment.
beforeAll(() => {
  if (!('IntersectionObserver' in globalThis)) {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }
});

describe('content-detail components with no sections', () => {
  it('MobileOnThisPage does not throw when sections is missing', () => {
    expect(() => render(<MobileOnThisPage sections={missing} />)).not.toThrow();
  });

  it('TableOfContents does not throw when sections is missing', () => {
    expect(() => render(<TableOfContents sections={missing} />)).not.toThrow();
  });

  it('ContentBody does not throw when sections is missing', () => {
    expect(() => render(<ContentBody description='' sections={missing} />)).not.toThrow();
  });

  it('all three still render normally when sections are present', () => {
    expect(() => {
      render(<MobileOnThisPage sections={[section()]} />);
      render(<TableOfContents sections={[section()]} />);
      render(<ContentBody description='' sections={[section()]} />);
    }).not.toThrow();
  });

  it('handles an explicit empty list', () => {
    expect(() => render(<TableOfContents sections={[]} />)).not.toThrow();
  });
});
