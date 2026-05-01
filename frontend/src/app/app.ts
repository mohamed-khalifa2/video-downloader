import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { Loading } from './shared/loading/loading';
import { VideoService } from './services/video.service';
import { ApiResponse, Format, Video } from './models/response.interface';
import { ContentType } from './models/contentType.interface';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [Loading, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public loadingService:LoadingService, public videoServices:VideoService){}

  @ViewChild('target') target!:ElementRef
  contentType:ContentType = 'none'

  indexDropdownOpen=signal<number|null> (null)
  indexSelectedFormat = signal<{ [key: number]: Format }>({});

  response = signal<ApiResponse | null>(null);
  videos = signal<Video[]>([]);

  currentUrl = signal<string|null>(null)
  currentPage=signal<number>(1) 
  totalPages=signal<number>(1) 

  isPageLoading =signal<boolean>(false);
  pageSize = signal<number>(10);

  handleAnalyze(url:string){
    if(!url) return
    
    this.currentUrl.set(url);
    this.loadingService.show();

    this.videoServices.analyze(url).subscribe({
      next: (res:ApiResponse) => {
        this.indexSelectedFormat.set({})
        this.response.set(res); 
        this.videos.set(res.items) ;
        this.totalPages.set(res.totalPages) ;
        if (!res.items || res.items.length === 0) {
            this.contentType = 'none';
            } else if (res.items.length === 1) {
            this.contentType = 'video';
            } else {
            this.contentType = 'playlist';
            }; 
        this.loadingService.hide();

        setTimeout(() => {
    this.target?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 0);
        
      },
      error: (err) => {console.log(err); this.loadingService.hide()}
    })
  }

  handlePage(page:number){
    this.isPageLoading.set(true)
    this.videoServices.analyze(this.currentUrl()!, page).subscribe({next:(res)=> {
      this.indexSelectedFormat.set({})
      this.response.set(res); 
      this.videos.set(res.items);
      this.currentPage.set(page);
      this.isPageLoading.set(false);
    },
    error: err => console.log(err)})
  }

handleDownload(url: string, formatId: string) {
  if (!formatId) return;

  const downloadUrl = `http://localhost:3000/api/video/download?url=${encodeURIComponent(url)}&formatId=${formatId}`;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

  indexToggleDropDown(index:number){
    this.indexDropdownOpen.set(
    this.indexDropdownOpen() === index ? null : index);
  }

  indexSelectFormat(option:any, index:number){
   this.indexSelectedFormat.update(current => ({
    ...current,
    [index]: option
    }));

  this.indexDropdownOpen.set(null);
  }


}
