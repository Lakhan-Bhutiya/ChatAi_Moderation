import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
    @ApiProperty({
        example: 'coolUser123',
        description: 'Unique username for the new account',
        minLength: 3,
        maxLength: 20
    })
    username: string;

    @ApiProperty({
        example: 'securePass!',
        description: 'Strong password for encryption',
        minLength: 6
    })
    password: string;
}

export class LoginDto {
    @ApiProperty({
        example: 'coolUser123',
        description: 'Your registered username'
    })
    username: string;

    @ApiProperty({
        example: 'securePass!',
        description: 'Your password'
    })
    password: string;
}
