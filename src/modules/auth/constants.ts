import { config } from 'node-config-ts';
export const jwtConstants = {
    secret: String(config.server.jwtSecret),
    expiresIn: String(config.server.jwtExpiresIn),
};
