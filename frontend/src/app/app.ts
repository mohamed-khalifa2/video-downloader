import { Component, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { Loading } from './shared/loading-spinner/loading';
import { VideoService } from './services/video.service';
import { ApiResponse, Format, Video } from './models/response.interface';
import { ContentType } from './models/contentType.interface';
import { CommonModule } from '@angular/common';
import { SizeToMBPipe } from './pipes/size-to-mb-pipe';
import { DurationInMinutesPipe } from './pipes/duration-in-minutes-pipe';
import { FeatureCard } from './shared/feature-card/feature-card';
import { LoadingButton } from './shared/loading-button/loading-button';
import { Pagination } from './shared/pagination/pagination';

@Component({
  selector: 'app-root',
  imports: [
    SizeToMBPipe,
    DurationInMinutesPipe,
    CommonModule,
    FeatureCard,
    LoadingButton,
    Pagination,
    Loading,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(
    public loadingService: LoadingService,
    public videoServices: VideoService,
  ) {}

  ngOnInit() {
    if (document.readyState === 'complete') {
      this.loadingService.hide();
    } else {
      window.addEventListener(
        'load',
        () => {
          this.loadingService.hide();
        },
        { once: true },
      );
    }
  }

  @ViewChild('target') target!: ElementRef; //for scrolling to the fetched video section
  contentType: ContentType = 'none';
  analyzeVideoLoading = signal<boolean>(false);
  response = signal<ApiResponse | null>(null);
  videos = signal<Video[]>([]);

  indexDropdownOpen = signal<number | null>(null);
  indexSelectedFormat = signal<{ [key: number]: Format }>({});

  playlistAnalyzedVideos = signal<Video[]>([]);
  playlistVideoLoading = signal<{ index?: number; isLoading: boolean }>({ isLoading: false });

  // pagination helpers
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  totalPages = computed(() => Math.ceil(this.videos().length / this.pageSize()));
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.videos().slice(start, start + this.pageSize());
  });
  handlePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    setTimeout(() => {
      this.currentPage.set(page);
      this.target?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 700);
  }

  //API functions

  handleAnalyze(url: string) {
    if (!url) return;

    this.analyzeVideoLoading.set(true);
    this.videoServices.analyze(url).subscribe({
      next: (res: ApiResponse) => {
        this.currentPage.set(1);
        this.indexSelectedFormat.set({});
        this.response.set(res);
        this.videos.set(res.items);
        if (!res.items || res.items.length === 0) {
          this.contentType = 'none';
        } else if (res.items.length === 1) {
          this.contentType = 'video';
        } else {
          this.contentType = 'playlist';
        }
        this.analyzeVideoLoading.set(false);

        setTimeout(() => {
          this.target?.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 700);
      },
      error: (err) => {
        console.log(err);
        this.analyzeVideoLoading.set(false);
      },
    });
  }

  analyzePlaylistVideo(url: string, index: number) {
    this.playlistVideoLoading.set({ index, isLoading: true });
    this.videoServices.analyze(url).subscribe({
      next: (res: ApiResponse) => {
        this.videos.update((items) => {
          const updated = [...items];
          updated[index] = res.items[0];
          return updated;
        });
        this.playlistVideoLoading.set({ index, isLoading: false });
      },
      error: (err) => {
        console.log(err);
      },
    });
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

  indexToggleDropDown(index: number) {
    this.indexDropdownOpen.set(this.indexDropdownOpen() === index ? null : index);
  }

  indexSelectFormat(option: any, index: number) {
    this.indexSelectedFormat.update((current) => ({
      ...current,
      [index]: option,
    }));

    this.indexDropdownOpen.set(null);
  }
}
