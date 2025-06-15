import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  forget,
  login,
  merchantReg,
  ProfileInfo,
  ResetPassword,
  Rest,
  signUp,
} from '../interfaces/user-auth';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class UserAuthService {
  private baseApiUrl: string = 'https://aston.runasp.net/';
  isUserLogin: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  profilePicture: BehaviorSubject<string> = new BehaviorSubject<string>(
    'https://img.freepik.com/premium-vector/person-icon_109161-4674.jpg'
  );
  userId: string = '';

  constructor(private _HttpClient: HttpClient, private _Router: Router) {
    const token = localStorage.getItem('token');
    if (token && this.isTokenValid(token)) {
      this.isUserLogin.next(true);
      const decodedToken: any = jwtDecode(token);
      this.userId = decodedToken.ID;
      this.loadProfilePicture(this.userId);
    } else {
      // localStorage.removeItem('token');
      this.isUserLogin.next(false);
    }
  }

  private loadProfilePicture(userId: string): void {
    this.ProfileInfo(userId).subscribe({
      next: (response) => {
        this.profilePicture.next(`${response.image}?v=${Date.now()}`);
      },
      error: (error) => {
        console.error('Error fetching profile picture:', error);
        this.profilePicture.next(
          'https://img.freepik.com/premium-vector/person-icon_109161-4674.jpg'
        );
      },
    });
  }

  login(data: login): Observable<any> {
    return this._HttpClient.post(`${this.baseApiUrl}Login`, data);
  }

  register(data: signUp): Observable<any> {
    return this._HttpClient.post(`${this.baseApiUrl}CustomerReg`, data, {
      responseType: 'text',
    });
  }

  merchantReg(data: merchantReg): Observable<any> {
    return this._HttpClient.post(`${this.baseApiUrl}MerchantReg`, data);
  }

  forgetPassword(data: forget): Observable<any> {
    return this._HttpClient.post(
      `${this.baseApiUrl}api/Auth/forgot-password`,
      data
    );
  }

  verifyResetCode(data: Rest): Observable<any> {
    return this._HttpClient.post(
      `${this.baseApiUrl}api/Auth/verify-Code`,
      data
    );
  }

  resendverificationcode(email: string): Observable<any> {
    return this._HttpClient.post(
      `${this.baseApiUrl}api/Auth/resend-verification-code`,
      { email }
    );
  }

  resetPassword(data: ResetPassword): Observable<any> {
    return this._HttpClient.post(
      `${this.baseApiUrl}api/Auth/reset-password`,
      data
    );
  }

  logout() {
    // localStorage.removeItem('token');
    this.isUserLogin.next(false);
    this.profilePicture.next(
      'https://img.freepik.com/premium-vector/person-icon_109161-4674.jpg'
    );
    this._Router.navigate(['/login']);
  }

  isTokenValid(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      this.userId = decodedToken.ID;
      const isExpired = decodedToken.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }

  ProfileInfo(userId: string): Observable<ProfileInfo> {
    return this._HttpClient.get<ProfileInfo>(
      `${this.baseApiUrl}ProfileInfo?userId=${userId}`
    );
  }

  updateProfilePic(userId: string, data: FormData): Observable<any> {
    return this._HttpClient.put<ProfileInfo>(
      `${this.baseApiUrl}ProfilePicture?userId=${userId}`,
      data
    );
  }
}
