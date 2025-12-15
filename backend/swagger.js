import express from 'express';
import swaggerUi from 'swagger-ui-express';
const router = express.Router();

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RobEurope API',
    version: '1.0.0',
    description: 'API documentation for the RobEurope backend. This documentation includes two example endpoints: GET /health and POST /auth/login. All descriptions are written in English.'
  },
  servers: [
    { url: 'http://localhost:85/api', description: 'Local development server' },
    { url: 'https://api.robeurope.samuelponce.es/api', description: 'Remote test server' }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate a user and receive a JWT token. Provide email and password in the request body.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', description: 'User email address' },
                  password: { type: 'string', description: 'Plain text password' }
                },
                required: ['email','password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful authentication',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', description: "JWT token. Use as 'Authorization: Bearer <token>'" },
                    user: { type: 'object', description: 'Authenticated user object' }
                  }
                }
              }
            }
          },
          '400': { description: 'Bad request - validation failed' },
          '401': { description: 'Unauthorized - invalid credentials' }
        }
      }
    }
    ,
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        description: 'Create a new user account and return a JWT token. The successful response may include a token that Swagger UI will capture and set automatically.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' }
                },
                required: ['username','email','password']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Registered and token returned (if implemented)' },
          '400': { description: 'Validation error' }
        }
      }
    }
    ,
    '/countries': {
      get: { summary: 'List countries', responses: { '200': { description: 'List of countries', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Country' } } } } } } },
      post: { summary: 'Create country', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CountryCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/notifications/push/vapidPublicKey': {
      get: {
        summary: 'Get VAPID public key',
        description: 'Returns the application VAPID public key used for Web Push subscriptions.',
        responses: { '200': { description: 'Public key', content: { 'application/json': { schema: { type: 'object', properties: { publicKey: { type: 'string' } } } } } } }
      }
    },
    '/notifications/push/subscribe': {
      post: {
        summary: 'Subscribe to push notifications',
        description: 'Stores a Web Push subscription for the current authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  subscription: {
                    type: 'object',
                    description: 'The PushSubscription JSON per W3C spec',
                  },
                },
                required: ['subscription']
              }
            }
          }
        },
        responses: { '201': { description: 'Subscription saved' }, '400': { description: 'Invalid subscription' } }
      }
    },
    '/notifications/push/unsubscribe': {
      post: {
        summary: 'Unsubscribe from push notifications',
        description: 'Removes a stored Web Push subscription for the current authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string', description: 'Subscription endpoint to remove' }
                },
                required: ['endpoint']
              }
            }
          }
        },
        responses: { '200': { description: 'Unsubscribed' }, '404': { description: 'Subscription not found' } }
      }
    },
    '/notifications/push/test': {
      post: {
        summary: 'Send test push',
        description: 'Sends a test Web Push notification to the current user’s active subscriptions.',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } } } },
        responses: { '200': { description: 'Test sent (or queued)' } }
      }
    },
    '/countries/{id}': {
      get: { summary: 'Get country by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Country', content: { 'application/json': { schema: { $ref: '#/components/schemas/Country' } } } } } },
      put: { summary: 'Update country', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CountryCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete country', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/users': {
      get: { summary: 'List users', responses: { '200': { description: 'List of users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } } },
      post: { summary: 'Create user', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/users/{id}': {
      get: { summary: 'Get user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } } },
      put: { summary: 'Update user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/streams': {
      get: { summary: 'List streams', responses: { '200': { description: 'Streams list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Stream' } } } } } } },
      post: { summary: 'Create stream', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StreamCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/streams/{id}': {
      get: { summary: 'Get stream', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Stream', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stream' } } } } } },
      put: { summary: 'Update stream', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StreamCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete stream', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/competitions': {
      get: { summary: 'List competitions', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Competition' } } } } } } },
      post: { summary: 'Create competition', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompetitionCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/competitions/{id}': {
      get: { summary: 'Get competition', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Competition', content: { 'application/json': { schema: { $ref: '#/components/schemas/Competition' } } } } } },
      put: { summary: 'Update competition', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CompetitionCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete competition', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/posts': {
      get: { summary: 'List posts', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Post' } } } } } } },
      post: { summary: 'Create post', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PostCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/posts/{id}': {
      get: { summary: 'Get post', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Post', content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } } } } },
      put: { summary: 'Update post', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/PostCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete post', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/posts/{id}/like': {
      post: { summary: 'Toggle like on post', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Liked/Unliked' }, '404': { description: 'Post not found' } } }
    },
    '/posts/{id}/comments': {
      get: { summary: 'List comments for post', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'List of comments', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
      post: { summary: 'Add comment to post', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] } } } }, responses: { '201': { description: 'Comment added' }, '404': { description: 'Post not found' } } }
    },
    '/posts/{id}/pin': {
      post: { summary: 'Toggle pin on post (super admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Pinned/Unpinned' }, '403': { description: 'Requires super_admin' }, '404': { description: 'Post not found' } } }
    },
    '/notifications': {
      get: { summary: 'List notifications', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } } } } } },
      post: { summary: 'Create notification', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/notifications/{id}': {
      get: { summary: 'Get notification', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Notification', content: { 'application/json': { schema: { $ref: '#/components/schemas/Notification' } } } } } },
      put: { summary: 'Update notification', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete notification', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/media': {
      get: { summary: 'List media (auth required)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
      post: {
        summary: 'Upload media (auth required)',
        description: 'Uploads a media file. Use multipart/form-data with a file field named "file". Returns created media metadata including URL.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                },
                required: ['file']
              }
            }
          }
        },
        responses: { '201': { description: 'Uploaded' }, '400': { description: 'Validation error' } }
      }
    },
    '/media/{id}': {
      get: { summary: 'Get media by id (auth required)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Media item' }, '404': { description: 'Not found' } } },
      delete: { summary: 'Delete media (auth required)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } } }
    },
    '/system-logs': {
      get: {
        summary: 'List system logs (super admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'user_id', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entity_type', in: 'query', schema: { type: 'string' } },
          { name: 'entity_id', in: 'query', schema: { type: 'string' } },
          { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'created_at' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['ASC','DESC'], default: 'DESC' } }
        ],
        responses: {
          '200': {
            description: 'Logs with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: { type: 'array', items: { type: 'object' } },
                    pagination: {
                      type: 'object',
                      properties: { total: { type: 'integer' }, limit: { type: 'integer' }, offset: { type: 'integer' }, hasMore: { type: 'boolean' } }
                    }
                  }
                }
              }
            }
          },
          '403': { description: 'Requires super_admin' }
        }
      }
    },
    '/system-logs/stats': {
      get: {
        summary: 'System statistics (super admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date-time' } }
        ],
        responses: {
          '200': { description: 'Aggregated stats', content: { 'application/json': { schema: { type: 'object', properties: { actionStats: { type: 'array', items: { type: 'object' } }, entityStats: { type: 'array', items: { type: 'object' } }, dailyStats: { type: 'array', items: { type: 'object' } }, userStats: { type: 'array', items: { type: 'object' } } } } } } },
          '403': { description: 'Requires super_admin' }
        }
      }
    },
    '/system-logs/{id}': {
      get: { summary: 'Get system log by id (super admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Log entry' }, '404': { description: 'Not found' }, '403': { description: 'Requires super_admin' } } }
    },
    '/system-logs/cleanup': {
      delete: { summary: 'Delete old logs (super admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'days_old', in: 'query', schema: { type: 'integer', default: 90 } }], responses: { '200': { description: 'Cleanup result' }, '403': { description: 'Requires super_admin' } } }
    },
    '/robot-files': {
      get: { summary: 'List robot files', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of files', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
      post: {
        summary: 'Upload robot file',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] }
            }
          }
        },
        responses: { '201': { description: 'Uploaded' } }
      }
    },
    '/robot-files/{id}': {
      delete: { summary: 'Delete robot file', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } } }
    },
    '/robot-files/{id}/visibility': {
      put: { summary: 'Toggle file visibility', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Visibility updated' }, '404': { description: 'Not found' } } }
    },
    '/team-logs': {
      get: { summary: 'List team logs', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
      post: { summary: 'Create team log entry', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/team-logs/{id}': {
      delete: { summary: 'Delete team log', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } } }
    },
    '/whoami': {
      get: { summary: 'Current authenticated user', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Session info', content: { 'application/json': { schema: { type: 'object', properties: { user: { type: 'object', nullable: true } } } } } } } }
    },
    '/registrations': {
      get: { summary: 'List registrations', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Registration' } } } } } } },
      post: { summary: 'Create registration', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrationCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/registrations/{id}': {
      get: { summary: 'Get registration', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Registration', content: { 'application/json': { schema: { $ref: '#/components/schemas/Registration' } } } } } },
      put: { summary: 'Update registration', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrationCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete registration', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/registrations/{id}/approve': {
      post: {
        summary: 'Approve registration (admin)',
        description: 'Marks a pending team competition registration as approved. Optionally include a decision_reason for audit/message.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { decision_reason: { type: 'string', nullable: true } } } } } },
        responses: { '200': { description: 'Approved' }, '400': { description: 'Not pending / validation error' }, '403': { description: 'Forbidden (requires admin)' }, '404': { description: 'Registration not found' } }
      }
    },
    '/registrations/{id}/reject': {
      post: {
        summary: 'Reject registration (admin)',
        description: 'Marks a pending team competition registration as rejected with a mandatory decision_reason explaining why.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { decision_reason: { type: 'string' } }, required: ['decision_reason'] } } } },
        responses: { '200': { description: 'Rejected' }, '400': { description: 'Not pending / validation error' }, '403': { description: 'Forbidden (requires admin)' }, '404': { description: 'Registration not found' } }
      }
    },
    '/sponsors': {
      get: { summary: 'List sponsors', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Sponsor' } } } } } } },
      post: { summary: 'Create sponsor', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SponsorCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/sponsors/{id}': {
      get: { summary: 'Get sponsor', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Sponsor', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sponsor' } } } } } },
      put: { summary: 'Update sponsor', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/SponsorCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete sponsor', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/teams': {
      get: { summary: 'List teams', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } } } },
      post: { summary: 'Create team', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/teams/{id}': {
      get: { summary: 'Get team', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Team', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } } } },
      put: { summary: 'Update team', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete team', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    },
    '/teams/{teamId}/messages': {
      get: { summary: 'Get team chat messages', security: [{ bearerAuth: [] }], parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'List of messages', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
      post: {
        summary: 'Send team chat message',
        description: 'Sends a message to the team chat. Supports file attachments via multipart/form-data with an array field named "files".',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  files: { type: 'array', items: { type: 'string', format: 'binary' } }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Message sent' } }
      }
    },
    '/teams/mine': {
      get: { summary: 'Get my team (owner)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Owned team (if any)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } }, '404': { description: 'No team owned' } } }
    },
    '/teams/status': {
      get: { summary: 'Get membership status', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Membership status', content: { 'application/json': { schema: { type: 'object', properties: { ownedTeamId: { type: 'integer', nullable: true }, memberOfTeamId: { type: 'integer', nullable: true } } } } } } } }
    },
    '/teams/leave': {
      post: { summary: 'Leave current team (non-owner)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Left team' }, '400': { description: 'Owner cannot leave or not a member' } } }
    },
    '/teams/{id}/invite': {
      post: {
        summary: 'Invite a user to team',
        description: 'Invite by username or email. If the email does not correspond to a user, a token email can be sent if email service is configured.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, email: { type: 'string', format: 'email' } } } } } },
        responses: { '201': { description: 'Invitation created/sent' }, '400': { description: 'Validation error' }, '403': { description: 'Only owner can invite' } }
      }
    },
    '/teams/invitations/accept': {
      post: {
        summary: 'Accept team invitation',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } }, required: ['token'] } } } },
        responses: { '200': { description: 'Joined team' }, '400': { description: 'Invalid token' } }
      }
    },
    '/teams/{id}/requests': {
      get: { summary: 'List join requests (owner)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, user_id: { type: 'string' }, status: { type: 'string' }, user_username: { type: 'string', nullable: true }, user_email: { type: 'string', nullable: true }, user_name: { type: 'string', nullable: true } } } } } } } },
      post: { summary: 'Request to join a team', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Request created' } } }
    },
    '/teams/requests/{requestId}/approve': {
      post: { summary: 'Approve a join request (owner)', security: [{ bearerAuth: [] }], parameters: [{ name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Approved' }, '403': { description: 'Forbidden' } } }
    },
    '/team-members': {
      get: { summary: 'List team members', responses: { '200': { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } } } } } } },
      post: { summary: 'Create team member', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamMemberCreate' } } } }, responses: { '201': { description: 'Created' } } }
    },
    '/team-members/{id}': {
      get: { summary: 'Get team member', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'TeamMember', content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamMember' } } } } } },
      put: { summary: 'Update team member', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamMemberCreate' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Delete team member', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } }
    }
  }
  ,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Country: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, code: { type: 'string' }, flag_emoji: { type: 'string' } } },
      CountryCreate: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' }, flag_emoji: { type: 'string' } }, required: ['name','code'] },
      User: { type: 'object', properties: { id: { type: 'string' }, username: { type: 'string' }, email: { type: 'string' }, bio: { type: 'string' } } },
      UserCreate: { type: 'object', properties: { username: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, bio: { type: 'string' } }, required: ['username','email','password'] },
      Stream: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, platform: { type: 'string' }, stream_url: { type: 'string', description: 'Visible only to approved users' } } },
      StreamCreate: { type: 'object', properties: { title: { type: 'string' }, platform: { type: 'string' }, stream_url: { type: 'string' } }, required: ['title'] },
      Competition: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, slug: { type: 'string' }, description: { type: 'string' }, status: { type: 'string', enum: ['draft', 'published', 'archived'] }, location: { type: 'string' }, max_teams: { type: 'integer' }, is_active: { type: 'boolean' }, is_approved: { type: 'boolean' } } },
      CompetitionCreate: { type: 'object', properties: { title: { type: 'string' }, slug: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' }, location: { type: 'string' }, max_teams: { type: 'integer' }, is_active: { type: 'boolean' } }, required: ['title'] },
      Post: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' } } },
      PostCreate: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, author_id: { type: 'string' } }, required: ['title','content'] },
      Notification: { type: 'object', properties: { id: { type: 'string' }, user_id: { type: 'string' }, title: { type: 'string' }, message: { type: 'string' }, type: { type: 'string' } } },
      NotificationCreate: { type: 'object', properties: { user_id: { type: 'string' }, title: { type: 'string' }, message: { type: 'string' }, type: { type: 'string' } }, required: ['user_id','title','message','type'] },
  Registration: { type: 'object', properties: { id: { type: 'string' }, team_id: { type: 'string' }, competition_id: { type: 'string' }, status: { type: 'string', enum: ['pending','approved','rejected'] }, decision_reason: { type: 'string', nullable: true } } },
  RegistrationCreate: { type: 'object', properties: { team_id: { type: 'string' }, competition_id: { type: 'string' } }, required: ['team_id','competition_id'] },
      Sponsor: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, logo_url: { type: 'string' } } },
      SponsorCreate: { type: 'object', properties: { name: { type: 'string' }, logo_url: { type: 'string' }, website_url: { type: 'string' } }, required: ['name'] },
      Team: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, country_id: { type: 'string' }, description: { type: 'string' }, website_url: { type: 'string' }, stream_url: { type: 'string' } } },
      TeamCreate: { type: 'object', properties: { name: { type: 'string' }, country_id: { type: 'string' }, created_by_user_id: { type: 'string' }, description: { type: 'string' }, website_url: { type: 'string' }, stream_url: { type: 'string' } }, required: ['name'] },
      TeamMember: { type: 'object', properties: { id: { type: 'string' }, team_id: { type: 'string' }, user_id: { type: 'string' }, role: { type: 'string' } } },
      TeamMemberCreate: { type: 'object', properties: { team_id: { type: 'string' }, user_id: { type: 'string' }, role: { type: 'string' } }, required: ['team_id','user_id','role'] }
    }
  }
}
}

// Serve the raw spec at /api-docs/swagger.json
router.get('/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

// Also expose a standard Swagger UI (no custom JS) at /api-docs/simple for quick troubleshooting
router.use('/simple', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve a custom Swagger UI page that populates Bearer automatically after register
router.get('/', (req, res) => {
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>RobEurope API Docs</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.18.3/swagger-ui.css" />
      <style>body{margin:0;padding:0}#swagger-ui{height:100vh}</style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.18.3/swagger-ui-bundle.js"></script>
      <script>
        // Wrap fetch so we can capture responses and detect register success
        (function(){
          const originalFetch = window.fetch.bind(window);
          window.fetch = function(input, init){
            return originalFetch(input, init).then(async res => {
              try{
                const url = (typeof input === 'string') ? input : (input && input.url) || '';
                // if registration endpoint returns a token, extract it and set Authorization
                if (url.endsWith('/api/auth/register') || url.endsWith('/auth/register')){
                  const clone = res.clone();
                  const data = await clone.json().catch(()=>null);
                  if (data && data.token){
                    const bearer = 'Bearer ' + data.token;
                    localStorage.setItem('swaggerBearer', bearer);
                    // if swagger UI instance available, programmatically authorize
                    if (window.ui && window.ui.authActions && window.ui.authActions.authorize){
                      try{ window.ui.authActions.authorize({ bearerAuth: { name: 'bearerAuth', schema: { type: 'http' }, value: bearer } }); }catch(e){}
                    }
                    // small visual cue
                    console.info('Swagger: stored bearer token from register response');
                  }
                }
              }catch(e){ console.warn('register capture', e); }
              return res;
            });
          };
        })();

        window.onload = () => {
          const ui = SwaggerUIBundle({
            url: window.location.origin + '/api-docs/swagger.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
            layout: 'BaseLayout',
            docExpansion: 'none',
            requestInterceptor: (req) => {
              const bearer = localStorage.getItem('swaggerBearer');
              if (bearer) req.headers['Authorization'] = bearer;
              return req;
            }
          });
          window.ui = ui;
        };
      </script>
    </body>
  </html>`;
  res.type('html').send(html);
});

export default router;
