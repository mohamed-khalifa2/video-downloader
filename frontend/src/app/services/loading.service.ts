import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  isLoading = signal<boolean>(true);

  show() {
    this.isLoading.set(true);
  }

  hide() {
    this.isLoading.set(false);
  }

  toggle() {
    this.isLoading.set(!this.isLoading());
  }
}
