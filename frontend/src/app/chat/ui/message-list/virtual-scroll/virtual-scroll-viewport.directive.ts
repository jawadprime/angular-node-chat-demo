import { Directive, ElementRef, HostListener, afterRenderEffect, inject, input, output } from '@angular/core';
import { VirtualScrollService } from './virtual-scroll.service';

// Fire loadOlder once the user scrolls within this many px of the top.
const LOAD_OLDER_THRESHOLD_PX = 300;

// Pure DOM glue between a scrollable element and VirtualScrollService: hands
// over the native element once, forwards scroll metrics, and emits loadOlder
// near the top. No virtual-scroll math lives here — that's all in the service.
@Directive({
  selector: '[appVirtualScrollViewport]',
})
export class VirtualScrollViewportDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly virtualScroll = inject(VirtualScrollService);

  readonly loadingOlder = input(false);
  readonly loadOlder = output<void>();

  constructor() {
    afterRenderEffect(() => this.virtualScroll.attachViewport(this.elementRef.nativeElement));
  }

  @HostListener('scroll')
  protected onScroll(): void {
    const element = this.elementRef.nativeElement;
    this.virtualScroll.recordScroll(element.scrollTop, element.scrollHeight, element.clientHeight);

    if (element.scrollTop < LOAD_OLDER_THRESHOLD_PX && !this.loadingOlder()) {
      this.loadOlder.emit();
    }
  }
}
