import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, AuthUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'uam_token';
  private readonly USER_KEY = 'uam_user';
  private readonly PERMISSIONS_KEY = 'uam_permissions';

  private _currentUser = signal<AuthUser | null>(this.loadUser());
  private _permissions = signal<string[]>(this.loadPermissions());

  readonly currentUser = this._currentUser.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          if (res.success) {
            localStorage.setItem(this.TOKEN_KEY, res.data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
            localStorage.setItem(
              this.PERMISSIONS_KEY,
              JSON.stringify(res.data.permissions),
            );
            this._currentUser.set(res.data.user);
            this._permissions.set(res.data.permissions);
          }
        }),
        catchError((err) => throwError(() => err)),
      );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  // refreshPermissions: change endpoint
  refreshPermissions(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/permissions/my`).pipe(
      tap((res) => {
        if (res.success) {
          const perms: string[] = res.data.permissions;
          localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(perms));
          this._permissions.set(perms);
        }
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private loadPermissions(): string[] {
    try {
      const raw = localStorage.getItem(this.PERMISSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);
    this._currentUser.set(null);
    this._permissions.set([]);
  }
}
