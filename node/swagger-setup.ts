import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

export function setupSwagger(app: express.Application) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'SimplerQMS API',
        version: '1.0.0',
        description: 'API for SimplerQMS User and Group Management System',
        contact: {
          name: 'API Support',
          email: 'support@simplerqms.com',
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
            required: ['name', 'email'],
            properties: {
              id: {
                type: 'integer',
                description: 'User ID',
              },
              name: {
                type: 'string',
                description: 'User name',
              },
              email: {
                type: 'string',
                description: 'User email',
              },
              type: {
                type: 'string',
                description: 'User type',
                enum: ['admin', 'regular'],
              },
            },
          },
          Group: {
            type: 'object',
            required: ['name'],
            properties: {
              id: {
                type: 'integer',
                description: 'Group ID',
              },
              name: {
                type: 'string',
                description: 'Group name',
              },
              parent_id: {
                type: 'integer',
                nullable: true,
                description: 'Parent group ID',
              },
            },
          },
          GroupMember: {
            type: 'object',
            required: ['group_id', 'member_id', 'member_type'],
            properties: {
              id: {
                type: 'integer',
                description: 'Group member ID',
              },
              group_id: {
                type: 'integer',
                description: 'Group ID',
              },
              member_id: {
                type: 'integer',
                description: 'Member ID (user or group)',
              },
              member_type: {
                type: 'string',
                description: 'Member type',
                enum: ['user', 'group'],
              },
            },
          },
          MembershipCheck: {
            type: 'object',
            required: ['memberId', 'memberType'],
            properties: {
              memberId: {
                type: 'integer',
                description: 'Member ID (user or group)',
              },
              memberType: {
                type: 'string',
                description: 'Member type',
                enum: ['user', 'group'],
              },
            },
          },
          MembershipResult: {
            type: 'object',
            properties: {
              isMember: {
                type: 'boolean',
                description: 'Whether the member is in the group hierarchy',
              },
            },
          },
          Member: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Member ID',
              },
              name: {
                type: 'string',
                description: 'Member name',
              },
              type: {
                type: 'string',
                description: 'Member type',
                enum: ['user', 'group'],
              },
            },
          },
          Error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Error message',
              },
            },
          },
        },
      },
    },
    apis: ['./routes/*.ts', './routes/*.swagger.ts'], // Path to the API routes and their Swagger docs
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
}
