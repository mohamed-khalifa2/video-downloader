import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response.interface';
@Injectable({
  providedIn: 'root',
})
export class VideoService {

  baseUrl = 'http://localhost:3000/api/video';

  constructor(private http: HttpClient) { }

  analyze(url: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('url', url)
    return this.http.get<ApiResponse>(`${this.baseUrl}/analyze`, { params });
  }

  download(url: string, formatId: string): Observable<any> {
    let params = new HttpParams()
      .set('url', url)
      .set('formatId', formatId)

    return this.http.get(`${this.baseUrl}/download`, {
      params,
      responseType: 'blob'
    }
    );
  }

}
