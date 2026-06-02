import {Routes} from '@angular/router';
import {Home} from './features/home/home';
import {Login} from './features/auth/login';
import {Register} from './features/auth/register';
import {ProductList} from './features/products/product-list';
import {ProductDetail} from './features/products/product-detail';
import {Dashboard} from './features/admin/dashboard';
import {Checkout} from './features/checkout/checkout';
import {adminGuard} from './core/admin.guard';
import {customerGuard} from './core/customer.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'auth/login',
    component: Login,
  },
  {
    path: 'auth/register',
    component: Register,
  },
  {
    path: 'products',
    component: ProductList,
  },
  {
    path: 'products/:id',
    component: ProductDetail,
  },
  {
    path: 'checkout',
    component: Checkout,
    canActivate: [customerGuard],
  },
  {
    path: 'admin',
    component: Dashboard,
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
