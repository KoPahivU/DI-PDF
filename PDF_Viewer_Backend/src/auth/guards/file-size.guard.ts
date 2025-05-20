import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileSizeGuard implements CanActivate {
  constructor(private readonly maxTotalSize: number) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const file: Express.Multer.File = request.file;

    if (!file) return true;

    const totalSize = file.size;
    if (totalSize > this.maxTotalSize) {
      return false;
    }
    return true;
  }
}
