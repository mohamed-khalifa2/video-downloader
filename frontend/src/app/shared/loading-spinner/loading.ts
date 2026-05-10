import { Component } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.css',
})
export class Loading {
  constructor(public loadingService:LoadingService){}
}
