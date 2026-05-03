import {Routes} from '@angular/router';
import {Home} from './features/home/home';
import {Login} from './features/auth/login';
import {Register} from './features/auth/register';
import {ProductList} from './features/products/product-list';
import {Dashboard} from './features/admin/dashboard';
import {adminGuard} from './core/admin.guard';

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
    path: 'admin',
    component: Dashboard,
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
