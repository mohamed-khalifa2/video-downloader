import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class VideoService {

  baseUrl = 'http://localhost:3000/api/video';

  constructor(private http: HttpClient){}
  
  analyze(url:string, page:number = 1):Observable<any>{
    let params = new HttpParams()
    .set('url', url)
    .set('page', page)
    return this.http.get(`${this.baseUrl}/analyze`, { params });
  }

  download(url:string, formatId:string):Observable<any>{
     let params = new HttpParams()
      .set('videoUrl', url)
      .set('format_id', formatId)

        return this.http.get(`${this.baseUrl}/download`, {
        params,
        responseType: 'blob'
        }
      );
  }

}
