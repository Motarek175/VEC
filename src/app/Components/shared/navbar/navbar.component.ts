import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { computed } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { CustomerService } from '../../../Core/services/customer.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen: boolean = false;
  isUserMenuOpen: boolean = false;
  customerId: string = '';

  wishlistCount = computed(() => {
    return this.customerService.getWishlist()().length;
  });

  cartCount = computed(() => {
    return this.customerService.getCartItems()().length;
  });

  constructor(
    public _UserAuthService: UserAuthService,
    private customerService: CustomerService,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMenus();
      }
    });
  }

  ngOnInit(): void {
    this._UserAuthService.isUserLogin.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        const token = localStorage.getItem('token') || '';
        if (token) {
          const decodedToken: any = jwtDecode(token);
          this.customerId = decodedToken.ID;
        }
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const mobileMenu = document.getElementById('mobile-menu');
    const userMenuMobile = document.getElementById('user-menu-mobile');
    const userMenuDesktop = document.getElementById('user-menu-desktop');

    const isMenuToggleButton =
      target.closest('button')?.getAttribute('aria-expanded') !== null;
    const isUserMenuToggleButton =
      target.closest('button')?.classList.contains('cursor-pointer') &&
      (target.closest('button')?.classList.contains('md:hidden') ||
        target.closest('button')?.classList.contains('w-12'));

    if (this.isMenuOpen || this.isUserMenuOpen) {
      const clickInsideMobileMenu = mobileMenu?.contains(target);
      const clickInsideUserMenuMobile = userMenuMobile?.contains(target);
      const clickInsideUserMenuDesktop = userMenuDesktop?.contains(target);

      if (
        !clickInsideMobileMenu &&
        !clickInsideUserMenuMobile &&
        !clickInsideUserMenuDesktop &&
        !isMenuToggleButton &&
        !isUserMenuToggleButton
      ) {
        this.closeMenus();
      }
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isUserMenuOpen) this.isUserMenuOpen = false;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isMenuOpen) this.isMenuOpen = false;
  }

  closeMenus() {
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }
}
