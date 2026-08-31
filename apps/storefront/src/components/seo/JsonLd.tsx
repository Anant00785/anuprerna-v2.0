// Renders a JSON-LD structured-data <script> in BOTH dark and live modes
// (harmless while the page is noindexed, and it lets us verify the markup now).
// XSS-safe: escape '<' so a value containing </script> or an HTML tag can never
// break out of the script element.
import * as React from 'react';

type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

export default function JsonLd({ data }: { data: JsonLdData }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
