import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
//import { UtilService } from './util.service';
//import * as blake from 'blakejs';
//import BigNumber from 'bignumber.js';
//import { WorkPoolService } from './work-pool.service';
import { NotificationService } from './notification.service';
import { AppSettingsService } from './app-settings.service';
//import { WalletService } from './wallet.service';
// import { LedgerService } from './ledger.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
//import * as nacl from 'tweetnacl';

//const STATE_BLOCK_PREAMBLE = '0000000000000000000000000000000000000000000000000000000000000000';

@Injectable({
	providedIn: 'root'
})
export class QLCBlockService {
	//representativeAccount = 'qlc_3oftfjxu9x9pcjh1je3xfpikd441w1wo313qjc6ie1es5aobwed5x4pjojic'; // QLC Representative
	zeroHash = '0000000000000000000000000000000000000000000000000000000000000000';

	msg1 = '';
	msg2 = '';
	msg3 = '';
	msg4 = '';
	msg5 = '';
	msg6 = '';
	msg7 = '';

	constructor(
		private api: ApiService,
		//private util: UtilService,
		//private workPool: WorkPoolService,
		private notifications: NotificationService,
		// private ledgerService: LedgerService,
		public settings: AppSettingsService,
		private trans: TranslateService
	) {
		this.loadLang();
		this.trans.onLangChange.subscribe((event: LangChangeEvent) => {
			this.loadLang();
		});
	}

	loadLang() {
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg1').subscribe((res: string) => {
			this.msg1 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg2').subscribe((res: string) => {
			this.msg2 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg3').subscribe((res: string) => {
			this.msg3 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg4').subscribe((res: string) => {
			this.msg4 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg5').subscribe((res: string) => {
			this.msg5 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg6').subscribe((res: string) => {
			this.msg6 = res;
		});
		this.trans.get('SERVICE_WARNINGS_QLC_SERVICE.msg7').subscribe((res: string) => {
			this.msg7 = res;
		});
	}

	async generateChange(walletAccount, representativeAccount, ledger = false) {
		const changeBlock: any = await this.api.generateChangeBlock(
			walletAccount.id,
			representativeAccount,
			walletAccount.privateKey
		);
		const processResponse = await this.api.process(changeBlock.result);

		if (processResponse && processResponse.result) {
			const header = processResponse.result;
			walletAccount.header = header;
			return header;
		} else {
			return null;
		}
	}

	async generateSend(walletAccount, toAccountID, tokenTypeHash, rawAmount, ledger = false) {
		const blockData = {
			from: walletAccount.id,
			tokenName: tokenTypeHash,
			to: toAccountID,
			amount: rawAmount
		};

		const sendBlock: any = await this.api.generateSendBlock(blockData, walletAccount.privateKey);
		const processResponse = await this.api.process(sendBlock.result);

		if (processResponse && processResponse.result) {
			const header = processResponse.result;
			walletAccount.header = header;
			return header;
		} else {
			return null;
		}
	}

	async generateReceive(walletAccount, sourceBlock, ledger = false) {
		const srcBlockInfo = await this.api.blocksInfo([sourceBlock]);
		if (srcBlockInfo && !srcBlockInfo.error && srcBlockInfo.result.length > 0) {
			// console.log('find block info of ' + sourceBlock);
		} else {
			// console.log('can not find block info of ' + sourceBlock);
			return null;
		}
		const sendBlock = srcBlockInfo.result[0];

		const receiveBlock: any = await this.api.generateReceiveBlock(sendBlock, walletAccount.privateKey);
		const processResponse = await this.api.process(receiveBlock.result);

		if (processResponse && processResponse.result) {
			const header = processResponse.result;
			walletAccount.header = header;
			return header;
		} else {
			return null;
		}
	}

	sendLedgerDeniedNotification() {
		this.notifications.sendWarning(this.msg6);
	}
	sendLedgerNotification() {
		this.notifications.sendInfo(this.msg7, { identifier: 'ledger-sign', length: 0 });
	}
	clearLedgerNotification() {
		this.notifications.removeNotification('ledger-sign');
	}
}
