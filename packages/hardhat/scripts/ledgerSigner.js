const LedgerEth = require('@ledgerhq/hw-app-eth').default;
const CustomLedgerSigner = require('./CustomLedgerSigner');
const TransportNodeHidNoEvents = require('@ledgerhq/hw-transport-node-hid-noevents').default;

async function getLedgerSigner() {
  const transport = await TransportNodeHidNoEvents.create();
  const ledgerEth = new LedgerEth(transport);
  const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC);
  return new CustomLedgerSigner(ledgerEth, provider);
}

module.exports = {
  getLedgerSigner,
};
