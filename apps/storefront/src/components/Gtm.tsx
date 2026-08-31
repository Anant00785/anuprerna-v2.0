'use client';
import { useEffect, useRef } from 'react';

type W = Window & { dataLayer?: any[] };
function push(o: any) { (window as W).dataLayer = (window as W).dataLayer || []; (window as W).dataLayer!.push(o); }

export type GtmItem = {
  item_id: string; item_name: string; item_category: string;
  item_category2?: string; item_category3?: string; index: number;
};

// Fires view_item_list once when the grid scrolls into view (mirrors the real GTM ecommerce journey)
export function ViewItemList({ listId, listName, items, children }:{
  listId: string; listName: string; items: GtmItem[]; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting && !fired.current) {
          fired.current = true;
          push({ ecommerce: null });
          push({
            event: 'view_item_list',
            ecommerce: {
              item_list_id: listId, item_list_name: listName,
              items: items.map(i => ({
                item_id: i.item_id, item_name: i.item_name,
                affiliation: 'Anuprerna Website Store',
                item_list_id: listId, item_list_name: listName,
                item_category: i.item_category, item_category2: i.item_category2 || '',
                item_category3: i.item_category3 || '', index: i.index, quantity: 1,
              })),
            },
          });
          io.disconnect();
        }
      });
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [listId, listName, items]);
  return <div ref={ref} className="w-full">{children}</div>;
}

// select_item handler — attach to a product/category click
export function selectItem(listId: string, listName: string, item: GtmItem) {
  push({ ecommerce: null });
  push({
    event: 'select_item',
    ecommerce: {
      item_list_id: listId, item_list_name: listName,
      items: [{
        item_id: item.item_id, item_name: item.item_name,
        affiliation: 'Anuprerna Website Store',
        item_list_id: listId, item_list_name: listName,
        item_category: item.item_category, item_category2: item.item_category2 || '',
        item_category3: item.item_category3 || '', index: item.index, quantity: 1,
      }],
    },
  });
}
