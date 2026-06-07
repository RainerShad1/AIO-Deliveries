import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() productId: string;
  @IsInt() @Min(1) cantidad: number;
}

export class CreateOrderDto {
  // Slug del negocio al que se le hace el pedido (carrito = un solo negocio).
  @IsString() business: string;

  @IsString() addressId: string;

  @IsOptional() @IsString() nota?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
