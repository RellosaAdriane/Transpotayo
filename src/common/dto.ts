import { Transform, Type } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

export const WhenProvided = () => ValidateIf((_object, value) => value !== undefined);
export const Trim = () => Transform(({ value }) => typeof value === 'string' ? value.trim() : value);

export class PageQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(1000000)
  page = 1;

  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 20;

  get offset() { return (this.page - 1) * this.pageSize; }
}

export function pageResult<T>([items, total]: [T[], number], query: PageQuery) {
  return { items, total, page: query.page, pageSize: query.pageSize };
}
