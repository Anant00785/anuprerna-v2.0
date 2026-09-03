import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiscoverCraft from './DiscoverCraft';
import type { StoryItem } from '@/components/content-list/loom';

/**
 * Regression guard for the fabric-PDP outage: /get/story/related/product/{id}
 * returns rows whose `title` is null even though StoryItem types it `string`,
 * and the unguarded `s.title.trim()` threw inside the map. Because DiscoverCraft
 * renders within the PDP body, that took out the entire product section —
 * including Add to Cart — while the route still returned HTTP 200.
 */
const story = (over: Partial<StoryItem> = {}): StoryItem =>
  ({
    id: 1,
    slug: 'khesh-craft',
    title: 'The Khesh Craft',
    bannerImageMobile: '/m.jpg',
    bannerImageDesktop: '/d.jpg',
    timeOfCreation: 1700000000000,
    storyContentCategory: { name: 'Craft' },
    ...over,
  }) as unknown as StoryItem;

describe('DiscoverCraft', () => {
  it('renders nothing when there are no stories', () => {
    const { container } = render(<DiscoverCraft stories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a normal story', () => {
    render(<DiscoverCraft stories={[story()]} />);
    expect(screen.getByText('the khesh craft')).toBeTruthy();
  });

  it('does NOT throw when title is null — the PDP outage', () => {
    expect(() =>
      render(<DiscoverCraft stories={[story({ title: null as unknown as string })]} />),
    ).not.toThrow();
  });

  it('does NOT throw when title is undefined', () => {
    expect(() =>
      render(<DiscoverCraft stories={[story({ title: undefined as unknown as string })]} />),
    ).not.toThrow();
  });

  it('still renders the other cards when one story has a null title', () => {
    render(
      <DiscoverCraft
        stories={[
          story({ id: 1, title: null as unknown as string }),
          story({ id: 2, title: 'Jamdani Weaving' }),
        ]}
      />,
    );
    // The good card survives rather than the whole section being lost.
    expect(screen.getByText('jamdani weaving')).toBeTruthy();
  });
});
