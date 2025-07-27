import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Mock the bcrypt library with a factory function to ensure it's not undefined
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

// Mock the node-config-ts library
jest.mock('node-config-ts', () => ({
    config: {
        server: {
            saltRounds: 10,
        },
    },
}));

// --- Mock Data ---
const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
};

const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
};

const mockRegisterDto: RegisterDto = {
    email: 'new@example.com',
    password: 'password123',
    passwordConfirmation: 'password123',
    firstName: 'Jane',
    lastName: 'Doe',
};

describe('AuthService', () => {
    let authService: AuthService;
    let usersService: jest.Mocked<UsersService>;

    const mockUsersServiceProvider = {
        provide: UsersService,
        useValue: {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService, mockUsersServiceProvider],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
    });

    describe('login', () => {
        it('should throw UnauthorizedException if user is not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            await expect(authService.login(mockLoginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            // Directly cast the mocked import to set its return value
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(authService.login(mockLoginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should return user data on successful login', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.login(mockLoginDto);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...userWithoutPassword } = mockUser;

            expect(result).toEqual({
                message: 'Login successful',
                user: userWithoutPassword,
            });
        });
    });

    describe('register', () => {
        it('should throw ConflictException if email already exists', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            await expect(authService.register(mockRegisterDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should create and return a new user on successful registration', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

            const createdUser: User = {
                id: 2,
                email: mockRegisterDto.email,
                password: 'newHashedPassword',
                firstName: mockRegisterDto.firstName,
                lastName: mockRegisterDto.lastName,
                isActive: true,
            };
            usersService.createUser.mockResolvedValue(createdUser);

            const result = await authService.register(mockRegisterDto);
            // The 'User' entity does not have 'passwordConfirmation', so we only destructure 'password'.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...userWithoutPassword } = createdUser;

            // This is a common false positive in Jest tests, so we disable the rule for this line.
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(usersService.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: mockRegisterDto.email,
                    password: 'newHashedPassword',
                }),
            );

            expect(result).toEqual({
                message: 'Registration successful',
                user: userWithoutPassword,
            });
        });
    });
});
