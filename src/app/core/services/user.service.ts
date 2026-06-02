import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    perPage = 10,
    search = '',
  ): Observable<PaginatedResponse<User>> {
    let params = new HttpParams().set('page', page).set('limit', perPage); // was: per_page
    if (search) params = params.set('search', search);
    return this.http.get<any>(this.url, { params }).pipe(
      map((res) => ({
        success: res.success,
        data: res.data.data, // unwrap nested data
        meta: res.data.meta,
      })),
    );
  }

  getById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.url}/${id}`);
  }

  create(data: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.url, data);
  }

  update(id: number, data: UpdateUserRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}
