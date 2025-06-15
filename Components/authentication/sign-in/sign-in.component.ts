import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { login } from '../../../Core/interfaces/user-auth';
import {
  ReactiveFormsModule,
  FormControl,
  Validators,
  FormGroup,
} from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  constructor(
    private _Router: Router,
    private _UserAuthService: UserAuthService
  ) {}

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    if (this._UserAuthService.isUserLogin.getValue()) {
      this._Router.navigate(['/home']);
    }
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
    }
  }

  login() {
    const data: login = {
      email: this.loginForm.get('email')?.value || '',
      password: this.loginForm.get('password')?.value || '',
    };
    this._UserAuthService.login(data).subscribe({
      next: (res) => {
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          this._UserAuthService.isUserLogin.next(true);
          const decodedToken: any = jwtDecode(res.token);
          const userRole = decodedToken.Role;
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
              redirectRoute = '/home';
          }
          Swal.fire({
            title: 'Login Successful',
            text: 'You have been logged in successfully',
            icon: 'success',
            showConfirmButton: true,
          }).then(() => {
            // After clicking OK, decode token and load profile picture
            const token = localStorage.getItem('token') || '';
            if (token) {
              const decoded: any = jwtDecode(token);
              const userId = decoded.ID;
              this._UserAuthService.ProfileInfo(userId).subscribe({
                next: (response) => {
                  this._UserAuthService.profilePicture.next(
                    `${response.image}?v=${Date.now()}`
                  );
                  const returnUrl = localStorage.getItem('returnUrl');
                  localStorage.removeItem('returnUrl');
                  this._Router.navigate([returnUrl || redirectRoute]);
                },
                error: (err) => {
                  this._UserAuthService.profilePicture.next(
                    'https://img.freepik.com/premium-vector/person-icon_109161-4674.jpg'
                  );
                  const returnUrl = localStorage.getItem('returnUrl');
                  localStorage.removeItem('returnUrl');
                  this._Router.navigate([returnUrl || redirectRoute]);
                },
              });
            } else {
              const returnUrl = localStorage.getItem('returnUrl');
              localStorage.removeItem('returnUrl');
              this._Router.navigate([returnUrl || redirectRoute]);
            }
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: err.error.message || 'Invalid email or password',
        });
      },
    });
  }
}
