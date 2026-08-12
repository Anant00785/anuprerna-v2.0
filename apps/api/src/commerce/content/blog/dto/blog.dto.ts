/**
 * apps/api/src/commerce/content/blog/dto/blog.dto.ts
 *
 * Swagger request-body classes for BlogController. This file was missing from the
 * migration upload — the controller imported it and the whole API failed to boot with
 * MODULE_NOT_FOUND. `@ts-nocheck` on the controller hid it from tsc, so typecheck,
 * lint and build all passed while the server could not start.
 *
 * These are documentation types only. Runtime parsing and coercion still happen in
 * `../types/blog.types.ts`, whose *Input interfaces these mirror
 * field-for-field. Keep them in sync: if you add a field there, add it here.
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBlogTypeDto {
  @ApiPropertyOptional({ type: String })
  id?: string | number;

  @ApiProperty({ type: String })
  name!: string;

}

export class CreateBlogCategoryDto {
  @ApiPropertyOptional({ type: String })
  id?: string | number;

  @ApiProperty({ type: String })
  blogContentTypeId!: string | number;

  @ApiProperty({ type: String })
  name!: string;

}

export class CreateBlogContentDto {
  @ApiPropertyOptional({ type: String })
  id?: string | number;

  @ApiProperty({ type: String })
  blogContentCategoryId!: string | number;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: Number })
  readingTime!: number;

  @ApiProperty({ type: String })
  bannerImageDesktop!: string;

  @ApiProperty({ type: String })
  bannerImageMobile!: string;

  @ApiPropertyOptional({ type: String })
  bannerImageParallax?: string;

  @ApiPropertyOptional({ type: String })
  parallaxText?: string;

  @ApiPropertyOptional({ type: String })
  slug?: string;

  @ApiPropertyOptional({ type: String })
  previousBlog?: string | number;

  @ApiPropertyOptional({ type: String })
  nextBlog?: string | number;

  @ApiProperty({ type: String })
  authorId!: string | number;

  @ApiProperty({ type: String })
  metaTitle!: string;

  @ApiProperty({ type: String })
  metaDescription!: string;

  @ApiProperty({ type: String })
  bannerImageAlt!: string;

  @ApiProperty({ type: String })
  bannerImageParallaxAlt!: string;

  @ApiProperty({ type: String })
  backwardCompatibleLink!: string;

}

export class UpdateBlogContentDto {
  @ApiPropertyOptional({ type: String })
  id?: string | number;

  @ApiProperty({ type: String })
  blogContentCategoryId!: string | number;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: Number })
  readingTime!: number;

  @ApiProperty({ type: String })
  bannerImageDesktop!: string;

  @ApiProperty({ type: String })
  bannerImageMobile!: string;

  @ApiPropertyOptional({ type: String })
  bannerImageParallax?: string;

  @ApiPropertyOptional({ type: String })
  parallaxText?: string;

  @ApiPropertyOptional({ type: String })
  slug?: string;

  @ApiPropertyOptional({ type: String })
  previousBlog?: string | number;

  @ApiPropertyOptional({ type: String })
  nextBlog?: string | number;

  @ApiProperty({ type: String })
  authorId!: string | number;

  @ApiProperty({ type: String })
  metaTitle!: string;

  @ApiProperty({ type: String })
  metaDescription!: string;

  @ApiProperty({ type: String })
  bannerImageAlt!: string;

  @ApiProperty({ type: String })
  bannerImageParallaxAlt!: string;

  @ApiProperty({ type: String })
  backwardCompatibleLink!: string;

}

export class CreateBlogSectionDto {
  @ApiPropertyOptional({ type: String })
  id?: string | number;

  @ApiProperty({ type: String })
  blogContentId!: string | number;

  @ApiProperty({ type: Number })
  templateType!: number;

  @ApiProperty({ type: Number })
  templateColor!: number;

  @ApiProperty({ type: Number })
  sortOrder!: number;

  @ApiPropertyOptional({ type: String })
  image1?: string;

  @ApiPropertyOptional({ type: String })
  image2?: string;

  @ApiPropertyOptional({ type: String })
  caption1?: string;

  @ApiPropertyOptional({ type: String })
  caption2?: string;

  @ApiPropertyOptional({ type: String })
  video1?: string;

  @ApiPropertyOptional({ type: String })
  video2?: string;

  @ApiPropertyOptional({ type: String })
  heading?: string;

  @ApiPropertyOptional({ type: String })
  title1?: string;

  @ApiPropertyOptional({ type: String })
  title2?: string;

  @ApiPropertyOptional({ type: String })
  paragraph1?: string;

  @ApiPropertyOptional({ type: String })
  paragraph2?: string;

  @ApiPropertyOptional({ type: String })
  ctaButtonName1?: string;

  @ApiPropertyOptional({ type: String })
  ctaLink1?: string;

  @ApiPropertyOptional({ type: String })
  ctaButtonName2?: string;

  @ApiPropertyOptional({ type: String })
  ctaLink2?: string;

  @ApiPropertyOptional({ type: String })
  topMotif?: string;

  @ApiPropertyOptional({ type: String })
  bottomMotif?: string;

  @ApiProperty({ type: String })
  image1Alt!: string;

  @ApiProperty({ type: String })
  image2Alt!: string;

  @ApiProperty({ type: String })
  video1Alt!: string;

  @ApiProperty({ type: String })
  video2Alt!: string;

  @ApiPropertyOptional({ type: String })
  image1Link?: string;

  @ApiPropertyOptional({ type: String })
  image2Link?: string;

}
