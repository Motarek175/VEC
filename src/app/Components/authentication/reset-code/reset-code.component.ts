import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { forget, Rest } from '../../../Core/interfaces/user-auth';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-reset-code',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-code.component.html',
  styleUrl: './reset-code.component.css',
})
export class ResetCodeComponent {
  resetForm = new FormGroup({
    input1: new FormControl('', [Validators.required]),
    input2: new FormControl('', [Validators.required]),
    input3: new FormControl('', [Validators.required]),
    input4: new FormControl('', [Validators.required]),
    input5: new FormControl('', [Validators.required]),
    input6: new FormControl('', [Validators.required]),
  });
  reset: Rest = {
    email: '',
    verificationCode: '',
  };

  constructor(
    private _Router: Router,
    private _UserAuthService: UserAuthService
  ) {}
  verify() {
    const code = String(
      Object.values(this.resetForm.value)
        .map((value) => value || '')
        .join('')
    );
    this.reset.email = localStorage.getItem('email') || '';
    this.reset.verificationCode = code;
    this.resetForm.reset();
    this._UserAuthService.verifyResetCode(this.reset).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Success',
          text: 'Code is valid, now reset yout password',
          icon: 'success',
          showConfirmButton: true,
        }).then(() => {
          this._Router.navigate(['/reset-password']);
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error.message,
          icon: 'error',
          showConfirmButton: true,
        });
      },
    });
  }
  sendCodeAgain() {
    const email: forget = {
      email: localStorage.getItem('recoverdEmail') || '',
    };
    this._UserAuthService.forgetPassword(email).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Success',
          text: 'Code has been sent to your email again',
          icon: 'success',
          showCloseButton: true,
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          icon: 'error',
        });
      },
    });
  }
}
