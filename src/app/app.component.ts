import { AuthedAccount } from '../apiClasses/authedAccount';
import { Account } from '../apiClasses/account';
import { APIProvider } from '../providers/APIProvider';
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { Storage } from '@ionic/storage';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
import { InAppBrowser } from 'ionic-native';

declare var window: any;

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage;

  constructor(platform: Platform, storage: Storage, private mastodon: APIProvider) {
    platform.ready().then(() => {
      window.open = (url, target?, opts?) => new InAppBrowser(url, target, opts);
      this.setRootPage();
      // Okay, so the platform is ready and our plugins are available.
      StatusBar.styleDefault();
      Splashscreen.hide();
    });
 }

 ionViewDidEnter(){
   if(this.rootPage == LoginPage){
     this.setRootPage();
   }
 }

 setRootPage() {
   // check if user already has new TF Account system
   if (localStorage.getItem('currentAccount') != null) {
      console.log('user already has the new account system. Loading....')
      let currentAccount: AuthedAccount = JSON.parse(localStorage.getItem('currentAccount'));
      this.mastodon.setCurrentAccount(currentAccount);
      this.refreshMastodonUser(currentAccount);
      this.rootPage = TabsPage;
      localStorage.setItem('access_token', currentAccount.accessToken);
      localStorage.setItem('base_url', currentAccount.instanceUrl);
      localStorage.setItem('user', JSON.stringify(currentAccount.mastodonAccount));
      localStorage.setItem('tootCache', JSON.stringify(currentAccount.tootCache));
      localStorage.setItem('notificationsCache', JSON.stringify(currentAccount.notificationsCache));
   } else {
      // check if user still uses "old" system
      if (localStorage.getItem('access_token') != null) {
        console.log('Migrating to new account system...')
        let currentAccount: AuthedAccount = new AuthedAccount();
        currentAccount.accessToken = localStorage.getItem('access_token');
        currentAccount.instanceUrl = localStorage.getItem('base_url');
        currentAccount.mastodonAccount = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')): null;
        currentAccount.notificationsCache = localStorage.getItem('notificationsCache') ? JSON.parse(localStorage.getItem('notificationsCache')) : null;
        currentAccount.tootCache =  localStorage.getItem('tootCache') ? JSON.parse(localStorage.getItem('tootCache')) : null;
        
        localStorage.setItem('currentAccount', JSON.stringify(currentAccount));

        this.mastodon.setCurrentAccount(currentAccount);
        let accountList: AuthedAccount[] = [currentAccount];
        localStorage.setItem('accountList', JSON.stringify(accountList));

        localStorage.removeItem('access_token');
        localStorage.removeItem('base_url');
        localStorage.removeItem('user');
        localStorage.removeItem('notificationsCache');
        localStorage.removeItem('tootCache');
        this.rootPage = TabsPage;

      } 
      // ok user is completely new to TF, lets create new Account!
      else {
        console.log('new user! Starting login flow...')
        this.rootPage = LoginPage;  
      }
    } 
 }

 refreshMastodonUser(currentAccount: AuthedAccount){
   //fetching users masto account once for internal stuff
      this.mastodon.getAuthenticatedUser().map( res => {
        let currentUser: Account = JSON.parse(res['_body']);
        return currentUser;
      })
      .subscribe(data => {
        let mastoAccount: Account = data;
        currentAccount.mastodonAccount = mastoAccount;
        localStorage.setItem('currentAccount', JSON.stringify(currentAccount));
        this.mastodon.setCurrentAccount(currentAccount);
      })
 }

}


