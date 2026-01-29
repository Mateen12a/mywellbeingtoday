import { AuditLog } from '../models/index.js';

export const logAction = async (userId, action, resource, resourceId = null, details = null, req = null, status = 'success', errorMessage = null) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      status,
      errorMessage
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      const statusCode = res.statusCode;
      const status = statusCode >= 200 && statusCode < 400 ? 'success' : 'failure';
      
      if (req.user) {
        logAction(
          req.user._id,
          action,
          resource,
          req.params.id || null,
          { method: req.method, path: req.path },
          req,
          status
        );
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};
