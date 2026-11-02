import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { AppRoles } from '../../auth/interfaces/app-roles';

export class UpdateUserRolesDto {
  @ApiProperty({
    enum: AppRoles,
    isArray: true,
    example: [AppRoles.CLIENT, AppRoles.PROVIDER],
    description: 'Lista de roles que se asignarán al usuario.',
  })
  @IsArray({ message: 'roles debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe asignar al menos un rol' })
  @IsEnum(AppRoles, {
    each: true,
    message: 'Cada rol debe ser ADMIN, PROVIDER o CLIENT',
  })
  readonly roles!: AppRoles[];
}
