// @ts-nocheck
import { Controller, Post, Body } from '@nestjs/common';
import { MiscService } from '../service/misc.service.js';
import { parseContactUsData } from '../types/misc.types.js';
import { simpleResponse } from '../../../common/response/rain-response.js';

@Controller('submit')
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Post('contact-us')
  async submitContactUs(@Body() body: any) {
    try {
      const parsedData = parseContactUsData(body);
      
      const success = await this.miscService.processContactUs(parsedData);
      
      if (!success) {
        return simpleResponse(false, 'Failed to process submission. Please try again.');
      }

      return simpleResponse(true, 'Form submitted successfully!');
    } catch (error: any) {
      return simpleResponse(false, 'Fill up all necessary fields!');
    }
  }
}
// @ts-nocheck
