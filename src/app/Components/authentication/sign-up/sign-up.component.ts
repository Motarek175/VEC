import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { signUp } from '../../../Core/interfaces/user-auth';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
  isMatch: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor(
    private _Router: Router,
    private _UserAuthService: UserAuthService
  ) {}

  registerForm = new FormGroup({
    userName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9]+$/),
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#^~]{8,}$/
      ),
    ]),
    rePassword: new FormControl('', [Validators.required]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^01[0125][0-9]{8}$/),
    ]),
    state: new FormControl('', [Validators.required]),
    governorate: new FormControl('', [Validators.required]),
    location: new FormControl('', [Validators.required]),
    gender: new FormControl('', [Validators.required]),
    birthDate: new FormControl('', [Validators.required]),
  });

  checkMatch() {
    const password = this.registerForm.get('password')?.value;
    const rePassword = this.registerForm.get('rePassword')?.value;
    this.isMatch.next(password === rePassword && !!password && !!rePassword);
  }

  updateValidations() {
    this.checkMatch();
  }
  register() {
    if (this.registerForm.valid && this.isMatch.value) {
      const birthDateValue = this.registerForm.get('birthDate')?.value;
      const data: signUp = {
        userName: this.registerForm.get('userName')?.value || '',
        email: this.registerForm.get('email')?.value || '',
        password: this.registerForm.get('password')?.value || '',
        phone: this.registerForm.get('phone')?.value || '',
        state: this.registerForm.get('state')?.value || '',
        governorate: this.registerForm.get('governorate')?.value || '',
        location: this.registerForm.get('location')?.value || '',
        gender: this.registerForm.get('gender')?.value || '',
        birthDate: birthDateValue ? new Date(birthDateValue).toISOString() : '',
      };
      console.log(data);
      this._UserAuthService.register(data).subscribe({
        next: (res) => {
          this.registerForm.reset();
          Swal.fire({
            title: 'Success',
            text: res.message,
            icon: 'success',
            confirmButtonColor: '#a14b4b',
          }).then(() => {
            localStorage.setItem('email', data.email);
            this._Router.navigate(['/verify-email']);
          });
        },
        error: (err) => {
          console.log(err);
          const parsed = JSON.parse(err.error);
          let errMessage: string = '';
          errMessage = parsed.message;
          Swal.fire({
            title: 'Error',
            text: errMessage,
            icon: 'error',
            confirmButtonColor: '#ef4444',
          });
        },
      });
    }
  }
}
