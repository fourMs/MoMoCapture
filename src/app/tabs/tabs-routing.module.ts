import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab2',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../tab2/tab2.module').then(m => m.Tab2PageModule)
          }
        ]
      },
      {
        path: 'form/:type',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../form/form.module').then(m => m.FormPageModule)
          }
        ]
      },
      {
        path: 'form-pre',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../form/form.module').then(m => m.FormPageModule),
              data : { type:'pre'}
          }
        ]
      },
      {
        path: 'form-post',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../form/form.module').then(m => m.FormPageModule),
              data : { type:'post'}
          }
        ]
      },
      {
        path: 'form-custom',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../form/form.module').then(m => m.FormPageModule),
              data : { type:'custom'}
          }
        ]
      },
      {
        path: 'form-withdraw',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../form/form.module').then(m => m.FormPageModule),
              data : { type:'withdraw'}
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/tab2',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/tab2',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
