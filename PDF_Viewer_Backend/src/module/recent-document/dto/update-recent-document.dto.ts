import { PartialType } from '@nestjs/mapped-types';
import { CreateRecentDocumentDto } from './create-recent-document.dto';

export class UpdateRecentDocumentDto extends PartialType(CreateRecentDocumentDto) {}
