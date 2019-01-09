import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BigNumber } from 'bignumber.js';
import { BehaviorSubject } from 'rxjs';
import { AddressBookService } from '../../services/address-book.service';
import { ApiService } from '../../services/api.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { NotificationService } from '../../services/notification.service';
import { PriceService } from '../../services/price.service';
import { QLCBlockService } from '../../services/qlc-block.service';
import { UtilService } from '../../services/util.service';
import { WalletService } from '../../services/wallet.service';
import { WorkPoolService } from '../../services/work-pool.service';

const nacl = window['nacl'];

@Component({
	selector: 'app-send',
	templateUrl: './send.component.html',
	styleUrls: ['./send.component.scss']
})
export class SendComponent implements OnInit {
	qlc = 100000000;

	activePanel = 'send';

	accounts = this.walletService.wallet.accounts;
	accountTokens: any = [];
	selectedToken: any = [];
	selectedTokenSymbol = '';
	addressBookResults$ = new BehaviorSubject([]);
	showAddressBook = false;
	addressBookMatch = '';

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
	msg13 = '';

	amounts = [
		{ name: 'QLC', shortName: 'QLC', value: 'QLC' },
		{ name: 'kqlc (0.001 QLC)', shortName: 'kqlc', value: 'kqlc' },
		{ name: 'qlc (0.000001 QLC)', shortName: 'qlc', value: 'qlc' }
	];

	selectedAmount = this.amounts[0];

	amount = null;
	amountRaw = new BigNumber(0);
	amountFiat: number | null = null;
	rawAmount: BigNumber = new BigNumber(0);
	fromAccount: any = {};
	fromAccountID: any = '';
	fromAddressBook = '';
	// toAccount: any = false;
	toAccountID = '';
	bookContact = '';
	toAddressBook = '';
	toAccountStatus = null;
	confirmingTransaction = false;

	constructor(
		private router: ActivatedRoute,
		private walletService: WalletService,
		private addressBookService: AddressBookService,
		private notificationService: NotificationService,
		private api: ApiService,
		private qlcBlock: QLCBlockService,
		public price: PriceService,
		private workPool: WorkPoolService,
		public settings: AppSettingsService,
		private util: UtilService,
		private trans: TranslateService
	) {
		if (this.accounts !== undefined && this.accounts.length > 0) {
			this.searchAddressBook();
		}
		this.loadLang();
	}
	loadLang() {
		this.trans.get('SEND_WARNINGS.msg1').subscribe((res: string) => {
			// console.log(res);
			this.msg1 = res;
		});
		this.trans.get('SEND_WARNINGS.msg2').subscribe((res: string) => {
			// console.log(res);
			this.msg2 = res;
		});
		this.trans.get('SEND_WARNINGS.msg3').subscribe((res: string) => {
			// console.log(res);
			this.msg3 = res;
		});
		this.trans.get('SEND_WARNINGS.msg4').subscribe((res: string) => {
			// console.log(res);
			this.msg4 = res;
		});
		this.trans.get('SEND_WARNINGS.msg5').subscribe((res: string) => {
			// console.log(res);
			this.msg5 = res;
		});
		this.trans.get('SEND_WARNINGS.msg6').subscribe((res: string) => {
			// console.log(res);
			this.msg6 = res;
		});
		this.trans.get('SEND_WARNINGS.msg7').subscribe((res: string) => {
			// console.log(res);
			this.msg7 = res;
		});
		this.trans.get('SEND_WARNINGS.msg8').subscribe((res: string) => {
			// console.log(res);
			this.msg8 = res;
		});
		this.trans.get('SEND_WARNINGS.msg9').subscribe((res: string) => {
			// console.log(res);
			this.msg9 = res;
		});
		this.trans.get('SEND_WARNINGS.msg10').subscribe((res: string) => {
			// console.log(res);
			this.msg10 = res;
		});
		this.trans.get('SEND_WARNINGS.msg11').subscribe((res: string) => {
			// console.log(res);
			this.msg11 = res;
		});
		this.trans.get('SEND_WARNINGS.msg12').subscribe((res: string) => {
			// console.log(res);
			this.msg12 = res;
		});
		this.trans.get('SEND_WARNINGS.msg13').subscribe((res: string) => {
			// console.log(res);
			this.msg13 = res;
		});
	}
	async loadBalances() {
		const tokenMap = {};
		const tokens = await this.api.tokens();
		if (!tokens.error) {
			tokens.result.forEach(token => {
				tokenMap[token.tokenId] = token;
			});
		}

		// fill account meta
		for (const account of this.accounts) {
			const accountInfo = await this.api.accountInfo(account.id);
			if (!accountInfo.error) {
				const am = accountInfo.result;
				for (const token of am.tokens) {
					if (tokenMap.hasOwnProperty(token.type)) {
						token.tokenInfo = tokenMap[token.type];
					}
				}
				account.accountMeta = am;
			}
		}
		this.selectAccount();
	}

	async ngOnInit() {
		const params = this.router.snapshot.queryParams;
		if (params && params.amount) {
			this.amount = params.amount;
		}
		if (params && params.to) {
			this.toAccountID = params.to;
			this.validateDestination();
		}

		this.addressBookService.loadAddressBook();
		// Look for the first account that has a balance
		const accountIDWithBalance = this.accounts.reduce((previous, current) => {
			if (previous) {
				return previous;
			}
			const tokens = current.accountMeta.tokens;
			if (tokens) {
				const filter = tokens.filter(tokenMeta => {
					return tokenMeta.balance > 0;
				});

				if (filter && filter.length > 0) {
					return current.id;
				} else {
					return null;
				}
			} else {
				return null;
			}
		}, null);

		if (accountIDWithBalance) {
			this.fromAccountID = accountIDWithBalance;
		} else {
			this.fromAccountID = this.accounts.length ? this.accounts[0].id : '';
		}
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
		this.loadBalances();
	}

	// An update to the Nano amount, sync the fiat value
	syncFiatPrice() {
		const rawAmount = this.getAmountBaseValue(this.amount || 0).plus(this.amountRaw);
		if (rawAmount.lte(0)) {
			this.amountFiat = 0;
			return;
		}

		// This is getting hacky, but if their currency is bitcoin, use 6 decimals, if it is not, use 2
		const precision = this.settings.settings.displayCurrency === 'BTC' ? 1000000 : 100;

		// Determine fiat value of the amount
		const fiatAmount = this.util.qlc
			.rawToMqlc(rawAmount)
			.times(this.price.price.lastPrice)
			.times(precision)
			.div(precision)
			.toNumber();
		this.amountFiat = fiatAmount;
	}

	// An update to the fiat amount, sync the nano value based on currently selected denomination
	syncNanoPrice() {
		const fiatAmount = this.amountFiat || 0;
		const rawAmount = this.util.qlc.mqlcToRaw(new BigNumber(fiatAmount).div(this.price.price.lastPrice));
		const nanoVal = this.util.qlc.rawToQlc(rawAmount);
		const nanoAmount = this.getAmountValueFromBase(this.util.qlc.qlcToRaw(nanoVal));

		this.amount = nanoAmount.toNumber();
	}

	searchAddressBook() {
		this.showAddressBook = true;
		const search = this.toAccountID || '';
		const addressBook = this.addressBookService.addressBook;

		const matches = addressBook.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) !== -1).slice(0, 5);

		this.addressBookResults$.next(matches);
	}

	selectBookEntry(account) {
		this.showAddressBook = false;
		this.toAccountID = account;
		this.searchAddressBook();
		this.validateDestination();
	}

	async validateDestination() {
		// The timeout is used to solve a bug where the results get hidden too fast and the click is never registered
		setTimeout(() => (this.showAddressBook = false), 400);

		// Remove spaces from the account id
		this.toAccountID = this.toAccountID.replace(/ /g, '');

		this.addressBookMatch = this.addressBookService.getAccountName(this.toAccountID);

		// const accountInfo = await this.walletService.walletApi.accountInfo(this.toAccountID);
		const accountInfo = await this.api.accountInfo(this.toAccountID);
		if (accountInfo.error) {
			if (accountInfo.error === this.msg1) {
				this.toAccountStatus = 1;
			} else {
				this.toAccountStatus = 0;
			}
		} else if (accountInfo.result && accountInfo.result.tokens) {
			this.toAccountStatus = 2;
		}
	}

	async sendTransaction() {
		const isValid = await this.api.validateAccountNumber(this.toAccountID);
		if (!isValid || isValid.valid === '0') {
			return this.notificationService.sendWarning(this.msg2);
		}
		if (!this.fromAccountID || !this.toAccountID) {
			return this.notificationService.sendWarning(this.msg3);
		}

		const from = await this.api.accountInfoByToken(this.fromAccountID, this.selectedToken.type);
		// let to = await this.api.accountInfoByToken(this.toAccountID, this.selectedToken.token_hash);
		if (!from) {
			return this.notificationService.sendError(this.msg4);
		}
		if (this.fromAccountID === this.toAccountID) {
			return this.notificationService.sendWarning(this.msg5);
		}

		from.balanceBN = new BigNumber(from.balance || 0);
		// to.balanceBN = new BigNumber(to.balance || 0);
		this.fromAccount = from;
		// this.toAccount = to;

		// to be transfered amount
		const rawAmount = this.getAmountBaseValue(this.amount || 0);
		this.rawAmount = rawAmount.plus(this.amountRaw);

		const qlcAmount = this.rawAmount.div(this.qlc);

		if (this.amount < 0 || rawAmount.isLessThan(0)) {
			return this.notificationService.sendWarning(this.msg6);
		}
		if (qlcAmount.isLessThan(1)) {
			const warnMessage = this.msg7;
			return this.notificationService.sendWarning(warnMessage);
		}
		if (from.balanceBN.minus(rawAmount).isLessThan(0)) {
			return this.notificationService.sendError(this.msg8 + `${this.selectedToken.tokenInfo.tokenName}`);
		}

		// Determine a proper raw amount to show in the UI, if a decimal was entered
		this.amountRaw = this.rawAmount.mod(this.qlc);

		// Determine fiat value of the amount
		this.amountFiat = this.util.qlc
			.rawToMqlc(rawAmount)
			.times(this.price.price.lastPrice)
			.toNumber();

		// Start precopmuting the work...
		this.fromAddressBook = this.addressBookService.getAccountName(this.fromAccountID);
		this.toAddressBook = this.addressBookService.getAccountName(this.toAccountID);
		this.workPool.addWorkToCache(this.fromAccount.header);
		this.activePanel = 'confirm';
	}

	async confirmTransaction() {
		const walletAccount = this.walletService.wallet.accounts.find(a => a.id === this.fromAccountID);
		if (!walletAccount) {
			throw new Error(this.msg9);
		}
		if (this.walletService.walletIsLocked()) {
			return this.notificationService.sendWarning(this.msg10);
		}

		this.confirmingTransaction = true;

		try {
			const newHash = await this.qlcBlock.generateSend(
				walletAccount,
				this.toAccountID,
				this.selectedToken.type,
				this.rawAmount,
				this.walletService.isLedgerWallet()
			);
			if (newHash) {
				this.notificationService.sendSuccess(this.msg11 + ` ${this.amount} ${this.selectedToken.token}!`);
				this.activePanel = 'send';
				this.amount = null;
				this.amountFiat = null;
				this.resetRaw();
				this.toAccountID = '';
				this.toAccountStatus = null;
				this.fromAddressBook = '';
				this.toAddressBook = '';
				this.addressBookMatch = '';
			} else {
				if (!this.walletService.isLedgerWallet()) {
					const errMessage = this.msg12;
					this.notificationService.sendError(errMessage);
				}
			}
		} catch (err) {
			const errMessage = this.msg13 + ` ${err.message}`;
			this.notificationService.sendError(errMessage);
		}

		this.confirmingTransaction = false;

		await this.walletService.reloadBalances();
	}

	setMaxAmount() {
		const walletAccount = this.walletService.wallet.accounts.find(a => a.id === this.fromAccountID);
		if (!walletAccount) {
			return;
		}

		const amountRaw = this.selectedToken.balance;

		const tokenVal = this.util.qlc.rawToQlc(amountRaw);
		const maxAmount = this.getAmountValueFromBase(this.util.qlc.qlcToRaw(tokenVal));
		this.amount = maxAmount.toNumber();
		this.syncFiatPrice();
	}

	resetRaw() {
		this.amountRaw = new BigNumber(0);
		this.amount = '';
	}

	selectToken() {
		if (this.accountTokens !== undefined && this.accountTokens.length > 0) {
			this.selectedToken = this.accountTokens.find(a => a.tokenInfo.tokenSymbol === this.selectedTokenSymbol);
		} else {
			this.selectedToken = '';
		}
		this.resetRaw();
	}

	selectAccount() {
		const selectedAccount = this.accounts.find(a => a.id === this.fromAccountID);
		this.accountTokens =
			selectedAccount !== undefined &&
			selectedAccount.accountMeta.tokens !== undefined &&
			selectedAccount.accountMeta.tokens.length > 0
				? selectedAccount.accountMeta.tokens
				: [];
		this.selectedToken = this.accountTokens !== undefined && this.accountTokens.length > 0 ? this.accountTokens[0] : [];
		this.selectedTokenSymbol =
			this.selectedToken !== undefined && this.selectedToken.tokenInfo.tokenSymbol !== undefined
				? this.selectedToken.tokenInfo.tokenSymbol
				: '';

		this.resetRaw();
	}

	selectFromBook() {
		this.toAccountID = this.bookContact;
	}

	getAmountBaseValue(value) {
		switch (this.selectedAmount.value) {
			default:
			case 'QLC':
				return this.util.qlc.qlcToRaw(value);
			case 'kqlc':
				return this.util.qlc.kqlcToRaw(value);
			case 'mqlc':
				return this.util.qlc.mqlcToRaw(value);
		}
	}

	getAmountValueFromBase(value) {
		switch (this.selectedAmount.value) {
			default:
			case 'QLC':
				return this.util.qlc.rawToQlc(value);
			case 'kqlc':
				return this.util.qlc.rawToKqlc(value);
			case 'mqlc':
				return this.util.qlc.rawToMqlc(value);
		}
	}
}
