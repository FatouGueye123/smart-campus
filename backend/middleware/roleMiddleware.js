// ============================================================================
// Restreint l'accès à une route selon le(s) rôle(s) autorisé(s).
// Usage : roleMiddleware('ADMIN'), roleMiddleware('ADMIN', 'TECHNICIAN')
// ============================================================================
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé : rôle insuffisant." });
    }
    next();
  };
}

module.exports = roleMiddleware;
