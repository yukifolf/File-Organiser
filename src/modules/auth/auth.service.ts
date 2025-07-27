import {
    ConflictException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { config } from 'node-config-ts';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            this.logger.warn(`Login attempt with non-existing email: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            this.logger.warn(
                `Login attempt with invalid password for email: ${email}`,
            );
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log(`User logged in successfully: ${email}`);
        const token = await this.jwtService.signAsync({
            id: user.id,
            email: user.email,
        });
        return {
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                token,
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const { email, password, firstName, lastName } = registerDto;
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            this.logger.warn(
                `Registration attempt with existing email: ${email}`,
            );
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            hashLength: config.server.saltRounds,
        });

        const newUser = await this.usersService.createUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
        });

        this.logger.log(`User registered successfully: ${email}`);
        return {
            message: 'Registration successful',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
            },
        };
    }
}
