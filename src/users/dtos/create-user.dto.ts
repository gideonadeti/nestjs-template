import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateUserDto {
  /** The Clerk user ID
   * @example 'user_123'
   */
  @IsString()
  @IsNotEmpty()
  id: string;

  /** User's email address
   * @example 'john.doe@example.com'
   */
  @IsEmail()
  email: string;

  /** User's display name
   * @example 'John Doe'
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}
