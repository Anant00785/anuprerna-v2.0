/**
 * apps/api/src/commerce/content/story/dto/story.dto.ts
 *
 * Swagger request-body classes for StoryController with accurate types and examples.
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateStoryCategoryDto {
  @ApiProperty({ example: "Handloom Heritage", description: "Category name" })
  name!: string;
}

export class UpdateStoryCategoryDto {
  @ApiProperty({ example: 2326, description: "Category ID (e.g. 123, 2326, 4518)", type: Number })
  id!: number;

  @ApiProperty({ example: "ORGANIC & NATURAL", description: "Category name" })
  name!: string;
}

export class CreateStoryContentDto {
  @ApiProperty({ example: 2326, description: "Story content category ID (e.g. 2326, 4518, 4537)", type: Number })
  storyContentCategoryId!: number;

  @ApiProperty({ example: "Naturally Dyed Block Printing", description: "Story title" })
  title!: string;

  @ApiProperty({ example: "Exploring the artisanal heritage of natural dye and block printing techniques.", description: "Story description" })
  description!: string;

  @ApiProperty({ example: 5, description: "Reading time in minutes", type: Number })
  readingTime!: number;

  @ApiProperty({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/stories/banner-desktop.jpg", description: "Desktop banner image URL" })
  bannerImageDesktop!: string;

  @ApiProperty({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/stories/banner-mobile.jpg", description: "Mobile banner image URL" })
  bannerImageMobile!: string;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/stories/banner-parallax.jpg", description: "Parallax banner image URL" })
  bannerImageParallax?: string;

  @ApiPropertyOptional({ example: "Crafting sustainable stories since 1990", description: "Parallax banner text" })
  parallaxText?: string;

  @ApiPropertyOptional({ example: "naturally-dyed-block-printing", description: "SEO slug (optional, auto-generated if omitted)" })
  slug?: string;

  @ApiPropertyOptional({ example: 551, description: "Previous story ID", type: Number })
  previousStory?: number;

  @ApiPropertyOptional({ example: 9149, description: "Next story ID", type: Number })
  nextStory?: number;

  @ApiProperty({ example: 1, description: "Author ID (e.g. 1)", type: Number })
  authorId!: number;

  @ApiProperty({ example: "Artisanal Naturally Dyed Block Printing | Anuprerna", description: "Meta title for SEO" })
  metaTitle!: string;

  @ApiProperty({ example: "Discover authentic hand block printed fabrics and the artisans behind them.", description: "Meta description for SEO" })
  metaDescription!: string;

  @ApiProperty({ example: "Naturally dyed fabric block printing artisan at work", description: "Banner image Alt text" })
  bannerImageAlt!: string;

  @ApiProperty({ example: "Handcrafted block print texture detail", description: "Parallax banner image Alt text" })
  bannerImageParallaxAlt!: string;
}

export class UpdateStoryContentDto extends CreateStoryContentDto {
  @ApiProperty({ example: 35676460, description: "Story content ID to update (e.g. 35676460, 2041070, 551)", type: Number })
  id!: number;
}

export class CreateStorySectionDto {
  @ApiProperty({ example: 35676460, description: "Story content ID (e.g. 35676460)", type: Number })
  storyContentId!: number;

  @ApiPropertyOptional({ example: 1, description: "Template layout type number", type: Number })
  templateType?: number;

  @ApiPropertyOptional({ example: 1, description: "Template color theme number", type: Number })
  templateColor?: number;

  @ApiPropertyOptional({ example: 1, description: "Sort display order", type: Number })
  sortOrder?: number;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/stories/section-image-1.jpg", description: "Primary section image URL" })
  image1?: string;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/stories/section-image-2.jpg", description: "Secondary section image URL" })
  image2?: string;

  @ApiPropertyOptional({ example: "Traditional wooden printing blocks", description: "Caption for Image 1" })
  caption1?: string;

  @ApiPropertyOptional({ example: "Hand block printed organic cotton fabric", description: "Caption for Image 2" })
  caption2?: string;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/videos/weaving-artisan.mp4", description: "Video 1 URL (S3/MP4/Streaming video link or empty)" })
  video1?: string;

  @ApiPropertyOptional({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/videos/natural-dye-process.mp4", description: "Video 2 URL (S3/MP4/Streaming video link or empty)" })
  video2?: string;

  @ApiPropertyOptional({ example: "The Art of Hand Block Printing", description: "Section heading" })
  heading?: string;

  @ApiPropertyOptional({ example: "Heritage Craftsmanship", description: "Title 1" })
  title1?: string;

  @ApiPropertyOptional({ example: "Natural Dye Extraction", description: "Title 2" })
  title2?: string;

  @ApiPropertyOptional({ example: "Each wooden block is hand-carved with intricate motifs passed down through generations.", description: "Paragraph 1" })
  paragraph1?: string;

  @ApiPropertyOptional({ example: "Colors are extracted naturally from indigo, turmeric, pomegranate, and madder root.", description: "Paragraph 2" })
  paragraph2?: string;

  @ApiPropertyOptional({ example: "Explore Handblock Fabrics", description: "CTA Button 1 text" })
  ctaButtonName1?: string;

  @ApiPropertyOptional({ example: "https://anuprerna.com/shop/fabrics/handblock", description: "CTA Button 1 destination link" })
  ctaLink1?: string;

  @ApiPropertyOptional({ example: "Meet the Artisans", description: "CTA Button 2 text" })
  ctaButtonName2?: string;

  @ApiPropertyOptional({ example: "https://anuprerna.com/artisans", description: "CTA Button 2 destination link" })
  ctaLink2?: string;

  @ApiPropertyOptional({ example: "Floral Motif", description: "Top motif description or name" })
  topMotif?: string;

  @ApiPropertyOptional({ example: "Paisley Border", description: "Bottom motif description or name" })
  bottomMotif?: string;

  @ApiPropertyOptional({ example: "Artisan hand printing organic cotton fabric with wooden block", description: "Image 1 Alt text for SEO" })
  image1Alt?: string;

  @ApiPropertyOptional({ example: "Close up of botanical natural dye preparation", description: "Image 2 Alt text for SEO" })
  image2Alt?: string;

  @ApiPropertyOptional({ example: "Video showcasing traditional loom weaving process", description: "Video 1 Alt text for SEO" })
  video1Alt?: string;

  @ApiPropertyOptional({ example: "Video demonstrating natural dye vat dipping", description: "Video 2 Alt text for SEO" })
  video2Alt?: string;
}

export class UpdateStorySectionDto extends CreateStorySectionDto {
  @ApiProperty({ example: 101, description: "Story section ID to update", type: Number })
  id!: number;
}

export class CreateStoryProductRelationDto {
  @ApiProperty({ example: 35676460, description: "Story content ID", type: Number })
  storyContentId!: number;

  @ApiProperty({ example: "52336,2728,94504", description: "Comma-separated list of product IDs" })
  productIdCsv!: string;

  @ApiPropertyOptional({ example: "2728", description: "Comma-separated list of finished product IDs" })
  finishProductIds?: string;
}
