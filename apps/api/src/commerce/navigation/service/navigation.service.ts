import { Injectable } from "@nestjs/common";
import { NavigationRepository } from "../repository/navigation.repository.js";
import {
  NavigationMenu,
  NavMenuCraft,
  NavMenuCraftOption,
  NavMenuFinished,
  NavMenuFinishedOption,
  NavMenuStory,
  NavMenuStoryOption
} from "../types/navigation.types.js";
import { keyedResponse } from "../../../common/response/rain-response.js";

@Injectable()
export class NavigationService {
  constructor(private readonly navigationRepository: NavigationRepository) {}

  async prepareNavigationMenu() {
    const contents = await this.navigationRepository.retrieveStoryContents();
    const finishedProducts = await this.navigationRepository.fetchProductPreviewForNavigation("finished");
    const fabricProducts = await this.navigationRepository.fetchProductPreviewForNavigation("fabric");

    const menu: NavigationMenu = {
      contents,
      finishedProducts,
      fabricProducts
    };

    return keyedResponse("entity", menu);
  }

  async fetchNavMenuCraftOptions() {
    const results = await this.navigationRepository.findNavMenuCraftMapping();

    const groupedBySegment = new Map<number, typeof results>();
    for (const res of results) {
      if (!groupedBySegment.has(res.segmentCategoryId)) {
        groupedBySegment.set(res.segmentCategoryId, []);
      }
      groupedBySegment.get(res.segmentCategoryId)!.push(res);
    }

    const menuItems: NavMenuCraft[] = [];
    for (const [segmentCategoryId, segmentResults] of groupedBySegment.entries()) {
      const options: NavMenuCraftOption[] = segmentResults.map(r => ({
        id: r.subCategoryId,
        subCategoryName: r.subCategoryName
      }));

      menuItems.push({
        id: segmentCategoryId,
        segmentCategoryName: segmentResults[0].segmentCategoryName,
        optionList: options
      });
    }

    return keyedResponse("entity", menuItems);
  }

  async fetchNavMenuMaterialOptions() {
    const results = await this.navigationRepository.findNavMenuMaterialMapping();
    return keyedResponse("entity", results);
  }

  async fetchNavMenuPatternOptions() {
    const results = await this.navigationRepository.findNavMenuPatternMapping();
    return keyedResponse("entity", results);
  }

  async fetchNavMenuColorOptions() {
    const results = await this.navigationRepository.findNavMenuColorMapping();
    return keyedResponse("entity", results);
  }

  async fetchNavMenuFinishedOptions(category: string) {
    const results = await this.navigationRepository.findNavMenuFinishedMapping(category);

    const groupedBySegment = new Map<number, typeof results>();
    for (const res of results) {
      if (!groupedBySegment.has(res.segmentCategoryId)) {
        groupedBySegment.set(res.segmentCategoryId, []);
      }
      groupedBySegment.get(res.segmentCategoryId)!.push(res);
    }

    const menuItems: NavMenuFinished[] = [];
    for (const [segmentCategoryId, segmentResults] of groupedBySegment.entries()) {
      const options: NavMenuFinishedOption[] = segmentResults.map(r => ({
        id: r.subCategoryId,
        subCategoryName: r.subCategoryName,
        subCategoryFeaturedImage: r.subCategoryFeaturedImage
      }));

      menuItems.push({
        id: segmentCategoryId,
        segmentCategoryName: segmentResults[0].segmentCategoryName,
        optionList: options
      });
    }

    return keyedResponse("entity", menuItems);
  }

  async fetchNavMenuStoryOptions(category: string) {
    const results = await this.navigationRepository.findNavMenuStoryMapping(category);

    const groupedBySegment = new Map<number, typeof results>();
    for (const res of results) {
      if (!groupedBySegment.has(res.storyCategoryId)) {
        groupedBySegment.set(res.storyCategoryId, []);
      }
      groupedBySegment.get(res.storyCategoryId)!.push(res);
    }

    const menuItems: NavMenuStory[] = [];
    for (const [storyCategoryId, storyResults] of groupedBySegment.entries()) {
      const options: NavMenuStoryOption[] = storyResults.map(r => ({
        storyId: r.storyId,
        storyTitle: r.storyTitle,
        slug: r.slug,
        bannerImage: r.bannerImage
      }));

      menuItems.push({
        storyCategoryId,
        storyCategoryName: storyResults[0].storyCategoryName,
        optionList: options
      });
    }

    return keyedResponse("entity", menuItems);
  }
}
