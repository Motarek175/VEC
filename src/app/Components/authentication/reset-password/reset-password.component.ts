import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ResetPassword } from '../../../Core/interfaces/user-auth';
import Swal from 'sweetalert2';
import { UserAuthService } from '../../../Core/services/user-auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  email: string = '';
  constructor(
    private _Router: Router,
    private _UserAuthService: UserAuthService
  ) {
    this.email = localStorage.getItem('email')!;
  }
  resetForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#^~]{8,}$/
      ),
    ]),
  });
  reset() {
    const data: ResetPassword = {
      email: this.email,
      newPassword: this.resetForm.get('password')?.value || '',
    };
    this._UserAuthService.resetPassword(data).subscribe({
      next: (res) => {
        console.log(res);
        Swal.fire({
          title: 'Password Reset',
          text: res.message,
          icon: 'success',
          showConfirmButton: true,
        }).then(() => {
          localStorage.removeItem('email');
          this._Router.navigate(['/login']);
        });
      },
      error(err) {
        Swal.fire({
          title: 'Error',
          text: err,
          icon: 'error',
          showConfirmButton: true,
        });
      },
    });
  }
}
