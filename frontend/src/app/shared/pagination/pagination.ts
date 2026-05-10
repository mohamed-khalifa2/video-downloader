import { CommonModule } from '@angular/common';
import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  handlePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
}
