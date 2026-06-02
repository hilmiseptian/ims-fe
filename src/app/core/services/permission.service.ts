import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private url = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  getAllPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(this.url);
  }

  // Level permissions
  getLevelPermissions(levelId: number): Observable<any> {
    return this.http.get<any>(`${this.url}/levels/${levelId}`);
  }

  updateLevelPermissions(
    levelId: number,
    permissionNames: string[],
  ): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.url}/levels/${levelId}`, {
      permissions: permissionNames, // send names, not IDs
    });
  }

  // User permission overrides
  getUserPermissions(userId: number): Observable<any> {
    return this.http.get<any>(`${this.url}/users/${userId}`);
  }

  updateUserAdditions(
    userId: number,
    permissionNames: String[],
  ): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(
      `${this.url}/users/${userId}/additions`,
      {
        permissions: permissionNames,
      },
    );
  }

  updateUserExclusions(
    userId: number,
    permissionNames: String[],
  ): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(
      `${this.url}/users/${userId}/exclusions`,
      {
        permissions: permissionNames,
      },
    );
  }
}
