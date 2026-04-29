import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { Loading } from './shared/loading/loading';
import { VideoService } from './services/video.service';

@Component({
  selector: 'app-root',
  imports: [Loading],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public loadingService:LoadingService, public videoServices:VideoService){}

  handleAnalyze(url:string){
    if(!url) return

    this.loadingService.show()

    this.videoServices.analyze(url).subscribe({
      next: (res) => {console.log(res); this.loadingService.hide()},
      error: (err) => {console.log(err); this.loadingService.hide()}
    })
  }
}
