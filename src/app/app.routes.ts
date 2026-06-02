import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { permission: 'dashboard.view' },
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        data: { permission: 'users.view' },
        canActivate: [permissionGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
          },
          {
            path: 'create',
            data: { permission: 'users.create' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          },
          {
            path: ':id/edit',
            data: { permission: 'users.update' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          }
        ]
      },
      {
        path: 'levels',
        data: { permission: 'levels.view' },
        canActivate: [permissionGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/levels/level-list/level-list.component').then(m => m.LevelListComponent)
          },
          {
            path: 'create',
            data: { permission: 'levels.create' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/levels/level-form/level-form.component').then(m => m.LevelFormComponent)
          },
          {
            path: ':id/edit',
            data: { permission: 'levels.update' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/levels/level-form/level-form.component').then(m => m.LevelFormComponent)
          }
        ]
      },
      {
        path: 'pages',
        data: { permission: 'pages.view' },
        canActivate: [permissionGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/pages/page-list/page-list.component').then(m => m.PageListComponent)
          },
          {
            path: 'create',
            data: { permission: 'pages.create' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/pages/page-form/page-form.component').then(m => m.PageFormComponent)
          },
          {
            path: ':id/edit',
            data: { permission: 'pages.update' },
            canActivate: [permissionGuard],
            loadComponent: () =>
              import('./features/pages/page-form/page-form.component').then(m => m.PageFormComponent)
          }
        ]
      },
      {
        path: 'permissions',
        data: { permission: 'permissions.view' },
        canActivate: [permissionGuard],
        loadComponent: () =>
          import('./features/permissions/permissions.component').then(m => m.PermissionsComponent)
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
