import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppComponent } from '../../../app.component';
import { UserAuthService } from '../../../Core/services/user-auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  isLogged: boolean = false;
  constructor(
    public _appComponent: AppComponent,
    public UserAuthService: UserAuthService
  ) {}
}
