import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { Loading } from './shared/loading/loading';

@Component({
  selector: 'app-root',
  imports: [Loading],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public loadingService:LoadingService){}
}
