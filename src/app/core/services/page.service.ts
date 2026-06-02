import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Page,
  CreatePageRequest,
  ApiResponse,
  PaginatedResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PageService {
  private url = `${environment.apiUrl}/pages`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    perPage = 10,
    search = '',
  ): Observable<PaginatedResponse<Page>> {
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

  getAllActive(): Observable<ApiResponse<Page[]>> {
    return this.http.get<ApiResponse<Page[]>>(`${this.url}/active`);
  }

  getById(id: number): Observable<ApiResponse<Page>> {
    return this.http.get<ApiResponse<Page>>(`${this.url}/${id}`);
  }

  create(data: CreatePageRequest): Observable<ApiResponse<Page>> {
    return this.http.post<ApiResponse<Page>>(this.url, data);
  }

  update(id: number, data: CreatePageRequest): Observable<ApiResponse<Page>> {
    return this.http.put<ApiResponse<Page>>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}
