// Role definitions and constraints for the frontend
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    PRO_CLIENT: 'pro_client',
    CLIENT: 'client'
  };
  
  // Role hierarchy levels (higher number = higher privileges)
  export const ROLE_LEVELS = {
    [ROLES.SUPER_ADMIN]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.PRO_CLIENT]: 2,
    [ROLES.CLIENT]: 1
  };
  
  // Role display names for UI
  export const ROLE_NAMES = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Shop Admin',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.PRO_CLIENT]: 'Pro Client',
    [ROLES.CLIENT]: 'Client'
  };
  
  // Role descriptions
  export const ROLE_DESCRIPTIONS = {
    [ROLES.SUPER_ADMIN]: 'Platform administrator with global access to all shops and system management',
    [ROLES.ADMIN]: 'Shop administrator with full control over shop operations and user management',
    [ROLES.MANAGER]: 'Shop manager with rate update permissions and full calculation access',
    [ROLES.PRO_CLIENT]: 'Professional client with calculation access and margin visibility',
    [ROLES.CLIENT]: 'Basic client with calculation access only'
  };
  
  // Role permissions matrix
  export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
      canCreateShops: true,
      canManageShops: true,
      canCreateUsers: true,
      canManageUsers: true,
      canAccessAllShops: true,
      canUpdateRates: true,
      canViewCalculations: true,
      canViewMargins: true,
      canManageCategories: true,
      canViewReports: true
    },
    [ROLES.ADMIN]: {
      canCreateShops: false,
      canManageShops: true, // Own shop only
      canCreateUsers: true, // Shop users only
      canManageUsers: true, // Shop users only
      canAccessAllShops: false,
      canUpdateRates: true,
      canViewCalculations: true,
      canViewMargins: true,
      canManageCategories: true,
      canViewReports: true
    },
    [ROLES.MANAGER]: {
      canCreateShops: false,
      canManageShops: false,
      canCreateUsers: false,
      canManageUsers: false,
      canAccessAllShops: false,
      canUpdateRates: true,
      canViewCalculations: true,
      canViewMargins: true,
      canManageCategories: false,
      canViewReports: true
    },
    [ROLES.PRO_CLIENT]: {
      canCreateShops: false,
      canManageShops: false,
      canCreateUsers: false,
      canManageUsers: false,
      canAccessAllShops: false,
      canUpdateRates: false,
      canViewCalculations: true,
      canViewMargins: true,
      canManageCategories: false,
      canViewReports: false
    },
    [ROLES.CLIENT]: {
      canCreateShops: false,
      canManageShops: false,
      canCreateUsers: false,
      canManageUsers: false,
      canAccessAllShops: false,
      canUpdateRates: false,
      canViewCalculations: true,
      canViewMargins: false,
      canManageCategories: false,
      canViewReports: false
    }
  };
  
  // Role constraints for validation
  export const ROLE_CONSTRAINTS = {
    [ROLES.SUPER_ADMIN]: {
      requiresShopId: false,
      multipleAllowed: true,
      canBeCreatedBy: [ROLES.SUPER_ADMIN],
      color: 'purple'
    },
    [ROLES.ADMIN]: {
      requiresShopId: true,
      multipleAllowed: false, // Only one per shop
      canBeCreatedBy: [ROLES.SUPER_ADMIN],
      color: 'red'
    },
    [ROLES.MANAGER]: {
      requiresShopId: true,
      multipleAllowed: false, // Only one per shop
      canBeCreatedBy: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      color: 'blue'
    },
    [ROLES.PRO_CLIENT]: {
      requiresShopId: true,
      multipleAllowed: false, // Only one per shop
      canBeCreatedBy: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      color: 'green'
    },
    [ROLES.CLIENT]: {
      requiresShopId: true,
      multipleAllowed: false, // Only one per shop
      canBeCreatedBy: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      color: 'gray'
    }
  };
  
  // Utility functions
  export const getRoleLevel = (role) => {
    return ROLE_LEVELS[role] || 0;
  };
  
  export const getRoleName = (role) => {
    return ROLE_NAMES[role] || role;
  };
  
  export const getRoleDescription = (role) => {
    return ROLE_DESCRIPTIONS[role] || '';
  };
  
  export const getRoleColor = (role) => {
    return ROLE_CONSTRAINTS[role]?.color || 'gray';
  };
  
  export const hasPermission = (userRole, permission) => {
    return ROLE_PERMISSIONS[userRole]?.[permission] || false;
  };
  
  export const canCreateRole = (creatorRole, targetRole) => {
    return ROLE_CONSTRAINTS[targetRole]?.canBeCreatedBy?.includes(creatorRole) || false;
  };
  
  export const isHigherRole = (role1, role2) => {
    return getRoleLevel(role1) > getRoleLevel(role2);
  };
  
  export const requiresShopId = (role) => {
    return ROLE_CONSTRAINTS[role]?.requiresShopId || false;
  };
  
  export const isMultipleAllowed = (role) => {
    return ROLE_CONSTRAINTS[role]?.multipleAllowed || false;
  };
  
  // Get roles that a user can create
  export const getCreatableRoles = (userRole) => {
    return Object.keys(ROLE_CONSTRAINTS).filter(role => 
      canCreateRole(userRole, role)
    );
  };
  
  // Get shop roles (excluding super_admin)
  export const getShopRoles = () => {
    return Object.keys(ROLES).filter(key => ROLES[key] !== ROLES.SUPER_ADMIN).map(key => ROLES[key]);
  };
  
  // Validation helpers
  export const validateRoleConstraints = (role, shopId, currentUserRole) => {
    const errors = [];
  
    // Check if role exists
    if (!Object.values(ROLES).includes(role)) {
      errors.push('Invalid role specified');
      return errors;
    }
  
    // Check shopId requirements
    if (requiresShopId(role) && !shopId) {
      errors.push(`${getRoleName(role)} must be assigned to a shop`);
    }
  
    if (!requiresShopId(role) && shopId) {
      errors.push(`${getRoleName(role)} cannot be assigned to a shop`);
    }
  
    // Check creation permissions
    if (currentUserRole && !canCreateRole(currentUserRole, role)) {
      errors.push(`You don't have permission to create ${getRoleName(role)} users`);
    }
  
    return errors;
  };
  
  // Role badge component props helper
  export const getRoleBadgeProps = (role) => {
    const color = getRoleColor(role);
    const name = getRoleName(role);
    
    return {
      color,
      text: name,
      className: `bg-${color}-100 text-${color}-800 border-${color}-200`
    };
  };
  
  export default ROLES;