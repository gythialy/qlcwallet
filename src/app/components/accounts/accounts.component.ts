import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AddressBookService } from '../../services/address-book.service';
import { ModalService } from '../../services/modal.service';
import { AppSettingsService } from '../../services/app-settings.service';
// import { LedgerService, LedgerStatus } from '../../services/ledger.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Component({
	selector: 'app-accounts',
	templateUrl: './accounts.component.html',
	styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {
	accounts = this.walletService.wallet.accounts;
	wallet = this.walletService.wallet;
	isLedgerWallet = this.walletService.isLedgerWallet();

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';
	msg6 = '';
	msg7 = '';
	msg8 = '';
	msg9 = '';
	msg10 = '';
	msg11 = '';
	msg12 = '';
	msgEdit1 = '';
	msgEdit2 = '';

	constructor(
		private walletService: WalletService,
		private api: ApiService,
		private notificationService: NotificationService,
		private addressBook: AddressBookService,
		public modal: ModalService,
		public settings: AppSettingsService,
		// private ledger: LedgerService,
		private trans: TranslateService
	) {
		// console.log(this.wallet);
		this.loadBalances();
		this.loadLang();
	}

	async ngOnInit() {
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
	}

	loadLang() {
		this.trans.get('ACCOUNTS_WARNINGS.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msg6 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg7').subscribe((res: string) => {
			// console.log(res);
			this.msg7 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg8').subscribe((res: string) => {
			// console.log(res);
			this.msg8 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg9').subscribe((res: string) => {
			// console.log(res);
			this.msg9 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg10').subscribe((res: string) => {
			// console.log(res);
			this.msg10 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg11').subscribe((res: string) => {
			// console.log(res);
			this.msg11 = res;
		});
		this.trans.get('ACCOUNTS_WARNINGS.msg12').subscribe((res: string) => {
			// console.log(res);
			this.msg12 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msgEdit1 = res;
		});
		this.trans.get('ACCOUNT_DETAILS_WARNINGS.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msgEdit2 = res;
		});
	}

	async loadBalances() {
		for (let i = 0; i < this.accounts.length; i++) {
			// console.log(this.accounts[i]);
			const am = await this.api.accountInfo(this.accounts[i].id);
			this.accounts[i].accountMeta = am.accountMeta.result;
		}
		// walletAccount.account_info = await this.api.accountInfo(accountID);
	}

	async createAccount() {
		if (this.walletService.isLocked()) {
			return this.notificationService.sendError(this.msg1);
		}
		if (!this.walletService.isConfigured()) {
			return this.notificationService.sendError(this.msg2);
		}
		if (this.walletService.wallet.accounts.length >= 20) {
			return this.notificationService.sendWarning(this.msg3);
		}
		try {
			const newAccount = await this.walletService.addWalletAccount();
			this.notificationService.sendSuccess(this.msg4 + ` ${newAccount.id}`);
		} catch (err) {}
	}

	copied() {
		this.notificationService.sendSuccess(this.msg5);
	}

	async deleteAccount(account) {
		if (this.walletService.walletIsLocked()) {
			return this.notificationService.sendWarning(this.msg6);
		}
		try {
			await this.walletService.removeWalletAccount(account.id);
			this.notificationService.sendSuccess(this.msg7 + ` ${account.id}`);
		} catch (err) {
			this.notificationService.sendError(this.msg8 + ` ${err.message}`);
		}
	}

	// async showLedgerAddress(account) {
	// 	if (this.ledger.ledger.status !== LedgerStatus.READY) {
	// 		return this.notificationService.sendWarning(this.msg9);
	// 	}
	// 	this.notificationService.sendInfo(this.msg10, { identifier: 'ledger-account', length: 0 });
	// 	try {
	// 		await this.ledger.getLedgerAccount(account.index, true);
	// 		this.notificationService.sendSuccess(this.msg11);
	// 	} catch (err) {
	// 		this.notificationService.sendError(this.msg12);
	// 	}
	// 	this.notificationService.removeNotification('ledger-account');
	// }

	editName(account) {
		account.editName = true;
		account.tempBookName = account.addressBookName;
	}
	editNameCancel(account) {
		account.editName = false;
		account.addressBookName = account.tempBookName;
		account.tempBookName = '';
	}
	async editNameSave(account) {
		const addressBookName = account.addressBookName.trim();
		if (!addressBookName) {
			this.addressBook.deleteAddress(account.id);
			this.notificationService.sendSuccess(this.msgEdit1);
			account.editName = false;
			return;
		}

		try {
			await this.addressBook.saveAddress(account.id, addressBookName);
		} catch (err) {
			this.notificationService.sendError(err.message);
			return;
		}

		this.notificationService.sendSuccess(this.msgEdit2);
		account.editName = false;
	}
}
