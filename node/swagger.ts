import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';
import type { Options } from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simpler QMS API',
      version: '1.0.0',
      description: 'API documentation for Simple RQMS',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            groupId: { type: 'integer', nullable: true },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            parentId: { type: 'integer', nullable: true },
          },
        },
        GroupMember: {
          type: 'object',
          properties: {
            groupId: { type: 'integer' },
            userId: { type: 'integer' },
          },
        },
        MembershipCheck: {
          type: 'object',
          properties: {
            userId: { type: 'integer' },
            groupId: { type: 'integer' },
          },
        },
        MembershipResult: {
          type: 'object',
          properties: {
            isMember: { type: 'boolean' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [], // We'll populate this dynamically
};

export async function getSpecs() {
  try {
    // Find all swagger files
    const swaggerFiles = await glob('**/*.swagger.ts', { cwd: __dirname });
    options.apis = swaggerFiles.map((file: string) => join(__dirname, file));

    const swaggerJsdoc = await import('swagger-jsdoc');
    return swaggerJsdoc.default(options);
  } catch (error) {
    console.error('Failed to load swagger-jsdoc:', error);
    return {};
  }
}
