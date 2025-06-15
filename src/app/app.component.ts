import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './Components/shared/footer/footer.component';
import { NavbarComponent } from './Components/shared/navbar/navbar.component';
import { BehaviorSubject, filter, interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserAuthService } from './Core/services/user-auth.service';
import { CustomerService } from './Core/services/customer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FooterComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'E-Commerce';
  authPage: BehaviorSubject<boolean> = new BehaviorSubject(false);
  notCustomerPage: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private trainSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private _UserAuthService: UserAuthService,
    private _CustomerService: CustomerService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const authRoutes = [
          '/login',
          '/signup',
          '/forget-email',
          '/reset-code',
          '/reset-password',
          '/verify-email',
          '/not-found',
          '/merchantReg',
          '/merchantVerifyEmail',
        ];
        const currentUrl = event.urlAfterRedirects;
        this.authPage.next(authRoutes.includes(currentUrl));
        const notCustomerRoutes = [
          '/adminDashboard',
          '/deliveryDashboard',
          '/merchantDashboard',
        ];
        const currentUrl1 = event.urlAfterRedirects;
        this.notCustomerPage.next(notCustomerRoutes.includes(currentUrl1));
      });
  }

  ngOnInit(): void {
    this.trainModel();

    this.trainSubscription = interval(300000).subscribe(() => {
      this.trainModel();
    });
  }

  private trainModel(): void {
    this._CustomerService.TrainModel().subscribe({
      next: (response) => {
        this._CustomerService.RecommendationTrain(response).subscribe({
          next: (res) => {
            this.getLogs();
          },
          error: (err) => {
            console.error('Error in RecommendationTrain:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error in TrainModel:', err);
      },
    });
  }

  private getLogs(): void {
    this._CustomerService.ShowCustomerLogs().subscribe({
      next: (response) => {
        this._CustomerService.postUserLogs(response).subscribe({
          next: (res) => {},
        });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.trainSubscription) {
      this.trainSubscription.unsubscribe();
    }
  }

  showButton: boolean = false;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (window.scrollY > 550) {
      this.showButton = true;
    } else {
      this.showButton = false;
    }
  }

  @HostListener('window:unload', ['$event'])
  onUnload(event: Event): void {
    this._UserAuthService.logout();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
