import db from '../models/index.js';
const { SystemLog } = db;

/**
 * @fileoverview
 * System logging utility for audit trails and activity tracking.
 * Captures user actions, IP addresses, and user agents for security monitoring.
 * @module utils/systemLogger
 */

/**
 * @typedef {Object} LogData
 * @property {string} action - The action performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN').
 * @property {string} entity_type - The type of entity affected (e.g., 'User', 'Team', 'Competition').
 * @property {string|number} [entity_id] - The ID of the affected entity.
 * @property {Object} [old_values] - Previous values before the change.
 * @property {Object} [new_values] - New values after the change.
 * @property {string} [details] - Additional details about the action.
 */

/**
 * Utility class for system-wide audit logging.
 * Provides static methods for logging various types of system events.
 * @class SystemLogger
 */
class SystemLogger {

  /**
   * Creates a system log entry with optional request context.
   * Extracts user ID, IP address, and user agent from the request object.
   * @static
   * @async
   * @param {LogData} logData - The log data to record.
   * @param {Express.Request} [req=null] - Express request object for extracting user context.
   * @returns {Promise<void>}
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
   * Logs user authentication events (login, logout, password reset).
   * @static
   * @async
   * @param {string} action - The authentication action (e.g., 'LOGIN', 'LOGOUT', 'PASSWORD_RESET').
   * @param {string} userId - The ID of the user performing the action.
   * @param {Express.Request} [req=null] - Express request object.
   * @param {string} [details=null] - Additional details about the auth event.
   * @returns {Promise<void>}
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
   * Logs entity creation events.
   * @static
   * @async
   * @param {string} entityType - The type of entity created (e.g., 'Team', 'Competition').
   * @param {string|number} entityId - The ID of the created entity.
   * @param {Object} newValues - The values of the newly created entity.
   * @param {Express.Request} [req=null] - Express request object.
   * @param {string} [details=null] - Additional details about the creation.
   * @returns {Promise<void>}
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
   * Logs entity update events with before/after values.
   * @static
   * @async
   * @param {string} entityType - The type of entity updated.
   * @param {string|number} entityId - The ID of the updated entity.
   * @param {Object} oldValues - The previous values before the update.
   * @param {Object} newValues - The new values after the update.
   * @param {Express.Request} [req=null] - Express request object.
   * @param {string} [details=null] - Additional details about the update.
   * @returns {Promise<void>}
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
   * Logs entity deletion events.
   * @static
   * @async
   * @param {string} entityType - The type of entity deleted.
   * @param {string|number} entityId - The ID of the deleted entity.
   * @param {Object} [oldValues=null] - The values of the entity before deletion.
   * @param {Express.Request} [req=null] - Express request object.
   * @param {string} [details=null] - Additional details about the deletion.
   * @returns {Promise<void>}
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
   * Logs file upload events.
   * @static
   * @async
   * @param {string} entityType - The type of entity the file is associated with.
   * @param {string|number} entityId - The ID of the associated entity.
   * @param {Object} fileInfo - Information about the uploaded file.
   * @param {string} fileInfo.filename - The name of the uploaded file.
   * @param {string} fileInfo.mimetype - The MIME type of the file.
   * @param {number} fileInfo.size - The size of the file in bytes.
   * @param {Express.Request} [req=null] - Express request object.
   * @param {string} [details=null] - Additional details about the upload.
   * @returns {Promise<void>}
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
   * Logs system-level events not associated with a specific user.
   * @static
   * @async
   * @param {string} action - The system action performed.
   * @param {string} entityType - The type of entity affected.
   * @param {string|number} [entityId=null] - The ID of the affected entity.
   * @param {string} [details=null] - Additional details about the system event.
   * @returns {Promise<void>}
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