# User Role Management Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for the User Role Management system in the Restaurant Application. This system will provide secure access control, staff management, and administrative capabilities for restaurant operations.

## Current Database Schema Analysis

Based on the existing authentication system, we have:
- Basic user authentication with NextAuth
- User roles: ADMIN, MANAGER, CHEF, WAITER, CUSTOMER
- Basic user table with role field

## Implementation Phases

### Phase 1: Core User Management (Week 1-2)

#### 1.1 Database Schema Enhancements
```sql
-- User profile extensions
ALTER TABLE User ADD COLUMN employeeId VARCHAR(50);
ALTER TABLE User ADD COLUMN firstName VARCHAR(100);
ALTER TABLE User ADD COLUMN lastName VARCHAR(100);
ALTER TABLE User ADD COLUMN phone VARCHAR(20);
ALTER TABLE User ADD COLUMN status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE';
ALTER TABLE User ADD COLUMN hireDate DATE;
ALTER TABLE User ADD COLUMN lastLogin TIMESTAMP;
ALTER TABLE User ADD COLUMN createdById VARCHAR(191);

-- User audit log table
CREATE TABLE UserAuditLog (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON,
  performedById VARCHAR(191) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (performedById) REFERENCES User(id)
);

-- User sessions tracking
CREATE TABLE UserSession (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  loginTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logoutTime TIMESTAMP NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

#### 1.2 Server Actions (lib/actions/user-management-actions.ts)
- `getUserStats()` - Dashboard statistics for user management
- `getUsers()` - Paginated user listing with filtering
- `createUser()` - Create new staff members with email invitations
- `updateUser()` - Update user profiles and roles
- `deactivateUser()` - Soft delete/deactivate users
- `resetUserPassword()` - Password reset functionality
- `getUserAuditLog()` - User activity history
- `updateUserRole()` - Role assignment with permissions check

#### 1.3 Core Components

**UserManagement Component** (`components/UserManagement.tsx`)
- User listing table with search and filtering
- Role-based action buttons
- User creation modal
- Bulk operations interface
- Status management (active/inactive/suspended)

**UserDetailsModal Component**
- Complete user profile view
- Activity history and audit logs
- Role and permission management
- Session history

**CreateUserModal Component**
- Staff member creation form
- Role assignment
- Email invitation system
- Initial password setup

### Phase 2: Advanced Permission System (Week 3-4)

#### 2.1 Permission Database Schema
```sql
-- Permissions table
CREATE TABLE Permission (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions junction table
CREATE TABLE RolePermission (
  id VARCHAR(191) PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permissionId VARCHAR(191) NOT NULL,
  granted BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permissionId) REFERENCES Permission(id),
  UNIQUE(role, permissionId)
);

-- User specific permissions (overrides)
CREATE TABLE UserPermission (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  permissionId VARCHAR(191) NOT NULL,
  granted BOOLEAN NOT NULL,
  grantedById VARCHAR(191) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (permissionId) REFERENCES Permission(id),
  FOREIGN KEY (grantedById) REFERENCES User(id),
  UNIQUE(userId, permissionId)
);
```

#### 2.2 Permission Categories and Definitions
```typescript
export const PERMISSION_CATEGORIES = {
  MENU_MANAGEMENT: [
    'menu:view',
    'menu:create',
    'menu:edit',
    'menu:delete',
    'menu:categories',
    'menu:promotions'
  ],
  ORDER_MANAGEMENT: [
    'orders:view',
    'orders:update_status',
    'orders:cancel',
    'orders:print_receipt',
    'orders:analytics'
  ],
  BOOKING_MANAGEMENT: [
    'bookings:view',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
    'bookings:assign_table'
  ],
  USER_MANAGEMENT: [
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'users:roles',
    'users:permissions'
  ],
  ANALYTICS: [
    'analytics:view',
    'analytics:export',
    'analytics:financial'
  ],
  SYSTEM: [
    'system:settings',
    'system:audit_logs',
    'system:backup'
  ]
};
```

#### 2.3 Advanced Components

**PermissionManagement Component**
- Role-based permission matrix
- Permission inheritance visualization
- Bulk permission assignment
- Permission templates

**RoleHierarchy Component**
- Visual role hierarchy display
- Permission inheritance flow
- Role comparison tool

### Phase 3: Staff Management Features (Week 5-6)

#### 3.1 Staff Scheduling Database Schema
```sql
-- Staff schedules
CREATE TABLE StaffSchedule (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  dayOfWeek INT NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Staff attendance tracking
CREATE TABLE StaffAttendance (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  clockIn TIMESTAMP NOT NULL,
  clockOut TIMESTAMP NULL,
  date DATE NOT NULL,
  hoursWorked DECIMAL(4,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

#### 3.2 Staff Management Components

**StaffScheduling Component**
- Weekly schedule calendar view
- Shift assignment and management
- Time-off request system
- Schedule conflict detection

**StaffAttendance Component**
- Clock in/out interface
- Attendance tracking and reports
- Hours worked calculations
- Overtime management

**StaffPerformance Component**
- Performance metrics dashboard
- Goal setting and tracking
- Feedback and evaluation system

## Technical Implementation Details

### Authentication & Authorization

#### Permission Checking Utility
```typescript
// lib/utils/permissions.ts
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  // Check user-specific permissions first (overrides)
  // Then check role-based permissions
  // Return combined result
}

export function requirePermission(permission: string) {
  // HOC for component-level permission checks
}

export async function requirePermissionAction(permission: string) {
  // Server action wrapper for API-level permission checks
}
```

#### Role-Based Component Wrapper
```typescript
// components/auth/PermissionGate.tsx
export function PermissionGate({ 
  permission, 
  fallback, 
  children 
}: {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  // Render children only if user has permission
}
```

### Security Considerations

1. **Audit Logging**: All user management actions logged
2. **Session Management**: Active session tracking and management
3. **Permission Validation**: Server-side permission checks on all actions
4. **Data Encryption**: Sensitive data encrypted at rest
5. **Rate Limiting**: Login attempt limiting and suspicious activity detection

### API Endpoints Structure

```
/api/admin/users/
├── GET / - List users with pagination and filtering
├── POST / - Create new user
├── PATCH /:id - Update user
├── DELETE /:id - Deactivate user
├── POST /:id/reset-password - Reset user password
├── GET /:id/audit-log - Get user audit history
├── POST /:id/permissions - Update user permissions
└── GET /:id/sessions - Get user session history

/api/admin/permissions/
├── GET / - List all permissions
├── GET /roles/:role - Get role permissions
├── POST /roles/:role - Update role permissions
└── GET /users/:userId - Get user effective permissions
```

## Testing Strategy

### Unit Tests
- Permission checking utilities
- User management server actions
- Component permission gates
- Role hierarchy calculations

### Integration Tests
- Complete user creation workflow
- Permission inheritance scenarios
- Role assignment and updates
- Session management flows

### Security Tests
- Permission bypass attempts
- Role escalation scenarios
- Audit log integrity
- Session hijacking prevention

## Deployment Considerations

### Database Migration Strategy
1. Create new tables without constraints
2. Migrate existing user data
3. Add foreign key constraints
4. Update application configuration
5. Deploy new application code

### Feature Flags
- Enable/disable advanced permissions
- Gradual rollout to different user roles
- A/B testing for UI improvements

## Success Metrics

### Functional Metrics
- User creation time reduced by 50%
- Permission conflicts reduced to 0
- Staff onboarding time improved by 60%
- Security incidents reduced by 90%

### Technical Metrics
- Page load time < 2 seconds
- API response time < 500ms
- 99.9% uptime for user management
- Zero permission bypass incidents

## Timeline and Milestones

### Week 1: Database & Core Setup
- [ ] Database schema implementation
- [ ] Basic server actions
- [ ] Core authentication enhancements

### Week 2: User Management UI
- [ ] UserManagement component
- [ ] User creation and editing
- [ ] Basic role assignment

### Week 3: Permission System
- [ ] Permission database setup
- [ ] Permission checking utilities
- [ ] Advanced role management

### Week 4: Permission UI
- [ ] Permission management interface
- [ ] Role hierarchy visualization
- [ ] Bulk operations

### Week 5: Staff Management Backend
- [ ] Scheduling database schema
- [ ] Attendance tracking system
- [ ] Performance metrics setup

### Week 6: Staff Management UI
- [ ] Scheduling interface
- [ ] Attendance dashboard
- [ ] Performance tracking

### Week 7: Testing & Polish
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] UI/UX improvements
- [ ] Documentation completion

## Next Steps

1. **Immediate (Next 2 days)**:
   - Review and approve implementation plan
   - Set up development environment
   - Begin database schema design

2. **Short-term (Next week)**:
   - Implement Phase 1 database changes
   - Create basic user management server actions
   - Start UserManagement component development

3. **Medium-term (Next 2-4 weeks)**:
   - Complete core user management functionality
   - Implement permission system
   - Add staff management features

4. **Long-term (Next 4-6 weeks)**:
   - Security testing and audit
   - Performance optimization
   - Production deployment preparation

This comprehensive plan provides a roadmap for implementing a robust, secure, and user-friendly staff management system that will significantly enhance the restaurant's operational capabilities. 