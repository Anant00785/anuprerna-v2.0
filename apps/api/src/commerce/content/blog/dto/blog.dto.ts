import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateBlogTypeDto {
  @ApiProperty({ example: "Artisan Stories", description: "Blog content type name" })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class UpdateBlogTypeDto {
  @ApiProperty({ example: 1, description: "Blog content type identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: "Artisan Stories & Heritage", description: "Updated blog content type name" })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class CreateBlogCategoryDto {
  @ApiProperty({ example: "Natural Dyeing", description: "Blog category name" })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class UpdateBlogCategoryDto {
  @ApiProperty({ example: 1, description: "Blog category identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 1, description: "Associated blog content type identifier" })
  @IsNotEmpty()
  @IsNumber()
  blogContentTypeId!: number;

  @ApiProperty({ example: "Natural Dyeing Techniques", description: "Updated category name" })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class CreateBlogContentDto {
  @ApiProperty({ example: 1, description: "Blog content category identifier" })
  @IsNotEmpty()
  @IsNumber()
  blogContentCategoryId!: number;

  @ApiProperty({ example: "The Art of Handloom Weaving in Bengal", description: "Blog post title" })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: "Explore centuries-old weaving traditions preserved by skilled rural weavers.", description: "Short summary description" })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 5, description: "Estimated reading time in minutes" })
  @IsNotEmpty()
  @IsNumber()
  readingTime!: number;

  @ApiProperty({ example: "https://assets.anuprerna.com/blogs/handloom-desktop.jpg", description: "Banner image URL for desktop view" })
  @IsNotEmpty()
  @IsString()
  bannerImageDesktop!: string;

  @ApiProperty({ example: "https://assets.anuprerna.com/blogs/handloom-mobile.jpg", description: "Banner image URL for mobile view" })
  @IsNotEmpty()
  @IsString()
  bannerImageMobile!: string;

  @ApiPropertyOptional({ example: "https://assets.anuprerna.com/blogs/handloom-parallax.jpg", description: "Parallax background image URL" })
  @IsOptional()
  @IsString()
  bannerImageParallax?: string;

  @ApiPropertyOptional({ example: "Handloom Heritage", description: "Text overlay for parallax banner" })
  @IsOptional()
  @IsString()
  parallaxText?: string;

  @ApiPropertyOptional({ example: "art-of-handloom-weaving-bengal", description: "Custom URL slug" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 1, description: "Previous blog post ID for pagination" })
  @IsOptional()
  @IsNumber()
  previousBlog?: number;

  @ApiPropertyOptional({ example: 3, description: "Next blog post ID for pagination" })
  @IsOptional()
  @IsNumber()
  nextBlog?: number;

  @ApiProperty({ example: 1, description: "Author / artisan profile identifier" })
  @IsNotEmpty()
  @IsNumber()
  authorId!: number;

  @ApiProperty({ example: "Handloom Weaving Traditions in Bengal | Anuprerna", description: "SEO meta title" })
  @IsNotEmpty()
  @IsString()
  metaTitle!: string;

  @ApiProperty({ example: "Discover the sustainable craft of authentic handloom weaving in Bengal.", description: "SEO meta description" })
  @IsNotEmpty()
  @IsString()
  metaDescription!: string;

  @ApiProperty({ example: "Handloom weaver crafting artisanal fabric", description: "Alt text for desktop banner" })
  @IsNotEmpty()
  @IsString()
  bannerImageAlt!: string;

  @ApiPropertyOptional({ example: "Artisanal textile textures", description: "Alt text for parallax banner" })
  @IsOptional()
  @IsString()
  bannerImageParallaxAlt?: string;

  @ApiPropertyOptional({ example: "/blog/handloom-weaving", description: "Legacy URL link" })
  @IsOptional()
  @IsString()
  backwardCompatibleLink?: string;
}

export class UpdateBlogContentDto extends CreateBlogContentDto {
  @ApiProperty({ example: 1, description: "Blog content unique identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;
}

export class CreateBlogSectionDto {
  @ApiProperty({ example: 1, description: "Associated blog content identifier" })
  @IsNotEmpty()
  @IsNumber()
  blogContentId!: number;

  @ApiProperty({ example: "Traditional Loom Techniques", description: "Section heading title" })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: "The wooden pit looms have remained virtually unchanged for generations...", description: "Section body text" })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: "https://assets.anuprerna.com/blogs/loom-section.jpg", description: "Section image URL" })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: "Artisan adjusting the warp on a pit loom", description: "Section image alt text" })
  @IsOptional()
  @IsString()
  imageAlt?: string;

  @ApiPropertyOptional({ example: "LEFT", description: "Image alignment position (e.g. LEFT, RIGHT, CENTER)" })
  @IsOptional()
  @IsString()
  imagePosition?: string;

  @ApiProperty({ example: 1, description: "Display sort sequence order" })
  @IsNotEmpty()
  @IsNumber()
  sequence!: number;
}

export class UpdateBlogSectionDto extends CreateBlogSectionDto {
  @ApiProperty({ example: 1, description: "Blog section unique identifier" })
  @IsNotEmpty()
  @IsNumber()
  id!: number;
}
