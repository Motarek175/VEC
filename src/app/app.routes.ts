import { Routes } from '@angular/router';
import { NotFoundComponent } from './Components/shared/not-found/not-found.component';
import { HomeComponent } from './Components/user/home/home.component';
import { AboutComponent } from './Components/user/about/about.component';
import { ContactComponent } from './Components/user/contact/contact.component';
import { roleGuardGuard } from './Core/Guards/role-guard.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  // -------------------Start Authentication-----------------------
  {
    path: 'login',
    loadComponent: () =>
      import('./Components/authentication/sign-in/sign-in.component').then(
        (obj) => obj.SignInComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./Components/authentication/sign-up/sign-up.component').then(
        (obj) => obj.SignUpComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'merchantReg',
    loadComponent: () =>
      import(
        './Components/authentication/merchant-reg/merchant-reg.component'
      ).then((obj) => obj.MerchantRegComponent),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'merchantVerifyEmail',
    loadComponent: () =>
      import(
        './Components/authentication/merchant-verify-email/merchant-verify-email.component'
      ).then((obj) => obj.MerchantVerifyEmailComponent),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'forget-email',
    loadComponent: () =>
      import(
        './Components/authentication/forget-email/forget-email.component'
      ).then((obj) => obj.ForgetEmailComponent),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'reset-code',
    loadComponent: () =>
      import(
        './Components/authentication/reset-code/reset-code.component'
      ).then((obj) => obj.ResetCodeComponent),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import(
        './Components/authentication/reset-password/reset-password.component'
      ).then((obj) => obj.ResetPasswordComponent),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import(
        './Components/authentication/verify-email/verify-email.component'
      ).then((obj) => obj.VerifyEmailComponent),
    canActivate: [roleGuardGuard],
  },
  // ---------------------End Authentication-----------------------
  // user routes
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'contact',
    component: ContactComponent,
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./Components/user/shop/shop.component').then(
        (obj) => obj.ShopComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./Components/user/cart/cart.component').then(
        (obj) => obj.CartComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./Components/user/wishlist/wishlist.component').then(
        (obj) => obj.WishlistComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./Components/user/profile/profile.component').then(
        (obj) => obj.ProfileComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'product/:prodId',
    loadComponent: () =>
      import(
        './Components/user/product-details/product-details.component'
      ).then((obj) => obj.ProductDetailsComponent),
  },
  {
    path: 'try',
    loadComponent: () =>
      import('./Components/user/try-it/try-it.component').then(
        (obj) => obj.TryComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('./Components/user/billing/billing.component').then(
        (obj) => obj.BillingComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./Components/user/orders/orders.component').then(
        (obj) => obj.OrdersComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'order-details/:orderId',
    loadComponent: () =>
      import('./Components/user/order-details/order-details.component').then(
        (obj) => obj.OrderDetailsComponent
      ),
    canActivate: [roleGuardGuard],
  },
  {
    path: 'merchant-page/:merchantId',
    loadComponent: () =>
      import('./Components/user/merchant-page/merchant-page.component').then(
        (obj) => obj.MerchantPageComponent
      ),
  },
  // admin routes
  {
    path: 'adminDashboard',
    loadComponent: () =>
      import(
        './Components/admin/admin-dashboard/admin-dashboard.component'
      ).then((obj) => obj.AdminDashboardComponent),
    canActivate: [roleGuardGuard],
    data: { expectedRole: 'Admin' },
  },
  // Delivery Routes
  {
    path: 'deliveryDashboard',
    loadComponent: () =>
      import('./Components/delivery/dashboard/dashboard.component').then(
        (obj) => obj.DashboardComponent
      ),
    canActivate: [roleGuardGuard],
    data: { expectedRole: 'DeliveryRep' },
  },
  // merchant Routes
  {
    path: 'merchantDashboard',
    loadComponent: () =>
      import(
        './Components/merchant/merchant-dashboard/merchant-dashboard.component'
      ).then((obj) => obj.MerchantDashboardComponent),
    canActivate: [roleGuardGuard],
    data: { expectedRole: 'Merchant' },
  },
  // not found
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', redirectTo: 'not-found' },
];
