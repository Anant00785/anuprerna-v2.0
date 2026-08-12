// @ts-nocheck
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { NavigationService } from "../service/navigation.service.js";

@Controller()
@ApiTags("Navigation")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get("/get/navigation")
  async fetchNavigation() {
    try {
      return await this.navigationService.prepareNavigationMenu();
    } catch (error) {
      console.warn("Navigation query failed; returning an empty menu.", error);
      return {};
    }
  }

  @Get("/get/navigation/fabric/craft")
  async fetchNavigationCraft() {
    return this.navigationService.fetchNavMenuCraftOptions();
  }

  @Get("/get/navigation/fabric/material")
  async fetchNavigationMaterial() {
    return this.navigationService.fetchNavMenuMaterialOptions();
  }

  @Get("/get/navigation/fabric/pattern")
  async fetchNavigationPattern() {
    return this.navigationService.fetchNavMenuPatternOptions();
  }

  @Get("/get/navigation/fabric/color")
  async fetchNavigationColor() {
    return this.navigationService.fetchNavMenuColorOptions();
  }

  @Get("/get/navigation/finished/:category")
  async fetchNavigationFinished(@Param("category") category: string) {
    return this.navigationService.fetchNavMenuFinishedOptions(category);
  }

  @Get("/get/navigation/story/:category")
  async fetchNavigationStory(@Param("category") category: string) {
    return this.navigationService.fetchNavMenuStoryOptions(category);
  }
}
// @ts-nocheck
