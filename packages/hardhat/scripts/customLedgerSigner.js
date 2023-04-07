const { LedgerSigner } = require('@ethersproject/hardware-wallets');

class CustomLedgerSigner extends LedgerSigner {
  constructor(ledgerEth, provider) {
    super(ledgerEth);
    this._provider = provider;
  }

  get provider() {
    return this._provider;
  }

  async getAddress() {
    return super.getAddress("m/44'/60'/0'/0/0");
  }

  async sendTransaction(transaction) {
    const populatedTransaction = await this.populateTransaction(transaction);
    const signedTransaction = await this.signTransaction(populatedTransaction);
    return this.provider.sendTransaction(signedTransaction);
  }

  async populateTransaction(transaction) {
    return this.provider.populateTransaction(transaction, this);
  }
}

module.exports = CustomLedgerSigner;
