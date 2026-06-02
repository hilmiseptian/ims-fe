# UAM — User Access Management (Angular 20 Frontend)

Full-stack permission management application built with **Angular 20**, consuming a **Slim PHP** REST API backend backed by **PostgreSQL**.

---

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Angular 20 (standalone) |
| UI       | Angular Material 20      |
| Auth     | JWT (Bearer token)      |
| Forms    | Reactive Forms          |
| State    | Angular Signals         |

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/           # authGuard, permissionGuard, guestGuard
│   ├── interceptors/     # JWT attach + 401/403 handling
│   ├── services/         # AuthService, UserService, LevelService, PageService, PermissionService
│   └── models/           # TypeScript interfaces for all domain types
│
├── shared/
│   ├── components/
│   │   ├── shell/        # Sidebar + header layout
│   │   ├── confirm-dialog/
│   │   └── unauthorized/
│   └── pipes/
│       └── has-permission.directive.ts  # *appHasPermission structural directive
│
└── features/
    ├── auth/login/       # Login page
    ├── dashboard/        # Stats overview
    ├── users/            # CRUD + list
    ├── levels/           # CRUD + list
    ├── pages/            # CRUD + list
    └── permissions/      # Level matrix + user overrides (two-tab UI)
```

---

## Prerequisites

- Node.js 20+
- Angular CLI 20: `npm install -g @angular/cli@20`

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure API URL
# Edit src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'   # ← point to your Slim PHP backend
};

# 3. Start dev server
ng serve

# App runs at http://localhost:4200
```

---

## Default Credentials

```
Username : admin
Password : Admin123!
```

---

## Permission System

### Naming Convention
```
{module}.{action}

dashboard.view
users.view | users.create | users.update | users.delete
levels.view | levels.create | levels.update | levels.delete
pages.view  | pages.create  | pages.update  | pages.delete
permissions.view | permissions.update
```

### Resolution (backend calculates, frontend reads)
```
Effective = (Level Permissions) + (User Additional) − (User Excluded)
```

### Route Guard Usage
```typescript
// app.routes.ts
{
  path: 'users',
  data: { permission: 'users.view' },
  canActivate: [permissionGuard],
  ...
}
```

### Template-level guard
```html
<ng-container *appHasPermission="'users.create'">
  <button>Add User</button>
</ng-container>

<!-- Multiple permissions (OR logic) -->
<ng-container *appHasPermission="['users.update', 'users.delete']">
  ...
</ng-container>
```

---

## Expected Backend API Endpoints

| Method | Path                              | Permission Required  |
|--------|-----------------------------------|----------------------|
| POST   | /api/auth/login                   | —                    |
| POST   | /api/auth/logout                  | authenticated        |
| GET    | /api/auth/permissions             | authenticated        |
| GET    | /api/dashboard/stats              | dashboard.view       |
| GET    | /api/users                        | users.view           |
| POST   | /api/users                        | users.create         |
| GET    | /api/users/:id                    | users.view           |
| PUT    | /api/users/:id                    | users.update         |
| DELETE | /api/users/:id                    | users.delete         |
| GET    | /api/users/:id/permissions        | permissions.view     |
| PUT    | /api/users/:id/permissions        | permissions.update   |
| GET    | /api/levels                       | levels.view          |
| GET    | /api/levels/active                | authenticated        |
| POST   | /api/levels                       | levels.create        |
| PUT    | /api/levels/:id                   | levels.update        |
| DELETE | /api/levels/:id                   | levels.delete        |
| GET    | /api/levels/:id/permissions       | permissions.view     |
| PUT    | /api/levels/:id/permissions       | permissions.update   |
| GET    | /api/pages                        | pages.view           |
| GET    | /api/pages/active                 | authenticated        |
| POST   | /api/pages                        | pages.create         |
| PUT    | /api/pages/:id                    | pages.update         |
| DELETE | /api/pages/:id                    | pages.delete         |
| GET    | /api/permissions                  | permissions.view     |

### Standard Response Formats

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 50, "page": 1, "per_page": 10, "last_page": 5 }
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": "Already taken", "username": "Already taken" }
}
```

**403 Forbidden:**
```json
{ "success": false, "message": "Forbidden" }
```

---

## Build for Production

```bash
ng build --configuration production
# Output: dist/uam-frontend/
```

---

## Key Features

- **JWT auth** stored in localStorage; auto-attached via HttpInterceptor
- **401** → redirect to login; **403** → redirect to /unauthorized
- **Dynamic sidebar** — menu items rendered only if user has matching `*.view` permission
- **Action-level UI gates** — Create/Edit/Delete buttons hidden per permission
- **Permission matrix** (Level tab) — checkbox grid across all levels × all permissions
- **User overrides** (User tab) — grant additional or exclude inherited permissions per user
- **Reactive Forms** with frontend + backend validation error display
- **Angular Signals** for reactive state (no NgRx needed)
- **Lazy-loaded routes** per feature module
- **Responsive layout** — collapsible sidebar, mobile-friendly
