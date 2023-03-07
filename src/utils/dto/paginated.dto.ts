import { ApiOkResponse, ApiProperty, ApiResponseOptions, getSchemaPath } from '@nestjs/swagger';
import { applyDecorators, Type } from '@nestjs/common';
// import { Type } from 'class-transformer';

export class MetaDTO {
  @ApiProperty()
  total: number;

  @ApiProperty()
  perPage: number;

  @ApiProperty()
  page: number;
}

export class PaginatedDto<TData> {
  @ApiProperty()
  meta: MetaDTO;

  data: TData[];
}

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel, options?: ApiResponseOptions) => {
  return applyDecorators(
    ApiOkResponse({
      ...options,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              results: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
