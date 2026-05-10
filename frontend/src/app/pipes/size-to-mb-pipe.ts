import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sizeToMB',
})
export class SizeToMBPipe implements PipeTransform {

  transform(value: number): string {
    if (value == null || isNaN(value)) return '0';

    const mb = value / (1024 * 1024);
    return `${mb.toFixed(2)}`
  };
}


