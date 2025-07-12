// src/slices/HeroSection/index.tsx
import { Content } from "@prismicio/client";
import { PrismicNextLink } from "@prismicio/next";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import React from "react";

export type HeroSectionProps = SliceComponentProps<Content.HeroSectionSlice>;

const HeroSection = ({ slice }: HeroSectionProps): JSX.Element => {
  return (
      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-screen-xl px-4 py-32 text-center">
          <div className="mx-auto max-w-3xl">
            {/* Render trường Heading */}
            <PrismicRichText
                field={slice.primary.heading}
                components={{
                  heading1: ({ children }) => (
                      <h1 className="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl">
                        {children}
                      </h1>
                  ),
                }}
            />

            {/* Render trường Tagline */}
            <div className="mt-8 text-xl/relaxed text-gray-300">
              <PrismicRichText field={slice.primary.tagline} />
            </div>

            {/* Render Nút Bấm */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PrismicNextLink
                  field={slice.primary.ctalink}
                  className="block rounded border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-white focus:outline-none focus:ring active:text-opacity-75"
              >
                <PrismicRichText field={slice.primary.cta_label} />
              </PrismicNextLink>
            </div>
          </div>
        </div>
      </section>
  );
};

export default HeroSection;