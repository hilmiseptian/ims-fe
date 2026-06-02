// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  login: string; // username or email
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
    permissions: string[];
  };
}

export interface AuthUser {
  id: number;
  full_name: string;
  username: string;
  email: string;
  level_id: number;
  level_name: string;
  is_active: boolean;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  level_id: number;
  level_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
  level_id: number;
  is_active: boolean;
}

export interface UpdateUserRequest {
  full_name: string;
  username: string;
  email: string;
  password?: string;
  level_id: number;
  is_active: boolean;
}

// ─── Level ───────────────────────────────────────────────────────────────────
export interface Level {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLevelRequest {
  name: string;
  description: string;
  is_active: boolean;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export interface Page {
  id: number;
  name: string;
  route_path: string;
  description: string;
  sort_order: number;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePageRequest {
  name: string;
  route_path: string;
  description: string;
  sort_order: number;
  icon: string;
  is_active: boolean;
}

// ─── Permission ──────────────────────────────────────────────────────────────
export interface Permission {
  id: number;
  name: string; // e.g. "users.view"
  module: string; // e.g. "users"
  action: string; // e.g. "view"
  description: string;
}

export interface LevelPermission {
  level_id: number;
  permission_id: number;
  permission_name: string;
}

export interface UserPermission {
  user_id: number;
  permission_id: number;
  permission_name: string;
  type: 'additional' | 'excluded';
}

export interface PermissionMatrixRow {
  permission: Permission;
  levelAssignments: { [levelId: number]: boolean };
}

export interface UserPermissionOverride {
  permission: Permission;
  additional: boolean;
  excluded: boolean;
}

export interface EffectivePermissionsResponse {
  success: boolean;
  data: {
    permissions: string[];
  };
}

// ─── API Response wrappers ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  };
}

// ─── Menu ────────────────────────────────────────────────────────────────────
export interface MenuItem {
  label: string;
  route_path: string;
  icon: string;
  permission: string;
}
