import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Level,
  CreateLevelRequest,
  ApiResponse,
  PaginatedResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class LevelService {
  private url = `${environment.apiUrl}/levels`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    perPage = 10,
    search = '',
  ): Observable<PaginatedResponse<Level>> {
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

  getAllActive(): Observable<ApiResponse<Level[]>> {
    return this.http.get<ApiResponse<Level[]>>(`${this.url}`);
  }

  getById(id: number): Observable<ApiResponse<Level>> {
    return this.http.get<ApiResponse<Level>>(`${this.url}/${id}`);
  }

  create(data: CreateLevelRequest): Observable<ApiResponse<Level>> {
    return this.http.post<ApiResponse<Level>>(this.url, data);
  }

  update(id: number, data: CreateLevelRequest): Observable<ApiResponse<Level>> {
    return this.http.put<ApiResponse<Level>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}
