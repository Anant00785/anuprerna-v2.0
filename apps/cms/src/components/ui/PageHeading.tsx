import React from 'react';

interface PageHeadingProps {
  heading: string;
}

export function PageHeading({ heading }: PageHeadingProps) {
  return (
    <h2 className="my-6 text-xl font-medium text-gray-700 uppercase text-center md:text-left">
      {heading}
    </h2>
  );
}
