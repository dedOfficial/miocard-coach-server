import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BodyResponse } from './dto/body.response';
import { FileResponse } from './dto/file.response';
import { FilesService } from './files.service';
import { MFile } from './mfile.class';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  private readonly logger = new Logger(FilesController.name);

  @Post('upload')
  @UseGuards(new JwtAuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: BodyResponse,
  ): Promise<FileResponse[]> {
    const saveArray: MFile[] = [];

    try {
      // handling avatar
      if (body.type === 'operator' || body.type === 'doctor') {
        const buffer = await this.filesService.convertToWebP(
          file.buffer,
          150,
          150,
        );

        saveArray.push(
          new MFile({
            originalname: `${body.id.split('.')[0]}.webp`,
            buffer,
          }),
        );

        return this.filesService.saveImage(saveArray, body.type);
      }

      // handling image
      if (body.type === 'image') {
        const buffer = await this.filesService.convertToWebP(file.buffer);
        saveArray.push(
          new MFile({
            originalname: `${body.id.split('.')[0]}.webp`,
            buffer,
          }),
        );

        return this.filesService.saveImage(saveArray, body.type);
      }
    } catch (error) {
      this.logger.log(`Upload file error: ${error}`);

      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Error loading image',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
