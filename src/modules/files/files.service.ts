import { Injectable } from '@nestjs/common';
import { FileResponse } from './dto/file.response';
import * as moment from 'moment';
import * as sharp from 'sharp';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';

import { MFile } from './mfile.class';

const DEFAULT_IMAGE_HEIGHT = 1024;

@Injectable()
export class FilesService {
  async saveImage(files: MFile[], type: string): Promise<FileResponse[]> {
    const res: FileResponse[] = [];

    if (type === 'operator' || type === 'doctor') {
      await ensureDir(`${path}/uploads`);
      for (const file of files) {
        await writeFile(`${path}/${file.originalname}`, file.buffer);
        res.push({
          url: `/${file.originalname}`,
          name: file.originalname,
        });
      }
      return res;
    }

    if (type === 'image') {
      await ensureDir(`${path}/uploads/`);
      for (const file of files) {
        await writeFile(`${path}/uploads/${file.originalname}`, file.buffer);
        res.push({
          url: `${file.originalname}`,
          name: file.originalname,
        });
      }
      return res;
    }
  }

  convertToWebP(
    file: Buffer,
    width?: number,
    height = DEFAULT_IMAGE_HEIGHT,
  ): Promise<Buffer> {
    if (width && height) {
      return sharp(file).resize({ width, height }).webp().toBuffer();
    }
    return sharp(file).resize({ height }).webp().toBuffer();
  }
}
