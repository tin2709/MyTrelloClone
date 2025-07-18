// Code generated by Slice Machine. DO NOT EDIT.

import type * as prismic from "@prismicio/client";

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };

type PickContentRelationshipFieldData<
  TRelationship extends
    | prismic.CustomTypeModelFetchCustomTypeLevel1
    | prismic.CustomTypeModelFetchCustomTypeLevel2
    | prismic.CustomTypeModelFetchGroupLevel1
    | prismic.CustomTypeModelFetchGroupLevel2,
  TData extends Record<
    string,
    | prismic.AnyRegularField
    | prismic.GroupField
    | prismic.NestedGroupField
    | prismic.SliceZone
  >,
  TLang extends string,
> =
  // Content relationship fields
  {
    [TSubRelationship in Extract<
      TRelationship["fields"][number],
      prismic.CustomTypeModelFetchContentRelationshipLevel1
    > as TSubRelationship["id"]]: ContentRelationshipFieldWithData<
      TSubRelationship["customtypes"],
      TLang
    >;
  } & // Group
  {
    [TGroup in Extract<
      TRelationship["fields"][number],
      | prismic.CustomTypeModelFetchGroupLevel1
      | prismic.CustomTypeModelFetchGroupLevel2
    > as TGroup["id"]]: TData[TGroup["id"]] extends prismic.GroupField<
      infer TGroupData
    >
      ? prismic.GroupField<
          PickContentRelationshipFieldData<TGroup, TGroupData, TLang>
        >
      : never;
  } & // Other fields
  {
    [TFieldKey in Extract<
      TRelationship["fields"][number],
      string
    >]: TFieldKey extends keyof TData ? TData[TFieldKey] : never;
  };

type ContentRelationshipFieldWithData<
  TCustomType extends
    | readonly (prismic.CustomTypeModelFetchCustomTypeLevel1 | string)[]
    | readonly (prismic.CustomTypeModelFetchCustomTypeLevel2 | string)[],
  TLang extends string = string,
> = {
  [ID in Exclude<
    TCustomType[number],
    string
  >["id"]]: prismic.ContentRelationshipField<
    ID,
    TLang,
    PickContentRelationshipFieldData<
      Extract<TCustomType[number], { id: ID }>,
      Extract<prismic.Content.AllDocumentTypes, { type: ID }>["data"],
      TLang
    >
  >;
}[Exclude<TCustomType[number], string>["id"]];

type HomepageDocumentDataSlicesSlice = HeroSectionSlice;

/**
 * Content for Homepage documents
 */
interface HomepageDocumentData {
  /**
   * Slice Zone field in *Homepage*
   *
   * - **Field Type**: Slice Zone
   * - **Placeholder**: *None*
   * - **API ID Path**: homepage.slices[]
   * - **Tab**: Main
   * - **Documentation**: https://prismic.io/docs/slices
   */
  slices: prismic.SliceZone<HomepageDocumentDataSlicesSlice> /**
   * Meta Title field in *Homepage*
   *
   * - **Field Type**: Text
   * - **Placeholder**: A title of the page used for social media and search engines
   * - **API ID Path**: homepage.meta_title
   * - **Tab**: SEO & Metadata
   * - **Documentation**: https://prismic.io/docs/fields/text
   */;
  meta_title: prismic.KeyTextField;

  /**
   * Meta Description field in *Homepage*
   *
   * - **Field Type**: Text
   * - **Placeholder**: A brief summary of the page
   * - **API ID Path**: homepage.meta_description
   * - **Tab**: SEO & Metadata
   * - **Documentation**: https://prismic.io/docs/fields/text
   */
  meta_description: prismic.KeyTextField;

  /**
   * Meta Image field in *Homepage*
   *
   * - **Field Type**: Image
   * - **Placeholder**: *None*
   * - **API ID Path**: homepage.meta_image
   * - **Tab**: SEO & Metadata
   * - **Documentation**: https://prismic.io/docs/fields/image
   */
  meta_image: prismic.ImageField<never>;
}

/**
 * Homepage document from Prismic
 *
 * - **API ID**: `homepage`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type HomepageDocument<Lang extends string = string> =
  prismic.PrismicDocumentWithoutUID<
    Simplify<HomepageDocumentData>,
    "homepage",
    Lang
  >;

export type AllDocumentTypes = HomepageDocument;

/**
 * Primary content in *HeroSection → Default → Primary*
 */
export interface HeroSectionSliceDefaultPrimary {
  /**
   * Heading field in *HeroSection → Default → Primary*
   *
   * - **Field Type**: Rich Text
   * - **Placeholder**: Nhập tiêu đề chính tại đây
   * - **API ID Path**: hero_section.default.primary.heading
   * - **Documentation**: https://prismic.io/docs/fields/rich-text
   */
  heading: prismic.RichTextField;

  /**
   * tagline field in *HeroSection → Default → Primary*
   *
   * - **Field Type**: Rich Text
   * - **Placeholder**: Nhập dòng mô tả ngắn hoặc slogan tại đây
   * - **API ID Path**: hero_section.default.primary.tagline
   * - **Documentation**: https://prismic.io/docs/fields/rich-text
   */
  tagline: prismic.RichTextField;

  /**
   * ctaLink field in *HeroSection → Default → Primary*
   *
   * - **Field Type**: Link
   * - **Placeholder**: Chọn một liên kết cho nút bấm
   * - **API ID Path**: hero_section.default.primary.ctalink
   * - **Documentation**: https://prismic.io/docs/fields/link
   */
  ctalink: prismic.LinkField<
    string,
    string,
    unknown,
    prismic.FieldState,
    never
  >;

  /**
   * CTA Label field in *HeroSection → Default → Primary*
   *
   * - **Field Type**: Rich Text
   * - **Placeholder**: Nhập văn bản hiển thị trên nút
   * - **API ID Path**: hero_section.default.primary.cta_label
   * - **Documentation**: https://prismic.io/docs/fields/rich-text
   */
  cta_label: prismic.RichTextField;
}

/**
 * Default variation for HeroSection Slice
 *
 * - **API ID**: `default`
 * - **Description**: Default
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type HeroSectionSliceDefault = prismic.SharedSliceVariation<
  "default",
  Simplify<HeroSectionSliceDefaultPrimary>,
  never
>;

/**
 * Slice variation for *HeroSection*
 */
type HeroSectionSliceVariation = HeroSectionSliceDefault;

/**
 * HeroSection Shared Slice
 *
 * - **API ID**: `hero_section`
 * - **Description**: HeroSection
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type HeroSectionSlice = prismic.SharedSlice<
  "hero_section",
  HeroSectionSliceVariation
>;

declare module "@prismicio/client" {
  interface CreateClient {
    (
      repositoryNameOrEndpoint: string,
      options?: prismic.ClientConfig,
    ): prismic.Client<AllDocumentTypes>;
  }

  interface CreateWriteClient {
    (
      repositoryNameOrEndpoint: string,
      options: prismic.WriteClientConfig,
    ): prismic.WriteClient<AllDocumentTypes>;
  }

  interface CreateMigration {
    (): prismic.Migration<AllDocumentTypes>;
  }

  namespace Content {
    export type {
      HomepageDocument,
      HomepageDocumentData,
      HomepageDocumentDataSlicesSlice,
      AllDocumentTypes,
      HeroSectionSlice,
      HeroSectionSliceDefaultPrimary,
      HeroSectionSliceVariation,
      HeroSectionSliceDefault,
    };
  }
}
