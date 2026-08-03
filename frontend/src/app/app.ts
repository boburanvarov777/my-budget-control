import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TelegramService } from './core/services/telegram.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private telegram = inject(TelegramService);

  ngOnInit(): void {
    this.telegram.init();
  }
}
