import db from '../models/index.js';
const { SystemLog } = db;

/**
 * Utility class for system logging
 */
class SystemLogger {
  /**
   * Log a system operation
   * @param {Object} logData - Log data
   * @param {string} logData.action - Action type (CREATE, UPDATE, DELETE, etc.)
   * @param {string} logData.entity_type - Entity type (User, Team, Post, etc.)
   * @param {string|number} logData.entity_id - Entity ID
   * @param {Object} logData.old_values - Previous values (for UPDATE)
   * @param {Object} logData.new_values - New values (for CREATE/UPDATE)
   * @param {string} logData.details - Additional details
   * @param {Object} req - Express request object (optional, for extracting user/IP info)
   */
  static async log(logData, req = null) {
    try {
      const logEntry = {
        action: logData.action,
        entity_type: logData.entity_type,
        entity_id: logData.entity_id?.toString(),
        old_values: logData.old_values || null,
        new_values: logData.new_values || null,
        details: logData.details || null,
        user_id: null,
        ip_address: null,
        user_agent: null
      };

      // Extract user information from request if available
      if (req) {
        if (req.user && req.user.id) {
          logEntry.user_id = req.user.id;
        }

        // Get IP address
        logEntry.ip_address = req.ip ||
                             req.connection?.remoteAddress ||
                             req.socket?.remoteAddress ||
                             req.connection?.socket?.remoteAddress ||
                             'unknown';

        // Handle IPv4-mapped IPv6 addresses
        if (logEntry.ip_address && logEntry.ip_address.startsWith('::ffff:')) {
          logEntry.ip_address = logEntry.ip_address.substring(7);
        }

        // Get user agent
        logEntry.user_agent = req.get('User-Agent') || null;
      }

      await SystemLog.create(logEntry);
    } catch (error) {
      // Log the error but don't throw it to avoid breaking the main operation
      console.error('Failed to create system log:', error);
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(action, userId, req = null, details = null) {
    await this.log({
      action,
      entity_type: 'User',
      entity_id: userId,
      details
    }, req);
  }

  /**
   * Log entity creation
   */
  static async logCreate(entityType, entityId, newValues, req = null, details = null) {
    await this.log({
      action: 'CREATE',
      entity_type: entityType,
      entity_id: entityId,
      new_values: newValues,
      details
    }, req);
  }

  /**
   * Log entity update
   */
  static async logUpdate(entityType, entityId, oldValues, newValues, req = null, details = null) {
    await this.log({
      action: 'UPDATE',
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      details
    }, req);
  }

  /**
   * Log entity deletion
   */
  static async logDelete(entityType, entityId, oldValues = null, req = null, details = null) {
    await this.log({
      action: 'DELETE',
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      details
    }, req);
  }

  /**
   * Log file upload
   */
  static async logUpload(entityType, entityId, fileInfo, req = null, details = null) {
    await this.log({
      action: 'UPLOAD',
      entity_type: entityType,
      entity_id: entityId,
      new_values: { file: fileInfo },
      details
    }, req);
  }

  /**
   * Log system events (no user associated)
   */
  static async logSystem(action, entityType, entityId = null, details = null) {
    await this.log({
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  }
}

export default SystemLogger;