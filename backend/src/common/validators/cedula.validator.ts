import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Valida cedula dominicana (11 digitos) usando el algoritmo
 * de digito verificador de la JCE (Luhn modificado).
 */
@ValidatorConstraint({ name: 'isCedulaDominicana', async: false })
export class IsCedulaDominicanaConstraint
  implements ValidatorConstraintInterface
{
  validate(cedula: string): boolean {
    if (!cedula) return false;
    const clean = cedula.replace(/-/g, '');
    if (!/^\d{11}$/.test(clean)) return false;

    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let prod = parseInt(clean[i], 10) * weights[i];
      if (prod >= 10) prod -= 9; // suma de digitos
      sum += prod;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(clean[10], 10);
  }

  defaultMessage(): string {
    return 'La cedula no tiene un formato dominicano valido';
  }
}

export function IsCedulaDominicana(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsCedulaDominicanaConstraint,
    });
  };
}
