import { IsNumber, IsString, Max, Min, MaxLength, MinLength } from 'class-validator';

// La direccion exige AMBOS: texto (por si el delivery no puede abrir el mapa)
// Y coordenadas (para que el delivery navegue al punto exacto). Asi se cubren
// los casos en que falta una u otra via.
export class AddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  etiqueta: string; // "Casa", "Trabajo"

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  direccion: string;

  // Coordenadas obligatorias y validadas dentro de rangos geograficos reales.
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
