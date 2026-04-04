import prisma from '../lib/prisma.js';

/**
 * @fileoverview
 * System logging utility for audit trails and activity tracking.
 * @module utils/systemLogger
 */

class SystemLogger {
  static async log(logData, req = null) {
    try {
      const logEntry = {
        action: logData.action,
        entity_type: logData.entity_type,
        entity_id: logData.entity_id?.toString() ?? null,
        old_values: logData.old_values ?? null,
        new_values: logData.new_values ?? null,
        details: logData.details ?? null,
        user_id: null,
        ip_address: null,
        user_agent: null,
      };

      if (req) {
        if (req.user?.id) logEntry.user_id = req.user.id;

        let ip =
          req.ip ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          'unknown';
        if (ip?.startsWith('::ffff:')) ip = ip.substring(7);
        logEntry.ip_address = ip;
        logEntry.user_agent = req.get('User-Agent') ?? null;
      }

      await prisma.systemLog.create({ data: logEntry });
    } catch (error) {
      console.error('Failed to create system log:', error);
    }
  }

  static async logAuth(action, userId, req = null, details = null) {
    await this.log({ action, entity_type: 'User', entity_id: userId, details }, req);
  }

  static async logCreate(entityType, entityId, newValues, req = null, details = null) {
    await this.log({ action: 'CREATE', entity_type: entityType, entity_id: entityId, new_values: newValues, details }, req);
  }

  static async logUpdate(entityType, entityId, oldValues, newValues, req = null, details = null) {
    await this.log({ action: 'UPDATE', entity_type: entityType, entity_id: entityId, old_values: oldValues, new_values: newValues, details }, req);
  }

  static async logDelete(entityType, entityId, oldValues = null, req = null, details = null) {
    await this.log({ action: 'DELETE', entity_type: entityType, entity_id: entityId, old_values: oldValues, details }, req);
  }

  static async logUpload(entityType, entityId, fileInfo, req = null, details = null) {
    await this.log({ action: 'UPLOAD', entity_type: entityType, entity_id: entityId, new_values: { file: fileInfo }, details }, req);
  }

  static async logSystem(action, entityType, entityId = null, details = null) {
    await this.log({ action, entity_type: entityType, entity_id: entityId, details });
  }
}

export default SystemLogger;
