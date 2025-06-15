import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';
import { jwtDecode } from './../../../../node_modules/jwt-decode/build/cjs/index';
import Swal from 'sweetalert2';

export const roleGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userAuthService = inject(UserAuthService);
  const token = localStorage.getItem('token');

  // List of authentication routes
  const authRoutes = [
    'login',
    'signup',
    'forget-email',
    'reset-code',
    'reset-password',
    'verify-email',
    'merchantReg',
    'merchantVerifyEmail',
  ];

  // List of protected user routes requiring authentication (no specific role)
  const protectedUserRoutes = [
    'cart',
    'wishlist',
    'profile',
    'orders',
    'try',
    'billing',
    'order-details/:orderId',
  ];

  // Check if the current route is an authentication route
  const isAuthRoute = authRoutes.includes(route.routeConfig?.path || '');

  // Check if the current route is a protected user route
  const isProtectedUserRoute = protectedUserRoutes.includes(
    route.routeConfig?.path || ''
  );

  // If it's an authentication route
  if (isAuthRoute) {
    if (token && userAuthService.isUserLogin.getValue()) {
      try {
        // Decode token to get user role
        const decodedToken: any = jwtDecode(token);
        const userRole = decodedToken.Role;
        let redirectRoute: string;

        // Redirect based on role
        switch (userRole) {
          case 'Customer':
            redirectRoute = '/home';
            break;
          case 'Admin':
            redirectRoute = '/adminDashboard';
            break;
          case 'DeliveryRep':
            redirectRoute = '/deliveryDashboard';
            break;
          case 'Merchant':
            redirectRoute = '/merchantDashboard';
            break;
          default:
            redirectRoute = '/home';
        }

        router.navigate([redirectRoute]);
        return false; // Prevent access to authentication route
      } catch (error) {
        // If token is invalid, clear it and allow access
        localStorage.removeItem('token');
        userAuthService.isUserLogin.next(false);
        return true;
      }
    }
    // Allow non-logged-in users to access authentication routes
    return true;
  }

  if (isProtectedUserRoute) {
    if (!token || !userAuthService.isUserLogin.getValue()) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'You must log in to access this page. You can either log in or return to the homepage.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#a14b4b',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Back to Home',
      }).then((result) => {
        if (result.isConfirmed) {
          router.navigate(['/login']);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          router.navigate(['/home']);
        }
      });
      return false;
    }
    return true;
  }

  // If it's a role-protected route (e.g., adminDashboard, deliveryDashboard)
  const expectedRole = route.data['expectedRole'];
  if (!token) {
    router.navigate(['/home']);
    return false;
  }

  try {
    // Decode token and check role
    const decodedToken: any = jwtDecode(token);
    const userRole = decodedToken.Role;

    // Check if user has the expected role
    if (userRole === expectedRole) {
      return true;
    } else {
      // Redirect to appropriate dashboard or home based on role
      let redirectRoute: string;
      switch (userRole) {
        case 'Customer':
          redirectRoute = '/home';
          break;
        case 'Admin':
          redirectRoute = '/adminDashboard';
          break;
        case 'DeliveryRep':
          redirectRoute = '/deliveryDashboard';
          break;
        case 'Merchant':
          redirectRoute = '/merchantDashboard';
          break;
        default:
          redirectRoute = '/login';
      }
      router.navigate([redirectRoute]);
      return false;
    }
  } catch (error) {
    // If token is invalid, clear storage and redirect to login
    localStorage.removeItem('token');
    userAuthService.isUserLogin.next(false);
    router.navigate(['/login']);
    return false;
  }
};
