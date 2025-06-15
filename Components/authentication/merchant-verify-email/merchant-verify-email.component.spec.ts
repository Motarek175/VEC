import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantVerifyEmailComponent } from './merchant-verify-email.component';

describe('MerchantVerifyEmailComponent', () => {
  let component: MerchantVerifyEmailComponent;
  let fixture: ComponentFixture<MerchantVerifyEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantVerifyEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantVerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
