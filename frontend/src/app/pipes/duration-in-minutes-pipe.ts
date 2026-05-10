import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationInMinutes',
})
export class DurationInMinutesPipe implements PipeTransform {

  transform(value: number): string {
    if (value == null || isNaN(value)) return `0`;

    const minutes = value / 60;
    return `${minutes.toFixed(2)}`
  }

}
